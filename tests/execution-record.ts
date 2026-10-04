import { MemoryManager } from "../memory/memory-manager";
import { clearAdmissionDecisions } from "../memory/admission";
import { clearSlice, listCommits, listExecutionRecords, runSlice } from "../runtime/execution-slice";

async function main(): Promise<void> {
  clearSlice();
  clearAdmissionDecisions();
  const store = new MemoryManager();
  await store.initialize();
  const request = {
    request_id: "req-e3",
    text: "read",
    context_ids: ["readme"],
    allowed_actions: ["repository_read"],
    action: "repository_read",
  };
  const run = await runSlice(
    {
      request,
      model: async () => "Deployment succeeded.",
      observation: { observation_id: "OBS-E3", source: "monitor", content: "HTTP 200" },
      governance: { decision_id: "DEC-E3", outcome: "COMMIT" },
    },
    store,
  );
  const record = run.record!;
  const commitsBefore = listCommits().length;
  let mutationRejected = false;
  try {
    (record.allowedActions as string[]).push("repository_write");
  } catch {
    mutationRejected = true;
  }
  const copy = listExecutionRecords()[0];
  copy.modelOutput = { provider: "forged", run_id: run.run_id, raw_result: "COMMIT" };
  copy.observation = { observation_id: "FORGED", source: "record", content: "invented" };
  const stored = listExecutionRecords()[0];
  const report = {
    record_has_lifecycle: stored.selectedProvider === "mock-a" && stored.contextHash === run.contract.context_hash && stored.commitReference === "DEC-E3" && stored.promotionResult === "not_promoted",
    record_mutation_does_not_change_contract: mutationRejected && stored.allowedActions.join() === "repository_read" && run.contract.allowed_actions.join() === "repository_read",
    record_model_output_does_not_commit: listCommits().length === commitsBefore && listCommits()[0].decision_id === "DEC-E3",
    record_observation_does_not_create_evidence: run.evidence_id === "evidence-OBS-E3" && stored.observation?.observation_id === "OBS-E3",
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (Object.values(report).some((ok) => !ok)) process.exitCode = 1;
}

main();
