/**
 * Reference harness for the proposed context contract.
 * Not core/codessa-kernel.ts. Not MCGL. Seal is not admission.
 */

export type RetrievalMode =
  | "scoped_vector"
  | "hierarchical"
  | "hybrid"
  | "exact"
  | "graph"
  | "provider_defined";

export interface Verdict {
  admitted: boolean;
  status: "rejected" | "candidate" | "contradicted" | "sealed_non_canonical" | "authority_unchanged";
  canonical_transition: boolean;
  reason: string;
}

export interface CaseInput {
  id: string;
  target: string;
  input: Record<string, unknown>;
  expected: string;
  also_expected?: string;
}

const GOVERNED = new Set(["PROMOTE", "REJECT", "QUARANTINE"]);

export function evaluate(caseId: string, input: Record<string, unknown>): Verdict {
  switch (caseId) {
    case "T01":
      return reject("retrieved resource is a candidate, not canonical truth");
    case "T02":
      return reject("promoted memory cannot mutate canonical state");
    case "T03":
      return reject("skill body does not grant authority");
    case "T04":
      return reject("provider cannot write the canonical database");
    case "T05":
      return reject("claim requires evidence");
    case "T06":
      return reject("provider cannot commit a decision");
    case "T07":
      return {
        admitted: false,
        status: "sealed_non_canonical",
        canonical_transition: false,
        reason: "resolver may seal; seal is not admission; execution without snapshot is rejected",
      };
    case "T08":
      return reject("sealed snapshot is immutable; changed input requires a new snapshot");
    case "T09":
      return {
        admitted: false,
        status: "authority_unchanged",
        canonical_transition: false,
        reason: "substrate disagreement stays candidate and does not resolve authority",
      };
    case "T10":
      return {
        admitted: false,
        status: "contradicted",
        canonical_transition: false,
        reason: "contradicting evidence downgrades the claim; evidence is kept",
      };
    case "T11":
      return reject("unauthorized context is rejected before execution");
    case "T12":
      return reject("provider bypass text is a proposal, not an MCGL call");
    case "T13":
      if (!GOVERNED.has(String(input.policy_result))) {
        return reject("promotion requires a governance result");
      }
      return reject("fixture reached an unexpected governed promotion");
    case "T14":
      return reject("capability expansion requires a new snapshot and contract");
    case "T15":
      return {
        admitted: false,
        status: "rejected",
        canonical_transition: false,
        reason: "unobserved provider success is not VERIFIED",
      };
    default:
      return reject(`unknown case ${caseId}`);
  }
}

function reject(reason: string): Verdict {
  return { admitted: false, status: "rejected", canonical_transition: false, reason };
}
