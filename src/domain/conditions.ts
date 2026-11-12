import type { ModuleId, ProviderRequest } from './types';
import { parseDate } from '@/lib/format';
import type { EducationData, HouseholdData, HouseholdMember, PersonalData } from './data';

/** Read a step's saved data from a request without throwing when it is absent. */
export function stepData<T>(request: ProviderRequest | undefined, moduleId: ModuleId, stepId: string): Partial<T> {
  const mod = request?.modules.find((m) => m.id === moduleId);
  return ((mod?.data[stepId] as Partial<T> | undefined) ?? {}) as Partial<T>;
}

export const getPersonal = (request: ProviderRequest) => stepData<PersonalData>(request, 'information', 'personal');
export const getHousehold = (request: ProviderRequest) => stepData<HouseholdData>(request, 'information', 'household');
export const getEducation = (request: ProviderRequest) => stepData<EducationData>(request, 'information', 'education');

/** Information › Documents: anyone who is not a U.S. citizen uploads a work authorization document. */
export function requiresWorkAuthDocument(request: ProviderRequest): boolean {
  const country = getPersonal(request).countryOfCitizenship;
  return !!country && country !== 'US';
}

/** Information › Household: members aged 18 or older need a background check consent row. */
export function householdAdults(request: ProviderRequest, today = new Date()): HouseholdMember[] {
  const cutoff = new Date(today);
  cutoff.setFullYear(today.getFullYear() - 18);
  return (getHousehold(request).members ?? []).filter((m) => {
    const dob = parseDate(m?.dob);
    return !!dob && dob <= cutoff;
  });
}

/** Information › Education: licensed providers sign an attestation and upload their license. */
export function isLicensedProvider(request: ProviderRequest): boolean {
  const level = getEducation(request).highestLevel;
  return level === 'nursing_degree' || level === 'other_licensed';
}
