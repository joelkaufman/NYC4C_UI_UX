import type { ModuleDef, ModuleId } from './types';
import { informationModule } from '@/modules/information';
import { backgroundCheckModule } from '@/modules/background-check';
import { esignModule } from '@/modules/esign';
import { trainingModule } from '@/modules/training';
import { hrReviewModule } from '@/modules/hr-review';

/** Ordered modules per process type. The shell (sidebar, step path, footer) is generic over this. */
export const PROCESS_REGISTRY: Record<'onboarding', ModuleDef[]> = {
  onboarding: [informationModule, backgroundCheckModule, esignModule, trainingModule, hrReviewModule],
};

const byId = new Map<ModuleId, ModuleDef>(PROCESS_REGISTRY.onboarding.map((m) => [m.id, m]));

export function getModuleDef(id: ModuleId): ModuleDef {
  const def = byId.get(id);
  if (!def) throw new Error(`Unknown module ${id}`);
  return def;
}

if (import.meta.env.DEV) {
  // MODULE_TITLES is a light copy for the request list; warn if it drifts from the registry.
  import('./module-titles').then(({ MODULE_TITLES }) => {
    for (const def of PROCESS_REGISTRY.onboarding) {
      if (MODULE_TITLES[def.id] !== def.title) console.warn(`MODULE_TITLES.${def.id} is out of sync with the registry`);
    }
  });
}
