/**
 * Data-driven conformance runner for the proposed context contract.
 * Implementation drift is not run here.
 */
import fs from "fs";
import path from "path";
import { evaluate } from "./harness";
import { assertCase } from "./assertions";

interface CaseFile {
  cases: Array<{
    id: string;
    target: string;
    expected: string;
    also_expected?: string;
    input: Record<string, unknown>;
  }>;
}

function loadCases(): CaseFile {
  const file = path.resolve(__dirname, "../../fixtures/cases.json");
  return JSON.parse(fs.readFileSync(file, "utf8")) as CaseFile;
}

function main(): void {
  const cases = loadCases().cases;
  const results = cases.map((item) => {
    const verdict = evaluate(item.id, item.input);
    const assertion = assertCase(item.expected, item.also_expected, verdict);
    return { id: item.id, target: item.target, pass: assertion.pass, detail: assertion.detail };
  });
  const failed = results.filter((item) => !item.pass);
  const report = {
    branch_status: "PROPOSED",
    harness: "proposed-context-contract",
    kernel: "NOT_RUN",
    verdicts: {
      context_contract: failed.length === 0 ? "PASS" : "FAIL",
      constitutional_conformance: failed.length === 0 ? "PASS" : "FAIL",
      implementation_drift: "NOT_RUN",
    },
    cases: results,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main();
