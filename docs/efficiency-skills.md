# Skills inventory — what to build for efficiency

Based on the patterns I see us hit over and over. Each one packaged as a named skill at `~/.claude/skills/<name>/SKILL.md` so you can invoke it with one phrase ("drop the new release," "audit catalog," etc.) and I run the full playbook without you re-explaining every time.

## ✅ Ranked by impact

### 1. `new-release` — drop a new record, end-to-end (HIGH)

You hand me a Sanity slug + a Dropbox folder path. I run the wiring playbook:

1. Find the audio in the Dropbox folder (MP3 / WAV / m4a)
2. Convert WAV → AAC m4a 256kbps if needed (afconvert)
3. Find / build the cover (look for cover.jpg in folder, OR build via existing cover-build scripts if metadata is enough)
4. Find a press photo / signature / page-background image
5. Find a stem folder (if present, wire as `stems[]`)
6. Find a sample pack (if present, link as `release.pack`)
7. Find a YouTube playlist or video URL
8. Read any `credits.txt` / `notes.md` / `tracklist.txt` files in the folder
9. Patch the Sanity release doc with everything in one transaction
10. Apply standard `coverColor` repaint from the cover
11. Upload cover, audio, signature, photos as Sanity assets
12. Run typecheck + verify the page renders
13. Report back: what got wired, what's missing, what needs your input

Why this one first: I do this manually every time you drop a record, takes 15+ tool calls. As a skill it's "yo drop the new XYZ release" and I just do it.

### 2. `bio-pass` — write liner notes for releases that lack them (MED)

113 releases don't have liner notes. I CAN'T fabricate them, but I CAN generate fact-based skeleton bios from existing data (artists, year, label, format, credits) and offer them to you for editorial pass. Skill takes a slug, returns a draft bio you can approve/reject/edit in Studio.

### 3. `audit-release` — visual + data audit per release (MED)

You point at a slug. I:
1. Hit the live page, screenshot it
2. Check the data in Sanity (gaps, missing covers, missing credits, etc.)
3. Verify the cover renders properly, the coverColor reads
4. Check audio plays / video embeds
5. Check the JSON-LD + meta tags
6. Spit out a punch list

Useful when polishing one record at a time.

### 4. `press-import` — scrape press URL → Sanity (MED)

You paste a press URL. I:
1. Fetch the page
2. Extract og:image, headline, excerpt, author, date, outlet
3. Match to an existing release / artist / era / brand
4. Create a pressQuote doc with all fields filled
5. If image asset, upload to Sanity
6. Report the resulting press card

### 5. `cover-builder` — build a cover via templates (MED)

You give me a release slug + a treatment ("zine", "duotone photo", "credits poster", "blackletter bottle"). I run the matching cover-build script with parameters and upload to Sanity. Standardizes the C+C visual system.

Builtin templates:
- **Zine** (CC Comp / Remix Vol 1 style): paper-cream, big Anton title, tracklist
- **Duotone photo** (Glove style): cover photo + purple/slime/lamp duotone
- **Credits poster** (Just Nico style): full collaborator typography
- **Bottle** (Old English style): wordmark on the iconic bottle artwork
- **Live React** (KUSA style): pure SVG/CSS composition, no PNG

### 6. `catalog-audit` — sitemap + data gaps + orphan-doc sweep (LOW-MED)

We already have these as scripts. Skill version: one phrase runs them all + writes a combined report. Use it as a weekly site health check.

### 7. `studio-session-import` — drop a session folder (LOW-MED)

For the future "studio sessions" content you've talked about. Skill takes a session date / location / Dropbox folder, creates a `studioSession` doc with photos, gear list, people, and links to any record that came out of it.

### 8. `boo-wall-photos` — when you drop them (LOW)

When the 20 photos land in `BOO VAULT/photos/`, this skill compresses + copies + auto-tiles them into the `BooWall.tsx` component. One phrase → wall is live.

## Skills I'd NOT build

- "Deploy to prod" — `git push` already does it via Vercel auto-deploy. No need.
- "Run all tests" — there are no tests in this project right now.
- "Send a tweet" — out of scope, social media tools are their own world.

## Why this structure

The pattern: I am most efficient when the prompt is **a slug or a folder path**, and the rest of the context is **baked into the skill prompt**. Each skill is a recipe — I read it, look at the inputs, fetch what I need from Sanity / Dropbox, write/upload, report back. No re-explaining what a "vinyl jacket artifact" is or where the cover scripts live or what the standard heptagon spec is — all of that is in the skill.

## What I'm building right now while you walk

**`new-release` skill** at `~/.claude/skills/new-release/SKILL.md`. Highest leverage. Spec it tonight, you test-drive it on the next record drop, we iterate.
