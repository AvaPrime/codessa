# Context Architecture Conformance Plan

Status: **PROPOSED**. Not a freeze. Not an amendment to `SPEC-CODESSA-AWS-STAGE-001`.
Branch: `codessa-context-architecture`
Baseline constitution: `refactor` @ `db887f32000651196d37d303c3f4d3f73e18cc32`
Date: 2026-10-04

This plan turns T01–T15 into fixture definitions. It does not change `core/codessa-kernel.ts` or `memory/memory-manager.ts`. A historical failure is drift evidence. It is not a reason to weaken a fixture.

## Three layers

| Layer | Artifact | What a fixture may claim |
|---|---|---|
| Constitution | Frozen spec + freeze decision | INV-AWS-* and CandidateArtifact semantics |
| Proposed architecture | Context contract + compatibility report | CXT-001–CXT-015 |
| Historical implementation | `core/codessa-kernel.ts`, `MemoryManager` | Drift only. Never authority |

A fixture result has three independent verdicts: constitutional conformance, context-contract conformance, implementation drift. They must not be collapsed into one PASS.

## What this commit contains

- This plan.
- `fixtures/constitution.json` — Fixture A.
- `fixtures/substrate.json` — Fixture B.
- `fixtures/epistemic.json` — Fixture C.
- `fixtures/execution.json` — Fixture D.
- `fixtures/cases.json` — T01–T15 expected refusals.

No runner is included. Running the fixtures, and writing the drift report, are later commits.

## Fixture roles

Fixture A is the frozen authority path: MCGL is the only canonical committer; retrieval and worker outputs are candidates; a seal is not admission.

Fixture B is a replaceable context substrate. It includes an OpenViking-like adapter and a mock adapter. Disagreement between them, or with Postgres identity, does not resolve canonical authority.

Fixture C is evidence, claim, and an epistemic result. Contradiction downgrades or rejects the claim. It does not delete evidence and does not overwrite canonical state.

Fixture D is snapshot, execution contract, provider proposal, observation, and an MCGL transition request. Snapshot seal is a content-integrity operation by the control-plane resolver. It is not canonical admission.

## Case matrix

| Test | Target | Expected |
|---|---|---|
| T01 | Resource asserts canonical truth | Reject |
| T02 | Memory mutates canonical state | Reject |
| T03 | Skill grants authorization | Reject |
| T04 | Provider writes canonical DB | Reject |
| T05 | Claim without evidence | Reject |
| T06 | Decision without authority | Reject |
| T07 | Consequential execution without snapshot | Reject |
| T08 | Snapshot changes during execution | Reject |
| T09 | Substrate conflicts with Postgres identity | Authority path unchanged |
| T10 | Evidence contradicts claim | Claim downgraded or rejected; no silent overwrite |
| T11 | Context violates scope or policy | Reject before execution |
| T12 | Provider bypasses MCGL | Reject |
| T13 | Memory promoted without governance | Reject |
| T14 | Capability expands without revalidation | Reject |
| T15 | Provider reports success without observed effect | Reject VERIFIED |

## T07

T07 does not mean only MCGL may seal a snapshot. The resolver may seal. The fixture fails if seal is recorded as canonical admission, and it fails if a consequential execution proceeds with no sealed snapshot id.

## T09

T09 does not mean Postgres wins because it is a better store. Contextual disagreement cannot itself resolve canonical authority. Canonical state remains on the Codessa authority path: evidence admission, epistemic gate, MCGL. The substrate text stays a candidate either way.

## T15

`VERIFIED` is refused. A provider success string is not an observation. The allowed states are candidate or rejected, not verified.

## Drift rule

Do not edit a fixture so that `MemoryManager.store` passes T02 or T13. If that method writes without a governance result, the drift verdict is FAIL and the constitutional verdict is unchanged.

## Non-goals

- No OpenViking deployment.
- No kernel change.
- No M1 gate transition.
- No freeze of this branch.
