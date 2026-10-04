# A-004 Conformance Matrix

Status: **PROPOSED** measurement. Not an implementation.
Contract: A-004 non-promotion proposal.
Runtime: A-003 gate @ `a39f84f`. Non-promotion records do not exist yet.

| Case | Outcome | Memory | Admission record | Expected now |
|---|---|---|---|---|
| REJECT_RECORDS_NON_PROMOTION | REJECT | none | candidate, observations, source, decision id, timestamp | cannot pass; no record |
| QUARANTINE_RECORDS_NON_PROMOTION | QUARANTINE | none | same fields, outcome quarantine | cannot pass; no record |
| PROMOTE_IS_NOT_A_NON_PROMOTION_RECORD | PROMOTE | stored memory | not required by this case | already passed in A-003 |
| MISSING_OUTCOME_DOES_NOT_INVENT_REJECT | none | none | none | refuse; no synthetic record |
| CONFLICT_STAYS_ON_THE_RECORD | REJECT with two observations | none | both observation refs kept | cannot pass; no record |

A pass on the first, second, or last case requires an implementation that does not exist. A-003 refusing `REJECT` and `QUARANTINE` is not an A-004 pass. Absence of a record is the gap this matrix names.

Implementation remains unauthorized.
