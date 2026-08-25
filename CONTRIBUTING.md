# Contributing to Codessa

Codessa uses a frozen-specification workflow for authority-sensitive changes.

## Before changing architecture

1. Identify the governing specification and decision record.
2. Do not silently alter frozen invariants.
3. Separate provider observations from assumptions.
4. Keep probabilistic execution outside canonical authority boundaries.
5. Add deterministic conformance evidence for provider-dependent claims.

## Evidence discipline

Provider execution artifacts are evidence, not canonical state. Preserve raw responses unmodified when safe to publish, record hashes for derived runtime artifacts, and label candidate outputs as `CandidateArtifact`.

## Pull requests

A useful PR should state:

- the governing specification/decision;
- files changed;
- invariants affected, if any;
- tests or conformance checks run;
- unresolved UNKNOWN/BLOCKED conditions;
- whether the change is implementation, evidence, or documentation.

Do not convert an UNKNOWN gate to PASS through documentation alone.
