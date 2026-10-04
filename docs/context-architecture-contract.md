# Codessa Context Architecture Contract v0.1

Status: **PROPOSED** on branch `codessa-context-architecture`
Base: `refactor` @ `db887f32000651196d37d303c3f4d3f73e18cc32`
Date: 2026-10-04
Precedence: this document does not amend `SPEC-CODESSA-AWS-STAGE-001 v0.1` or `DEC-SPEC-CODESSA-AWS-STAGE-001-FREEZE`. Those remain FROZEN. Where they conflict with this proposal, the frozen decision wins.
Primary invariant: perception informs action; perception does not establish truth.

This commit is the contract only. It does not implement OpenViking, does not change MCGL, and does not mark any M1 gate PASS.

## 1. Lifecycle

```text
Prompt
  → Intent
  → Context resolution
  → Context
  → Snapshot (sealed)
  → epistemic gate (ECL role)
  → admissibility gate (RAG-Guard role)
  → Execution contract
  → Provider proposal
  → MCGL
  → Observation
  → Evidence
  → Claim
  → Decision
  → MCGL
  → Canonical state
  → memory policy
  → promote / reject / quarantine
  → optional context projection
```

Prompt is an input signal. Provider output is a proposal. Only MCGL commits a canonical transition. That restates the frozen decision: MCGL remains the sole transition authority; substrates remain non-authoritative.

ECL and RAG-Guard are role names in this proposal. A code search on 2026-10-04 found no `ECL` or `RAG-Guard` symbols in this repository. They are not claimed as existing modules.

## 2. Objects

| Object | Definition | Canonical owner |
|---|---|---|
| Resource | Externally originating material available for context | Codessa identity row |
| Memory | Scoped experience eligible for later retrieval | Codessa lifecycle row |
| Skill | Versioned instructions for a class of work | Codessa approval row |
| Evidence | Immutable observation that can support or contradict a claim | Codessa / evidence store |
| Claim | A proposition | Codessa |
| Decision | An authorized state-changing determination | MCGL |
| Context | Bounded view selected for one operation | Resolver |
| Snapshot | Immutable revision set used by one execution | Codessa |
| Trace | Path of retrieval, policy, provider, and observation | Codessa / MCGL |

Resource identity is `(provider, locator, revision, content_hash)`. Name is not identity.

Memory epistemic status and lifecycle status are different fields. `PROMOTED` means eligible for retrieval. It does not mean true. `epistemic_status` cannot be `CANONICAL`.

A skill's `grants_authority` is constantly false. Content is not capability and not authority.

Evidence is not a claim. A claim is not a decision. A decision cites evidence ids and a sealed snapshot, and its committing actor is `mcgl`.

## 3. Ownership matrix

| Concern | OpenViking | Postgres | ECL role | RAG-Guard role | MCGL | Provider |
|---|---|---|---|---|---|---|
| Find and read context | mechanics | identity metadata | — | filter | — | no |
| Canonical rows | no | yes | — | — | commits transitions | no |
| Epistemic weight | no | stores result | decides | — | — | no |
| Admissibility | no | stores result | — | decides | — | no |
| Causal commit | no | records | — | — | sole writer | no |
| Proposal | no | no | no | no | no | yes |

OpenViking is a candidate context substrate, in the same authority class as pgvector in the repository README: retrieval assistance, never a truth oracle. It is not selected as a deployment by this contract.

## 4. Forbidden edges

```text
Provider ──X──> Postgres
Provider ──X──> MCGL
Provider ──X──> canonical Memory
Provider ──X──> canonical Decision
OpenViking ──X──> MCGL
Skill ──X──> authorization
Retrieved Resource ──X──> canonical truth
```

Legal path:

```text
Provider → ProviderRequest → Codessa → MCGL
```

The provider receives a contract, a sealed snapshot, and tool grants. It does not receive database credentials, MCGL access, or substrate write access.

## 5. State machines

Resource: `DISCOVERED → INGESTED → INDEXED → AVAILABLE → SUPERSEDED → ARCHIVED`

Memory: `EXTRACTED → CANDIDATE → PROMOTED | QUARANTINED → SUPERSEDED → ARCHIVED`

