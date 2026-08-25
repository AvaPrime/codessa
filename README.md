# Codessa

**Epistemic infrastructure and deterministic governance for AI systems.**

Codessa separates probabilistic inference from canonical state authorization. Model outputs, retrieval results, and worker artifacts are candidates. The deterministic **MCGL (Model Causal Governance Ledger) kernel** is the sole authority permitted to authorize canonical state transitions.

## Canonical staging status

- **AWS staging specification:** `SPEC-CODESSA-AWS-STAGE-001 v0.1` — **FROZEN**
- **Freeze decision:** `DEC-SPEC-CODESSA-AWS-STAGE-001-FREEZE` — **FROZEN**
- **Current verification:** `AWS-STAGE-M1` — **PENDING_EXECUTION / BLOCKED**
- **Primary AWS region:** `af-south-1` (Cape Town)
- **Infrastructure role:** execution substrate only; zero epistemic authority

The repository deliberately does **not** claim AWS/Bedrock availability, routing, runtime success, promotional-credit eligibility, or Spendbase eligibility until provider evidence has been captured from the target account.

## Architecture

```text
Probabilistic substrates
  Bedrock / local models / Fargate Spot workers
             |
             v
Epistemic validation boundary
  schema + invariants + provenance + ECL
             |
             v
Deterministic MCGL kernel
  transition authorization + canonical commit
        /                 \
       v                   v
RDS PostgreSQL         S3 Object Lock
canonical state        immutable audit evidence
```

### Authority rules

1. AWS compute, storage, networking and model services are implementation substrates.
2. Only MCGL may authorize canonical state transitions.
3. Inference, retrieval and worker outputs remain non-canonical until explicitly authorized.
4. Fargate Spot workers are idempotent/replayable and have zero canonical commit power.
5. S3 Object Lock preserves evidence; it does not create epistemic authority.
6. pgvector is retrieval assistance, never a truth oracle.
7. AWS is a replaceable implementation binding, not a constitutional dependency.

## Bedrock invariants

- `INV-BEDROCK-01` — model catalogs, regional availability and routing mechanisms have zero canonical authority.
- `INV-BEDROCK-02` — cross-region execution requires an explicitly authorized inference-profile reference; implicit geographic failover is forbidden.
- `INV-BEDROCK-03` — every candidate execution records provider, model/profile, source region, routing policy, timestamp, request hash and candidate artifact identity.

## AWS-STAGE-M1 gates

| Gate | Evidence required | State |
|---|---|---|
| G-01 | Raw `af-south-1` catalog + active Anthropic derivation | UNKNOWN |
| G-02 | Profile detail with explicit non-empty destination regions and admissible contract reference | UNKNOWN |
| G-03 | Live direct/profile invocation artifact with SHA-256 provenance | UNKNOWN |
| G-04 | Provider-issued Spendbase Org ID evidence or documented Founders route | UNKNOWN |

**UNKNOWN is intentional.** Documentation and Terraform are not substitutes for provider execution evidence.

## Repository map

- `docs/specs/` — canonical architecture and implementation bindings
- `docs/decisions/` — frozen decision records
- `artifacts/conformance/AWS-STAGE-M1/` — raw/derived provider evidence and state ledger
- `scripts/conformance/` — deterministic M1 discovery and invocation scripts
- `docs/activation/` — AWS Activate / Spendbase submission material
- `.github/workflows/` — repository validation

## M1 execution

The execution environment must have AWS CLI, `jq`, `sha256sum`, and credentials authorized for the target staging account. Run:

```bash
./scripts/conformance/verify-stage-m1.sh
./scripts/conformance/invoke-smoke-test.sh
```

The scripts dynamically discover targets and never hard-code an assumed active model. Raw provider responses are preserved before derived artifacts are generated.

Do not commit credentials, account secrets, raw secret values, or other sensitive provider material.

## Public-release boundary

This repository is a **public staging/conformance baseline**, not a declaration of production readiness. The frozen architecture is complete; provider-dependent activation remains blocked until M1 evidence exists. No UNKNOWN gate may be represented as PASS by documentation, fixtures, or expected service behavior.

## Development

This branch contains historical Codessa material alongside the current canonical staging specification. When older documents conflict with the frozen specification, the frozen specification and decision record take precedence.

Before submitting changes:

```bash
npm ci
npm run format:check
npm run lint:check
npm test
```

## Security

See `SECURITY.md`. Never publish credentials, API keys, AWS account secrets, private provider documents, or unredacted operational logs.

## License

MIT. See `LICENSE`.
