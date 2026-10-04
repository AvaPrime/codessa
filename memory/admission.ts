/**
 * A-003 admission gate. It does not create or validate a governance outcome.
 * MemoryManager.store remains a map write.
 */

export type AdmissionOutcome = "PROMOTE" | "REJECT" | "QUARANTINE";

export interface MemoryCandidate {
  candidate_id: string;
  content: unknown;
  observation_refs: string[];
  source_refs: string[];
}

export interface GovernanceOutcome {
  decision_id: string;
  candidate_id: string;
  outcome: AdmissionOutcome;
}

export interface AdmissionRequest {
  candidate?: MemoryCandidate;
  outcome?: GovernanceOutcome;
  model_result?: unknown;
}

export interface AdmissionResult {
  promoted: boolean;
  reason: string;
  record?: {
    id: string;
    type: string;
    content: unknown;
    timestamp: string;
    metadata: {
      observation_refs: string[];
      source_refs: string[];
      promotion_decision_id: string;
      candidate_id: string;
    };
  };
}

const OUTCOMES = new Set(["PROMOTE", "REJECT", "QUARANTINE"]);

export function admit(request: AdmissionRequest | null | undefined): AdmissionResult {
  if (!request || !request.candidate || !request.candidate.candidate_id) {
    return { promoted: false, reason: "missing candidate" };
  }
  const observations = request.candidate.observation_refs;
  if (!Array.isArray(observations) || observations.length === 0 || observations.some((ref) => !ref)) {
    return { promoted: false, reason: "missing observation" };
  }
  const sources = request.candidate.source_refs;
  if (!Array.isArray(sources) || sources.length === 0 || sources.some((ref) => !ref)) {
    return { promoted: false, reason: "missing source" };
  }
  const outcome = request.outcome;
  if (!outcome || !outcome.decision_id || !OUTCOMES.has(outcome.outcome)) {
    return { promoted: false, reason: "missing or forged outcome" };
  }
  if (outcome.candidate_id !== request.candidate.candidate_id) {
    return { promoted: false, reason: "outcome does not name candidate" };
  }
  if (outcome.outcome !== "PROMOTE") {
    return { promoted: false, reason: outcome.outcome };
  }
  return {
    promoted: true,
    reason: "PROMOTE",
    record: {
      id: outcome.decision_id,
      type: "promoted_memory",
      content: request.candidate.content,
      timestamp: new Date().toISOString(),
      metadata: {
        observation_refs: [...observations],
        source_refs: [...sources],
        promotion_decision_id: outcome.decision_id,
        candidate_id: request.candidate.candidate_id,
      },
    },
  };
}

export async function admitToStore(
  store: { store(data: any): Promise<void> },
  request: AdmissionRequest | null | undefined,
): Promise<AdmissionResult> {
  const result = admit(request);
  if (result.promoted && result.record) {
    await store.store(result.record);
  }
  return result;
}
