import { MemoryManager } from "../memory/memory-manager";
import { clearAdmissionDecisions } from "../memory/admission";
import { clearSlice, listCommits, runSlice } from "../runtime/execution-slice";
import { listCommits as coreCommits, resetCore } from "../runtime/codessa-core";

async function main(): Promise<void> {
  clearSlice();
  clearAdmissionDecisions();
  resetCore();
  const store = new MemoryManager();
  await store.initialize();
  const request = {
    request_id: "wire",
    text: "read",
    context_ids: ["readme"],
    allowed_actions: ["repository_read"],
    action: "repository_read",
  };
  const claimed = await runSlice({ request, model: async () => '{"outcome":"COMMIT"}' }, store);
  const coreAfterClaim = coreCommits().length;
  const committed = await runSlice(
    {
      request,
      model: async () => "Deployment succeeded.",
      observation: { observation_id: "OBS-W", source: "monitor", content: "HTTP 200" },
      governance: { decision_id: "DEC-W", outcome: "COMMIT" },
    },
    store,
  );
  const report = {
    slice_follows_core_refusal: claimed.committed === false && coreAfterClaim === 0,
    slice_commit_matches_core: committed.committed === true && listCommits().some((item) => item.decision_id === "DEC-W") && coreCommits().includes("DEC-W"),
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (Object.values(report).some((ok) => !ok)) process.exitCode = 1;
}

main();
