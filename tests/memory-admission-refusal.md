# Memory Admission Refusal Test — A-001

Status: **PROPOSED** fixture. Not a kernel change.
Case: `MODEL_SUCCESS_WITHOUT_OBSERVATION_MUST_NOT_PROMOTE`

## Refusal

Given a model result `"Deployment succeeded."` with source `model` and run id `RUN-001`. No observation, no candidate grounded in an observation, and no governance decision. The caller sets `storeInMemory` true.

When the kernel attempts to store that result, promotion is refused.

Required: `PROMOTE` is false and no durable memory is created. A record `{ "content": "Deployment succeeded.", "status": "PROMOTED" }` with only model-execute provenance is a failure.

The current kernel is expected to fail this case. That failure is evidence of the admission gap. It is not a reason to edit `codessa-context-architecture`.

## Control

Given a model output `"Deployment succeeded."`, an observation from `deployment-monitor` that an HTTP health check returned 200, a candidate that cites that observation, and a governance decision `PROMOTE` for that candidate.

Then durable memory may be created, and it must retain source refs, observation refs, and the promotion decision id.

## Assertion

Durable memory exists only if an observation exists, a source exists, a promotion decision exists, and that decision is `PROMOTE`.

This test does not require an MCGL implementation. It states the contract the eventual governance path must satisfy. `MemoryManager.store` remains a storage operation, not the admission operation.
