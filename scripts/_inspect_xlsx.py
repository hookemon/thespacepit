"""Inspect xlsx templates from the C+C catalog."""
import pandas as pd
import sys

def inspect(path, label, header=None, sheet=None):
    print(f"\n{'='*70}\n{label}\n{path}\n{'='*70}")
    try:
        xls = pd.ExcelFile(path)
        print(f"Sheets: {xls.sheet_names}")
        sn = sheet or xls.sheet_names[0]
        df = pd.read_excel(path, sheet_name=sn, header=None)
        print(f"Sheet '{sn}' shape: {df.shape}")
        nrows = min(df.shape[0], 12)
        for r in range(nrows):
            print(f"--- Row {r} ---")
            for c in range(df.shape[1]):
                v = df.iat[r, c]
                if pd.notna(v):
                    sv = str(v)
                    if len(sv) > 80:
                        sv = sv[:77] + '...'
                    print(f"  c{c}: {sv!r}")
    except Exception as e:
        print(f"ERROR: {e}")

base = '/Users/nickhook/Library/CloudStorage/Dropbox/C + C/CALM + COLLECT CATALOG( CURRENT AS OF Q3 2025)'

samples = [
    # Believe V4 (already known)
    (f"{base}/2-The Lockhart Dynasty + Calm + Collect ( Cubic Zirconia Partnership Imprint)/LDCC001 Cubic Zirconia- Josephine/810523015708_metadata.xlsx", "BELIEVE V4 - LDCC001"),
    # Ninja Tune
    (f"{base}/1-Calm + Collect/CC013: ZENDNLS413R- Nick Hook Collage v.1 Remixes/ZENDNLS413R.xlsx", "NINJA TUNE - CC013"),
    (f"{base}/1-Calm + Collect/CC012: ZENDNLS413-Nick Hook- Collage v.1/ZENDNLS413.xlsx", "NINJA TUNE - CC012"),
    # Fool's Gold
    (f"{base}/1-Calm + Collect/CC014: FGR156 Nick Hook - Head feat. 21 Savage & Bulletproof Dolphin Single/FGR156 Nick Hook - Head Single Assets/FGR156_NickHook_Head_21Savage_BulletproofDolphin_Meta.xlsx", "FOOLS GOLD - CC014"),
    # Caroline
    (f"{base}/1-Calm + Collect/CC017: FGR208 Nick Hook & DJ Earl - 50 Backwoods/CC017 Nick Hook & DJ Earl - 50 Backwoods/Nick Hook, DJ Earl - 50 Backwoods - Caroline Label Copy.xlsx", "CAROLINE LABEL COPY - CC017"),
    (f"{base}/1-Calm + Collect/CC017: FGR208 Nick Hook & DJ Earl - 50 Backwoods/CC017 Nick Hook & DJ Earl - 50 Backwoods/2017 Caroline Digital Scheduling Form - 50 Backwoods.xlsx", "CAROLINE DIGITAL SCHEDULING - CC017"),
    # CC003 - DRUMS.xlsx unknown format
    (f"{base}/1-Calm + Collect/CC003 Spiritual Friendship, Nick Hook, Gareth Jones- Drums/metadata_drums/DRUMS.xlsx", "DRUMS - CC003"),
    # hookemon001 - meta.xlsx
    (f"{base}/3-Hookemon Records/hookemon001- Nick Hook- Without You/meta.xlsx", "META - hookemon001"),
]

# Skip the first sample (already inspected) - hardcode for stdin invocation
for p, lbl in samples[1:]:
    inspect(p, lbl)
