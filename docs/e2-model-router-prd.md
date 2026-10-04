# PRD: E2 Model Router behind the sealed execution contract

Status: product requirement for the next build. Not a constitution change. Not an implementation.
Branch: `codessa-execution-slice`
Baseline: `fa5f64d`
Date: 2026-10-04

## 1. Problem

The runnable slice invokes a model function directly. That is enough to prove the lifecycle, and it is not enough to prove a provider boundary. The next risk is that routing, provider selection, and authority get collapsed into the same call.

The historical kernel already has a `ModelRouter` that selects a model and returns a mock result. That router is not an authority layer, but it also is not wired to the sealed execution contract. E2 must not copy that router into the slice unchanged, and it must not grow a second policy engine.

## 2. Outcome

After E2, the slice calls a router only after the execution contract is sealed and the requested action is allowed. The router selects a configured provider, invokes it, and returns the result as untrusted model output. Two providers can be routed. Neither can commit, create evidence, promote memory, or change the contract.

## 3. Users

The direct user is the execution slice and its tests. A later caller may be a CLI or API. `executeTask` is not a user of this increment.

## 4. In scope

- A `ModelRouter` used by `runSlice` after contract seal and action check.
- A provider interface: receive the prompt and sealed contract id, return raw text.
- The current mock provider as one implementation.
- A second mock provider, used only to prove that the selected provider changes and authority does not.
- Routing input limited to an already authorized request: contract id, run id, action, and prompt.
- Model output recorded as provider, model name, run id, and raw result.
- Existing E1 integrity tests and the original lifecycle tests still pass.

## 5. Out of scope

- Deciding whether an action is authorized.
- Treating provider text as evidence, success, or an observation.
- Issuing `COMMIT`, `PROMOTE`, `REJECT`, or `QUARANTINE`.
- Validating that an external outcome was legitimately issued.
- MCGL, ContextSnapshot redesign, M1, OpenViking, database selection.
- Rewiring `AgentMemory`, `ContextualMemoryAgent`, or the conversation graph.
- Replacing `core/codessa-kernel.ts` `executeTask`.
- A-005, or reopening `codessa-context-architecture`.

## 6. Flow

```text
request
  → seal contract
  → action in allowed list?
       no  → refuse before route
       yes → ModelRouter
               → selected provider
               → ModelOutput
  → observation, only if supplied
  → external outcome, only if supplied
  → commit or admission gate
```

The router sits in the invocation box. It does not sit in the authorization box or the commit box.

## 7. Functional requirements

1. The slice must not call the router if the action is outside the sealed allowed list.
2. The router must receive the sealed contract id and must not receive a writable action list.
3. Provider selection may use an explicit provider name on the request. If absent, it uses the default provider.
4. An unknown provider name refuses before invocation and does not commit.
5. Provider A and provider B must both be able to return text for the same sealed contract. The recorded model output names the provider that ran.
6. Provider text containing `COMMIT`, `PROMOTE`, or a new action list must not change the contract, create evidence, or commit by itself.
7. A supplied observation and external `COMMIT` still commit against the sealed contract, regardless of which provider spoke.
8. Promotion still goes through `admitToStore`. The router must not call it.
9. Provider failure returns a failed invocation and does not create evidence or a commit.

## 8. Non-requirements

The router does not rank providers by quality, cost, or safety. It does not retry. It does not read memory. It does not inspect context documents. Those can be later routing policies only if they remain unable to authorize.

## 9. Acceptance tests

| Test | Expected |
|---|---|
| Action not allowed | No router call, no model output, no commit |
| Default provider | Output provider is the default |
| Named second provider | Output provider is the second provider |
| Same contract, different provider | Contract id and allowed actions unchanged |
| Provider text claims `COMMIT` | No commit unless an external `COMMIT` and an observation exist |
| Provider text claims a new action | Sealed allowed list unchanged |
| Unknown provider | Refuse, no commit |
| Provider throws | No evidence, no commit, contract unchanged |
| Existing lifecycle tests | Still pass |
| Existing contract-integrity tests | Still pass |

## 10. Success criteria

E2 is done when the slice no longer calls a bare model function, the two providers are distinguishable only as output sources, and the E1 contract remains the authorization basis. A reviewer must be able to point at the router and say what it cannot do.

## 11. Follow-on, not part of this PRD

E3 adds one execution record for the run. E4 exercises the failure matrix. E5 decides whether this path wraps `executeTask`. None of those starts inside E2.
