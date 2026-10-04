/**
 * One claims request through the pack, the kernel caller, and the record file.
 * The file does not become authority.
 */
import { mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { CodesssaKernel } from "../core/codessa-kernel";
import { listCommits, resetCore } from "./codessa-core";
import { attachRole, claims, mapObservation } from "./packs";
import { loadSnapshot, saveSnapshot } from "./record-store";

export async function runClaimsPath(file: string, reply: string, supplied?: { decisionId: string; content: string }) {
  const observation = supplied ? mapObservation(claims, "adjusterReport", "OBS-PATH", supplied.content) : undefined;
  const outcome = supplied ? attachRole(claims, "handler", { decisionId: supplied.decisionId, outcome: "COMMIT" }) : undefined;
  const kernel = new CodesssaKernel();
  const result = await kernel.runGoverned({
    request_id: "path-1",
    text: "review claim",
    context_ids: ["policy"],
    allowed_actions: ["read_file"],
    action: "read_file",
    reply,
    observationId: observation?.observationId,
    observationSource: observation?.source,
    observationContent: observation?.content,
    decisionId: outcome?.decisionId,
    outcome: outcome?.outcome,
  });
  await saveSnapshot(file, { commits: result.committed && outcome ? [outcome.decisionId] : [], memory: [], decisions: [] });
  return result;
}

export async function tempFile(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "codessa-path-"));
  return join(dir, "records.json");
}

export { listCommits, loadSnapshot, resetCore };
