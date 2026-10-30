/** Plain data shapes stored per step, keyed by step id inside ModuleInstance.data. */

export type YesNo = 'yes' | 'no';

export interface PersonalData {
  firstName: string;
  middleName?: string;
  lastName: string;
  hasOtherName: YesNo | '';
  previousName?: string;
  dob: string;
  ssn: string;
  gender?: string;
  email: string;
  mobile: string;
  homePhone?: string;
  preferredContact: 'email' | 'mobile' | 'home' | '';
  workAuth: 'citizen' | 'permanent_resident' | 'visa' | '';
  visaType?: string;
  visaExpiry?: string;
  paymentMethod: 'direct_deposit' | 'check' | '';
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
}

export interface Address {
  id: string;
  type: 'home' | 'mailing' | 'previous' | '';
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  from: string;
  to?: string;
  current: boolean;
}

export interface AddressesData {
  addresses: Address[];
}

export interface HouseholdMember {
  id: string;
  name: string;
  relationship: string;
  dob: string;
  livesWithYou: boolean;
  helpsWithCare?: boolean;
}

export interface HouseholdData {
  members: HouseholdMember[];
  livesAlone: boolean;
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

export interface BackgroundConfirmData {
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
