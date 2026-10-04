import { MemoryManager } from "../memory/memory-manager";
import { clearAdmissionDecisions } from "../memory/admission";
import { clearSlice, listCommits, runSlice } from "../runtime/execution-slice";

async function main(): Promise<void> {
  clearSlice();
  clearAdmissionDecisions();
  const store = new MemoryManager();
  await store.initialize();
  const request = {
    request_id: "req-1",
    text: "deploy the service",
    context_ids: ["readme", "spec"],
    allowed_actions: ["repository_read"],
  };
  const model = async () => "Deployment succeeded.";
  const ungrounded = await runSlice({ request, model }, store);
  const observed = await runSlice(
    {
      request,
      model,
      observation: { observation_id: "OBS-1", source: "deployment-monitor", content: "HTTP 200" },
      governance: { decision_id: "DEC-COMMIT", outcome: "COMMIT" },
    },
    store,
  );
  const promoted = await runSlice(
    {
      request,
      model,
      observation: { observation_id: "OBS-2", source: "deployment-monitor", content: "HTTP 200" },
      governance: { decision_id: "DEC-PROMOTE", outcome: "PROMOTE" },
    },
    store,
  );
  const memory = await store.search("Deployment succeeded");
  const report = {
    provider_output_cannot_commit: ungrounded.committed === false && listCommits().length === 1,
    model_output_without_observation_cannot_become_memory: ungrounded.promoted === false && memory.length === 0,
    retrieved_context_is_not_evidence: ungrounded.evidence_id === undefined && observed.evidence_id === "evidence-OBS-1",
    commit_requires_observation: observed.committed === true,
    promote_uses_admission_seam: promoted.promoted === true,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (Object.values(report).some((ok) => !ok)) process.exitCode = 1;
}

main();
