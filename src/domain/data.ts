/** Plain data shapes stored per step, keyed by step id inside ModuleInstance.data. */

export type YesNo = 'yes' | 'no';

/** Information › Personal info: the sheet's "Onboarding Information" and "Demographics" fields. */
export interface PersonalData {
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string;
  email: string;
  primaryPhone: string;
  alternatePhone: string;
  preferredContact: 'phone' | 'email' | '';
  usedAlias: YesNo | '';
  aliasNames?: string;
  gender: 'male' | 'female' | '';
  ssn: string;
  stateOfBirth: string;
  countryOfBirth: string;
  countryOfCitizenship: string;
  ethnicity: string;
  race: string;
  preferredLanguage: string;
  languagesSpoken: string[];
  /** Height is entered as whole feet plus the remaining inches (0–11). */
  heightFeet: string;
  heightInches: string;
  /** Pounds. */
  weight: string;
  eyeColor: string;
  hairColor: string;
}

/** One previous address. Its move-out date is derived from the next newer address's move-in date. */
export interface PreviousAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  moveIn: string;
}

/** Information › Addresses: current address plus the previous-addresses subform. */
export interface AddressesData {
  street: string;
  apt?: string;
  city: string;
  state: string;
  zip: string;
  /** Date the provider started living at the current address. */
  startDate: string;
  previousAddresses: PreviousAddress[];
}

/** Dated address period, used to draw the address timeline. */
export interface Address {
  id: string;
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  from: string;
  to?: string;
  current: boolean;
}

export interface HouseholdMember {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | '';
  dob: string;
  relationship: string;
}

export interface HouseholdData {
  members: HouseholdMember[];
}

export interface License {
  id: string;
  type: string;
  number: string;
  state: string;
  expiry: string;
}

export interface EducationData {
  highestLevel: 'high_school' | 'some_college' | 'associate' | 'bachelor' | 'nursing_degree' | 'other_licensed' | '';
  school?: string;
  fieldOfStudy?: string;
  graduationYear?: string;
  licenses: License[];
}

/** One date and time the provider can attend a fingerprint appointment (`YYYY-MM-DDTHH:mm`, local). */
export interface FingerprintSlot {
  id: string;
  at: string;
}

export interface BackgroundConfirmData {
  /** Fingerprint availability subform: one to three options. */
  fingerprintAvailability: FingerprintSlot[];
  otherNames?: string;
  livedOutsideState: YesNo | '';
  states?: string;
  authorize: boolean;
  helperConsents: Record<string, boolean>;
}

export interface Certificate {
  id: string;
  type: 'cpr' | 'first_aid' | 'cna' | 'hha' | 'other' | '';
  otherType?: string;
  organization: string;
  issueDate: string;
  expiryDate: string;
}

export interface CertificatesData {
  certificates: Certificate[];
}

export interface Training {
  id: string;
  name: string;
  provider: string;
  completionDate: string;
  hours: string;
}

export interface TrainingsData {
  trainings: Training[];
}
