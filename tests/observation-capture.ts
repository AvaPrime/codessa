import { MemoryManager } from "../memory/memory-manager";
import { clearAdmissionDecisions } from "../memory/admission";
import { clearSlice, listCommits, runSlice } from "../runtime/execution-slice";

async function main(): Promise<void> {
  clearSlice();
  clearAdmissionDecisions();
  const store = new MemoryManager();
  await store.initialize();
  const request = {
    request_id: "req-e5",
    text: "deploy",
    context_ids: ["readme"],
    allowed_actions: ["repository_read"],
    action: "repository_read",
  };
  const model = async () => "Deployment succeeded.";
  const copied = await runSlice(
    {
      request,
      model,
      observation: { observation_id: "OBS-COPY", source: "model", content: "Deployment succeeded." },
      governance: { decision_id: "DEC-COPY", outcome: "COMMIT" },
    },
    store,
  );
  const captured = await runSlice(
    {
      request,
      model,
      observation: { observation_id: "OBS-OK", source: "deployment-monitor", content: "HTTP 200" },
      governance: { decision_id: "DEC-OK", outcome: "COMMIT" },
    },
    store,
  );
  const report = {
    model_source_is_not_observation: copied.evidence_id === undefined && copied.committed === false && copied.record?.observation === undefined,
    sourced_observation_is_distinct: captured.evidence_id === "evidence-OBS-OK" && captured.record?.observation?.source === "deployment-monitor" && captured.model_output?.raw_result === "Deployment succeeded.",
    missing_observation_still_blocks_commit: listCommits().every((item) => item.evidence_id !== "evidence-OBS-COPY") && listCommits().some((item) => item.decision_id === "DEC-OK"),
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (Object.values(report).some((ok) => !ok)) process.exitCode = 1;
}

main();
