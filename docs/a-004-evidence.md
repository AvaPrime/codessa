# A-004 Evidence

Status: implementation evidence. Not a freeze. Not an authorization for A-005.
Proposal: `2106515`
Date: 2026-10-04

Decision records are held in the admission module. They are not written to `MemoryManager`. `MemoryManager.store` was not edited. `core/codessa-kernel.ts` was not edited. The two existing call sites already use `admitToStore`, so `REJECT` and `QUARANTINE` through those paths now record a decision and still do not store memory.

Command: `npx tsx tests/memory-admission-a004.ts`

Result:

```json
{
  "REJECT_RECORDS_NON_PROMOTION": true,
  "QUARANTINE_RECORDS_NON_PROMOTION": true,
  "PROMOTE_IS_NOT_A_NON_PROMOTION_RECORD": true,
  "MISSING_OUTCOME_DOES_NOT_INVENT_REJECT": true,
  "CONFLICT_STAYS_ON_THE_RECORD": true
}
```

A-003 cases were rerun and still passed. The gate does not validate that an authority issued the outcome.
