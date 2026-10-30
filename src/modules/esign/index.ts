import type { ModuleDef } from '@/domain/types';
import { validateSteps } from '@/domain/validation';
import * as Step from './ESignStep';

export const esignModule: ModuleDef = {
  id: 'esign',
  title: 'E-sign',
  description: 'Sign your employment documents electronically.',
  requiresReview: false,
  steps: [
    {
      id: 'documents',
      title: 'Sign documents',
      description: 'Sign each required document, then finish.',
      kind: 'esign',
      component: Step.ESignStep,
      helpers: [Step.signHelper],
      issues: Step.issues,
    },
  ],
  uploadSlots: () => [],
  esignItems: (request) => Step.esignDefs(request),
  validate(instance, request) {
    return validateSteps(esignModule, instance, request);
  },
};
