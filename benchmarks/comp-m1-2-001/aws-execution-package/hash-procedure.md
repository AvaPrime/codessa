# M1-2-001 AWS Evidence Hash Procedure v0.1

## Purpose
Provide a reproducible hash procedure for the AWS competitor execution evidence bundle. Hashing authenticates captured artifacts; it does not establish semantic conformance.

## Algorithm
SHA-256.

## Canonicalization
For JSON artifacts use the frozen M1-1 profile:
`C14N-M1-1-v0.1:UTF8|sorted-object-keys|preserve-array-order|UTC-timestamps|null-distinct-from-absent|stable-id-regex|sha256-domain-separated|version-bound|non-circular-provenance`

For text and binary artifacts hash the exact captured bytes. Do not normalize line endings after capture.

## Required hashes
Record SHA-256 for:
1. Frozen fixture corpus export.
2. Expected-decision manifest.
3. AWS configuration snapshot.
4. Environment/version manifest.
5. Each raw execution trace.
6. Each policy/guardrail output.
7. Each state-transition record.
8. Each provenance artifact.
9. Each replay artifact.
10. Machine-readable result record set.
11. Final evidence bundle manifest.

## Hash manifest format
Use one line per artifact:
`<sha256>  <relative-path>`

Paths MUST be repository-relative and stable. Do not hash a manifest that contains its own final hash; generate the final bundle hash after all member artifacts are fixed.

## Decision/provenance hashes
`input_hash` and `decision_hash` MUST be computed over the canonicalized semantic objects defined by the M1-1 replay boundary. AWS-native trace IDs are evidence references, not substitutes for canonical hashes.

`provenance_hash` MUST cover the provenance receipt without circularly including its own hash.

## Verification
A reviewer must be able to recompute every recorded SHA-256 from the attached artifact bytes. A mismatch makes the affected artifact `UNRESOLVED` until corrected; it must not be silently replaced.

## Evidence rule
Hashes prove artifact identity/integrity only. They do not prove that AWS reproduced the Codessa invariant semantics. Semantic conclusions require the execution records and the M1-2-001 acceptance rules.
