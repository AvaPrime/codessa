# Codessa Engineering Rules

## Frozen constitution

Do not modify `SPEC-CODESSA-AWS-STAGE-001` or its freeze decision without explicit authorization. M1 stays `PENDING_EXECUTION / BLOCKED` until evidence says otherwise.

## Authority

Provider output is never authority. A skill is never authority. Retrieval is never evidence. Model output is never evidence by itself. Execution does not create canonical state by itself. A canonical transition needs the governed evidence and decision path. `COMMIT` is an externally supplied outcome unless a later authorized change says otherwise.

## Current build

The active branch is `codessa-execution-slice`. Build forward from that slice. Do not reopen `codessa-context-architecture`. Do not open A-005. Do not select OpenViking or another substrate as part of a slice task.

## Engineering mode

Prefer a small implementation over a new design track. If a requirement is ambiguous and does not change authority, add the smallest reversible interface. Do not silently broaden scope. Run the slice verification after a slice change.

Report files changed, tests run, failures, invariant implications, and remaining limitations.
