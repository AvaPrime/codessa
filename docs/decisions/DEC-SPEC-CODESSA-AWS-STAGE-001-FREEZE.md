# Decision Record: DEC-SPEC-CODESSA-AWS-STAGE-001-FREEZE

- **Decision ID:** `DEC-SPEC-CODESSA-AWS-STAGE-001-FREEZE`
- **Status:** `FROZEN`
- **Target Specification:** `SPEC-CODESSA-AWS-STAGE-001 v0.1`
- **Scope:** Canonical AWS Staging Implementation Binding
- **Epistemic Boundary:** MCGL remains the sole transition authority; AWS substrates possess zero epistemic authority.
- **Verification Phase:** `AWS-STAGE-M1`
- **Current Verification State:** `PENDING_EXECUTION / BLOCKED`

## Frozen Invariants

### AWS substrate invariants

- `INV-AWS-01 — Substrate Non-Authority`: AWS compute, networking, storage, and inference operate strictly as physical substrates with zero epistemic authority.
- `INV-AWS-02 — Kernel Authority`: Sole authority to authorize canonical state transitions resides exclusively within the deterministic MCGL kernel.
- `INV-AWS-03 — Probabilistic Non-Canonicality`: Model inference, vector search returns, and worker outputs remain uncommitted candidate claims until validated and authorized.
- `INV-AWS-04 — Replayable Execution`: Fargate Spot worker tasks are strictly non-authoritative; interruptions drop ephemeral state and requeue with zero ledger mutation.
- `INV-AWS-05 — Canonical Immutability`: S3 Object Lock Compliance Mode preserves evidence of authorized state; it does not grant epistemic authority.
- `INV-AWS-06 — Retrieval Non-Authority`: pgvector and semantic retrieval layers propose candidate evidence only; they possess no truth-determining authority.
- `INV-AWS-07 — Infrastructure Substitutability`: The AWS implementation is a pluggable binding, not a constitutional dependency of the Codessa runtime.

### Bedrock invariants

- `INV-BEDROCK-01 — Model Availability Non-Authority`: External model catalog states, regional availability shifts, deprecations, and routing mechanisms have zero authority over canonical state.
- `INV-BEDROCK-02 — Explicit Routing`: Cross-region inference execution requires an explicitly authorized inference-profile reference within the execution contract; implicit geographic failover is forbidden.
- `INV-BEDROCK-03 — Routing Provenance`: Every candidate inference execution must record an immutable provenance tuple containing provider, model_or_profile_id, source_region, routing_policy, timestamp, request_hash, and candidate_artifact_id.

## M1 Verification Gate Ledger

| Gate | Condition | State | Required Evidence |
|---|---|---|---|
| `G-01` | Active Anthropic model(s) proven in `af-south-1` | `UNKNOWN` | `artifacts/conformance/AWS-STAGE-M1/bedrock/anthropic-active-models.json` |
| `G-02` | Explicit routing destinations proven for a selected inference profile and admissible under the declared execution contract | `UNKNOWN` | `selected-profile-detail.json` plus routing-policy/contract evidence |
| `G-03` | Successful direct and/or explicitly profiled runtime invocation with valid provenance hashes | `UNKNOWN` | `invocation-smoke-test-direct.json` and/or `invocation-smoke-test-profile.json` |
| `G-04` | Spendbase Provider Org ID verified, or fallback path selected | `UNKNOWN` | `artifacts/conformance/AWS-STAGE-M1/spendbase/provider-verification-record.md` |

## Evidence Integrity Rules

1. **Raw Preservation:** Unmodified provider responses must be preserved alongside all derived artifacts.
2. **Deterministic Selection:** Model/profile selection must use explicit predicates and lexical ordering; incidental API ordering is not admissible evidence selection logic.
3. **G-02 Explicit Admissibility:** Existence of `selected-profile-detail.json` alone cannot produce a PASS. The artifact must contain non-empty destination region mappings and must be compatible with the declared routing contract.
4. **CandidateArtifact Immutability:** Outputs under `AWS-STAGE-M1` remain non-authoritative execution evidence. No downstream process may promote them to canonical knowledge without an explicit deterministic MCGL state transition.
5. **No Provider Assumption Promotion:** Documentation, expected catalog state, or commercial-program assumptions cannot be promoted to M1 PASS without raw provider evidence.

## State Transition Constraint

The canonical state remains:

```text
SPEC-CODESSA-AWS-STAGE-001 v0.1 (FROZEN)
  -> DEC-SPEC-CODESSA-AWS-STAGE-001-FREEZE (FROZEN)
  -> AWS-STAGE-M1 (PENDING_EXECUTION / BLOCKED)
```

No architectural transformation is authorized on this branch until the required raw CLI/provider evidence is deposited and the M1 gates are evaluated from that evidence.
