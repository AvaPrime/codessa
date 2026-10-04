/**
 * One request through the canonical lifecycle.
 * The model may speak. It may not commit, observe, promote, or rewrite the contract.
 */
import { createHash } from "crypto";
import { admitToStore, AdmissionRequest, listAdmissionDecisions } from "../memory/admission";
import { registerProvider, route } from "./model-router";
import { run as runCore } from "./codessa-core";

export interface RunRequest {
  request_id: string;
  text: string;
  context_ids: string[];
  allowed_actions: string[];
  action?: string;
  provider?: string;
}

export interface ExecutionContract {
  contract_id: string;
  run_id: string;
  context_hash: string;
  allowed_actions: readonly string[];
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
  model?: (prompt: string) => Promise<string>;
  observation?: Observation;
  governance?: { decision_id: string; outcome: "PROMOTE" | "REJECT" | "QUARANTINE" | "COMMIT" };
}

export interface CommitRecord {
  decision_id: string;
  contract_id: string;
  run_id: string;
  context_hash: string;
  evidence_id: string;
}

export interface SliceResult {
  run_id: string;
  contract: ExecutionContract;
  snapshot_id: string;
  contract_actions: readonly string[];
  model_output?: ModelOutput;
  evidence_id?: string;
  committed: boolean;
  promoted: boolean;
  refused?: string;
  record?: ExecutionRecord;
}


export interface ExecutionRecord {
  runId: string;
  sealedContract: ExecutionContract;
  contextHash: string;
  allowedActions: readonly string[];
  selectedProvider?: string;
  modelOutput?: ModelOutput;
  observation?: Observation;
  externalOutcome?: string;
  commitReference?: string;
  promotionResult?: "promoted" | "not_promoted";
  refused?: string;
}

const records: ExecutionRecord[] = [];

export function listExecutionRecords(): ExecutionRecord[] {
  return records.map((item) => ({
    ...item,
    allowedActions: [...item.allowedActions],
    sealedContract: { ...item.sealedContract, allowed_actions: [...item.sealedContract.allowed_actions] },
    modelOutput: item.modelOutput ? { ...item.modelOutput } : undefined,
    observation: item.observation ? { ...item.observation } : undefined,
  }));
}

function remember(record: ExecutionRecord): ExecutionRecord {
  const stored: ExecutionRecord = {
    ...record,
    allowedActions: Object.freeze([...record.allowedActions]),
    sealedContract: Object.freeze({
      ...record.sealedContract,
      allowed_actions: Object.freeze([...record.sealedContract.allowed_actions]),
    }),
  };
  records.push(stored);
  return stored;
}

const commits: CommitRecord[] = [];

export function listCommits(): CommitRecord[] {
  return commits.map((item) => ({ ...item }));
}

