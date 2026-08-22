# AAPT0-M7-GUARD-COMMIT-v0.1.2 — Path-Binding Correction Candidate

**Status:** DESIGN CANDIDATE / FREEZE BLOCKED  
**Authority:** NONE  
**Canonical effect:** NONE  
**Live harness authorization:** NO  
**Branch:** `refactor`

## Purpose

Module 7 protects the canonical-state boundary. `state.committed` is valid only when the complete MCGL canonical commit path is reconstructable and all path elements belong to the same causal chain.

This document preserves the accepted v0.1.1 architecture and records the required v0.1.2 correction pass. It does not authorize adapter construction, live harness execution, provider pressure testing, production credentials, or canonical-state mutation.

## Accepted architecture

The only valid commit path is:

```text
spent MCGL Grant
+ authorized write matching the spent Grant
+ inbound evidence from an authorized adapter
+ intact ECL attestation bound to that evidence
+ CRGF recommendation = commit_knowledge for this transition
+ MCGL canonical Decision { authority: "mcgl", verdict: "admit", rule: "MCGL.COMMIT_KNOWLEDGE" }
+ CanonicalFact(kind = "knowledge")
→ state.committed
```

`runtime` may emit `state.committed` only as the mechanical executor of this exact MCGL path. `runtime` is never an independent commit authority.

## Core invariant

> No object, claim, provider/runtime success, Decision, Grant, write authorization, seal, evidence artifact, ECL attestation, CRGF recommendation, worker artifact, Notion page, or generated specification may establish Codessa canonical state independently of the complete MCGL canonical commit path.

## Trust boundary

`emitted_by` is an **untrusted claim**, not authority proof. A claimed `mcgl` emitter must be validated by reconstruction from Assignment + Execution Contract + ordered CIX events.

Permissive `| string` unions are permitted only on untrusted input. Validated domain values remain closed:

```typescript
type ValidatedAuthority = "mcgl";
type ValidatedVerdict = "admit" | "reject" | "defer";
type ValidatedFactKind = "knowledge";
type ValidatedCrgfRecommendation =
  | "commit_knowledge"
  | "seal_only"
  | "reject";
```

## Required causal-path binding

All of these identifiers must reconstruct as one chain:

```text
Decision.exchange_id == Grant.exchange_id
Grant.exchange_id == Write.exchange_id
Write.exchange_id == Evidence.exchange_id
Evidence.exchange_id == ECL.exchange_id
ECL.exchange_id == CRGF.exchange_id
CRGF.exchange_id == Fact.exchange_id
Fact.exchange_id == Candidate.exchange_id

Decision.artifact_id == Grant.artifact_id
Grant.artifact_id == Write.artifact_id
Write.artifact_id == Evidence.artifact_id
Evidence.artifact_id == ECL.artifact_id
ECL.artifact_id == CRGF.artifact_id
CRGF.artifact_id == Fact.artifact_id
Fact.artifact_id == Candidate.artifact_id

Grant.decision_id == Decision.decision_id
Write.grant_id == Grant.grant_id
Grant.consumed_by_write_id == Write.write_id
Evidence.inbound_id == ECL.inbound_id
Evidence.inbound_id == CRGF.inbound_id
CRGF.grant_id == Grant.grant_id
Fact.decision_id == Decision.decision_id
Candidate.fact_id == Fact.fact_id
```

Any mismatch is invalid commit-path reconstruction. Mixed valid objects from different chains are classified as `CROSS_CHAIN_ASSEMBLY` / `COMMIT_PATH_IDENTITY_MISMATCH`.

## Required validation

### Reconstruction

A positive commit requires:

- Assignment available;
- Execution Contract available;
- ordered CIX events available;
- commit path reconstructable;
- no active unrecovered absorbing state.

Reconstruction failure must never silently degrade into `NOT_COMMITTED` when a commit claim exists.

### Canonical Decision

Require:

```text
authority = mcgl
verdict = admit
rule = MCGL.COMMIT_KNOWLEDGE
reason = non-empty
```

The Decision must govern the same exchange/artifact/path as the candidate commit.

### Grant

Require:

- MCGL authority;
- matching Decision ID;
- matching artifact/exchange;
- single-use Grant;
- valid issuance/expiry interval;
- consumed exactly once;
- `consumed_by_write_id` equals the authorized write;
- consumption timestamp is valid.

A `consumed_at` timestamp without write linkage is insufficient.

### Authorized write

Require:

- `rule === MCGL.AUTHORIZE_WRITE`;
- matching Grant/participant/artifact/exchange;
- capability is included in `Grant.allows`;
- write is the write associated with the reconstructed commit path.

### Inbound evidence

Require:

- evidence exists;
- adapter is authorized by Assignment / Execution Contract;
- evidence belongs to the same artifact/exchange;
- evidence reference is attributable to that adapter;
- claim/evidence identifiers are available for ECL binding.

### ECL

Require:

- attestation exists;
- `intact === true`;
- attestation is bound to the inbound evidence;
- attestation covers the relevant evidence/claim identifiers.

An intact attestation for another evidence chain is invalid.

### CRGF

Require:

- reflection exists;
- `recommends === commit_knowledge`;
- reflection is bound to the same inbound evidence/reference;
- same artifact/exchange;
- same Grant where applicable.

A generic `commit_knowledge` recommendation is insufficient.

## Runtime emitter rule

If `candidate.emitted_by === "runtime"`, acceptance requires an explicit derivation link to the exact canonical Decision and the complete path. A valid MCGL Decision existing elsewhere does not authorize an independent runtime commit event.

