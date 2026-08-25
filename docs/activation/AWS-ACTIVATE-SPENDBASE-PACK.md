# AWS Activate / Spendbase Readiness

**Application pack status:** technically prepared; provider-dependent fields remain unverified.

## Company

- Product: Codessa
- Location: South Africa
- Primary deployment: `af-south-1`
- Stage: pre-seed / bootstrapped staging
- Website: https://codessa.io
- Target: B2B developer platforms, AI-agent developers and verifiable AI infrastructure providers

## Product statement

Codessa is an epistemic infrastructure and deterministic governance platform providing audit-verifiable state execution, evidence acquisition pipelines and invariant enforcement for AI systems. Probabilistic model outputs and retrieved evidence remain non-canonical until they pass a deterministic validation boundary and MCGL authorizes the transition.

## Workload

- ECS Fargate On-Demand for admission/kernel execution
- Fargate Spot for idempotent/replayable ingestion workers
- RDS PostgreSQL + pgvector for canonical relational state and retrieval indexing
- S3 Object Lock + SSE-KMS for immutable audit evidence
- Amazon Bedrock for model evaluation and structured extraction
- CloudWatch and VPC PrivateLink for telemetry and private service access

## Commercial fields requiring provider evidence

| Field | State |
|---|---|
| AWS account ID | TO BE POPULATED FROM ACCOUNT |
| Active Spendbase Partner Org ID | UNKNOWN |
| Activate credit scope for third-party Bedrock models | UNKNOWN |
| Current provider minimum-spend requirement | UNKNOWN |
| In-region Bedrock model catalog | UNKNOWN until M1 execution |
| Cross-region profile destinations | UNKNOWN until M1 execution |

Do not replace UNKNOWN with assumptions. Attach provider-issued evidence under `artifacts/conformance/AWS-STAGE-M1/` after redaction review.

## Requested trajectory

The staging plan targets progressive use of AWS compute, database, storage and eligible Bedrock workloads as the deterministic kernel and replay/conformance system are validated. Financial projections must be refreshed against the actual account and current AWS commercial terms immediately before submission.

## Submission gate

The commercial application is **not** represented as approved or eligible by this repository. G-04 remains UNKNOWN until a verified provider Org ID is captured or the explicit Founders route is selected.
