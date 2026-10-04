# Codessa System Acceptance Contract

Status: descriptive acceptance contract. It defines what a working governed Codessa path must demonstrate; it does not authorize implementation or make any task READY.
Constitution: unchanged.
E-007: BLOCKED.

## Purpose

The current repository proves several refusal invariants and one narrow claims path. This document defines the minimum system-level behavior required before Codessa can be considered a coherent governed runtime.

## Required lifecycle

A working governed request must be able to demonstrate, with inspectable records:

`request → seal → provider invocation → untrusted result → named observation → supplied outcome → governed decision → commit and/or memory admission → persisted record → reload without implicit authority`

## Acceptance properties

1. **Request sealing**
   - A request has a stable run identity and contract identity.
   - Context and allowed actions are bound into the sealed contract.
   - A provider/model cannot rewrite the sealed contract.

2. **Action boundary**
   - An action outside the sealed allowed-action set is refused before provider execution.
   - Refusal is observable and recorded.

3. **Provider isolation**
   - Provider/model output is retained as untrusted text.
   - Provider output cannot create an observation, outcome, evidence, commit, or memory promotion by assertion alone.

4. **Observation provenance**
   - Evidence requires a named source and observation identity.
   - Model/provider text cannot be relabeled as an observation.
   - The observation remains distinguishable from the provider result.

5. **Outcome intake**
   - A commit or promotion requires a supplied outcome and decision identity.
   - The model/provider cannot manufacture the outcome from returned text.
   - E-007 remains explicit: issuer legitimacy is not currently verified.

6. **Commit gate**
   - A commit requires the applicable observation/evidence and supplied `COMMIT` outcome.
   - Loading a persisted record cannot create a new commit.
   - No provider/model success message can commit.

7. **Memory admission**
   - A candidate requires observation and source references.
   - Only explicit `PROMOTE` reaches memory through the admission boundary.
   - `REJECT` and `QUARANTINE` create non-promotion decision records.
   - Missing or malformed outcomes do not become implicit decisions.

8. **Persistence**
   - Execution/decision state can be serialized and reloaded.
   - Reload is observational: it does not itself authorize a transition.
   - Persistence semantics are explicit about what is authoritative and what is merely a record.

9. **Provenance**
   - The resulting record can connect request, sealed contract, provider result, observation/evidence, supplied outcome, decision identity, and resulting transition.
   - Provenance does not itself confer authority.

10. **End-to-end path**
    - At least one representative product path traverses the governed lifecycle without bypassing the refusal core.
    - The path has executable acceptance tests.

11. **Failure semantics**
    - Provider failure, missing observation, invalid observation source, missing outcome, invalid action, rejection, quarantine, and absent promotion evidence terminate without unauthorized canonical transition.
    - Failures are distinguishable from successful governed transitions.

12. **Restart/replay semantics**
    - The governed state needed to understand a completed request survives the selected persistence boundary.
    - Replaying/loading records does not silently repeat a canonical transition.

## Non-requirements

These are deliberately not required by this acceptance contract:

- a particular database;
- OpenViking;
- pgvector;
- AWS/Bedrock availability;
- a particular model provider;
- autonomous scheduling;
- autonomous constitutional change;
- a verified E-007 issuer model.

Those are separate architectural or infrastructure decisions.

## Definition of done

Codessa is system-acceptance-ready only when the required lifecycle is implemented through a canonical runtime path, its acceptance properties are executable, the legacy bypasses are either removed from the target path or explicitly classified as non-canonical, and the complete regression suite passes.

This is an acceptance target, not a declaration that the repository currently satisfies it.
