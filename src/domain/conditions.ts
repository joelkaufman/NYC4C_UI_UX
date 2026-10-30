import type { ModuleId, ProviderRequest } from './types';
import type { EducationData, HouseholdData, HouseholdMember, PersonalData } from './data';

/** Read a step's saved data from a request without throwing when it is absent. */
export function stepData<T>(request: ProviderRequest | undefined, moduleId: ModuleId, stepId: string): Partial<T> {
  const mod = request?.modules.find((m) => m.id === moduleId);
  return ((mod?.data[stepId] as Partial<T> | undefined) ?? {}) as Partial<T>;
}

export const getPersonal = (request: ProviderRequest) => stepData<PersonalData>(request, 'information', 'personal');
export const getHousehold = (request: ProviderRequest) => stepData<HouseholdData>(request, 'information', 'household');
export const getEducation = (request: ProviderRequest) => stepData<EducationData>(request, 'information', 'education');

/** Information › Personal: "Have you been known by another name?" */
export function hasOtherName(personal: Partial<PersonalData>): boolean {
  return personal.hasOtherName === 'yes';
}

/** Information › Personal: visa holders must give visa type and expiry. */
export function needsVisaFields(personal: Partial<PersonalData>): boolean {
  return personal.workAuth === 'visa';
}

/** Information › Documents: permanent residents and visa holders upload a work authorization document. */
export function requiresWorkAuthDocument(request: ProviderRequest): boolean {
  const wa = getPersonal(request).workAuth;
  return wa === 'permanent_resident' || wa === 'visa';
}

/** Information › Household: members who help with care need a background check consent row. */
export function householdHelpers(request: ProviderRequest): HouseholdMember[] {
  return (getHousehold(request).members ?? []).filter((m) => m.helpsWithCare);
}

/** Information › Education: licensed providers sign an attestation and upload their license. */
export function isLicensedProvider(request: ProviderRequest): boolean {
  const level = getEducation(request).highestLevel;
  return level === 'nursing_degree' || level === 'other_licensed';
}

/** E-sign: direct deposit authorization only when paid by direct deposit. */
export function usesDirectDeposit(request: ProviderRequest): boolean {
  return getPersonal(request).paymentMethod === 'direct_deposit';
}