export function clearSlice(): void {
  commits.length = 0;
  records.length = 0;
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function sealContract(request: RunRequest): ExecutionContract {
  const run_id = `run-${request.request_id}`;
  const context_hash = hash(request.context_ids.join("|"));
  const allowed_actions = Object.freeze([...request.allowed_actions]);
  const contract_id = hash(`${run_id}|${context_hash}|${allowed_actions.join("|")}`);
  return Object.freeze({ contract_id, run_id, context_hash, allowed_actions });
}


export function readExternalOutcome(rawResult: string, governance?: SliceInput["governance"]): string | undefined {
  if (!governance || !governance.decision_id || !governance.outcome) return undefined;
  if (rawResult.includes(governance.outcome) && !governance.decision_id) return undefined;
  return governance.outcome;
}

export async function runSlice(
  input: SliceInput,
  store: { store(data: unknown): Promise<void> },
): Promise<SliceResult> {
  const contract = sealContract(input.request);
  const action = input.request.action ?? contract.allowed_actions[0];
  if (!contract.allowed_actions.includes(action)) {
    const record = remember({
      runId: contract.run_id,
      sealedContract: contract,
      contextHash: contract.context_hash,
      allowedActions: contract.allowed_actions,
      refused: "action not allowed",
      promotionResult: "not_promoted",
    });
    return {
      run_id: contract.run_id,
      contract,
      snapshot_id: contract.context_hash,
      contract_actions: contract.allowed_actions,
      committed: false,
      promoted: false,
      refused: "action not allowed",
      record,
    };
  }

  if (input.model) {
    registerProvider({
      name: input.request.provider ?? "mock-a",
      invoke: async () => input.model!(input.request.text),
    });
  }
  let model_output: ModelOutput;
  try {
    model_output = await route({
      contract,
      action,
      prompt: input.request.text,
      provider: input.request.provider,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "provider failed";
    const refused = message.startsWith("unknown provider") ? "unknown provider" : "provider failed";
    const record = remember({
      runId: contract.run_id,
      sealedContract: contract,
      contextHash: contract.context_hash,
      allowedActions: contract.allowed_actions,
      selectedProvider: input.request.provider,
      refused,
      promotionResult: "not_promoted",
    });
    return {
      run_id: contract.run_id,
      contract,
      snapshot_id: contract.context_hash,
      contract_actions: contract.allowed_actions,
      committed: false,
      promoted: false,
      refused,
      record,
    };
  }
  const raw = model_output.raw_result;
  let evidence_id: string | undefined;
  let committed = false;
  let promoted = false;

  const observation = input.observation;
  const observationValid = Boolean(
    observation &&
      observation.observation_id &&
      observation.source &&
      observation.source !== "model" &&
      observation.source !== "provider" &&
      observation.content !== model_output.raw_result,
  );
  if (observationValid && observation) {
    evidence_id = `evidence-${observation.observation_id}`;
  }

  if (input.governance?.outcome === "COMMIT" && evidence_id && input.governance.decision_id) {
    commits.push({
      decision_id: input.governance.decision_id,
      contract_id: contract.contract_id,
      run_id: contract.run_id,
      context_hash: contract.context_hash,
      evidence_id,
    });
    committed = true;
  }

  const admission: AdmissionRequest = {
    model_result: raw,
    candidate: input.observation
      ? {
          candidate_id: `cand-${contract.run_id}`,
          content: input.observation.content,
          observation_refs: [input.observation.observation_id],
          source_refs: [input.observation.source],
        }
      : undefined,
    outcome:
      input.governance && input.governance.outcome !== "COMMIT"
        ? {
            decision_id: input.governance.decision_id,
            candidate_id: `cand-${contract.run_id}`,
            outcome: input.governance.outcome,
          }
        : undefined,
  };
  const admitted = await admitToStore(store, admission);
  promoted = admitted.promoted;
  const core = await runCore({
    request: {
      requestId: input.request.request_id,
      text: input.request.text,
      contextIds: input.request.context_ids,
      allowedActions: [...contract.allowed_actions],
      action,
      provider: model_output.provider,
    },
    providers: { [model_output.provider]: async () => raw },
    observation: observationValid && observation
      ? { observationId: observation.observation_id, source: observation.source, content: observation.content }
      : undefined,
    outcome: input.governance
      ? { decisionId: input.governance.decision_id, outcome: input.governance.outcome, roleLabel: undefined }
      : undefined,
  });
  committed = committed && core.committed;
  promoted = promoted && core.promoted;
  const record = remember({
    runId: contract.run_id,
    sealedContract: contract,
    contextHash: contract.context_hash,
    allowedActions: contract.allowed_actions,
    selectedProvider: model_output.provider,
    modelOutput: model_output,
    observation: observationValid ? input.observation : undefined,
    externalOutcome: readExternalOutcome(raw, input.governance),
    commitReference: committed ? input.governance?.decision_id : undefined,
    promotionResult: promoted ? "promoted" : "not_promoted",
  });
  return {
    run_id: contract.run_id,
    contract,
    snapshot_id: contract.context_hash,
    contract_actions: contract.allowed_actions,
    model_output,
    evidence_id,
    committed,
    promoted,
    record,
  };
}

export { listAdmissionDecisions };
