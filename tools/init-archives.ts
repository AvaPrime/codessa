import { mkdir } from 'fs/promises';
import path from 'path';

const ARCHIVE_STRUCTURE = [
  'raw_potential',
  'processed',
  'assimilated'
];

async function initializeArchives() {
  for (const dir of ARCHIVE_STRUCTURE) {
    await mkdir(path.join(process.cwd(), 'archives', dir), { recursive: true });
  }
  
  // Create initial intake manifest
  const initialManifest = {
    archive_version: '1.0.0',
    last_updated: new Date().toISOString(),
    total_projects: 0,
    projects: [],
    processing_queue: [],
    integration_roadmap: {
      phase_1: [],
      phase_2: [],
      phase_3: []
    }
  };

  const fs = require('fs');
  fs.writeFileSync(
    path.join(process.cwd(), 'archives', 'raw_potential', 'intake_manifest.json'),
    JSON.stringify(initialManifest, null, 2)
  );
}

initializeArchives().catch(console.error);
