// src/agents/DirectiveTrackerAgent.ts
import { DirectiveRegistry } from '../registry/DirectiveRegistry';
import { updateDirectiveStatus, checkDirectiveStatus } from '../tools/statusManager';

export const DirectiveTrackerAgent = async () => {
  const registry = new DirectiveRegistry();
  const directives = registry.getAllDirectives();
  for (const directive of directives) {
    const result = checkDirectiveStatus(directive.id);
    updateDirectiveStatus(directive.id, result || 'unknown');
  }
};
