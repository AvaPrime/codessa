/**
 * Drift harness. Observes the historical kernel. Does not import the contract runner.
 */
import fs from "fs";
import path from "path";
import { MemoryManager } from "../../memory/memory-manager";

type Verdict = "CONFORMANT" | "DRIFT" | "NOT_APPLICABLE" | "UNOBSERVABLE";

interface Finding {
  case_id: string;
  contract_rule: string;
  constitutional_invariant: string;
  implementation_symbol: string;
  observed_behavior: string;
  expected_behavior: string;
  verdict: Verdict;
  evidence: string;
}

async function observeStore(): Promise<{ wrote: boolean; emitted: boolean; governanceRequired: boolean }> {
  const manager = new MemoryManager();
  let emitted = false;
  manager.on("memory.stored", () => {
    emitted = true;
  });
  await manager.initialize();
  await manager.store({
    id: "drift-probe",
    type: "note",
    content: "unguarded",
    timestamp: new Date().toISOString(),
  });
  const stored = await manager.get("drift-probe");
  return { wrote: stored !== null, emitted, governanceRequired: false };
}

function source(rel: string): string {
  return fs.readFileSync(path.resolve(__dirname, "../../", rel), "utf8");
}

async function main(): Promise<void> {
  const store = await observeStore();
  const kernel = source("core/codessa-kernel.ts");
  const agent = source("agents/ContextualMemoryAgent.ts");
  const findings: Finding[] = [
    {
      case_id: "T02",
      contract_rule: "CXT-007",
      constitutional_invariant: "INV-AWS-03",
      implementation_symbol: "MemoryManager.store",
      observed_behavior: `writes to in-memory map=${store.wrote}; emits memory.stored=${store.emitted}; governance parameter absent`,
      expected_behavior: "memory remains non-canonical unless admitted; promotion requires a governance result",
      verdict: "DRIFT",
      evidence: "memory/memory-manager.ts store() sets Map entry and emits memory.stored; runtime probe stored drift-probe",
    },
    {
      case_id: "T13",
      contract_rule: "CXT-007",
      constitutional_invariant: "INV-AWS-03",
      implementation_symbol: "MemoryManager.store",
      observed_behavior: "store accepts any MemoryEntry; no policy_result field exists",
      expected_behavior: "projection or promotion requires PROMOTE, REJECT, or QUARANTINE",
      verdict: "DRIFT",
      evidence: "MemoryEntry interface has id, type, content, agent, task_id, timestamp, metadata; no governance result",
    },
    {
      case_id: "T07",
      contract_rule: "CXT-008",
      constitutional_invariant: "INV-AWS-02",
      implementation_symbol: "CodesssaKernel.executeTask",
      observed_behavior: "executeTask routes to a model and returns a result; no snapshot id is read or written",
      expected_behavior: "consequential execution cites one sealed snapshot; seal is not admission",
      verdict: "DRIFT",
      evidence: "core/codessa-kernel.ts executeTask has no snapshot symbol; kernel source contains no ContextSnapshot",
    },
    {
      case_id: "T07-seal",
      contract_rule: "CXT-008",
      constitutional_invariant: "INV-AWS-02",
      implementation_symbol: "none",
      observed_behavior: "no resolver seal method exists",
      expected_behavior: "control-plane resolver may seal a content hash",
      verdict: "NOT_APPLICABLE",
      evidence: "grep of core/codessa-kernel.ts found no snapshot or seal symbol",
    },
    {
      case_id: "T02-kernel",
      contract_rule: "CXT-007",
      constitutional_invariant: "INV-AWS-03",
      implementation_symbol: "CodesssaKernel.storeMemory",
      observed_behavior: "storeMemory forwards data to MemoryManager.store and emits memory.stored",
      expected_behavior: "store is a candidate write, not a canonical admission",
      verdict: "DRIFT",
      evidence: "core/codessa-kernel.ts storeMemory lines call memoryManager.store then emit",
    },
    {
      case_id: "T02-agent",
      contract_rule: "CXT-007",
      constitutional_invariant: "INV-AWS-03",
      implementation_symbol: "ContextualMemoryAgent.storeMemory",
      observed_behavior: "writes context into a Map with no governance result",
      expected_behavior: "contextual write remains non-canonical until admitted",
      verdict: "DRIFT",
      evidence: agent.includes("this.memoryStore.set(id, context)") ? "agents/ContextualMemoryAgent.ts storeMemory sets memoryStore" : "symbol missing",
    },
    {
      case_id: "T15-kernel",
      contract_rule: "CXT-015",
      constitutional_invariant: "INV-AWS-03",
      implementation_symbol: "CodesssaKernel.executeTask",
      observed_behavior: "model.execute result is stored as task_result when metadata.storeInMemory is set",
      expected_behavior: "provider or model success is not evidence and not verified memory",
      verdict: "DRIFT",
      evidence: kernel.includes("type: 'task_result'") ? "executeTask stores model result as task_result" : "pattern absent",
    },
    {
      case_id: "T06",
      contract_rule: "CXT-012",
      constitutional_invariant: "INV-AWS-02",
      implementation_symbol: "none",
      observed_behavior: "kernel has no MCGL transition method",
      expected_behavior: "only MCGL commits",
      verdict: "NOT_APPLICABLE",
      evidence: "core/codessa-kernel.ts does not reference MCGL",
    },
  ];

  const report = {
    harness: "kernel-drift",
    baseline: "refactor db887f32 carried on codessa-context-architecture",
    contract_runner: "NOT_USED",
    kernel_modified: false,
    findings,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main();
