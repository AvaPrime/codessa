/**
 * File snapshot of records. Loading does not commit or promote.
 */
import { readFile, writeFile } from "fs/promises";
import { DecisionRecord, MemoryRecord } from "./codessa-core";

export interface RecordSnapshot {
  commits: string[];
  memory: MemoryRecord[];
  decisions: DecisionRecord[];
}

export async function saveSnapshot(file: string, snapshot: RecordSnapshot): Promise<void> {
  await writeFile(file, JSON.stringify(snapshot, null, 2));
}

export async function loadSnapshot(file: string): Promise<RecordSnapshot> {
  const raw = await readFile(file, "utf8");
  const parsed = JSON.parse(raw) as RecordSnapshot;
  return {
    commits: [...parsed.commits],
    memory: parsed.memory.map((item) => ({ ...item })),
    decisions: parsed.decisions.map((item) => ({ ...item })),
  };
}
