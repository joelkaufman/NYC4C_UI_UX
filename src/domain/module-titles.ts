import type { ModuleId } from './types';

/**
 * Module display titles without the step components, so light screens
 * (the request list) don't pull in every form and the validation library.
 * Keep in sync with the `title` of each ModuleDef in the registry.
 */
export const MODULE_TITLES: Record<ModuleId, string> = {
  information: 'Information',
  background_check: 'Background check',
  training: 'Training & Certificates',
  hr_review: 'HR review',
};
