/**
 * Codessa-like core. A model reply is not an observation, an outcome, or memory.
 */
import { createHash } from "crypto";

export type OutcomeName = "COMMIT" | "PROMOTE" | "REJECT" | "QUARANTINE";

export interface RunRequest {
  requestId: string;
  text: string;
  contextIds: string[];
  allowedActions: string[];
  action?: string;
  provider?: string;
}

export interface Contract {
  contractId: string;
  runId: string;
  contextHash: string;
  allowedActions: readonly string[];
}

export interface ModelOutput {
  provider: string;
  runId: string;
  rawResult: string;
}

export interface Observation {
  observationId: string;
  source: string;
  content: string;
}

export interface ExternalOutcome {
  decisionId: string;
  outcome: OutcomeName;
  roleLabel?: string;
}

export interface DecisionRecord {
  candidateId: string;
  observationRefs: string[];
  sourceRefs: string[];
  outcome: "REJECT" | "QUARANTINE";
  decisionId: string;
  timestamp: string;
}

export interface MemoryRecord {
  id: string;
  content: string;
  observationRefs: string[];
  sourceRefs: string[];
  promotionDecisionId: string;
}

export interface ExecutionRecord {
  runId: string;
  contract: Contract;
  provider?: string;
  modelOutput?: ModelOutput;
  observation?: Observation;
  externalOutcome?: OutcomeName;
  roleLabel?: string;
  commitId?: string;
  promotion: "promoted" | "not_promoted";
  refused?: string;
}

export interface RunInput {
  request: RunRequest;
  providers: Record<string, (prompt: string) => Promise<string>>;
  observation?: Observation;
  outcome?: ExternalOutcome;
}

export interface RunResult {
  record: ExecutionRecord;
  committed: boolean;
  promoted: boolean;
}

const memory: MemoryRecord[] = [];
const decisions: DecisionRecord[] = [];
const commits: string[] = [];

export function resetCore(): void {
  memory.length = 0;
  decisions.length = 0;
  commits.length = 0;
}

export function listMemory(): MemoryRecord[] {
  return memory.map((item) => ({ ...item, observationRefs: [...item.observationRefs], sourceRefs: [...item.sourceRefs] }));
}

export function listDecisions(): DecisionRecord[] {
  return decisions.map((item) => ({ ...item, observationRefs: [...item.observationRefs], sourceRefs: [...item.sourceRefs] }));
}

export function listCommits(): string[] {
  return [...commits];
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function seal(request: RunRequest): Contract {
  const runId = `run-${request.requestId}`;
  const contextHash = hash(request.contextIds.join("|"));
  const allowedActions = Object.freeze([...request.allowedActions]);
  const contractId = hash(`${runId}|${contextHash}|${allowedActions.join("|")}`);
  return Object.freeze({ contractId, runId, contextHash, allowedActions });
}

function validObservation(observation: Observation | undefined, rawResult: string): observation is Observation {
  return Boolean(
    observation &&
      observation.observationId &&
      observation.source &&
      observation.source !== "model" &&
      observation.source !== "provider" &&
      observation.content !== rawResult,
  );
}

export async function run(input: RunInput): Promise<RunResult> {
  const contract = seal(input.request);
  const action = input.request.action ?? contract.allowedActions[0];
  if (!contract.allowedActions.includes(action)) {
    return finish(contract, { refused: "action not allowed", promotion: "not_promoted" }, false, false);
  }
  const providerName = input.request.provider ?? "mock-a";
  const provider = input.providers[providerName];
  if (!provider) {
    return finish(contract, { provider: providerName, refused: "unknown provider", promotion: "not_promoted" }, false, false);
  }
  let rawResult: string;
  try {
    rawResult = await provider(input.request.text);
  } catch {
    return finish(contract, { provider: providerName, refused: "provider failed", promotion: "not_promoted" }, false, false);
  }
  const modelOutput: ModelOutput = { provider: providerName, runId: contract.runId, rawResult };
  const observation = validObservation(input.observation, rawResult) ? input.observation : undefined;
  const outcome = input.outcome?.decisionId && input.outcome.outcome ? input.outcome : undefined;
  let committed = false;
  let promoted = false;
  if (outcome?.outcome === "COMMIT" && observation) {
    commits.push(outcome.decisionId);
    committed = true;
  }
  if (observation && outcome && (outcome.outcome === "REJECT" || outcome.outcome === "QUARANTINE")) {
    decisions.push({
      candidateId: `cand-${contract.runId}`,
      observationRefs: [observation.observationId],
      sourceRefs: [observation.source],
      outcome: outcome.outcome,
      decisionId: outcome.decisionId,
      timestamp: new Date().toISOString(),
    });
  }
  if (observation && outcome?.outcome === "PROMOTE") {
    memory.push({
      id: outcome.decisionId,
      content: observation.content,
      observationRefs: [observation.observationId],
      sourceRefs: [observation.source],
      promotionDecisionId: outcome.decisionId,
    });
    promoted = true;
  }
  return finish(
    contract,
    {
      provider: providerName,
      modelOutput,
      observation,
      externalOutcome: outcome?.outcome,
      roleLabel: outcome?.roleLabel,
      commitId: committed ? outcome?.decisionId : undefined,
      promotion: promoted ? "promoted" : "not_promoted",
    },
    committed,
    promoted,
  );
}

function finish(contract: Contract, fields: Omit<ExecutionRecord, "runId" | "contract">, committed: boolean, promoted: boolean): RunResult {
  const record: ExecutionRecord = Object.freeze({
    runId: contract.runId,
    contract,
    ...fields,
  });
  return { record, committed, promoted };
}
