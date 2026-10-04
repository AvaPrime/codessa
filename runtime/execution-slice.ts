/**
 * One request through the canonical lifecycle.
 * The model may speak. It may not commit, observe, or promote.
 */
import { createHash } from "crypto";
import { admitToStore, AdmissionRequest, listAdmissionDecisions } from "../memory/admission";

export interface RunRequest {
  request_id: string;
  text: string;
  context_ids: string[];
  allowed_actions: string[];
}

export interface ModelOutput {
  provider: string;
  run_id: string;
  raw_result: string;
}

export interface Observation {
  observation_id: string;
  source: string;
  content: string;
}

export interface SliceInput {
  request: RunRequest;
  model: (prompt: string) => Promise<string>;
  observation?: Observation;
  governance?: { decision_id: string; outcome: "PROMOTE" | "REJECT" | "QUARANTINE" | "COMMIT" };
}

export interface SliceResult {
  run_id: string;
  snapshot_id: string;
  contract_actions: string[];
  model_output: ModelOutput;
  evidence_id?: string;
  committed: boolean;
  promoted: boolean;
}

const commits: string[] = [];

export function listCommits(): string[] {
  return [...commits];
}

export function clearSlice(): void {
  commits.length = 0;
}

export async function runSlice(
  input: SliceInput,
  store: { store(data: unknown): Promise<void> },
): Promise<SliceResult> {
  const run_id = `run-${input.request.request_id}`;
  const snapshot_id = createHash("sha256").update(input.request.context_ids.join("|")).digest("hex").slice(0, 16);
  const raw = await input.model(input.request.text);
  const model_output: ModelOutput = { provider: "model", run_id, raw_result: raw };
  let evidence_id: string | undefined;
  let committed = false;
  let promoted = false;

  if (input.observation) {
    evidence_id = `evidence-${input.observation.observation_id}`;
  }

  if (input.governance?.outcome === "COMMIT" && evidence_id && input.governance.decision_id) {
    commits.push(input.governance.decision_id);
    committed = true;
  }

  const admission: AdmissionRequest = {
    model_result: raw,
    candidate: input.observation
      ? {
          candidate_id: `cand-${run_id}`,
          content: input.observation.content,
          observation_refs: [input.observation.observation_id],
          source_refs: [input.observation.source],
        }
      : undefined,
    outcome:
      input.governance && input.governance.outcome !== "COMMIT"
        ? {
            decision_id: input.governance.decision_id,
            candidate_id: `cand-${run_id}`,
            outcome: input.governance.outcome,
          }
        : undefined,
  };
  const admitted = await admitToStore(store, admission);
  promoted = admitted.promoted;
  return {
    run_id,
    snapshot_id,
    contract_actions: [...input.request.allowed_actions],
    model_output,
    evidence_id,
    committed,
    promoted,
  };
}

export { listAdmissionDecisions };
