import { MemoryManager } from "../memory/memory-manager";
import { clearAdmissionDecisions, listAdmissionDecisions } from "../memory/admission";
import { clearSlice, listCommits, runSlice } from "../runtime/execution-slice";

async function main(): Promise<void> {
  clearSlice();
  clearAdmissionDecisions();
  const store = new MemoryManager();
  await store.initialize();
  const request = {
    request_id: "req-e4",
    text: "deploy",
    context_ids: ["readme"],
    allowed_actions: ["repository_read"],
    action: "repository_read",
  };
  const successText = async () => "Deployment succeeded.";
  const missingObservation = await runSlice(
    { request, model: successText, governance: { decision_id: "DEC-MISS", outcome: "COMMIT" } },
    store,
  );
  const rejected = await runSlice(
    {
      request,
      model: successText,
      observation: { observation_id: "OBS-R", source: "monitor", content: "HTTP 500" },
      governance: { decision_id: "DEC-R", outcome: "REJECT" },
    },
    store,
  );
  const quarantined = await runSlice(
    {
      request,
      model: successText,
      observation: { observation_id: "OBS-Q", source: "monitor", content: "HTTP 500" },
      governance: { decision_id: "DEC-Q", outcome: "QUARANTINE" },
    },
    store,
  );
  const missingOutcome = await runSlice(
    {
      request,
      model: successText,
      observation: { observation_id: "OBS-N", source: "monitor", content: "HTTP 200" },
    },
    store,
  );
  const malformed = await runSlice({ request, model: async () => "" }, store);
  const memory = await store.search("Deployment succeeded");
  const decisions = listAdmissionDecisions();
  const report = {
    missing_observation_does_not_commit: missingObservation.committed === false && missingObservation.evidence_id === undefined && listCommits().length === 0,
    reject_does_not_promote: rejected.promoted === false && rejected.committed === false && decisions.some((item) => item.decision_id === "DEC-R" && item.outcome === "REJECT"),
    quarantine_does_not_promote: quarantined.promoted === false && decisions.some((item) => item.decision_id === "DEC-Q" && item.outcome === "QUARANTINE"),
    missing_outcome_not_invented: missingOutcome.committed === false && missingOutcome.promoted === false && !decisions.some((item) => item.decision_id === "DEC-N"),
    malformed_output_is_not_evidence: malformed.evidence_id === undefined && malformed.committed === false && malformed.model_output?.raw_result === "",
    no_false_memory: memory.length === 0,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (Object.values(report).some((ok) => !ok)) process.exitCode = 1;
}

main();
