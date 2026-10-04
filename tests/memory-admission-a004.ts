/**
 * A-004 matrix. Decision records are not MemoryManager entries.
 */
import { CodesssaKernel } from "../core/codessa-kernel";
import { admitToStore, clearAdmissionDecisions, listAdmissionDecisions } from "../memory/admission";
import { MemoryManager } from "../memory/memory-manager";

const candidate = {
  candidate_id: "CAND-004",
  content: "do not promote",
  observation_refs: ["OBS-A", "OBS-B"],
  source_refs: ["deployment-monitor"],
};

async function main(): Promise<void> {
  clearAdmissionDecisions();
  const manager = new MemoryManager();
  await manager.initialize();
  const rejected = await admitToStore(manager, {
    candidate,
    outcome: { decision_id: "DEC-R", candidate_id: "CAND-004", outcome: "REJECT" },
  });
  const quarantined = await admitToStore(manager, {
    candidate,
    outcome: { decision_id: "DEC-Q", candidate_id: "CAND-004", outcome: "QUARANTINE" },
  });
  const missing = await admitToStore(manager, { candidate });
  const kernel = new CodesssaKernel();
  await kernel.initialize();
  await kernel.storeMemory({
    candidate: {
      candidate_id: "CAND-P",
      content: "healthy endpoint",
      observation_refs: ["OBS-001"],
      source_refs: ["deployment-monitor"],
    },
    outcome: { decision_id: "DEC-P", candidate_id: "CAND-P", outcome: "PROMOTE" },
  });
  const promoted = await kernel.queryMemory("healthy endpoint");
  const rejectRecord = listAdmissionDecisions().find((item) => item.decision_id === "DEC-R");
  const quarantineRecord = listAdmissionDecisions().find((item) => item.decision_id === "DEC-Q");
  const report = {
    REJECT_RECORDS_NON_PROMOTION:
      !rejected.promoted &&
      (await manager.get("DEC-R")) === null &&
      rejectRecord?.outcome === "REJECT" &&
      rejectRecord.candidate_id === "CAND-004" &&
      Boolean(rejectRecord.timestamp),
    QUARANTINE_RECORDS_NON_PROMOTION:
      !quarantined.promoted &&
      (await manager.get("DEC-Q")) === null &&
      quarantineRecord?.outcome === "QUARANTINE" &&
      quarantineRecord.source_refs.join() === "deployment-monitor",
    PROMOTE_IS_NOT_A_NON_PROMOTION_RECORD:
      promoted.length === 1 &&
      promoted[0].metadata.promotion_decision_id === "DEC-P" &&
      !listAdmissionDecisions().some((item) => item.decision_id === "DEC-P"),
    MISSING_OUTCOME_DOES_NOT_INVENT_REJECT:
      !missing.promoted && !missing.decision && !listAdmissionDecisions().some((item) => item.outcome === "REJECT" && item.decision_id !== "DEC-R"),
    CONFLICT_STAYS_ON_THE_RECORD: rejectRecord?.observation_refs.join() === "OBS-A,OBS-B",
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (Object.values(report).some((passed) => !passed)) process.exitCode = 1;
  await kernel.shutdown();
}

main();
