# A-003 Evidence

Status: implementation evidence. Not a freeze. Not an MCGL implementation.
Branch: `codessa-memory-admission`
Plan applied: `2ca95cc`
Date: 2026-10-04

`MemoryManager.store` was not edited. The gate is `memory/admission.ts`. The only kernel edits are `storeMemory` and the `storeInMemory` branch of `executeTask`.

Command: `npx tsx tests/memory-admission-a003.ts`

Result:

```json
{
  "refusal_storeMemory": true,
  "refusal_executeTask_storeInMemory": true,
  "control_promote": true,
  "reject_and_quarantine_do_not_store": true
}
```

`MODEL_SUCCESS_WITHOUT_OBSERVATION_MUST_NOT_PROMOTE` refused on both call sites. A raw `"Deployment succeeded."` did not become a stored memory. The control case stored only with observation refs `OBS-001` and `OBS-002`, source `deployment-monitor`, and promotion decision `DEC-001`. `REJECT` and `QUARANTINE` did not call a successful store.

The gate does not check that an authority issued the outcome. A `PROMOTE` input is accepted as an input. That check remains outside A-003.
