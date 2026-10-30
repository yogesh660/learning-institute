#!/usr/bin/env python3
import argparse
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from security.secret_scan import scan


parser = argparse.ArgumentParser(description="Scan repository files for common secret patterns")
parser.add_argument("root", nargs="?", default=".")
args = parser.parse_args()
findings = scan(args.root)
if findings:
    print("Potential secrets found:")
    print("\n".join(findings))
    raise SystemExit(1)
print("No supported secret patterns found")