If `candidate.emitted_by === "mcgl"` but MCGL origin is not established by reconstruction, classify as an invalid/forged claim.

## Claim-state model

The commit claim state machine begins only when an actual commit claim exists:

1. candidate is present and `event_kind === "state.committed"`;
2. an object is explicitly treated as commit; or
3. a non-commit artifact is presented as the commit source.

Unknown `event_kind` on a presented candidate is an invalid claim, not `NOT_COMMITTED`.

Ordinary non-commit artifacts with absent optional fields remain non-commit unless they are explicitly treated as commit.

## Malformed vs forged

**Malformed:** a commit claim fails structural/schema requirements.  
Example: `state.committed` with missing `fact_id` → `CANONICAL_FACT_MALFORMED`.

**Forged:** a structurally plausible commit claim lacks proven authority, provenance, or causal path.  
Example: `state.committed` + `emitted_by = "mcgl"` without a valid MCGL path → `COMMIT_EVENT_FORGED` / `NON_MCGL_COMMIT_AUTHORITY`.

Cross-chain assembly of individually valid objects is forged-path behavior and must be rejected.

## Result semantics

```text
COMMITTED     = complete valid MCGL canonical path
NOT_COMMITTED = no commit claim and no reconstruction failure
INVALID_CLAIM = commit claim exists but is malformed, forged, unauthorized, or path-invalid
```

A null candidate with no invalid claim, no reconstruction failure, and no absorbing state is `NOT_COMMITTED` and produces no absorbing state.

## Predicate set

```text
UNKNOWN_EVENT_KIND
CANONICAL_FACT_MALFORMED
COMMIT_EVENT_FORGED
NON_MCGL_COMMIT_AUTHORITY
MCGL_EMITTER_CLAIM_UNVERIFIED
RUNTIME_EMITTER_UNBOUND
MISSING_CANONICAL_DECISION
INVALID_CANONICAL_DECISION
MISSING_SPENT_GRANT
INVALID_SPENT_GRANT
GRANT_NOT_CONSUMED_BY_THIS_WRITE
GRANT_CONSUMPTION_UNBOUND
MISMATCHED_AUTHORIZED_WRITE
WRITE_CAPABILITY_NOT_ALLOWED
WRITE_RULE_INVALID
MISSING_INBOUND_EVIDENCE
EVIDENCE_PROVENANCE_UNBOUND
EVIDENCE_ADAPTER_UNAUTHORIZED
ECL_ATTESTATION_UNBOUND
CRGF_REFLECTION_UNBOUND
CROSS_CHAIN_ASSEMBLY
COMMIT_PATH_IDENTITY_MISMATCH
TREATED_AS_COMMIT
USED_AFTER_ABSORBING_STATE
COMMIT_RECONSTRUCTION_FAILURE
EVIDENCE_RECONSTRUCTION_FAILURE
```

## Absorbing-state priority

When multiple failures match, primary selection remains:

1. `BLOCKED_TRANSITION_UNABSORBED`
2. `CANONICAL_MUTATION_ATTEMPT`
3. `UNAUTHORIZED_GOVERNANCE_TRANSITION`
4. `EVIDENCE_RECONSTRUCTION_FAILURE`
5. `CONTRACT_VIOLATION`

All additional commit-relevant absorbing states are retained as secondary state information.

Module 7 must consume the frozen absorbing-state vocabulary/validator. It must not invent a parallel absorbing-state vocabulary.

## K-* fixture corpus

The v0.1.2 freeze candidate requires at least:

- K-01 valid MCGL commit;
- K-02 valid runtime mechanical commit;
- K-03 Decision treated as commit;
- K-04 Grant treated as commit;
- K-05 write treated as commit;
- K-06 seal treated as commit;
- K-07 provider/model success treated as commit;
- K-08 artifact treated as commit;
- K-09 non-MCGL emitter;
- K-10 missing Decision;
- K-11 invalid Decision;
- K-12 missing/invalid Grant;
- K-13 unconsumed Grant;
- K-14 mismatched write;
- K-15 missing evidence;
- K-16 invalid ECL binding;
- K-17 invalid CRGF binding;
- K-18 malformed canonical fact;
- K-19 forged commit event;
- K-20 commit after absorbing state;
- K-21 reconstruction failure;
- K-22 **cross-chain assembly**: individually valid Decision + Grant + Write + Evidence + ECL + CRGF, but each belongs to a different causal chain. This fixture MUST fail deterministically.

## Freeze gate

Module 7 may not be frozen until:

1. K-01 and K-02 pass;
2. K-03 through K-21 map deterministically;
3. K-22 rejects cross-chain assembly;
4. malformed vs forged classification is deterministic;
5. every predicate has an explicit failure mapping;
6. Reconstruction Oracle commit completeness extension agrees with the guard;
7. no new CIX EventKind is introduced;
8. AAPT-0 live readiness remains FAIL until the separate preconditions audit passes.

## Prohibitions

This candidate does **not** authorize:

- adapter construction;
- live external harness invocation;
- provider pressure testing;
- production credentials;
- canonical-state mutation;
- treating fixture success as MCGL admission;
- adding new CIX EventKinds;
- modifying frozen contracts, schemas, or CIX hash behavior.

## Next authorized work

Fixture-only deterministic implementation, K-01…K-22 encoding, Oracle alignment, and review. Module 8 `guard_recovery` remains blocked until Module 7 is frozen and the commit boundary is demonstrably enforceable.
