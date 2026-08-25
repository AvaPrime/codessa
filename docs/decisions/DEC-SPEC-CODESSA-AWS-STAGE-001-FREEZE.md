# DEC-SPEC-CODESSA-AWS-STAGE-001-FREEZE

**Status:** FROZEN  
**Target:** `SPEC-CODESSA-AWS-STAGE-001 v0.1`  
**Scope:** Canonical AWS staging implementation binding

The AWS architecture, security boundaries and authority model are frozen. MCGL remains the sole transition authority; AWS substrates remain non-authoritative.

## M1 state

`AWS-STAGE-M1 = PENDING_EXECUTION / BLOCKED`

| Gate | State | Required evidence |
|---|---|---|
| G-01 | UNKNOWN | Raw `af-south-1` catalog and active Anthropic model derivation |
| G-02 | UNKNOWN | Profile detail proving explicit non-empty destination mappings and contract admissibility |
| G-03 | UNKNOWN | Direct/profile runtime invocation plus SHA-256 provenance |
| G-04 | UNKNOWN | Provider-issued Spendbase Org ID evidence or explicit Founders-route record |

The blocked state is deliberate. No provider assumption, documentation page, expected model ID, or commercial estimate can substitute for observed account evidence.

## Evidence rule

All M1 artifacts are `CandidateArtifact` evidence. They have no authority to establish canonical Codessa state. Promotion requires an explicit deterministic MCGL transition.

## Transition condition

The next valid M1 state transition occurs only after the required raw provider artifacts are deposited under `artifacts/conformance/AWS-STAGE-M1/` and the deterministic gate evaluator records the resulting evidence state.
