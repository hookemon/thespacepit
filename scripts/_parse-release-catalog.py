"""
Parse the master Release Catalog xlsx (Smooth Loop / Drive) into a normalized
JSON keyed by NORMALIZED release title — one entry per release, with all its
tracks aggregated underneath.

Source: /tmp/drive-xlsx/NICK HOOK - Release Catalog.xlsx
Output: /Users/nickhook/projects/spacepit-web/scripts/data/release-catalog-from-drive.json

Each row in the xlsx is one TRACK. We group rows by (RELEASE title) and emit:
  {
    "<normalized title>": {
       "title": "Mr. Wonderful",
       "label": "Atlantic Records, Vice Records",
       "labelCatalog": "ATL549151CD",
       "releaseDate": "2015-03-23",   # earliest date in group
       "year": 2015,
       "isUnknownRelease": false,      # true when title col was blank
       "tracks": [
         { "title": "...", "isrc": "...", "feature": "...", "remixer": "...",
           "artists": ["Action Bronson"], "composers": [...], "trackDate": "..." },
         ...
       ],
       "composers": [ ... unique union across all tracks ... ],
       "features":  [ ... unique union ... ],
       "remixers":  [ ... unique union ... ],
       "primaryArtists": [ ... mode of ARTIST 1 across tracks ... ]
    }
  }
"""
import json
import re
import unicodedata
from pathlib import Path
import pandas as pd
from collections import defaultdict, Counter

SRC = "/tmp/drive-xlsx/NICK HOOK - Release Catalog.xlsx"
OUT = "/Users/nickhook/projects/spacepit-web/scripts/data/release-catalog-from-drive.json"

# Column indexes (verified earlier)
COL_DATE       = 0
COL_ARTISTS    = 1   # all-caps display string e.g. "ACTION BRONSON"
COL_TRACK      = 2
COL_RELEASE    = 3
COL_LABEL      = 4
COL_DISTRIB    = 5
COL_ISRC       = 6
COL_UPC        = 7
COL_ISWC       = 8
COL_COMPOSER   = 11
COL_LBL_CAT    = 18
COL_ART_1      = 29
COL_ART_2      = 30
COL_ART_3      = 31
COL_FEAT_1     = 32
COL_FEAT_2     = 33
COL_FEAT_3     = 34
COL_REMIX_1    = 35


def norm(s):
    if s is None:
        return ""
    s = str(s).strip()
    s = unicodedata.normalize("NFKD", s)
    s = s.lower()
    s = re.sub(r"[‘’'`]", "", s)        # apostrophes
    s = re.sub(r"[^a-z0-9]+", " ", s)             # keep alnum, collapse rest
    return re.sub(r"\s+", " ", s).strip()


def parse_date(raw):
    """Convert '2015_0323' → '2015-03-23'. Tolerates other shapes."""
    if raw is None or pd.isna(raw):
        return None
    s = str(raw).strip()
    m = re.match(r"^(\d{4})_(\d{2})(\d{2})$", s)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    m = re.match(r"^(\d{4})[-_/](\d{2})[-_/](\d{2})$", s)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    # already iso?
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", s)
    if m:
        return s
    return None


def split_names(raw):
    """Split a multi-name cell. Tries / then , then ; then & ."""
    if raw is None or pd.isna(raw):
        return []
    s = str(raw).strip()
    if not s:
        return []
    # Use the most common separator found
    for sep in [" / ", "/", ";", " & ", ", "]:
        if sep in s:
            return [p.strip() for p in s.split(sep) if p.strip()]
    return [s]


