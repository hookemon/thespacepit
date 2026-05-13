#!/usr/bin/env python3
"""
Sanitize app/_lib/shows.ts — remove private/financial info before the file
ships to a public site.

Strips from each show entry's `notes`:
  · dollar amounts ($X, $X,XXX)
  · XK fees (e.g. "30k INR", "100k offer")
  · biz terms: offer, fee, advance, guarantee, deposit, payout, invoice,
    deal memo, contract, agency advancing, AMEX
  · door % deals
  · NFR (non-final-rate)
  · € figures

Strategy is sentence-level: for each note, split on sentence boundaries
(`. ` / `; `), drop sentences that contain a sensitive pattern, keep the
clean ones. If nothing survives, null the field entirely.

Also strips "(offer)" suffix from venue names so private booking-status
labels don't leak.
"""
import json
import re
import sys
from pathlib import Path
from typing import Optional

PATTERNS = [
    re.compile(r"\$\s*\d[\d,]*\.?\d*\s*[Kk]?\b"),   # $300, $1869.18, $1k
    re.compile(r"\b\d{2,4}\s*[Kk]\b"),               # 30k, 100k
    re.compile(r"€\s*\d[\d,]*"),                     # €2000
    re.compile(r"\b(?:offer|offers|offered|offering|fee|fees|advance|guarantee|deposit|payout|payment|invoice|deal memo|day sheet|agency advancing|advancing|net\b|gross\b|cashier|cash on day)\b", re.IGNORECASE),
    # Booker contact tracking ("Tom Gates email", "Jen Lyon email Jun 5") —
    # private contact/email records leak the chain of business comms.
    re.compile(r"\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+email\b"),
    re.compile(r"\b(?:Tom Gates|Jen Lyon|Adam Weiser|Yash Upadhyay|Gaz Williams|Gareth Williams|Damien|Panjak|Nevin|Tej|Achillea)\b"),
    re.compile(r"\bcontract(?:s|ed)?\b", re.IGNORECASE),
    re.compile(r"\bAMEX\b|\bAmex\b"),
    re.compile(r"\bNFR\b"),
    re.compile(r"\d+\s*%\s*(?:door|net|gross)", re.IGNORECASE),
    re.compile(r"(?:door|net|gross)\s*\d+\s*%", re.IGNORECASE),
    re.compile(r"\b(?:WMG|Nettwerk|Agency Group|Beyond Marketing|Rogue Agency|AM Only|Third Culture|Jen Lyon|Adam Weiser)\b.*\b(?:routing|contract|advance|booking|offer|fee|invoice)\b", re.IGNORECASE),
]


def is_sensitive(text: str) -> bool:
    return any(p.search(text) for p in PATTERNS)


def sanitize_notes(notes: str) -> Optional[str]:
    """Return cleaned notes (or None if nothing public-safe remains)."""
    # Split on sentence boundaries — `. ` `; ` `. ` keeping order
    sentences = re.split(r"(?<=[.;])\s+", notes)
    clean = [s.strip() for s in sentences if s.strip() and not is_sensitive(s)]
    out = " ".join(clean).strip()
    # If the cleaned version is too short or just punctuation, drop it
    if not out or len(out) < 8:
        return None
    return out


def sanitize_venue(venue: str) -> str:
    """Strip private booking-status suffixes from venue names."""
    return re.sub(
        r"\s*\((?:offer|TBC offer|pending|bid|hold)\)\s*$",
        "",
        venue,
        flags=re.IGNORECASE,
    ).strip()


def main():
    path = Path(__file__).parent.parent / "app" / "_lib" / "shows.ts"
    text = path.read_text()

    # The data is hand-written as a TS array literal — JSON parse the entries.
    # Each entry is a {} block. Capture them all, transform, re-emit.
    # We anchor on the array literal opener.
    head_match = re.search(r"export const SHOWS: Show\[\] = \[", text)
    if not head_match:
        print("couldn't find SHOWS array opener")
        sys.exit(1)
    head = text[: head_match.end()]
    tail_match = re.search(r"\];\s*$", text)
    if not tail_match:
        print("couldn't find SHOWS array closer")
        sys.exit(1)
    body = text[head_match.end() : tail_match.start()]
    tail = text[tail_match.start() :]

    # Parse the body as a JSON array (TS uses double-quoted keys/strings + no
    # trailing commas — should be valid JSON if we wrap it).
    try:
        entries = json.loads("[" + body + "]")
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        # Try to repair trailing commas
        body_clean = re.sub(r",(\s*[}\]])", r"\1", body)
        entries = json.loads("[" + body_clean + "]")

    # Per-show drop filters — entries matching these get removed entirely.
    # Use sparingly; this is the harshest scrub. Each pattern is a (field,
    # regex) pair; if the regex matches that field on a show, the show is
    # dropped. Comment any drop with WHY so future Claude knows.
    DROP_RULES = [
        # Pune India NH7 Weekender 2023 — Nick explicitly removed the show
        # (private booking, never confirmed). Defensive — if shows.ts gets
        # re-imported from the xlsx, this entry won't come back.
        ("city",  re.compile(r"^Pune$", re.IGNORECASE)),
        ("venue", re.compile(r"Bacardi\s+NH7\s+Weekender", re.IGNORECASE)),
    ]

    dropped_count = 0
    sanitized_count = 0
    venue_clean_count = 0
    kept = []
    for e in entries:
        # 1. Whole-row drop check
        if any(rx.search(str(e.get(field, ""))) for field, rx in DROP_RULES):
            dropped_count += 1
            continue
        # 2. Per-field sanitize (existing behavior)
        if e.get("notes") and is_sensitive(e["notes"]):
            clean = sanitize_notes(e["notes"])
            if clean != e["notes"]:
                e["notes"] = clean
                sanitized_count += 1
        if e.get("venue"):
            new_venue = sanitize_venue(e["venue"])
            if new_venue != e["venue"]:
                e["venue"] = new_venue
                venue_clean_count += 1
        kept.append(e)
    entries = kept

    # Re-emit. Match the existing 2-space indent.
    new_body = ",\n".join(
        "  " + json.dumps(e, indent=2).replace("\n", "\n  ")
        for e in entries
    )
    new_text = head + "\n" + new_body + "\n" + tail

    path.write_text(new_text)
    print(f"✓ dropped   {dropped_count} entries (private/withheld shows)")
    print(f"✓ sanitized {sanitized_count} note fields")
    print(f"✓ cleaned   {venue_clean_count} venue fields")
    print(f"  total entries kept: {len(entries)}")


if __name__ == "__main__":
    main()
