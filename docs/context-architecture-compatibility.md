# Context Architecture Compatibility Report

Status: **PROPOSED review**. Not a decision record. Not a freeze.
Baseline: `refactor` @ `db887f32000651196d37d303c3f4d3f73e18cc32`
Contract: `codessa-context-architecture` proposed v0.1
Date: 2026-10-04

Verdict: the contract is a compatible extension of the frozen constitution if, and only if, snapshot seal is not a canonical transition and OpenViking remains adapter evidence. It does not yet deserve freeze. It does deserve to remain a proposal.

## What was inspected

| Surface | What it is | Authority |
|---|---|---|
| `docs/specs/SPEC-CODESSA-AWS-STAGE-001-v0.1.md` | Frozen staging constitution | FROZEN |
| `docs/decisions/DEC-SPEC-CODESSA-AWS-STAGE-001-FREEZE.md` | Freeze of that spec; M1 blocked | FROZEN |
| `docs/aapt0/AAPT0-M7-GUARD-COMMIT-v0.1.2.md` and freeze-blocked directive | Path-binding design candidate | Authority NONE, canonical effect NONE, FREEZE BLOCKED |
| `core/codessa-kernel.ts`, `memory/memory-manager.ts`, `Codessa_Kernel_Interface_Spec.md` | Historical kernel | Implementation, not constitution |
| `AvaPrime/codessa-memory` README | Separate chat-archive extractor | Not this repo |

`docs/specs/` contains only the AWS staging spec. `docs/decisions/` contains only the freeze record. The README says older documents yield to the frozen spec.

## Constitution, stated

Frozen invariants that govern this review:

- INV-AWS-01 substrates have zero epistemic authority.
- INV-AWS-02 only MCGL may authorize canonical transitions.
- INV-AWS-03 inference, retrieval, and worker outputs are candidates until authorized.
- INV-AWS-06 pgvector/search structures propose evidence only.
- INV-AWS-07 infrastructure is substitutable.
- INV-BEDROCK-01 catalogs and routing have zero canonical authority.
- INV-BEDROCK-03 a candidate execution records provider, model, region, routing policy, timestamp, request hash, and artifact identity.

The freeze decision adds: M1 artifacts are `CandidateArtifact` evidence and cannot establish canonical state. Promotion requires an explicit MCGL transition. `AWS-STAGE-M1` remains `PENDING_EXECUTION / BLOCKED`.

The frozen diagram already places ECL validation before MCGL. It does not define Context, Snapshot, Skill, or Memory.

AAPT0-M7, which is not frozen, already says no object, claim, provider success, decision, grant, seal, or evidence artifact establishes canonical state outside the full MCGL path. That is design direction. It is compatible with this contract only when snapshot seal is outside that path.

## Review answers

Who may seal a ContextSnapshot? Not defined by the constitution. Proposed answer: the control-plane resolver. Seal is a content hash, not an MCGL transition. A provider or substrate must not seal. If seal were treated as canonical admission, that would amend INV-AWS-02.

Is ContextSnapshot an existing object? No. Not in the frozen spec, the freeze decision, or `core/codessa-kernel.ts`.

Does the frozen spec define memory semantics? No. INV-AWS-03 covers outputs as candidates. CXT-007 is an extension, not an amendment.

Where do resource revisions live? Not specified. Frozen storage roles are RDS/pgvector and S3 Object Lock. Git as source identity is a compatible extension, not an established rule.

What does MCGL receive? The frozen path is evidence, schema, provenance, and ECL validation. AAPT0 adds grant, write, CRGF, and decision. MCGL does not receive a context tree. The contract must say the resolver hands MCGL a bound evidence/claim set and a decision request, not an OpenViking URI space.

Does retrieval create evidence? No. INV-AWS-06: search structures propose evidence only.

Can an OpenViking memory become canonical? Not directly. Same rule as pgvector. A Codessa policy row may later be cited by an MCGL transition. The substrate write is not that transition.

Is `codessa-memory` part of this architecture? No. It is a separate repository whose README describes chat-archive extraction. Do not map it onto the Memory object.

Is OpenViking optional? Yes. INV-AWS-07 supports a replaceable adapter. The contract must not name OpenViking traversal as Codessa doctrine.

