# Execution slice

Status: runnable path. Not a constitution change. Not MCGL.
Branch: `codessa-execution-slice`
Base: `codessa-memory-admission` @ `7cc46b9`

One request creates a run, a context hash, and an allowed-action list. The model result is captured as model output. Evidence is created only from an observation. A commit is recorded only when an external `COMMIT` outcome and an observation both exist. Memory promotion goes through the A-003/A-004 gate.

The slice does not issue governance outcomes and does not select a substrate. `core/codessa-kernel.ts` is not the path this slice runs.
