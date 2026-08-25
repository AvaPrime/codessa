#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR="./artifacts/conformance/AWS-STAGE-M1/bedrock"
mkdir -p "${ARTIFACT_DIR}"
REGION="${AWS_STAGE_REGION:-af-south-1}"

command -v aws >/dev/null || { echo 'aws CLI required' >&2; exit 1; }
command -v jq >/dev/null || { echo 'jq required' >&2; exit 1; }

aws bedrock list-foundation-models --region "${REGION}" --output json > "${ARTIFACT_DIR}/af-south-1-model-catalog.json"

jq '[.modelSummaries[]
  | select(.modelLifecycle.status == "ACTIVE" and .providerName == "Anthropic")
  | select(.inputModalities | index("TEXT"))
  | select(.outputModalities | index("TEXT"))]
  | sort_by(.modelId)' \
  "${ARTIFACT_DIR}/af-south-1-model-catalog.json" > "${ARTIFACT_DIR}/anthropic-active-models.json"

TARGET_MODEL_ID=$(jq -r '.[0].modelId // empty' "${ARTIFACT_DIR}/anthropic-active-models.json")
if [[ -n "${TARGET_MODEL_ID}" ]]; then
  aws bedrock get-foundation-model --region "${REGION}" --model-identifier "${TARGET_MODEL_ID}" --output json > "${ARTIFACT_DIR}/selected-model-detail.json"
fi

aws bedrock list-inference-profiles --region "${REGION}" --type-equals SYSTEM_DEFINED --output json > "${ARTIFACT_DIR}/system-inference-profiles.json"
jq '[.inferenceProfileSummaries[]] | sort_by(.inferenceProfileId)' \
  "${ARTIFACT_DIR}/system-inference-profiles.json" > "${ARTIFACT_DIR}/system-inference-profiles-sorted.json"

TARGET_PROFILE_ID=$(jq -r '.[0].inferenceProfileId // empty' "${ARTIFACT_DIR}/system-inference-profiles-sorted.json")
if [[ -n "${TARGET_PROFILE_ID}" ]]; then
  aws bedrock get-inference-profile --region "${REGION}" --inference-profile-identifier "${TARGET_PROFILE_ID}" --output json > "${ARTIFACT_DIR}/selected-profile-detail.json"
fi

echo "Discovery evidence captured under ${ARTIFACT_DIR}"
