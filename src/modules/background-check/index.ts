import type { ModuleDef } from '@/domain/types';
import { validateSteps } from '@/domain/validation';
import * as Confirm from './ConfirmStep';

export const backgroundCheckModule: ModuleDef = {
  id: 'background_check',
  title: 'Background check',
  description: 'Confirm your details and authorize the background check.',
  requiresReview: false,
  steps: [
    {
      id: 'confirm',
      title: 'Confirm and authorize',
      description: 'Confirm your details and give consent. Results don’t hold up the next module.',
      kind: 'confirm',
      component: Confirm.ConfirmStep,
      previewSections: Confirm.previewSections,
      issues: Confirm.issues,
    },
  ],
  uploadSlots: () => [],
  esignItems: () => [],
  validate(instance, request) {
    return validateSteps(backgroundCheckModule, instance, request);
  },
};
