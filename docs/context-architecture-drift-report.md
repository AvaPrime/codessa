# Context Architecture Drift Report

Status: **observation**. Not a defect order. Not a freeze. Kernel was not modified.
Harness: `tests/context-architecture/drift-harness.ts`
Contract runner: not used
Baseline symbols: `refactor` @ `db887f32`, carried on `codessa-context-architecture`
Date: 2026-10-04

DRIFT means the historical implementation does not satisfy the proposed contract. It does not by itself amend the frozen spec, and it does not require a fix in this commit.

## Method

`MemoryManager.store` was initialized and called with an unguarded entry. The Map write and `memory.stored` event were observed at runtime. Kernel and agent findings are source observations of the same baseline. The reference conformance runner was not imported.

## Findings

| Case | Rule | Invariant | Symbol | Verdict |
|---|---|---|---|---|
| T02 | CXT-007 | INV-AWS-03 | `MemoryManager.store` | DRIFT |
| T13 | CXT-007 | INV-AWS-03 | `MemoryManager.store` | DRIFT |
| T07 | CXT-008 | INV-AWS-02 | `CodesssaKernel.executeTask` | DRIFT |
| T07-seal | CXT-008 | INV-AWS-02 | none | NOT_APPLICABLE |
| T02-kernel | CXT-007 | INV-AWS-03 | `CodesssaKernel.storeMemory` | DRIFT |
| T02-agent | CXT-007 | INV-AWS-03 | `ContextualMemoryAgent.storeMemory` | DRIFT |
| T15-kernel | CXT-015 | INV-AWS-03 | `CodesssaKernel.executeTask` | DRIFT |
| T06 | CXT-012 | INV-AWS-02 | none | NOT_APPLICABLE |

No finding was CONFORMANT. No finding was UNOBSERVABLE. Absence of a symbol is NOT_APPLICABLE. A write or execution path that skips the proposed gate is DRIFT.

### T02

Symbol: `MemoryManager.store` in `memory/memory-manager.ts`.

Observed: runtime probe stored `drift-probe`, wrote the in-memory map, and emitted `memory.stored`. No governance argument exists.

Expected: a memory write stays non-canonical unless admitted, and promotion requires a governance result.

Verdict: DRIFT. Evidence: the probe return `wrote=true`, `emitted=true`.

### T13

Same symbol. `MemoryEntry` has `id`, `type`, `content`, `agent`, `task_id`, `timestamp`, `metadata`. There is no `policy_result`.

Expected: promotion requires `PROMOTE`, `REJECT`, or `QUARANTINE`.

Verdict: DRIFT.

### T07

Symbol: `CodesssaKernel.executeTask`. It selects an agent, calls `model.execute`, and returns the result. No snapshot id is read or written. `storeInMemory` may then store that result.

Expected: a consequential execution cites one sealed snapshot. Seal itself is not admission.

Verdict: DRIFT for the execution path.

### T07-seal

No resolver seal method exists. Verdict: NOT_APPLICABLE. The contract allows a resolver to seal. This kernel does not implement that operation, so there is nothing to call conformant or drifting.

### Additional divergence

`CodesssaKernel.storeMemory` forwards to `MemoryManager.store` and emits `memory.stored`. DRIFT, same rule as T02.

`ContextualMemoryAgent.storeMemory` writes a `Map` with no governance result. DRIFT.

`executeTask` stores `model.execute` output as `task_result` when `metadata.storeInMemory` is set. That is T15-shaped drift: a model result becomes stored memory without an observation. DRIFT against CXT-015 and INV-AWS-03.

No MCGL method exists on the kernel. T06 is NOT_APPLICABLE, not a pass. The kernel cannot be said to enforce the authority path, because the path is absent.

## What this does not decide

These findings do not authorize a kernel change, a fixture change, or an OpenViking adapter. The comparison is now available: the frozen spec says retrieval is a candidate, the proposed contract refuses ungoverned promotion, and the kernel stores directly. Implementation choices come after that comparison, not inside this report.
