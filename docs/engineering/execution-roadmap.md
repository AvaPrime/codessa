# Codessa Execution Roadmap

Status: implementation queue for the engineering factory. Not a constitution.
Active implementation track: `codessa-execution-slice` @ `1d22888`
Factory branch: `codessa-engineering-factory`

The earlier slice numbering and this queue do not match. Completed work is marked so an agent does not rebuild it.

| Queue id | Objective | State |
|---|---|---|
| E-001 | Verify execution-contract integrity | Done on the slice at `fa5f64d` |
| E-002 | Formalize execution record | Done on the slice at `1d22888` |
| E-003 | Provider adapter boundary | Done on the slice as the model router at `a2db38e` |
| E-004 | Failure-path coverage | Trial implemented; pending review |
| E-005 | Observation capture | Not started |
| E-006 | Outcome verification | Not started |
| E-007 | Authority-validation seam | Not started; do not redefine the constitution |
| E-008 | Execution persistence | Not started |
| E-009 | Kernel integration | Later |
| E-010 | End-to-end execution | Later |

E-004 is the next unimplemented item. Do not start it from this factory branch. This branch holds the controls, not the next feature.

Forbidden unless a task explicitly allows it: MCGL implementation, snapshot redesign, OpenViking, database selection, unrelated memory stores, frozen constitution changes, and A-005.
