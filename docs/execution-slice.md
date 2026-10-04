# Execution slice

Status: runnable path. Not a constitution change. Not MCGL.
Branch: `codessa-execution-slice`
Base: `codessa-memory-admission` @ `7cc46b9`

One request creates a run, a context hash, and an allowed-action list. The model result is captured as model output. Evidence is created only from an observation. A commit is recorded only when an external `COMMIT` outcome and an observation both exist. Memory promotion goes through the A-003/A-004 gate.

The slice does not issue governance outcomes and does not select a substrate. `core/codessa-kernel.ts` is not the path this slice runs.


Contract integrity: the run seals a contract from the request before the model is called. The contract id covers the run id, context hash, and allowed actions. The model return value and later edits to the request do not change that contract. An action outside the sealed list is refused before invocation. A commit record stores the sealed contract id, run id, context hash, and evidence id. COMMIT is still an externally supplied outcome.
