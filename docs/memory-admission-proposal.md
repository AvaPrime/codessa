# Codessa Kernel Memory Admission Proposal — A-001

Status: **PROPOSED**. Design only. Not a freeze. Not an implementation.
Baseline: `refactor` @ `db887f32000651196d37d303c3f4d3f73e18cc32`
Scope: kernel memory admission only
Out of scope: `executeTask` redesign, MCGL implementation, ContextSnapshot, M1, OpenViking, database selection, closed `codessa-context-architecture`
Input, not modified: context package at `3466b567864d2a813c82506294c99456b81a89e7`

## Purpose

The kernel can turn a model result into retrievable memory directly:

```text
model.execute()
  → MemoryManager.store()
  → retrievable memory
```

`MemoryManager` is process-local. Shutdown clears it. The collapse is still real: a model assertion becomes something a later query can treat as memory. `AgentMemory` can also write JSON without this gate. This proposal does not migrate that file store.

The boundary separates three states.

```text
something happens
  → ObservationRecord
  → MemoryCandidate
  → Governance decision
       ├── PROMOTE
       ├── REJECT
       └── QUARANTINE
  → Durable memory
```

The admission question is only: may this candidate become memory Codessa is entitled to rely on later? It does not decide that the proposition is globally true.

## Objects

ModelOutput is what a model or provider returned: provider, model or version, run id, raw result, timestamp. It is not an observation.

ObservationRecord is something the system observed, or an attributable external observation: observation id, source, observed at, run or invocation id, subject, content, source revision or equivalent provenance. It is not a decision.

MemoryCandidate is a proposed memory derived from one or more observations: candidate id, content, observation refs, source refs, created at, provenance, status. Existence is not authority.

GovernanceDecision is the admission result: decision id, candidate id, outcome `PROMOTE | REJECT | QUARANTINE`, decided at, authority ref, evidence refs, reason. It is the only object in this proposal that can authorize promotion. This document does not implement the authority that produces it.

DurableMemory is memory that passed the boundary: memory id, content, source refs, observation refs, promotion decision id, promoted at. A durable memory without a valid promotion decision is invalid.

## Invariant

Promotion requires an observation, a source, a governance decision, and that decision equal to `PROMOTE`. No observation, no source, or no `PROMOTE` means no promotion. A model-success string alone cannot cross the boundary.

Provenance is source, then observation, then candidate, then governance decision, then memory. A free-form `evidence: ["deployment succeeded"]` is not provenance.

If two observations disagree, both remain. Later write, model origin, or which notebook held the note does not choose a winner. Contradiction is not resolved by storage.

## Kernel boundary

`MemoryManager.store` must not itself mean promotion. The future seam is record observation, create candidate, admit with a governance decision, then promote. This proposal does not prescribe the implementation and does not require a database, OpenViking, Postgres, an MCGL runtime, a new execution architecture, or migration of every historical memory mechanism.

## Required refusal

This sequence must not promote:

```text
model.execute() → "deployment succeeded" → MemoryManager.store() → promoted memory
```

The correct result is a model output that is not promoted. Recording that output as an artifact belongs to a later execution proposal.

## Conclusion

Codessa may remember a proposition as durable experience only when it is a candidate grounded in an attributable observation and an explicit `PROMOTE` decision.
