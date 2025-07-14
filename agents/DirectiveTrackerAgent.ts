// src/agents/DirectiveTrackerAgent.ts
import { DirectiveRegistry } from '../registry';
import { updateDirectiveStatus } from '../tools/statusManager';

export const DirectiveTrackerAgent = async () => {
  const directives = await DirectiveRegistry.getAll();
  for (const directive of directives) {
    const result = await checkDirectiveStatus(directive);
    await updateDirectiveStatus(directive.id, result);
  }
};