def main():
    df = pd.read_excel(SRC, sheet_name="Catalog", header=None)
    # Skip header row; iterate all data rows
    rows = df.iloc[1:].reset_index(drop=True)

    grouped = defaultdict(list)  # normalized_title -> list of row dicts
    raw_titles = {}              # normalized -> first non-empty raw title seen
    unknown_counter = 0

    for idx, row in rows.iterrows():
        title_raw = row[COL_RELEASE]
        if pd.isna(title_raw) or not str(title_raw).strip():
            # Track row with no release title — skip; can't group meaningfully.
            continue
        title_str = str(title_raw).strip()
        key = norm(title_str)
        if not key:
            continue
        if key not in raw_titles:
            raw_titles[key] = title_str
        grouped[key].append(row)

    out = {}
    for key, group_rows in grouped.items():
        # Aggregate
        title = raw_titles[key]
        labels = Counter()
        label_cats = Counter()
        all_dates = []
        composers_set = set()
        features_set = set()
        remixers_set = set()
        primary_artists_count = Counter()
        tracks = []

        for r in group_rows:
            label = r[COL_LABEL]
            if pd.notna(label) and str(label).strip():
                labels[str(label).strip()] += 1
            lcat = r[COL_LBL_CAT]
            if pd.notna(lcat) and str(lcat).strip():
                label_cats[str(lcat).strip()] += 1

            d = parse_date(r[COL_DATE])
            if d:
                all_dates.append(d)

            track_title = r[COL_TRACK]
            if pd.isna(track_title) or not str(track_title).strip():
                continue  # skip rows missing track title

            # Per-track contributors
            track_composers = split_names(r[COL_COMPOSER])
            for c in track_composers:
                composers_set.add(c)

            artists_per_track = []
            for col in [COL_ART_1, COL_ART_2, COL_ART_3]:
                v = r[col]
                if pd.notna(v) and str(v).strip():
                    artists_per_track.append(str(v).strip())
            # Fallback — col[1] (ARTISTS display string) is populated for almost
            # every row even when the per-track ARTIST 1/2/3 cells are blank.
            # Pull from there if we got nothing structured.
            if not artists_per_track:
                v = r[COL_ARTISTS]
                if pd.notna(v) and str(v).strip():
                    raw = str(v).strip()
                    # Title-case the all-caps display ("AZEALIA BANKS" → "Azealia Banks")
                    # Split on , ; / and " feat./ft." — but NOT on " & "
                    # (band names like "Men Women & Children", "Earth Wind & Fire").
                    parts = [p.strip() for p in re.split(r"[,/;]| feat\. | ft\. ", raw, flags=re.IGNORECASE) if p.strip()]
                    artists_per_track = [p.title() if p == p.upper() else p for p in parts]
            if artists_per_track:
                primary_artists_count[artists_per_track[0]] += 1

            track_features = []
            for col in [COL_FEAT_1, COL_FEAT_2, COL_FEAT_3]:
                v = r[col]
                if pd.notna(v) and str(v).strip():
                    nm = str(v).strip()
                    track_features.append(nm)
                    features_set.add(nm)

            track_remixer = None
            v = r[COL_REMIX_1]
            if pd.notna(v) and str(v).strip():
                track_remixer = str(v).strip()
                remixers_set.add(track_remixer)

            isrc = r[COL_ISRC] if pd.notna(r[COL_ISRC]) else None
            iswc = r[COL_ISWC] if pd.notna(r[COL_ISWC]) else None

            track = {
                "title": str(track_title).strip(),
                **({"isrc": str(isrc).strip()} if isrc else {}),
                **({"iswc": str(iswc).strip()} if iswc else {}),
                **({"feature": " / ".join(track_features)} if track_features else {}),
                **({"remixer": track_remixer} if track_remixer else {}),
                **({"composers": track_composers} if track_composers else {}),
                **({"artists": artists_per_track} if artists_per_track else {}),
                **({"trackDate": d} if d else {}),
            }
            tracks.append(track)

        if not tracks:
            continue

        primary_label = labels.most_common(1)[0][0] if labels else None
        primary_label_cat = label_cats.most_common(1)[0][0] if label_cats else None
        earliest = min(all_dates) if all_dates else None
        primary_artists = [a for a, _ in primary_artists_count.most_common(3)]

        out[key] = {
            "title": title,
            **({"label": primary_label} if primary_label else {}),
            **({"labelCatalog": primary_label_cat} if primary_label_cat else {}),
            **({"releaseDate": earliest} if earliest else {}),
            **({"year": int(earliest[:4])} if earliest else {}),
            "primaryArtists": primary_artists,
            "tracks": tracks,
            "composers": sorted(composers_set),
            "features": sorted(features_set),
            "remixers": sorted(remixers_set),
        }

    Path(OUT).parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(out, f, indent=2)

    print(f"\n✅ Parsed Release Catalog → {len(out)} releases × {sum(len(r['tracks']) for r in out.values())} tracks")
    print(f"   → {OUT}\n")
    print("Sample 5 release titles parsed:")
    for k in list(out.keys())[:5]:
        r = out[k]
        print(f"   • {r['title']!r:<45}  {len(r['tracks'])} tracks  ({r.get('label', '?')})")


if __name__ == "__main__":
    main()
