# AAPT-0 Module 7 Freeze Directive — v0.1.2

**Status:** ACTIVE DESIGN DIRECTIVE  
**Authority:** NONE  
**Canonical effect:** NONE  
**Live readiness:** FAIL  
**Target:** `guard_commit`

## Disposition

`guard_commit` v0.1.1 is accepted as architectural direction but **not frozen**.

`guard_commit` v0.1.2 is the active freeze candidate and remains **FREEZE BLOCKED** pending deterministic path-binding and conformance evidence.

## Required corrections

The commit guard must prove a single causal chain:

```text
Decision ↔ Grant ↔ Write ↔ Inbound Evidence ↔ ECL ↔ CRGF ↔ Canonical Fact ↔ Commit
```

Presence of individually valid objects is insufficient.

The following are mandatory:

1. Treat `emitted_by` as an untrusted claim.
2. Prove MCGL authority from reconstruction rather than emitter text.
3. Bind runtime-emitted commits to the exact MCGL Decision.
4. Bind Grant consumption to the exact authorized write.
5. Bind write capability to Grant scope and the exact commit path.
6. Prove inbound evidence came through an authorized adapter.
7. Bind ECL attestation to the evidence/claim set actually used.
8. Bind CRGF `commit_knowledge` to the exact artifact/evidence transition.
9. Define malformed vs forged commit claims.
10. Map every predicate deterministically.
11. Reject unknown commit `event_kind` as invalid claim.
12. Consume the frozen absorbing-state validator rather than inventing vocabulary.
13. Reject cross-chain assembly of individually valid objects.
14. Keep permissive types confined to untrusted input boundaries.

## Mandatory adversarial fixture

### K-22 — Cross-chain assembly

Construct a candidate from individually valid records that are intentionally drawn from different causal chains:

```text
Decision A
Grant B
Write C
Evidence D
ECL E
CRGF F
Fact G
Commit H
```

The guard MUST reject the candidate deterministically as a path-binding failure / forged-path condition.

This is the principal residual attack against a presence-and-field-equality validator.

## Freeze criteria

Freeze remains blocked until:

- K-01/K-02 positive paths pass;
- K-03…K-21 negative/edge cases map deterministically;
- K-22 rejects cross-chain assembly;
- malformed vs forged is deterministic;
- Reconstruction Oracle agrees with the guard;
- no new CIX EventKinds are introduced;
- no frozen contract or CIX hash behavior is changed.

## Global prohibition

Until the AAPT-0 preconditions audit returns a positive readiness verdict, the following remain prohibited:

- adapter construction;
- live Codex / Anthropic / xAI / native harness invocation;
- provider pressure testing;
- production credentials;
- canonical-state mutation;
- treating fixture success as MCGL admission.

## Module 8 dependency

`guard_recovery` remains blocked. Recovery semantics depend on a precisely enforceable commit boundary and must not be designed as a workaround for unresolved Module 7 ambiguity.

## Engineering principle

> Capability may increase without authority increasing.

External harness sophistication, persistent memory, subagents, computer use, browser use, provider success, or model capability cannot create Codessa canonical authority.
