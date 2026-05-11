"""
Decode the base64-wrapped xlsx files saved by the Drive download tool
and skim their contents (sheet names, columns, first 8 rows).

Doesn't write anything; just prints a digest so we know what's in each.
"""
import base64
import json
import pandas as pd
import sys
from pathlib import Path

INPUTS = [
    ("/Users/nickhook/.claude/projects/-Users-nickhook/271c6d8d-9aa4-4302-810d-ba3df1efac53/tool-results/mcp-0be36f3a-33c2-46fa-8eb4-98f934c15521-download_file_content-1778464209423.txt", "NICK HOOK - Release Catalog.xlsx"),
    ("/Users/nickhook/.claude/projects/-Users-nickhook/271c6d8d-9aa4-4302-810d-ba3df1efac53/tool-results/mcp-0be36f3a-33c2-46fa-8eb4-98f934c15521-download_file_content-1778464221203.txt", "BMI Catalog Status.xlsx"),
    ("/Users/nickhook/.claude/projects/-Users-nickhook/271c6d8d-9aa4-4302-810d-ba3df1efac53/tool-results/mcp-0be36f3a-33c2-46fa-8eb4-98f934c15521-download_file_content-1778464225036.txt", "nickhook_discography.xlsx"),
]

OUT_DIR = Path("/tmp/drive-xlsx")
OUT_DIR.mkdir(exist_ok=True)

for src, label in INPUTS:
    print("\n" + "=" * 80)
    print(f"📄 {label}")
    print("=" * 80)
    raw = Path(src).read_text()
    payload = json.loads(raw)
    binary = base64.b64decode(payload["content"])
    out_path = OUT_DIR / label
    out_path.write_bytes(binary)
    print(f"   decoded → {out_path}  ({len(binary):,} bytes)")
    try:
        xls = pd.ExcelFile(out_path)
        for sn in xls.sheet_names:
            df = pd.read_excel(out_path, sheet_name=sn, header=None)
            print(f"\n   --- sheet: {sn!r}  ({df.shape[0]} rows × {df.shape[1]} cols) ---")
            for i in range(min(8, len(df))):
                row = df.iloc[i]
                cells = [(j, str(v)[:40]) for j, v in enumerate(row) if pd.notna(v) and str(v).strip()]
                if cells:
                    print(f"     R{i:02d}: " + " | ".join(f"[{j}]{v}" for j, v in cells[:10]))
    except Exception as e:
        print(f"   ERROR parsing: {e}")
