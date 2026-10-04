# Codessa Engineering Instructions

## Purpose

Codessa is developed through bounded implementation slices. Agents are implementation workers. They do not redefine Codessa's constitutional authority.

## Authority

The frozen Codessa constitution is authoritative. Do not modify frozen specifications, freeze decisions, or constitutional invariants unless the task explicitly authorizes that change.

Provider output is not authority. Model output is not evidence by itself. Retrieval is not evidence by itself. Storage is not promotion. A successful model response is not proof that an external action succeeded. A candidate is not canonical merely because it exists in a database, file, vector store, memory store, or agent context.

## Scope

Implement only the task currently assigned. Do not reopen closed branches. Do not introduce OpenViking, a new database, vector store, graph store, or other infrastructure unless the task explicitly authorizes it. Do not repair unrelated historical architecture while implementing a bounded task. Prefer the smallest reversible implementation that satisfies the acceptance tests.

`codessa-context-architecture` stays closed. `codessa-memory-admission` stays as recorded. `codessa-execution-slice` is the active implementation track. Do not open A-005.

## Evidence

Do not manufacture evidence to make a test pass. Do not convert model output into an observation. Do not convert an observation into a decision. Do not treat a test fixture as production authority. When evidence is unavailable, report that it is unavailable.

## Memory

Memory storage and memory admission are separate. A stored candidate is not necessarily durable or canonical memory. Do not bypass an existing admission boundary. Do not modify unrelated memory stores unless the task includes them.

## Execution

Execution must not silently acquire authority. Do not interpret provider success text as proof of an external effect. Do not invent execution outcomes. Do not broaden an execution task into an architecture redesign.

## Implementation

Before changing code, read the assigned task, the relevant implementation, the tests covering the behavior, the files permitted to change, and the applicable invariants. Implement the smallest change necessary.

## Verification

After implementation, run the task-specific tests, the Codessa verification command, and inspect the diff. Confirm files outside the declared scope were not changed. Do not report success if verification failed.

The verification command is `npm run codessa:verify`.

## Stop conditions

Stop and report instead of improvising when the task contradicts a frozen invariant, the required behavior is ambiguous in a way that affects authority, the task requires an out-of-scope subsystem, a required dependency is unavailable, tests and the stated contract disagree, or the smallest implementation cannot satisfy the acceptance criteria.

## Completion report

Report task id, summary, files changed, tests run, verification result, invariants affected, known limitations, and follow-up work discovered. Do not silently create additional work.

## Git

Keep commits narrowly scoped. Do not modify unrelated files. Do not rewrite history unless explicitly instructed. Do not merge branches automatically unless explicitly authorized. A passing implementation is evidence for review, not automatic architectural approval.
