// src/agents/SystemStateUpdater.ts
import { collectSystemStats } from '../tools/diagnostics';
import { writeManifest, createManifest } from '../tools/manifestWriter';

export const SystemStateUpdater = async () => {
  const stats = collectSystemStats();
  const manifest = createManifest(
    '1.0.0',
    'active',
    { systemStats: stats },
    { updatedBy: 'SystemStateUpdater' }
  );
  writeManifest(manifest);
};
