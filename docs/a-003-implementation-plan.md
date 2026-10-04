# A-003 Implementation Plan

Status: **PLAN ONLY**. Authorized as a written plan. Not an implementation authorization.
Branch: `codessa-memory-admission`
Contract: A-001 @ `08615a8`. Matrix: A-002 @ `a89e667`.
Baseline: `refactor` @ `db887f32000651196d37d303c3f4d3f73e18cc32`
Date: 2026-10-04

This plan does not change `core/codessa-kernel.ts` or `memory/memory-manager.ts`.

## Allowed change, if later authorized

One admission function, plus the two kernel shortcuts that currently call `MemoryManager.store`:

- `CodesssaKernel.storeMemory`
- `CodesssaKernel.executeTask` when `metadata.storeInMemory` is set

`MemoryManager.store` stays a map write. It does not learn admission.

## Gate

Input: a candidate and a governance outcome. The gate does not create or validate the outcome.

```text
missing observation → refuse
missing source      → refuse
missing candidate   → refuse
missing outcome     → refuse
REJECT              → refuse
QUARANTINE          → refuse
PROMOTE             → MemoryManager.store
```

On `PROMOTE`, the stored record keeps observation refs, source refs, and the decision id. On every other result, `store` is not called for that candidate. Conflicting observation refs are copied through. The gate does not drop one. A missing or forged outcome refuses. Checking that an authority issued it is outside this plan.

## Call sites

A raw model result reaching either call site is not passed to `store` as memory. It may remain recorded as model output only if a later execution proposal adds that record. This plan does not add that record. The existing `storeInMemory` path stops meaning promotion.

## Tests that would be required

`MODEL_SUCCESS_WITHOUT_OBSERVATION_MUST_NOT_PROMOTE` must refuse. The control case may store only when an observation, a source, a candidate, and `PROMOTE` are all present, and the stored record must keep those refs. `REJECT` and `QUARANTINE` must not call `store`. These tests are not added by this plan.

## Out of scope

MCGL, ContextSnapshot, `executeTask` redesign beyond the store shortcut, M1, OpenViking, database selection, `AgentMemory`, `ContextualMemoryAgent`, and the conversation sync graph.

## Stop

Implementation remains unauthorized. The next step, if any, is a separate authorization to apply this plan.
