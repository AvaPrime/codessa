/**
 * Industry names only. A pack cannot issue an outcome or turn a summary into proof.
 */
import { ExternalOutcome, Observation, OutcomeName } from "./codessa-core";

export interface RoleLabel {
  key: string;
  label: string;
}

export interface Pack {
  name: string;
  sources: Record<string, string>;
  roles: RoleLabel[];
}

export const claims: Pack = {
  name: "claims",
  sources: { adjusterReport: "adjuster-report" },
  roles: [{ key: "handler", label: "claims-handler" }],
};

export const matter: Pack = {
  name: "matter",
  sources: { pleading: "filed-pleading" },
  roles: [{ key: "lawyer", label: "responsible-lawyer" }],
};

export const chart: Pack = {
  name: "chart",
  sources: { lab: "lab-result" },
  roles: [{ key: "clinician", label: "clinician" }],
};

export function mapObservation(pack: Pack, sourceKey: string, observationId: string, content: string): Observation | undefined {
  const source = pack.sources[sourceKey];
  if (!source) return undefined;
  return { observationId, source, content };
}

export function labelRole(pack: Pack, roleKey: string): RoleLabel | undefined {
  return pack.roles.find((role) => role.key === roleKey);
}

export function attachRole(pack: Pack, roleKey: string, outcome: ExternalOutcome | undefined): ExternalOutcome | undefined {
  const role = labelRole(pack, roleKey);
  if (!role || !outcome) return undefined;
  return { ...outcome, roleLabel: role.label };
}

export function summaryIsNotObservation(pack: Pack, summary: string): Observation | undefined {
  return mapObservation(pack, "modelSummary", "OBS-SUMMARY", summary);
}

export type { OutcomeName };
