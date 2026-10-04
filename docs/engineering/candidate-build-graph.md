# Codessa Candidate Build Graph

Status: candidate engineering decomposition. Not a queue and not authorization.
No task is READY.
E-007 remains BLOCKED.

## Purpose

Convert the subsystem contract matrix and system acceptance contract into bounded candidate work without allowing task existence to imply permission.

## Dependency graph

### Foundation

**G-001 — Canonical runtime boundary**
- Reconcile which runtime entry point is the target governed path.
- Depends on: subsystem contract matrix.
- Decision class: architecture/contract reconciliation.
- Not READY.

**G-002 — System acceptance harness**
- Turn the system acceptance contract into executable end-to-end checks.
- Depends on: G-001 and existing governed path.
- Decision class: implementation of an existing acceptance contract.
- Not READY.

### Governed execution

**G-010 — Canonical execution contract**
- Consolidate request, context, provider result, observation, evidence, outcome, decision, and commit contracts without changing constitutional authority.
- Depends on: G-001.
- Decision class: contract reconciliation where definitions conflict.
- Not READY.

**G-011 — Provenance contract**
- Define one inspectable provenance record spanning the governed lifecycle.
- Depends on: G-010.
- Decision class: contract definition if no existing authority is sufficient.
- Not READY.

### Persistence

**G-020 — Persistence contract**
- Define restart, replay, load, and record semantics independently of storage technology.
- Depends on: G-011 and existing record-store behavior.
- Decision class: contract definition.
- Not READY.

**G-021 — Persistence implementation**
- Implement the already-defined persistence contract without selecting infrastructure by inference.
- Depends on: G-020.
- Decision class: implementation.
- Not READY.

### Memory

**G-030 — Canonical memory contract**
- Reconcile candidate, observation, source, decision, admission, promotion, rejection, quarantine, and retrieval semantics.
- Depends on: G-010 and G-011.
- Decision class: architecture/contract reconciliation.
- Not READY.

**G-031 — Governed memory integration**
- Bring the selected canonical memory path behind the existing admission boundary.
- Depends on: G-030.
- Decision class: implementation.
- Not READY.

### Agents

**G-040 — Governed agent-action contract**
- Define how agent capability, requested action, observation, outcome, and commit relate.
- Depends on: G-010 and G-030.
- Decision class: architecture/contract definition.
- Not READY.

**G-041 — Agent runtime integration**
- Implement the already-defined governed agent-action contract.
- Depends on: G-040.
- Decision class: implementation.
- Not READY.

### Authority

**E-007 — Outcome issuer authorization**
- Define and enforce who may issue which outcome for which decision, including issuer establishment and missing/mismatched proof.
- Status: BLOCKED.
- Requires explicit human authorization and a written authority contract before implementation.
- Not READY.

## Autonomous eligibility rule

A candidate may enter a future READY state only when:

1. its contract exists;
2. its dependencies are satisfied;
3. its acceptance tests are defined;
4. its allowed scope is explicit;
5. it does not require an unresolved constitutional or authority decision;
6. an explicit authorization marks it READY.

Task existence, numbering, dependency order, or apparent usefulness does not satisfy these conditions.
