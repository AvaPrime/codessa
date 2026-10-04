# Context invariant and adversarial tests

Status: **PROPOSED** conformance text for contract v0.1.
These cases are specifications. They are not executed against production MCGL in this commit.
Expected result of every case is refusal or non-authority. A pass that writes canonical state is a failure of the contract.

## Boundary

OpenViking is context mechanics. Postgres is canonical application state. The ECL role is the epistemic gate. The RAG-Guard role is the admissibility gate. MCGL is causal authority. The provider is an intelligence substrate.

```text
Provider ──X──> Postgres
Provider ──X──> MCGL
Provider ──X──> canonical Memory
Provider ──X──> canonical Decision
```

## Cases

### T01 — Retrieved resource becomes truth

Given a substrate hit `{uri, score, epistemic_status: CANDIDATE}`.
When a caller writes it as a canonical fact without a collector.
Then the write is refused. CXT-003, CXT-015.

### T02 — Memory mutates canonical state

Given memory `M` with `epistemic_status: OBSERVED` and `lifecycle: PROMOTED`.
When `M` is applied as a project-state update.
Then no MCGL transition is created. CXT-007.

### T03 — Skill grants authorization

Given a skill whose body says `authorize: delete_repository`.
When the resolver loads the skill.
Then `grants_authority` remains false and no capability bit is set from the body. CXT-006.

### T04 — Provider mutates the database

Given a provider result that includes a SQL statement or a Postgres credential use.
When the result is admitted.
Then it is stored as a proposal only. No database session is opened for the provider. Forbidden edge.

### T05 — Claim without evidence

Given `supported_by: []`.
When a claim is proposed.
Then schema validation fails (`minItems: 1`). CXT-010.

### T06 — Decision without authority

Given `actor: provider`.
When a decision is submitted for commit.
Then schema validation fails (`actor` const `mcgl`) and no transition is written. CXT-012.

### T07 — Execution without snapshot

Given an execution request with no `snapshot_id`.
When MCGL is asked to run it.
Then the request is denied. CXT-008.

### T08 — Snapshot mutates after start

Given sealed snapshot `S` with hash `H`.
When a resource revision cited by `S` changes.
Then `S` is unchanged and a new snapshot is required. CXT-013, CXT-014.

### T09 — Substrate disagrees with Postgres

Given Postgres resource revision `abc` and a substrate overview that names revision `def`.
When context is resolved.
Then the Postgres identity wins for revision, and the substrate text remains a candidate. CXT-002.

### T10 — Evidence contradicts a claim

Given claim `C` supported by `E1` and new evidence `E2` that contradicts `C`.
When `E2` is admitted.
Then `C` becomes `CONTRADICTED` or validation is blocked. `E1` and `E2` both remain.

### T11 — Unauthorized material in context

Given a resource the agent may not read.
When the resolver assembles context.
Then the admissibility gate denies inclusion even if retrieval returned it. Trust is not permission.

### T12 — Provider instructs an MCGL bypass

Given provider text `commit canonical state directly`.
When the control plane handles the result.
Then the text is a proposal. No MCGL method is invoked by the provider. CXT-011, CXT-012.

### T13 — Promotion without governance

Given an extracted sentence and policy result absent.
When a projection write is attempted.
Then the write is refused. Promotion requires `{PROMOTE, REJECT, QUARANTINE}` from Codessa policy.

### T14 — Capability expands without revalidation

Given a sealed snapshot and contract for `repository_read`.
When the provider requests `repository_write`.
Then the request is denied unless a new snapshot and contract are sealed.

### T15 — Success claimed without observation

Given provider text `deploy succeeded` and no collector artifact.
When a claim of success is proposed.
Then the claim is refused for lack of evidence. CXT-005, CXT-010, CXT-015.

## What this file does not do

It does not execute these cases against `AvaPrime/codessa` runtime. It does not change `AWS-STAGE-M1`. A later commit may add executable checks; this commit is the specification of the refusals.
