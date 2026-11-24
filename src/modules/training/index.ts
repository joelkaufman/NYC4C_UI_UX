import type { ModuleDef } from '@/domain/types';
import { validateSteps } from '@/domain/validation';
import { PreviewConfirmStep } from '@/modules/common/PreviewConfirmStep';
import * as Certificates from './CertificatesStep';
import * as Trainings from './TrainingsStep';

export const trainingModule: ModuleDef = {
  id: 'training',
  title: 'Training & Certificates',
  description: 'Your certificates, completed trainings and, for licensed providers, your license.',
  requiresReview: true,
  steps: [
    {
      id: 'certificates',
      title: 'Certificates',
      description: 'Each certificate with a copy.',
      kind: 'form',
      component: Certificates.CertificatesStep,
      schema: Certificates.schema,
      previewSections: Certificates.previewSections,
      issues: Certificates.issues,
    },
    {
      id: 'trainings',
      title: 'Trainings',
      description: 'At least one training, each with its certificate.',
      kind: 'form',
      component: Trainings.TrainingsStep,
      schema: Trainings.schema,
      previewSections: Trainings.previewSections,
      issues: Trainings.issues,
    },
    {
      id: 'preview',
      title: 'Submit & sign',
      description: 'Check everything, then submit to HR.',
      kind: 'preview',
      component: PreviewConfirmStep,
    },
  ],
  uploadSlots: (request) => [...Certificates.certificateSlots(request), ...Trainings.trainingSlots(request)],
  esignItems: (request) => Certificates.attestationDefs(request),
  validate(instance, request) {
    return validateSteps(trainingModule, instance, request);
  },
};