Is AGPL acceptable for a network-exposed deployment? Not in the constitution. Product/legal UNKNOWN. Not an architecture contradiction.

## CXT classification

| Rule | Class | Basis |
|---|---|---|
| CXT-001 Context is not authority | Already established | INV-AWS-01, INV-AWS-03 |
| CXT-002 Substrate is not canonical state | Already established | INV-AWS-01, INV-AWS-06, INV-AWS-07 |
| CXT-003 Retrieval is not evidence until admitted | Already established | INV-AWS-03, INV-AWS-06, CandidateArtifact rule |
| CXT-004 Evidence is not a claim | Compatible extension | Frozen spec has evidence and ECL, not a Claim object. AAPT0 separates them. Unimplemented in kernel |
| CXT-005 A claim is not a decision | Compatible extension | AAPT0 separates Decision. Unimplemented in kernel |
| CXT-006 A skill never grants authority | Compatible extension | Not in frozen spec. Kernel registers capabilities without a grant chain; that is drift, not constitution |
| CXT-007 Memory is not silent canonical state | Compatible extension | No frozen memory semantics. In-memory `MemoryManager.store` has no MCGL gate |
| CXT-008 Execution cites one sealed snapshot | Compatible extension | New object. Must not be an authority transition |
| CXT-009 Transition cites evidence | Already established | Freeze decision; INV-AWS-02 |
| CXT-010 No evidence and no epistemic pass, no transition | Already established as a role | Frozen diagram includes ECL before MCGL. Module not found in kernel |
| CXT-011 Provider output is advisory | Already established | INV-AWS-03, INV-BEDROCK-01 |
| CXT-012 Substrate cannot invoke MCGL | Already established | INV-AWS-02 |
| CXT-013 Input change seals a new snapshot | Compatible extension | Unimplemented |
| CXT-014 Snapshot hash covers cited revisions | Compatible extension | Analogous to INV-BEDROCK-03 request hash. New object |
| CXT-015 Perception does not establish truth | Already established | INV-AWS-01, INV-AWS-03 |

No CXT rule is a contradiction or a required amendment of the frozen spec, provided the seal wording below is applied.

OpenViking hierarchical retrieval and L0/L1/L2 are external dependency evidence. They are not Codessa doctrine.

## Required wording correction

Codessa specifies context semantics. It does not specify the retrieval algorithm.

`ContextAdapter` may expose `ingest`, `retrieve`, `resolve`, `read`, `list`, `search`, `remember`, `promote`, `archive`, and `trace`. `retrieve` must not imply hierarchical traversal. It reports `retrieval_mode` as one of `scoped_vector`, `hierarchical`, `hybrid`, `exact`, `graph`, `provider_defined`.

L0/L1/L2 is a possible progressive-read representation in an adapter, not Codessa's canonical layer model.

Section 7 must not call the snapshot hash "canonical JSON" in the constitutional sense. It is a content hash. AAPT0 already says a seal does not establish canonical state by itself.

## Implementation classification

Already-canonical: frozen spec, freeze decision, M1 blocked state.

Candidate: AAPT0-M7 path binding. Authority none.

Duplicate risk: `memory/memory-manager.ts` and `/storeMemory` if a second memory store is added without classifying this one. It is an in-process map with substring search, not a governed memory plane.

Obsolete relative to the frozen spec: kernel routes and stores without evidence admission or MCGL. README precedence already demotes older material. Not deleted here.

Architectural violation in implementation, not in constitution: `MemoryManager.store` emits `memory.stored` with no candidate/evidence distinction. Kernel interface `/storeMemory` has no epistemic gate.

Missing: ContextSnapshot, Claim, Skill approval, ContextAdapter, retrieval-mode trace.

## Decision

Retain the branch as proposed. Do not freeze it. Do not open an amendment to `SPEC-CODESSA-AWS-STAGE-001`. Do not implement OpenViking from this review.

Next admissible artifact is a conformance plan that maps T01–T15 onto fixtures, after the wording correction in this report is applied to the contract. Executable tests against the historical kernel would measure drift. They would not prove the frozen constitution.
