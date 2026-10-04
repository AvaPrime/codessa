# Codessa Autonomous Development Readiness Assessment

Status: descriptive inventory. Not a constitution. Not authorization. No task is READY.
Base: `codessa-engineering-factory` after `5355846`.
E-007 remains BLOCKED.

## Finding

The factory can execute an explicitly authorized task and stop when none is authorized. Codessa is not yet an autonomously buildable target. The missing front half was an inventory, contracts, a definition of done, and a candidate engineering graph. Those descriptive artifacts now exist. They authorize nothing. A scheduler would still only automate the stop.

## Status taxonomy

CANONICAL means the frozen constitution. ACTIVE means a tested path on this branch. EXPERIMENTAL means a proposal or reference harness. LEGACY means older code that can still run and must not be treated as the target. BLOCKED means identified and not authorized. MISSING means required for a whole system and not present.

## Inventory

| Area | Status | What exists | Authority | Gap |
|---|---|---|---|---|
| Constitution | CANONICAL | `SPEC-CODESSA-AWS-STAGE-001` and freeze decision | MCGL is the only canonical transition authority | Unchanged |
| Factory | ACTIVE | Roadmap, ledger, verifier, dispatch rule | Repository READY marker only | No gap discovery, no repair loop, no scheduler |
| Refusal core | ACTIVE | `runtime/codessa-core.ts`, accepted at C-001 | None by itself | Narrow |
| Industry packs | ACTIVE | Claims, matter, chart name maps | Labels only | Role label is not authority |
| Record file | ACTIVE | Snapshot save/load | None; load does not commit | Not a system of record |
| Execution slice | ACTIVE | Seal, router, observation, supplied outcome | Consumes outcome; does not certify it | E-007 |
| Caller and kernel entry | ACTIVE | `handleRequest`, `runGoverned` | Forwards supplied outcome | Old `executeTask` remains |
| Claims path | ACTIVE | Pack, kernel, file | Same seam | One path, not a product |
| Outcome authorization | BLOCKED | Decision id and outcome name are accepted | Unresolved | E-007 |
| Historical kernel | LEGACY | Goal, agent, model execute, admission on store | Weaker than the slice | Not the canonical runtime |
| Memory mechanisms | LEGACY | MemoryManager, AgentMemory, conversation and sync managers, historical store notes | Fragmented | No single memory contract |
| Context architecture | EXPERIMENTAL | Closed proposal branch | None | Not canonical |
| Agents and guilds | LEGACY | Registry and directives | Unclear | Not bound to the governed path |
| Providers | ACTIVE for mocks | Model router and historical router | None | No production provider contract |
| Retrieval and infrastructure | LEGACY | Chroma, Firebase, S3, pgvector references | None | Not selected |
| OpenViking | DEFERRED | Research only | None | Not a blocker |
| System acceptance | MISSING | Slice refusals pass | n/a | No end-to-end definition of done |
| Engineering graph | MISSING | Separate E, C, F, and P series | Existence is not authorization | No dependency backlog |

## What the factory may do later without E-007

Find untested code, stale documents, duplicate implementations, and contract violations. Generate tests for an already specified contract. Repair a failing test inside an authorized task. It may not choose the architecture, issue an outcome, or mark its own task READY.

## What remains human

Constitutional changes. The authority model. Declaring a subsystem canonical. Selecting infrastructure. Promoting an experiment to the target architecture.

## Build graph

This graph is not a queue.

Constitution, frozen.
Authority model, blocked at E-007.
Execution and evidence, active for one slice.
Admission, active for the kernel shortcuts.
Memory and context, legacy or experimental.
Agent runtime, legacy.
Integration and end-to-end acceptance, missing.

## Resolved descriptive boundary

The following artifacts now provide the missing descriptive layer:

- `docs/engineering/subsystem-contract-matrix.md` — contract/code/test inventory.
- `docs/engineering/system-acceptance.md` — whole-system definition of done.
- `docs/engineering/candidate-build-graph.md` — dependency-aware candidate decomposition with no READY tasks.

These artifacts do not authorize implementation, select infrastructure, resolve E-007, or change the constitution.

The remaining blockers are now classified rather than ambiguous: missing/conflicting contracts are architectural work; already-defined contract implementations can become bounded factory work when explicitly authorized; E-007 remains an authority decision and stays BLOCKED.
