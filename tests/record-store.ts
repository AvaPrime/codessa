import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { listCommits, listMemory, resetCore, run } from "../runtime/codessa-core";
import { loadSnapshot, saveSnapshot } from "../runtime/record-store";

async function main(): Promise<void> {
  resetCore();
  const dir = await mkdtemp(join(tmpdir(), "codessa-store-"));
  const file = join(dir, "records.json");
  const committed = await run({
    request: { requestId: "store", text: "read", contextIds: ["file"], allowedActions: ["read"], action: "read" },
    providers: { "mock-a": async () => "The claim is covered." },
    observation: { observationId: "OBS-S", source: "adjuster-report", content: "Roof damage confirmed." },
    outcome: { decisionId: "DEC-S", outcome: "COMMIT" },
  });
  await saveSnapshot(file, { commits: listCommits(), memory: listMemory(), decisions: [] });
  resetCore();
  const loaded = await loadSnapshot(file);
  const report = {
    file_keeps_commit_id: loaded.commits.includes("DEC-S"),
    load_does_not_commit: listCommits().length === 0 && committed.committed === true,
    load_does_not_promote: listMemory().length === 0,
  };
  await rm(dir, { recursive: true, force: true });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (Object.values(report).some((ok) => !ok)) process.exitCode = 1;
}

main();
