# Hermes Adapter M0 Conformance Contract

## Constitutional boundary

Hermes is an execution substrate. It is not a Codessa governance authority.

### INV-HERMES-01 — Agent Non-Authority

No Hermes-originated output may become canonical Codessa state by origin, profile identity, model, runtime status, confidence, or inter-agent consensus.

### INV-HERMES-02 — Assignment Identity Integrity

Every Hermes execution must be bound to an immutable Codessa assignment established before runtime dispatch.

### INV-HERMES-03 — Effective Capability Verification

Conformance must verify effective runtime capabilities rather than trusting declared profile configuration.

### INV-HERMES-04 — Message Provenance

Every inter-agent message relevant to the experiment must be reconstructable from the Codessa assignment and captured runtime evidence.

### INV-HERMES-05 — Isolation

Profile, session, machine, runtime, and task identities must not cross boundaries without an explicit governed transition.

### INV-HERMES-06 — Cancellation

A governed cancellation must either terminate the underlying execution or produce an explicit quarantined failure state.

## Verdicts

- PASS — all required observations satisfy the contract.
- FAIL — a required invariant is violated.
- QUARANTINED — runtime state is ambiguous or unverifiable; no canonical admission permitted.
