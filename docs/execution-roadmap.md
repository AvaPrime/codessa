# Execution roadmap

Status: work queue. Not a constitution. Not permission to skip a task's tests.
Active branch: `codessa-execution-slice`
Date: 2026-10-04

Each item is one bounded change: implement, test, diff, pass or fail. Stop and report if the change would alter authority.

| Id | Objective | State |
|---|---|---|
| E-001 | Execution-contract integrity | Done at `fa5f64d` |
| E-002 | Model router behind the sealed contract | PRD at `4cc60ec`; not implemented |
| E-003 | One execution record for the run | Not started |
| E-004 | Failure-path coverage | Not started |
| E-005 | Persist execution records | Not started |
| E-006 | Provider adapter beyond the two mocks | Not started |
| E-007 | Real observation source | Not started |
| E-008 | Authority-validation seam | Not started; do not pretend MCGL exists |
| E-009 | Integrate the slice with `executeTask` | Later |
| E-010 | End-to-end CLI or API | Later |

E-002 is the next item. Its requirement is `docs/e2-model-router-prd.md`. Verification command: `npm run verify:slice`.
