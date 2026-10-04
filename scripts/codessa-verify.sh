#!/usr/bin/env bash
# Standard Codessa acceptance check for the active slice.
set -u
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
fail=0
echo "== slice tests =="
if bash scripts/verify-slice.sh; then
  echo "PASS slice"
else
  echo "FAIL slice"
  fail=1
fi
echo "== frozen spec drift =="
base="db887f32000651196d37d303c3f4d3f73e18cc32"
for file in docs/specs/SPEC-CODESSA-AWS-STAGE-001-v0.1.md docs/decisions/DEC-SPEC-CODESSA-AWS-STAGE-001-FREEZE.md; do
  if git diff --quiet "$base" -- "$file"; then
    echo "PASS unchanged $file"
  else
    echo "FAIL changed $file"
    fail=1
  fi
done
if [ "$fail" -ne 0 ]; then
  echo "codessa:verify FAIL"
  exit 1
fi
echo "codessa:verify PASS"
