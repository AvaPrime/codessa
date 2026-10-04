# Memory Admission Conformance Matrix — A-002

Status: **PROPOSED** measurement. Not an implementation. Not a kernel change.
Contract: A-001 on `codessa-memory-admission` @ `08615a8`
Baseline runtime: `refactor` @ `db887f32000651196d37d303c3f4d3f73e18cc32`
Closed branch: `codessa-context-architecture` is not modified.

A-002 asks whether the existing runtime satisfies A-001. It does not add the missing boundary.

## Decision order

```text
input
  → attributable observation?
  → source provenance?
  → candidate?
  → explicit governance outcome?
       ├── PROMOTE     → memory
       ├── REJECT      → no memory
       ├── QUARANTINE  → quarantine only
       └── anything else, including absence → refuse
```

Retrievable is enough. The kernel map does not have to survive restart for a model string to function as memory during the process.

## Matrix

| Case | Observation | Source | Candidate | Outcome | Required | Runtime |
|---|---|---|---|---|---|---|
| MODEL_SUCCESS_WITHOUT_OBSERVATION_MUST_NOT_PROMOTE | no | model only | no | none | refuse | expected FAIL |
| REJECT_DOES_NOT_PROMOTE | yes | yes | yes | REJECT | no memory | cannot pass; no boundary |
| QUARANTINE_DOES_NOT_PROMOTE | yes | yes | yes | QUARANTINE | quarantine only | cannot pass; no boundary |
| CONFLICT_PRESERVES_BOTH | two, disagree | both | either | none | both kept, no winner | cannot pass; no boundary |
| PROMOTE_WITH_OBSERVATION | yes | yes | yes | PROMOTE | memory with refs | cannot pass; no boundary |
| MISSING_SOURCE_REFUSES | yes | no | yes | PROMOTE | refuse | cannot pass; no boundary |
| STRING_EVIDENCE_IS_NOT_PROVENANCE | no | free-form string | no | none | refuse | expected FAIL on AgentMemory-shaped input; AgentMemory remains out of scope |

`cannot pass` means the positive contract is not implemented, so the case is not a runtime pass. It is not a license to weaken the case.

## Expected kernel result

`executeTask` with `storeInMemory` true calls `MemoryManager.store` with the model result. `storeMemory` does the same. Neither reads an observation, a candidate, or a governance outcome. `MODEL_SUCCESS_WITHOUT_OBSERVATION_MUST_NOT_PROMOTE` therefore fails on the current kernel. That failure is the A-002 observation.

No other case can pass, because the admission boundary does not exist. A control case that would promote after a health-check observation and `PROMOTE` has nowhere to land.

## What this does not do

It does not implement admission. It does not change `MemoryManager.store`. It does not pull `AgentMemory`, conversation memory, or `ContextualMemoryAgent` into the next implementation. Those stores are named only where a write is already visible. Convergence is later than A-003.

A-003, if opened, is the smallest boundary that makes the refusal succeed and gives the positive cases a place to pass. It is not authorized by this matrix.
