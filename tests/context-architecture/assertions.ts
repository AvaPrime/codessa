import { Verdict } from "./harness";

export interface Assertion {
  pass: boolean;
  detail: string;
}

export function assertCase(expected: string, alsoExpected: string | undefined, verdict: Verdict): Assertion {
  if (verdict.canonical_transition) {
    return { pass: false, detail: "canonical transition was written" };
  }
  if (verdict.admitted) {
    return { pass: false, detail: "attempt was admitted" };
  }
  if (expected === "reject" || expected === "reject_execution" || expected === "reject_before_execution" || expected === "reject_verified") {
    if (verdict.status !== "rejected" && verdict.status !== "sealed_non_canonical") {
      return { pass: false, detail: `expected reject, got ${verdict.status}` };
    }
  }
  if (expected === "reject_mutation_require_new_snapshot" && verdict.status !== "rejected") {
    return { pass: false, detail: verdict.status };
  }
  if (expected === "authority_path_unchanged" && verdict.status !== "authority_unchanged") {
    return { pass: false, detail: verdict.status };
  }
  if (expected === "claim_contradicted_or_rejected" && verdict.status !== "contradicted" && verdict.status !== "rejected") {
    return { pass: false, detail: verdict.status };
  }
  if (expected === "reject_unless_new_snapshot_and_contract" && verdict.status !== "rejected") {
    return { pass: false, detail: verdict.status };
  }
  if (alsoExpected === "seal_is_not_canonical_admission" && verdict.canonical_transition) {
    return { pass: false, detail: "seal was treated as admission" };
  }
  if (alsoExpected === "seal_is_not_canonical_admission" && verdict.status !== "sealed_non_canonical") {
    return { pass: false, detail: "T07 did not record a non-canonical seal" };
  }
  return { pass: true, detail: verdict.reason };
}
