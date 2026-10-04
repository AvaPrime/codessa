# A-004 Non-Promotion Proposal

Status: **PROPOSED**. Not an implementation authorization.
Branch: `codessa-memory-admission`
Depends on: A-003 @ `a39f84f`
Baseline: `refactor` @ `db887f32000651196d37d303c3f4d3f73e18cc32`
Date: 2026-10-04

No prior A-004 label exists in this repository. This name is the increment described in the authorization request. It is not a discovered roadmap item.

## Question

What does it mean to retain an admission decision without promoting the candidate to memory?

A-003 answers promotion. `REJECT` and `QUARANTINE` currently refuse and leave no record. A later encounter cannot see that the candidate was already rejected or quarantined.

## Boundary

```text
candidate + outcome
  ├── PROMOTE    → MemoryManager.store
  ├── REJECT     → admission decision record
  └── QUARANTINE → admission decision record
```

Neither `REJECT` nor `QUARANTINE` becomes memory. The record explains the non-promotion. It does not enter `MemoryManager`.

Minimum fields: `candidate_id`, `observation_refs`, `source_refs`, `outcome`, `decision_id`, `timestamp`.

No new durable store is selected. The proposal defines the record. Where it is held is a later implementation choice, and it must not be the promoted-memory map.

## What this is not

Not a quarantine subsystem, a rejection-learning system, a contradiction resolver, a retry mechanism, an MCGL implementation, a database, a replacement for `AgentMemory`, a convergence of historical memory stores, or an OpenViking integration.

A missing or forged outcome still refuses. It does not become a synthetic `REJECT` record. Conflicting observations stay on the record and are not reduced to a winner.

## Stop

Implementation is not authorized. The next recorded step is the conformance matrix, then a separate authorization.
