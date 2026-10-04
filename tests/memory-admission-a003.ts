/**
 * A-003 refusal and control cases. Does not change MemoryManager.store.
 */
import { CodesssaKernel } from "../core/codessa-kernel";
import { admitToStore } from "../memory/admission";
import { MemoryManager } from "../memory/memory-manager";

const success = "Deployment succeeded.";

async function refusalStoreMemory(kernel: CodesssaKernel): Promise<boolean> {
  await kernel.storeMemory({ content: success, source: "model", run_id: "RUN-001", storeInMemory: true });
  const found = await kernel.queryMemory(success);
  return found.length === 0;
}

async function refusalExecuteTask(kernel: CodesssaKernel): Promise<boolean> {
  await (kernel as unknown as { executeTask(task: unknown): Promise<unknown> }).executeTask({
    id: "RUN-001",
    type: "reasoning",
    content: "deploy",
    agent: "Ava Prime",
    metadata: { storeInMemory: true },
  });
  const found = await kernel.queryMemory("Mock");
  const promoted = found.filter((entry) => entry.type === "promoted_memory" || entry.type === "task_result");
  return promoted.length === 0;
}

async function control(kernel: CodesssaKernel): Promise<boolean> {
  await kernel.storeMemory({
    candidate: {
      candidate_id: "CAND-001",
      content: "Successful deployment requires a healthy post-deploy endpoint.",
      observation_refs: ["OBS-001", "OBS-002"],
      source_refs: ["deployment-monitor"],
    },
    outcome: { decision_id: "DEC-001", candidate_id: "CAND-001", outcome: "PROMOTE" },
    model_result: success,
  });
  const found = await kernel.queryMemory("healthy post-deploy");
  const stored = found.find((entry) => entry.metadata?.promotion_decision_id === "DEC-001");
  return Boolean(
    stored &&
      stored.metadata.observation_refs.join() === "OBS-001,OBS-002" &&
      stored.metadata.source_refs.join() === "deployment-monitor",
  );
}

async function negativeOutcomes(): Promise<boolean> {
  const manager = new MemoryManager();
  await manager.initialize();
  const candidate = {
    candidate_id: "CAND-002",
    content: "keep both",
    observation_refs: ["OBS-A", "OBS-B"],
    source_refs: ["monitor"],
  };
  const rejected = await admitToStore(manager, {
    candidate,
    outcome: { decision_id: "DEC-R", candidate_id: "CAND-002", outcome: "REJECT" },
  });
  const quarantined = await admitToStore(manager, {
    candidate,
    outcome: { decision_id: "DEC-Q", candidate_id: "CAND-002", outcome: "QUARANTINE" },
  });
  return !rejected.promoted && !quarantined.promoted && (await manager.get("DEC-R")) === null && (await manager.get("DEC-Q")) === null;
}

async function main(): Promise<void> {
  const kernel = new CodesssaKernel();
  await kernel.initialize();
  const report = {
    refusal_storeMemory: await refusalStoreMemory(kernel),
    refusal_executeTask_storeInMemory: await refusalExecuteTask(kernel),
    control_promote: await control(kernel),
    reject_and_quarantine_do_not_store: await negativeOutcomes(),
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (Object.values(report).some((passed) => !passed)) {
    process.exitCode = 1;
  }
  await kernel.shutdown();
}

main();
