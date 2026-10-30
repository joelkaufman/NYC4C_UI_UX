import type { ModuleDef } from '@/domain/types';
import { validateSteps } from '@/domain/validation';
import { StatusStep } from './StatusStep';

export const hrReviewModule: ModuleDef = {
  id: 'hr_review',
  title: 'HR review',
  description: 'HR verifies your complete file.',
  requiresReview: true,
  steps: [{ id: 'status', title: 'Status', description: 'HR reviews everything you submitted.', kind: 'custom', component: StatusStep }],
  uploadSlots: () => [],
  esignItems: () => [],
  validate(instance, request) {
    return validateSteps(hrReviewModule, instance, request);
  },
};
