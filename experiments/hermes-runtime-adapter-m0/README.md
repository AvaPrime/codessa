# CODESSA-EXEC-HERMES-M0

Hermes Runtime Adapter Conformance Experiment v0.1.

## Status

- Maturity: M0 / candidate experiment
- Authority: NONE
- Canonical effect: NONE
- Scope: external execution-substrate conformance only
- Constitutional dependency: existing Codessa runtime / assignment contracts
- Kernel impact: NONE

## Objective

Determine whether Hermes can execute a governed Codessa Agent without acquiring authority over identity, capability, provenance, cancellation, evidence admission, or canonical Codessa state.

## Non-goals

- No MCGL changes
- No CANON-M0 changes
- No Hermes-derived governance model
- No event-sourcing migration
- No production runtime integration

## Conformance gates

1. Identity integrity
2. Effective capability integrity
3. Agent-message provenance
4. Runtime/session isolation
5. Cancellation integrity
6. Authority isolation

## Directory map

- `contract/` — experiment contract and invariants
- `fixtures/` — deterministic test inputs and expected observations
- `harness/` — future adapter/test harness scaffolding
- `evidence/` — captured execution evidence; no secrets
- `results/` — conformance reports and verdicts
- `notes/` — bounded research observations

The experiment must fail closed. A runtime discrepancy is a conformance failure or quarantine condition, never silent recovery.
