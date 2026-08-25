# Security Policy

## Scope

This repository contains Codessa research, specifications, conformance harnesses and staging implementation material. Do not include production credentials or sensitive provider evidence in Git.

## Do not commit

- AWS access keys, session tokens, private keys or Secrets Manager values
- API keys or model-provider credentials
- database passwords or connection strings containing credentials
- private customer data
- unredacted CloudTrail, CloudWatch or runtime logs containing secrets
- provider documents marked confidential

## Reporting

For a suspected security vulnerability, do not open a public issue containing exploit details or credentials. Contact the repository owner privately through the GitHub account associated with this project and provide a minimal reproduction, affected path/component and impact assessment.

## Evidence handling

AWS-STAGE-M1 artifacts are execution evidence, not canonical knowledge. Raw provider responses may be committed only when they contain no secrets, personal data or confidential provider material. Derived artifacts must preserve their non-authoritative `CandidateArtifact` classification.
