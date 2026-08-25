# SPEC-CODESSA-AWS-STAGE-001 v0.1

**Status:** FROZEN / Canonical Staging Baseline  
**Primary region:** `af-south-1`  
**Inference strategy:** prefer explicitly available in-region models; use explicitly authorized Bedrock Inference Profiles where required. No implicit geographic failover.

## Seven substrate invariants

- `INV-AWS-01` Substrate Non-Authority — AWS compute, networking, storage and inference possess zero epistemic authority.
- `INV-AWS-02` Kernel Authority — only deterministic MCGL may authorize canonical state transitions.
- `INV-AWS-03` Probabilistic Non-Canonicality — inference, retrieval and worker outputs are candidates until authorized.
- `INV-AWS-04` Replayable Execution — Fargate Spot workers cannot perform irreversible canonical transitions.
- `INV-AWS-05` Canonical Immutability — canonical audit evidence is preserved with S3 Object Lock Compliance Mode.
- `INV-AWS-06` Retrieval Non-Authority — pgvector/search structures propose evidence only.
- `INV-AWS-07` Infrastructure Substitutability — AWS is an implementation binding, not a constitutional dependency.

## Three Bedrock invariants

- `INV-BEDROCK-01` Model Availability Non-Authority — provider catalogs, availability changes, deprecations and routing have zero canonical authority.
- `INV-BEDROCK-02` Explicit Routing — cross-region execution requires an explicitly authorized inference-profile reference in the execution contract.
- `INV-BEDROCK-03` Routing Provenance — each candidate execution records provider, model/profile ID, source region, routing policy, timestamp, request hash and candidate artifact identity.

## Frozen implementation boundary

```text
Untrusted inference / ingestion
        |
        v
Evidence + schema + provenance + ECL validation
        |
        v
MCGL kernel (sole transition authority)
        |
   +----+----+
   v         v
RDS/pgvector S3 Object Lock audit ledger
```

### Storage roles

**Operational artifacts:** versioned, encrypted, lifecycle-managed scratchpad and extraction data.  
**Canonical audit ledger:** versioned S3 bucket with Object Lock Compliance Mode, customer-managed SSE-KMS, public-access blocking and preservation-only authority semantics.

### Network role

Application tasks use private AWS interface endpoints for core AWS APIs. Data-tier resources remain isolated from direct internet routes. Endpoint security groups permit HTTPS ingress only from authorized ECS task security groups.

### Worker role

Fargate Spot execution mode is `IDEMPOTENT_REPLAY`. Interrupted tasks discard uncommitted candidate state and requeue without mutating canonical RDS state or the audit ledger.

This document is constitutional for the AWS staging binding. Provider-specific facts are verified separately by AWS-STAGE-M1 and must never be inferred from this specification.