Claim: `PROPOSED → SUPPORTED → VALIDATED`, or `PROPOSED → CONTRADICTED → REJECTED`. No transition into a status named `CANONICAL` on the claim object. Canonical state is an MCGL transition that may cite a validated claim.

Decision: `PROPOSED → REVIEWED → AUTHORIZED → COMMITTED`, or `PROPOSED → DENIED`.

Snapshot: `RESOLVING → SEALED → CONSUMED → ARCHIVED`. A sealed snapshot is not mutated. A changed input seals a new snapshot.

## 6. Context resolution

Inputs: intent, agent, project, permissions, policy version, token budget.
Reads: Postgres identity and policy; optional substrate candidates; no direct provider call.
Outputs: a Context whose members are ids, plus a trace step for query, scope, and candidates.
Failure: missing scope, permission deny, or budget overflow yields a deny step and no snapshot.

Retrieval mode is recorded. This contract does not assert that OpenViking navigates directories recursively. Current product docs describe scoped global vector search; the TrieHI paper describes recursive directory query. The trace field `retrieval_mode` holds whichever the adapter observed.

## 7. Snapshot protocol

Seal covers intent id, resource revisions, memory ids, skill versions, claim ids, evidence ids, and policy version. The hash is over that canonical JSON. Execution of a consequential action requires exactly one sealed snapshot id. Changing any cited revision after seal is a contract violation (T08), not an in-place edit.

## 8. Evidence, claim, decision

An evidence record requires collector, content hash, captured time, and snapshot id. A retrieved resource does not become evidence until a collector admits it.

A claim requires at least one admitted evidence id. Contradicting evidence moves the claim to `CONTRADICTED` or blocks validation. It does not delete the evidence.

A committed decision requires evidence ids, a sealed snapshot, actor `mcgl`, and an epistemic pass on each cited claim. Absence of any of these is a deny.

## 9. Memory promotion

Not every observation is a memory. Eligibility requires derivation ids and a policy result in `{PROMOTE, REJECT, QUARANTINE}`. Promotion writes a Codessa lifecycle row first. A substrate projection is optional and rebuildable. Deleting the projection must not delete the row.

## 10. Adapter

`ContextAdapter` methods: `retrieve`, `read`, `project_memory`. None may return epistemic status `CANONICAL`. `establish_canonical` is not a method. Providers do not call the adapter.

Postgres holds users, projects, agents, skill versions, resource identities, claims, evidence metadata, decisions, snapshot metadata, and transition records. Bodies may live in object storage. If deleting a record would change authoritative state, that record is not solely in the substrate.

## 11. Invariants

- CXT-001 Context is not authority.
- CXT-002 A context substrate is not canonical state.
- CXT-003 A retrieved resource is not evidence until admitted.
- CXT-004 Evidence is not a claim.
- CXT-005 A claim is not a decision.
- CXT-006 A skill never grants authority.
- CXT-007 A memory never silently becomes canonical state.
- CXT-008 Every consequential execution cites one sealed snapshot.
- CXT-009 Every canonical transition cites evidence ids.
- CXT-010 No evidence and no epistemic pass means no canonical transition.
- CXT-011 Provider output is advisory until admitted.
- CXT-012 External substrates cannot invoke MCGL.
- CXT-013 Changed contextual inputs create a new snapshot.
- CXT-014 A sealed snapshot hash covers the revisions it cites.
- CXT-015 Perception does not establish truth.

## 12. Non-goals

- No OpenViking deployment in this commit.
- No Mem0 or Letta dependency.
- No Graphiti admission.
- No replacement of `AvaPrime/codessa-memory` (chat-archive extractor; not mapped).
- No M1 gate transition. `AWS-STAGE-M1` remains `PENDING_EXECUTION / BLOCKED`.
- No declaration that this proposal is a frozen decision. Freeze of this contract would require its own decision record, which this commit is not.

## 13. Remaining map

Existing-code classification (already-canonical, candidate, duplicate, obsolete, violation) is not done in this commit. `docs/specs/` currently contains the AWS staging spec only. Kernel and historical docs on `refactor` were not fully read. That map is the next review, not a reason to implement a second memory engine first.
