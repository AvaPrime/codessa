import { handleRequest } from "../runtime/caller";

async function main(): Promise<void> {
  const base = {
    request_id: "call-1",
    text: "review claim",
    context_ids: ["policy"],
    allowed_actions: ["read_file"],
    action: "read_file",
    reply: "The claim is covered.",
  };
  const claimed = await handleRequest(base);
  const committed = await handleRequest({
    ...base,
    observationId: "OBS-C",
    observationSource: "adjuster-report",
    observationContent: "Roof damage confirmed.",
    decisionId: "DEC-C",
    outcome: "COMMIT",
  });
  const report = {
    caller_does_not_invent_commit: claimed.committed === false && claimed.evidence_id === undefined,
    caller_passes_supplied_outcome: committed.committed === true && committed.evidence_id === "evidence-OBS-C",
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (Object.values(report).some((ok) => !ok)) process.exitCode = 1;
}

main();
