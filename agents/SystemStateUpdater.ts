// src/agents/SystemStateUpdater.ts
import { collectSystemStats } from '../tools/diagnostics';
import { writeManifest } from '../tools/manifestWriter';

export const SystemStateUpdater = async () => {
  const state = await collectSystemStats();
  await writeManifest(state, './system_manifest.json');
};
