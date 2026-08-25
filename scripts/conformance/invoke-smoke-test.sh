#!/usr/bin/env bash
set -euo pipefail

ARTIFACT_DIR="./artifacts/conformance/AWS-STAGE-M1/bedrock"
REGION="${AWS_STAGE_REGION:-af-south-1}"
CATALOG="${ARTIFACT_DIR}/anthropic-active-models.json"
PROFILES="${ARTIFACT_DIR}/system-inference-profiles-sorted.json"

command -v aws >/dev/null || { echo 'aws CLI required' >&2; exit 1; }
command -v jq >/dev/null || { echo 'jq required' >&2; exit 1; }
command -v sha256sum >/dev/null || { echo 'sha256sum required' >&2; exit 1; }
[[ -f "${CATALOG}" ]] || { echo 'Run verify-stage-m1.sh first' >&2; exit 1; }

invoke() {
  local target="$1" policy="$2" prompt="$3" output="$4"
  local raw="${ARTIFACT_DIR}/.raw-bedrock-response.json"
  local payload timestamp start latency req_hash resp_hash raw_json

  payload=$(jq -n --arg p "${prompt}" '{anthropic_version:"bedrock-2023-05-31",max_tokens:64,messages:[{role:"user",content:$p}]}')
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  start=$(date +%s%3N)

  aws bedrock-runtime invoke-model --region "${REGION}" --model-id "${target}" \
    --content-type application/json --accept application/json --body "${payload}" "${raw}"

  latency=$(( $(date +%s%3N) - start ))
  req_hash=$(printf '%s' "${payload}" | sha256sum | awk '{print $1}')
  resp_hash=$(sha256sum "${raw}" | awk '{print $1}')
  raw_json=$(cat "${raw}")

  jq -n --arg provider anthropic --arg id "${target}" --arg region "${REGION}" \
    --arg policy "${policy}" --arg ts "${timestamp}" --arg latency "${latency}" \
    --arg req "sha256:${req_hash}" --arg resp "sha256:${resp_hash}" \
    --argjson payload "${payload}" --argjson response "${raw_json}" \
    '{verificationStatus:"SUCCESS",epistemicRole:"CandidateArtifact",provenanceTuple:{provider:$provider,modelOrProfileId:$id,sourceRegion:$region,routingPolicy:$policy,timestamp:$ts,latencyMs:($latency|tonumber),requestHash:$req,candidateArtifactHash:$resp},requestPayload:$payload,runtimeResponse:$response}' \
    > "${output}"
  rm -f "${raw}"
}

MODEL_ID=$(jq -r '.[0].modelId // empty' "${CATALOG}")
if [[ -n "${MODEL_ID}" ]]; then
  invoke "${MODEL_ID}" DIRECT_IN_REGION 'Respond with: MCGL substrate connectivity verified.' "${ARTIFACT_DIR}/invocation-smoke-test-direct.json"
fi

if [[ -f "${PROFILES}" ]]; then
  PROFILE_ID=$(jq -r '.[0].inferenceProfileId // empty' "${PROFILES}")
  if [[ -n "${PROFILE_ID}" ]]; then
    invoke "${PROFILE_ID}" EXPLICIT_INFERENCE_PROFILE 'Respond with: MCGL inference profile connectivity verified.' "${ARTIFACT_DIR}/invocation-smoke-test-profile.json"
  fi
fi
