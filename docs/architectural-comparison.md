# Architectural Comparison Report

Status: **PROPOSED comparison**. Not a freeze. Not an implementation decision. Not an amendment to `SPEC-CODESSA-AWS-STAGE-001`.
Evidence: contract at `1908466`, conformance runner at `e46d249`, drift report at `5e9b916`.
Baseline: `refactor` @ `db887f32000651196d37d303c3f4d3f73e18cc32`.
Date: 2026-10-04

The proposed context architecture is compatible with the frozen constitution, passes its own reference harness, and the historical kernel drifts from both. None of that authorizes a kernel change.

## Three authorities

| Layer | Establishes | Status |
|---|---|---|
| Frozen spec + freeze decision | Constitutional authority. Substrates are non-authoritative. Only MCGL commits. Retrieval is a candidate. M1 is blocked. | FROZEN |
| Context Architecture Contract | Proposed context semantics: resource identity, memory lifecycle, skill non-authority, snapshot as content hash, adapter-reported retrieval. | PROPOSED |
| `core/codessa-kernel.ts` and `MemoryManager` | Observed behavior. Unguarded store, no snapshot, model result may be stored. | DRIFT MEASURED |

These layers do not collapse. A kernel failure is not a contract failure. A contract pass is not constitutional admission. A frozen invariant is not implemented merely because a proposal restates it.

## Scope boundary

Context architecture owns context semantics, resource identity, memory lifecycle, skill semantics, snapshot semantics, the retrieval-adapter boundary, and the evidence/claim distinction as types.

Execution and governance architecture owns MCGL, authority, the execution contract, leases, canonical transition, and effect verification. That owner is not this branch. AAPT0-M7 remains a freeze-blocked design candidate with authority none.

The historical kernel owns `MemoryManager`, `ContextualMemoryAgent`, `executeTask`, and `model.execute` persistence. It is the measured subject. It is not the constitution.

OpenViking is outside all three. It is a possible adapter behind the retrieval boundary, blocked until a context implementation is actually in scope.

## Classification

| Finding | Class | Owner |
|---|---|---|
| `MemoryManager.store` writes and emits without governance (T02, T13) | In scope for context architecture | Context architecture |
| `CodesssaKernel.storeMemory` forwards that write | In scope for context architecture | Context architecture |
| `ContextualMemoryAgent.storeMemory` writes another unguarded map | Historical implementation debt | Historical kernel |
| `executeTask` has no snapshot id (T07) | Requires a separate architectural decision | Execution / governance |
| No resolver seal (T07-seal) | Not actionable without a context implementation; not a kernel defect by itself | Context architecture, later |
| `executeTask` stores `model.execute` output as `task_result` | Requires a separate architectural decision | Execution / governance |
| No MCGL method (T06) | Not a violation of an executable kernel contract. Outside this branch. | Execution / governance |
| M1 gates | Not actionable without M1 evidence | Frozen staging binding |

In scope means a later context proposal may specify the change. It does not mean this branch should edit the file.

## Memory governance

`MemoryManager.store` and `CodesssaKernel.storeMemory` bypass the proposed promotion boundary. That is not an OpenViking problem. The kernel's memory semantics are weaker than CXT-007: any entry can be stored and emitted as `memory.stored`. The frozen spec already says worker and retrieval outputs are candidates. The kernel does not represent that distinction.

`ContextualMemoryAgent` is a second unguarded map. It is debt in the historical tree, not a second context architecture. Repairing it inside the context contract would mix a scaffold with the proposal.

## Snapshot binding

T07 drift does not imply that context architecture should modify `executeTask`. Snapshot semantics belong to the context layer: who may seal, what the hash covers, and that seal is not admission. Binding a sealed snapshot to a consequential run belongs to the execution contract. Verifying the effect belongs to governance. Those are three owners. Putting all three into `executeTask` from this branch would smuggle an execution proposal into the context contract.

## Model output stored as memory

`model.execute` to `task_result` to `storeInMemory` has no observation boundary. That collapses model output, observed effect, evidence, claim, memory, and canonical state. The collapse is real. The owner of the persistence hook is the execution path, not the context substrate. Classification first: this is a separate architectural proposal if anyone later wants the kernel to stop persisting model results as memory.

## Missing MCGL

NOT_APPLICABLE was the correct drift verdict. The kernel does not declare an MCGL implementation, so absence is not an executable-contract violation. It is also not conformance. Authority remains defined only by the frozen spec. This branch does not implement it.

## Decision gate

A. Context-only work, if later authorized, is limited to memory lifecycle and snapshot semantics as a proposal. It does not start by editing `executeTask`.

B. Kernel execution semantics, including snapshot consumption and `task_result` persistence, need their own proposal. They are not admitted here.

C. `ContextualMemoryAgent` should be left as documented drift unless a later decision says the scaffold is in scope.

D. M1 stays `PENDING_EXECUTION / BLOCKED`. No provider evidence in this comparison changes that.

OpenViking is not selected. A context substrate is not required to record this comparison, and introducing one would hide the kernel/governance split this report exists to keep visible.

No file under `core/` or `memory/` was changed. No freeze record was added.
