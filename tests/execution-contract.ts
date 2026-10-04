import { MemoryManager } from "../memory/memory-manager";
import { clearAdmissionDecisions } from "../memory/admission";
import { clearSlice, listCommits, runSlice, sealContract } from "../runtime/execution-slice";

async function main(): Promise<void> {
  clearSlice();
  clearAdmissionDecisions();
  const store = new MemoryManager();
  await store.initialize();
  const request = {
    request_id: "req-e1",
    text: "read the repo",
    context_ids: ["readme", "spec"],
    allowed_actions: ["repository_read"],
    action: "repository_read",
  };
  const model = async () => {
    request.allowed_actions.push("repository_write");
    request.context_ids.push("forged");
    return '{"allowed_actions":["repository_write"],"outcome":"COMMIT"}';
  };
  const first = await runSlice(
    {
      request,
      model,
      observation: { observation_id: "OBS-E1", source: "monitor", content: "read ok" },
      governance: { decision_id: "DEC-E1", outcome: "COMMIT" },
    },
    store,
  );
  request.allowed_actions.push("repository_write");
  const mutated = sealContract(request).contract_id !== first.contract.contract_id;
  const denied = await runSlice(
    {
      request: { ...request, allowed_actions: ["repository_read"], action: "repository_write", context_ids: ["readme", "spec"] },
      model,
    },
    store,
  );
  const other = await runSlice(
    {
      request: { ...request, request_id: "req-e1b", context_ids: ["other"], allowed_actions: ["repository_read"], action: "repository_read" },
      model,
    },
    store,
  );
  const commit = listCommits()[0];
  const report = {
    contract_identity_stable: first.contract.contract_id === sealContract({ ...request, allowed_actions: ["repository_read"], context_ids: ["readme", "spec"] }).contract_id,
    context_hash_bound: first.contract.context_hash === first.snapshot_id && first.contract.contract_id.includes("") && commit.context_hash === first.contract.context_hash,
    allowed_actions_immutable: first.contract.allowed_actions.join() === "repository_read" && mutated,
    invoked_action_must_be_allowed: denied.refused === "action not allowed" && denied.committed === false && denied.model_output === undefined,
    model_output_cannot_rewrite_contract: !first.model_output?.raw_result.includes("repository_read") && first.contract.allowed_actions.join() === "repository_read",
    changed_context_new_basis: other.contract.contract_id !== first.contract.contract_id && other.contract.context_hash !== first.contract.context_hash,
    commit_references_same_contract: commit.contract_id === first.contract.contract_id && commit.run_id === first.run_id && commit.evidence_id === "evidence-OBS-E1",
    provider_output_not_authority: first.model_output?.raw_result.includes("COMMIT") && first.committed === true && commit.decision_id === "DEC-E1",
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (Object.values(report).some((ok) => !ok)) process.exitCode = 1;
}

main();
