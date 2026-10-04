/**
 * One request in. The caller does not invent an observation or an outcome.
 */
import { MemoryManager } from "../memory/memory-manager";
import { RunRequest, SliceResult, runSlice } from "./execution-slice";

export interface CallerRequest extends RunRequest {
  reply: string;
  observationId?: string;
  observationSource?: string;
  observationContent?: string;
  decisionId?: string;
  outcome?: "COMMIT" | "PROMOTE" | "REJECT" | "QUARANTINE";
}

export async function handleRequest(request: CallerRequest): Promise<SliceResult> {
  const store = new MemoryManager();
  await store.initialize();
  const observation = request.observationId && request.observationSource && request.observationContent
    ? { observation_id: request.observationId, source: request.observationSource, content: request.observationContent }
    : undefined;
  const governance = request.decisionId && request.outcome
    ? { decision_id: request.decisionId, outcome: request.outcome }
    : undefined;
  return runSlice(
    {
      request,
      model: async () => request.reply,
      observation,
      governance,
    },
    store,
  );
}
