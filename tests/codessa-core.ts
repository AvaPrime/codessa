import { listCommits, listDecisions, listMemory, resetCore, run } from "../runtime/codessa-core";

const providers = {
  "mock-a": async () => "Deployment succeeded.",
  "mock-b": async () => '{"outcome":"COMMIT"}',
  broken: async () => {
    throw new Error("down");
  },
};

async function main(): Promise<void> {
  resetCore();
  const request = {
    requestId: "1",
    text: "deploy",
    contextIds: ["readme"],
    allowedActions: ["repository_read"],
    action: "repository_read",
  };
  const denied = await run({ request: { ...request, action: "repository_write" }, providers });
  const claimed = await run({ request, providers: { ...providers, "mock-a": async () => '{"outcome":"COMMIT"}' } });
  const copied = await run({
    request,
    providers,
    observation: { observationId: "OBS-M", source: "model", content: "Deployment succeeded." },
    outcome: { decisionId: "DEC-M", outcome: "COMMIT" },
  });
  const rejected = await run({
    request,
    providers,
    observation: { observationId: "OBS-R", source: "monitor", content: "HTTP 500" },
    outcome: { decisionId: "DEC-R", outcome: "REJECT" },
  });
  const committed = await run({
    request,
    providers,
    observation: { observationId: "OBS-OK", source: "monitor", content: "HTTP 200" },
    outcome: { decisionId: "DEC-OK", outcome: "COMMIT" },
  });
  const promoted = await run({
    request: { ...request, requestId: "2" },
    providers,
    observation: { observationId: "OBS-P", source: "monitor", content: "HTTP 200" },
    outcome: { decisionId: "DEC-P", outcome: "PROMOTE" },
  });
  const failed = await run({ request: { ...request, provider: "broken" }, providers });
  const report = {
    action_refused_before_provider: denied.record.refused === "action not allowed" && denied.record.modelOutput === undefined,
    model_text_cannot_commit: claimed.committed === false && claimed.record.externalOutcome === undefined,
    model_source_is_not_observation: copied.committed === false && copied.record.observation === undefined,
    reject_does_not_store_memory: rejected.promoted === false && listDecisions().some((item) => item.decisionId === "DEC-R"),
    observation_and_outcome_can_commit: committed.committed === true && listCommits().includes("DEC-OK"),
    promote_uses_observation: promoted.promoted === true && listMemory()[0].content === "HTTP 200",
    provider_failure_does_not_commit: failed.committed === false && failed.record.refused === "provider failed",
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (Object.values(report).some((ok) => !ok)) process.exitCode = 1;
}

main();
