import { MemoryManager } from "../memory/memory-manager";
import { clearAdmissionDecisions } from "../memory/admission";
import { clearSlice, listCommits, readExternalOutcome, runSlice } from "../runtime/execution-slice";

async function main(): Promise<void> {
  clearSlice();
  clearAdmissionDecisions();
  const store = new MemoryManager();
  await store.initialize();
  const request = {
    request_id: "req-e6",
    text: "deploy",
    context_ids: ["readme"],
    allowed_actions: ["repository_read"],
    action: "repository_read",
  };
  const claimed = await runSlice(
    {
      request,
      model: async () => '{"outcome":"COMMIT","decision_id":"DEC-FAKE"}',
      observation: { observation_id: "OBS-E6", source: "deployment-monitor", content: "HTTP 200" },
    },
    store,
  );
  const supplied = await runSlice(
    {
      request,
      model: async () => "Deployment succeeded.",
      observation: { observation_id: "OBS-E6B", source: "deployment-monitor", content: "HTTP 200" },
      governance: { decision_id: "DEC-E6", outcome: "COMMIT" },
    },
    store,
  );
  const report = {
    provider_success_does_not_create_outcome: readExternalOutcome('{"outcome":"COMMIT"}', undefined) === undefined && claimed.committed === false && claimed.record?.externalOutcome === undefined,
    supplied_outcome_is_consumed: supplied.record?.externalOutcome === "COMMIT" && listCommits().some((item) => item.decision_id === "DEC-E6"),
    outcome_not_parsed_from_model_text: claimed.model_output?.raw_result.includes("COMMIT") && claimed.record?.externalOutcome === undefined,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (Object.values(report).some((ok) => !ok)) process.exitCode = 1;
}

main();
