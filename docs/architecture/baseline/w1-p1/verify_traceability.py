#!/usr/bin/env python3
"""W1-P1.1-R traceability validator (documentation-only helper).

Validates that the machine-readable matrix (W1-P1-TRACEABILITY.json) and the
Markdown ledger (W1-P1-CONTRACT-LEDGER.md) reconcile one-to-one, that IDs are
unique, that target increments are supported, and that every source locator
points at an existing file with an in-bounds line range.

Run from the repository root:
    python3 docs/architecture/baseline/w1-p1/verify_traceability.py
Exit code 0 = all checks pass.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
LEDGER = os.path.join(HERE, "W1-P1-CONTRACT-LEDGER.md")
MATRIX = os.path.join(HERE, "W1-P1-TRACEABILITY.json")
VALID_TARGETS = {"P1.1", "P1.2", "P1.3", "P1.4", "P1.5", "P1.6"}
ID_RE = re.compile(r"^\| ((?:API|EVENT|ATTR|PART|SLOT|LIFECYCLE|CONFIG|KBD)-\d{3}) \|", re.M)
NUM_RE = re.compile(r"\d+")


def main() -> int:
    doc = json.load(open(MATRIX, encoding="utf-8"))
    records = doc["contracts"]
    ledger = open(LEDGER, encoding="utf-8").read()
    md_ids = sorted(set(ID_RE.findall(ledger)))
    js_ids = [r["id"] for r in records]
    failures = []

    if set(md_ids) != set(js_ids):
        failures.append("R-01 ID sets differ: missing=%s orphaned=%s" % (
            sorted(set(md_ids) - set(js_ids)), sorted(set(js_ids) - set(md_ids))))

    if len(js_ids) != len(set(js_ids)):
        failures.append("R-02 duplicate IDs present")

    for r in records:
        if r.get("targetIncrement") not in VALID_TARGETS:
            failures.append("R-06 bad targetIncrement for %s" % r["id"])
        if r.get("coverage") not in ("Existing", "Partial", "Diagnostic", "Missing"):
            failures.append("R-06 bad coverage for %s" % r["id"])
        tid = r.get("testId")
        # testId is 'verify', 'unassigned', or a concrete spec reference of the
        # form "<path>.spec.<ext>[#anchor]". Concrete references must resolve to
        # an existing file under the repository root.
        is_ref = isinstance(tid, str) and ".spec." in tid
        if tid not in ("verify", "unassigned") and not is_ref:
            failures.append("R-06 bad testId state for %s" % r["id"])
        if is_ref:
            ref_path = tid.split("#", 1)[0]
            if not os.path.exists(os.path.join(ROOT, ref_path)):
                failures.append("R-06 testId references missing file %s (%s)" % (ref_path, r["id"]))
        locs = r.get("sourceLocators") or []
        if not locs:
            failures.append("R-05 no source locator for %s" % r["id"])
        for loc in locs:
            path = os.path.join(ROOT, loc["file"])
            if not os.path.exists(path):
                failures.append("R-05 missing file %s (%s)" % (loc["file"], r["id"]))
                continue
            n = sum(1 for _ in open(path, encoding="utf-8"))
            nums = [int(x) for x in NUM_RE.findall(loc["lines"])]
            if nums and max(nums) > n:
                failures.append("R-05 line %s exceeds %d in %s (%s)" % (
                    loc["lines"], n, loc["file"], r["id"]))

    print("ledger IDs=%d json records=%d unique json=%d" % (
        len(md_ids), len(js_ids), len(set(js_ids))))
    if failures:
        print("FAIL:")
        for f in failures:
            print("  -", f)
        return 1
    print("PASS: ledger/matrix reconcile; IDs unique; targets valid; locators in bounds")
    return 0


if __name__ == "__main__":
    sys.exit(main())
