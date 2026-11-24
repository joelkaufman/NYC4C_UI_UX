import type { ModuleDef } from '@/domain/types';
import { validateSteps } from '@/domain/validation';
import { PreviewConfirmStep } from '@/modules/common/PreviewConfirmStep';
import * as Personal from './PersonalInfoStep';
import * as Addresses from './AddressesStep';
import * as Household from './HouseholdStep';
import * as Education from './EducationStep';
import * as Documents from './DocumentsStep';
import * as Sign from './SignStep';
import { signDefs, signHelper } from './esign';
import { addressHelper, documentsHelper, householdHelper, legalNameHelper } from './helpers';

export const informationModule: ModuleDef = {
  id: 'information',
  title: 'Information',
  description: 'Your personal details, address history, household, education, identity documents and employment documents to sign.',
  requiresReview: true,
  steps: [
    {
      id: 'personal',
      title: 'Personal info',
      description: 'Your name and demographics.',
      kind: 'form',
      component: Personal.PersonalInfoStep,
      schema: Personal.schema,
      helpers: [legalNameHelper],
      previewSections: Personal.previewSections,
      issues: Personal.issues,
    },
    {
      id: 'addresses',
      title: 'Addresses',
      description: 'Every address from the last 5 years.',
      kind: 'form',
      component: Addresses.AddressesStep,
      schema: Addresses.schema,
      helpers: [addressHelper],
      previewSections: Addresses.previewSections,
      issues: Addresses.issues,
    },
    {
      id: 'household',
      title: 'Household',
      description: 'Everyone who lives with you.',
      kind: 'form',
      component: Household.HouseholdStep,
      schema: Household.schema,
      helpers: [householdHelper],
      previewSections: Household.previewSections,
      issues: Household.issues,
    },
    {
      id: 'education',
      title: 'Education',
      description: 'Your education and any licenses.',
      kind: 'form',
      component: Education.EducationStep,
      schema: Education.schema,
      previewSections: Education.previewSections,
      issues: Education.issues,
    },
    {
      id: 'documents',
      title: 'Documents',
      description: 'Clear photos or scans, all four corners visible.',
      kind: 'upload',
      component: Documents.DocumentsStep,
      helpers: [documentsHelper],
      issues: Documents.issues,
    },
    {
      id: 'preview',
      title: 'Review & submit',
      description: 'Check everything, then submit your information.',
      kind: 'preview',
      component: PreviewConfirmStep,
    },
    {
      id: 'sign',
      title: 'Sign documents',
      description: 'Sign each required document, then send Information to HR.',
      kind: 'esign',
      component: Sign.SignStep,
      helpers: [signHelper],
      issues: Sign.issues,
    },
  ],
  uploadSlots: (request) => Documents.documentSlots(request),
  esignItems: () => signDefs(),
  validate(instance, request) {
    return validateSteps(informationModule, instance, request);
  },
};
