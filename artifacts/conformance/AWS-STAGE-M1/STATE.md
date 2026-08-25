# AWS-STAGE-M1 Conformance State

**Specification:** `SPEC-CODESSA-AWS-STAGE-001 v0.1`  
**Decision:** `DEC-SPEC-CODESSA-AWS-STAGE-001-FREEZE`  
**State:** `PENDING_EXECUTION / BLOCKED`  
**Evidence status:** `UNKNOWN` across all gates until raw AWS/provider outputs are deposited.

## Gate Ledger

| Gate | Invariant Bound | State | Blocker |
|---|---|---|---|
| `G-01` | `INV-BEDROCK-01` | `UNKNOWN` | Raw `af-south-1` Bedrock catalog output required |
| `G-02` | `INV-BEDROCK-02` | `UNKNOWN` | Raw profile routing destinations plus execution-contract authorization required |
| `G-03` | `INV-BEDROCK-03` | `UNKNOWN` | Dual-branch invocation output plus SHA-256 provenance required |
| `G-04` | Commercial Isolation | `UNKNOWN` | Provider-issued Spendbase Org ID evidence or explicit Founders-route selection required |

## Evidence Integrity Constraints

- Raw provider responses are preserved unmodified beside derived artifacts.
- G-02 cannot pass from file existence alone; routing destinations must be explicit, non-empty, and admissible under the declared execution contract.
- All M1 outputs remain classified as non-authoritative `CandidateArtifact` evidence.
- No M1 artifact may be promoted to canonical knowledge without an explicit deterministic MCGL state transition.
- No provider documentation, expected model availability, or commercial assumption may be treated as an observed AWS-account result.

## Expected Evidence Tree

```text
artifacts/conformance/AWS-STAGE-M1/
├── STATE.md
├── bedrock/
│   ├── af-south-1-model-catalog.json
│   ├── anthropic-active-models.json
│   ├── selected-model-detail.json
│   ├── system-inference-profiles.json
│   ├── system-inference-profiles-sorted.json
│   ├── selected-profile-detail.json
│   ├── invocation-smoke-test-direct.json
│   └── invocation-smoke-test-profile.json
├── activate/
│   ├── credit-eligibility-matrix.md
│   └── terms-snapshot.md
└── spendbase/
    └── provider-verification-record.md
```

Until the raw execution artifacts exist, the canonical state remains blocked.
