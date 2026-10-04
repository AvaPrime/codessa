import { listCommits, resetCore, run } from "../runtime/codessa-core";
import { attachRole, chart, claims, labelRole, mapObservation, matter, summaryIsNotObservation } from "../runtime/packs";

async function main(): Promise<void> {
  resetCore();
  const providers = { "mock-a": async () => "The claim is covered." };
  const request = {
    requestId: "claim-1",
    text: "review claim",
    contextIds: ["policy"],
    allowedActions: ["read_file"],
    action: "read_file",
  };
  const summary = summaryIsNotObservation(claims, "The claim is covered.");
  const refused = await run({
    request,
    providers,
    observation: summary,
    outcome: { decisionId: "DEC-BAD", outcome: "COMMIT" },
  });
  const observation = mapObservation(claims, "adjusterReport", "OBS-ADJ", "Roof damage confirmed.");
  const role = labelRole(claims, "handler");
  const outcome = attachRole(claims, "handler", { decisionId: "DEC-CLAIM", outcome: "COMMIT" });
  const accepted = await run({ request, providers, observation, outcome });
  const pleading = mapObservation(matter, "pleading", "OBS-LAW", "Complaint filed.");
  const lab = mapObservation(chart, "lab", "OBS-LAB", "Hemoglobin 13.4.");
  const report = {
    summary_is_not_observation: summary === undefined && refused.committed === false,
    claims_source_maps: observation?.source === "adjuster-report" && accepted.committed === true && listCommits().includes("DEC-CLAIM"),
    role_is_a_label: role?.label === "claims-handler" && accepted.record.roleLabel === "claims-handler",
    other_packs_map_without_issuing: pleading?.source === "filed-pleading" && lab?.source === "lab-result",
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (Object.values(report).some((ok) => !ok)) process.exitCode = 1;
}

main();
