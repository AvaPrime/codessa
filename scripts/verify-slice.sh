#!/usr/bin/env bash
# Slice verification. Fails if a required slice test fails.
set -u
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
fail=0
run() {
  echo "== $1 =="
  if npx --yes tsx "$1"; then
    echo "PASS $1"
  else
    echo "FAIL $1"
    fail=1
  fi
}
run tests/execution-slice.ts
run tests/execution-contract.ts
run tests/model-router.ts
run tests/execution-record.ts
run tests/failure-paths.ts
run tests/observation-capture.ts
run tests/outcome-intake.ts
run tests/codessa-core.ts
run tests/packs.ts
run tests/record-store.ts
run tests/slice-core.ts
run tests/caller.ts
run tests/kernel-bridge.ts
run tests/product-path.ts
if [ "$fail" -ne 0 ]; then
  echo "verify:slice FAIL"
  exit 1
fi
echo "verify:slice PASS"
