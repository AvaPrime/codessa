# Codessa Subsystem Contract Matrix

Status: descriptive engineering inventory. This document does not authorize implementation, architecture changes, or task readiness.
Baseline: `codessa-engineering-factory` at the time of assessment.
Constitution: unchanged.
E-007: BLOCKED.
READY tasks: none.

## Interpretation

- **Present** means the behavior has an identifiable contract in code and/or the accepted governed-path tests.
- **Partial** means a narrow contract exists, but the subsystem lacks a complete system-level semantic contract.
- **Missing** means no authoritative governed contract exists for the subsystem.
- **Code** records whether an implementation exists, not whether it is canonical.
- **Tests** record whether the stated behavior is executable and tested, not whether the architecture is complete.
- A legacy implementation does not become canonical merely because it exists or passes a test.

| Subsystem | Contract | Code | Tests | Authority / admission | Current status | Principal gap |
|---|---|---|---|---|---|---|
| Request | Partial — `RunRequest`, sealing, allowed-action constraint | Present — `runtime/execution-slice.ts`, caller/core bridge | Present — execution-contract, caller, kernel-bridge, product-path | Request creation does not itself authorize canonical state | ACTIVE, governed path | No complete system-level request lifecycle contract |
| Context | Partial — context IDs are bound into a request hash | Present — sealing/snapshot hash only | Present — contract/context binding checks | Context is not evidence or authority | ACTIVE, narrow | No semantic context contract, retrieval contract, or canonical context subsystem |
| Provider result | Partial — provider output is explicitly untrusted model output | Present — model router and execution slice | Present — execution-slice, outcome-intake, failure-paths | Provider/model output has no canonical authority | ACTIVE, mocks | No production provider contract or external-provider evidence path |
| Observation | Partial — named source, ID, content, and anti-model checks | Present — execution slice/core/packs | Present — observation-capture, execution-slice, core tests | Observation is evidence only when sourced outside model/provider output | ACTIVE | No unified observation source registry or lifecycle |
| Evidence | Partial — observation produces an evidence reference in the execution slice | Present — `evidence_id` and commit record | Present — execution-contract and observation-capture | Evidence supports a supplied outcome; it does not issue one | ACTIVE, narrow | No standalone evidence object/schema/provenance contract |
| Outcome | Partial — `COMMIT`, `PROMOTE`, `REJECT`, `QUARANTINE` are consumed as supplied inputs | Present — execution slice/core/admission | Present — outcome-intake, core, memory-admission tests | Issuer legitimacy is not established | ACTIVE intake / BLOCKED authority | E-007: no issuer authorization verification |
| Decision | Partial — admission non-promotion records and supplied decision IDs exist | Fragmented — admission records, execution records, commit IDs | Present for narrow refusal/record behavior | Decision ID is accepted but issuer authority is unresolved | ACTIVE, fragmented | No unified decision object, issuer identity, scope, or authorization contract |
| Commit | Partial — commit requires valid observation plus supplied `COMMIT` | Present — execution slice/core | Present — execution-contract, execution-slice, observation-capture, product-path | Commit is not permitted from model/provider text; issuer legitimacy remains unresolved | ACTIVE, narrow | No verified authority chain for the supplied outcome |
| Memory candidate | Partial — candidate requires observation/source references | Present — `memory/admission.ts` | Present — A-003/A-004 tests and execution-slice tests | Candidate is not memory until explicit `PROMOTE` | ACTIVE | Candidate semantics are not yet unified across legacy memory mechanisms |
| Memory admission | Present for the implemented seam — candidate + observation/source refs + explicit outcome | Present — `memory/admission.ts` and kernel integration | Present — A-003/A-004 and execution-slice tests | Only `PROMOTE` reaches MemoryManager through the gate | ACTIVE, narrow | Legacy memory stores remain outside one governed contract |
| Agent action | Missing as a governed subsystem contract | Present, but primarily legacy — registry/agent execution/planner paths | Fragmented; no complete governed agent-action acceptance suite | Legacy agent/model path is not equivalent to governed execution | LEGACY | No canonical agent-action contract tying capability, action, observation, outcome, and commit together |
| Persistence | Partial — record snapshot has explicit load/save semantics | Present — `runtime/record-store.ts`; MemoryManager is process-local | Present — record-store tests | Persistence does not create authority | ACTIVE snapshot / LEGACY memory persistence | No canonical durable system-of-record contract or restart semantics |
| Provenance | Partial — run IDs, contract hashes, provider, observation/source refs, decision IDs are recorded in places | Present, fragmented across execution/admission/records | Present in several slice tests | Provenance records authority inputs; it does not manufacture authority | ACTIVE, fragmented | No unified provenance schema spanning request → provider → observation → decision → commit/memory |
| System acceptance | Missing — only slice/refusal invariants are defined | Partial — one claims path exists | Partial — product-path is one-path acceptance | Human acceptance remains distinct from evidence | MISSING | No whole-system definition of done |
| Canonical runtime | Missing as an implementation contract | Multiple paths exist: governed runtime plus historical kernel/planner | Partial | Frozen constitution is authoritative; runtime implementation is not yet singular | MISSING / LEGACY overlap | No explicit migration boundary from legacy kernel to governed runtime |

## Findings

### 1. The governed seam is real

The following chain is implemented and tested for a narrow request:

`request → sealed contract → untrusted provider result → named observation → supplied outcome → refusal/commit or memory admission`

That is the current active implementation target.

### 2. The main semantic gaps are now explicit

There are three different classes of incompleteness:

- **Contract gaps:** context, evidence, decision, agent action, persistence, provenance, and whole-system acceptance lack complete system-level contracts.
- **Implementation gaps:** several contracts exist only in the governed slice and have not been carried into the older runtime.
- **Authority gap:** E-007 remains unresolved; a supplied outcome is consumed without proving that the issuer was authorized.

These must not be collapsed into one backlog item.

### 3. Legacy memory is not one subsystem

`MemoryManager`, `AgentMemory`, conversation memory, synchronization infrastructure, and historical storage references cannot currently be treated as one canonical memory implementation. The admission gate is the active governed seam; the rest remains legacy or outside the canonical path.

### 4. The historical kernel is not the target merely because it runs

The older goal → agent → model → result flow remains executable, but it does not establish the same governed lifecycle. It must not silently become the target architecture through autonomous refactoring.

### 5. Persistence is not solved by the record file

The record file proves that loading a snapshot does not itself commit or promote. It is a testable projection, not a canonical system of record.

## Autonomous-development consequence

The repository is now describable enough to distinguish:

1. a specified contract with missing implementation;
2. an implemented contract with missing tests;
3. a narrow active implementation that lacks a system-level contract;
4. legacy implementations that must not be mistaken for the target;
5. architectural/authority decisions that require explicit authorization.

No row in this matrix is a READY task.

## Explicit non-decisions

This matrix does **not**:

- authorize E-007;
- select an authority model;
- select OpenViking, pgvector, RDS, S3, or another persistence/retrieval substrate;
- authorize MCGL implementation;
- replace the legacy kernel;
- merge memory implementations;
- authorize a scheduler;
- promote any experimental architecture to canonical status;
- create a factory READY task.

## Next decision boundary

The next work can now be decomposed from evidence rather than repository archaeology. Before autonomous implementation, candidate work should be classified as either:

- **implementation of an already-defined contract**, which can potentially be factory work; or
- **definition/reconciliation of a missing or conflicting contract**, which remains an architectural decision.

E-007 remains in the second category and remains BLOCKED.
