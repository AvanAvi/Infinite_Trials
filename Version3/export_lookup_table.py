#!/usr/bin/env python3
"""Export the V1/V2 character-to-partition lookup table as JSON for
web/src/core/v1.ts, so the showcase's "V1 in action" demo uses the exact
real table instead of a hand-transcribed copy that could drift from it.

Usage:
    python3 Version3/export_lookup_table.py
"""

import csv
import json
import os

SOURCE_CSV = os.path.join(
    os.path.dirname(__file__), "..", "Version2", "data", "lookup_table.csv"
)
OUT_PATH = os.path.join(
    os.path.dirname(__file__), "..", "web", "src", "core", "data", "lookupTable.json"
)


def main():
    rows = []
    with open(SOURCE_CSV, newline="") as f:
        reader = csv.reader(f)
        next(reader)  # header
        for character, value in reader:
            rows.append([character, value])

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w") as f:
        json.dump(rows, f, indent=2)
        f.write("\n")

    print(f"wrote {len(rows)} entries to {OUT_PATH}")


if __name__ == "__main__":
    main()
