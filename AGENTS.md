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

## Current task

Implement E-002 only, as specified in `docs/e2-model-router-prd.md`.

Call the model router only after the execution contract is sealed and the requested action is in the sealed allowed list. The router selects a configured provider and returns raw text as untrusted model output. Keep the current mock as one provider. Add a second mock only to prove that the selected provider changes the recorded output source and does not change authority.

Do not let the router authorize an action, create evidence, issue `COMMIT` or `PROMOTE`, or rewrite the contract. An unknown provider or a thrown provider fails closed: no evidence and no commit. Provider text that claims `COMMIT` or a new action list is not authority.

Do not modify the frozen constitution, `core/codessa-kernel.ts` `executeTask`, the closed context branch, or the admission gate's meaning. Run `npm run verify:slice` and the new router tests. Report files changed, tests run, failures, invariant implications, and remaining limitations. Stop after E-002.


## Next task

Do not start this until E-002 is implemented and `npm run verify:slice` passes.

Implement E-003 only: one execution record for the run on `codessa-execution-slice`.

The record must include the sealed contract, context hash, allowed actions, selected provider, model output, observation if present, external outcome if present, commit reference if committed, and promotion result if promoted. It is a record of what happened. It is not a new authority.

Do not let the record rewrite the contract, turn model output into evidence, or issue `COMMIT`. Do not modify the frozen constitution, `executeTask`, or the closed context branch. Run `npm run verify:slice` and the new record tests. Report files changed, tests run, failures, invariant implications, and remaining limitations. Stop after E-003.
