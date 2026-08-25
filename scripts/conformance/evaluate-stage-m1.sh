#!/usr/bin/env bash
set -euo pipefail

ROOT="./artifacts/conformance/AWS-STAGE-M1"
B="${ROOT}/bedrock"

state="UNKNOWN"

[[ -s "${B}/anthropic-active-models.json" ]] && jq -e 'length >= 1' "${B}/anthropic-active-models.json" >/dev/null && G1=PASS || G1=UNKNOWN

G2=UNKNOWN
if [[ -s "${B}/selected-profile-detail.json" ]]; then
  # Accept only explicit non-empty model ARN mappings/destinations exposed by the provider response.
  if jq -e '(
    (.models // []) | length > 0
  ) or (
    (.inferenceProfileArn? // "") | length > 0 and ((.models // []) | length > 0)
  )' "${B}/selected-profile-detail.json" >/dev/null 2>&1; then
    G2=PASS
  fi
fi

G3=UNKNOWN
for f in "${B}/invocation-smoke-test-direct.json" "${B}/invocation-smoke-test-profile.json"; do
  if [[ -s "$f" ]] && jq -e '.verificationStatus == "SUCCESS" and .epistemicRole == "CandidateArtifact" and (.provenanceTuple.requestHash | startswith("sha256:")) and (.provenanceTuple.candidateArtifactHash | startswith("sha256:"))' "$f" >/dev/null 2>&1; then
    G3=PASS
    break
  fi
done

G4=UNKNOWN
[[ -s "${ROOT}/spendbase/provider-verification-record.md" ]] && grep -Eq 'Org ID|Founders' "${ROOT}/spendbase/provider-verification-record.md" && G4=PASS || true

printf 'G-01=%s\nG-02=%s\nG-03=%s\nG-04=%s\n' "$G1" "$G2" "$G3" "$G4"

if [[ "$G1" == PASS && "$G2" == PASS && "$G3" == PASS && "$G4" == PASS ]]; then
  echo 'AWS-STAGE-M1=READY_FOR_REVIEW'
else
  echo 'AWS-STAGE-M1=PENDING_EXECUTION_OR_PROVIDER_EVIDENCE'
  exit 2
fi
