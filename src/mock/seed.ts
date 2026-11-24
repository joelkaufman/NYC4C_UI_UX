import type { ApplicationInfo, ESignItem, ModuleId, ModuleInstance, Provider, ProviderRequest, UploadItem } from '@/domain/types';
import type {
  AddressesData,
  BackgroundConfirmData,
  CertificatesData,
  EducationData,
  HouseholdData,
  PersonalData,
  TrainingsData,
} from '@/domain/data';
import { recomputeStatus } from '@/domain/lifecycle';

/** Demo fixture only. Not a real person. */
export const SEED_PROVIDER: Provider = { name: 'Maria Gonzalez', email: 'maria.gonzalez@example.com' };

/** Placeholder values: the sheet lists Credentials, Channel and Division without their options. */
export const SEED_APPLICATION: ApplicationInfo = { position: 'clinician', credentials: 'LMSW', channel: 'Employee referral', division: 'Outpatient Services' };

const REVIEW: Record<ModuleId, boolean> = {
  information: true,
  background_check: false,
  training: true,
  hr_review: true,
};

/** ISO date `days` before today (local). */
export function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function daysAhead(days: number): string {
  return daysAgo(-days);
}
function stamp(days: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
}

export function emptyModule(id: ModuleId, status: ModuleInstance['status'] = 'locked_future'): ModuleInstance {
  return { id, status, requiresReview: REVIEW[id], data: {}, uploads: {}, esigns: {} };
}

export function emptyRequest(id: string, createdDaysAgo = 0): ProviderRequest {
  return {
    id,
    title: 'Onboarding – Home Care Provider',
    processType: 'onboarding',
    createdAt: stamp(createdDaysAgo, 9),
    status: 'not_started',
    application: SEED_APPLICATION,
    modules: [
      emptyModule('information', 'open'),
      emptyModule('background_check'),
      emptyModule('training'),
      emptyModule('hr_review'),
    ],
  };
}

// ---------- Maria's information, shared by the seeds ----------

export function mariaPersonal(overrides: Partial<PersonalData> = {}): PersonalData {
  return {
    firstName: 'Maria',
    middleName: 'Elena',
    lastName: 'Gonzalez',
    dob: '1988-04-17',
    email: SEED_PROVIDER.email,
    primaryPhone: '(916) 555-0142',
    alternatePhone: '(916) 555-0178',
    preferredContact: 'email',
    usedAlias: 'yes',
    aliasNames: 'Maria Elena Ruiz',
    gender: 'female',
    ssn: '412-55-7316',
    stateOfBirth: 'CA',
    countryOfBirth: 'US',
    countryOfCitizenship: 'US',
    ethnicity: 'hispanic',
    race: 'white',
    preferredLanguage: 'english',
    languagesSpoken: ['english', 'spanish'],
    heightFeet: '5',
    heightInches: '4',
    weight: '138',
    eyeColor: 'brown',
    hairColor: 'black',
    ...overrides,
  };
}

/** Current address plus one previous address, together covering more than five years. */
export function mariaAddresses(): AddressesData {
  return {
    street: '2147 Alder Creek Road',
    apt: '3B',
    city: 'Sacramento',
    state: 'CA',
    zip: '95822',
    startDate: daysAgo(1310),
    previousAddresses: [{ id: 'addr_2', street: '88 Willow Bend Court', city: 'Elk Grove', state: 'CA', zip: '95758', moveIn: daysAgo(2210) }],
  };
}

export function mariaHousehold(): HouseholdData {
  return {
    members: [
      { id: 'hh_1', firstName: 'Luis', lastName: 'Gonzalez', gender: 'male', relationship: 'Spouse', dob: '1985-09-02' },
      { id: 'hh_2', firstName: 'Sofia', lastName: 'Gonzalez', gender: 'female', relationship: 'Daughter', dob: '2012-01-23' },
    ],
  };
}

export function mariaEducation(level: EducationData['highestLevel'] = 'associate'): EducationData {
  const licensed = level === 'nursing_degree' || level === 'other_licensed';
  return {
    highestLevel: level,
    school: licensed ? 'Sacramento City College, School of Nursing' : 'Cosumnes River College',
    fieldOfStudy: licensed ? 'Nursing' : 'Health Sciences',
    graduationYear: '2014',
    licenses: licensed
      ? [{ id: 'lic_1', type: 'Licensed Vocational Nurse', number: 'VN 284113', state: 'CA', expiry: daysAhead(410) }]
      : [],
  };
}

function upload(slotId: string, label: string, required: boolean, fileName: string, size: number, days: number, status: UploadItem['status'] = 'accepted', rejectionReason?: string): UploadItem {
  return { slotId, label, required, status, fileName, fileSize: size, fileType: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg', uploadedAt: stamp(days, 14), rejectionReason };
}

export function mariaInfoUploads(days: number, proof: UploadItem['status'] = 'accepted', proofReason?: string): Record<string, UploadItem> {
  return {
    photo_id: upload('photo_id', 'Government photo ID', true, 'drivers-license-front.jpg', 1_284_000, days),
    ssn_card: upload('ssn_card', 'Social Security card', true, 'social-security-card.jpg', 942_000, days),
    proof_of_address: upload('proof_of_address', 'Proof of address', true, 'smud-utility-bill.pdf', 318_000, days, proof, proofReason),
    resume: upload('resume', 'Resume', false, 'maria-gonzalez-resume.pdf', 156_000, days),
  };
}

function signed(id: string, title: string, required: boolean, days: number): ESignItem {
  return { id, title, required, status: 'signed', providerEnvelopeId: `env_seed_${id}`, signedAt: stamp(days, 11) };
}

/** The Information documents, all signed. */
export function mariaESigns(days: number): Record<string, ESignItem> {
  const items: ESignItem[] = [
    signed('employment_agreement', 'Employment Agreement', true, days),
    signed('confidentiality_hipaa', 'Confidentiality & HIPAA Acknowledgment', true, days),
    signed('direct_deposit', 'Direct Deposit Authorization', true, days),
    signed('handbook_ack', 'Handbook Acknowledgment', false, days),
  ];
  return Object.fromEntries(items.map((e) => [e.id, e]));
}

export function mariaBackground(): BackgroundConfirmData {
  return {
    fingerprintAvailability: [
      { id: 'fp_1', at: `${daysAhead(5)}T10:00` },
      { id: 'fp_2', at: `${daysAhead(7)}T14:30` },
    ],
    otherNames: 'Maria Elena Ruiz', livedOutsideState: 'no', states: '', authorize: true, helperConsents: { hh_1: true },
  };
}

export function mariaCertificates(): CertificatesData {
  return {
    certificates: [
      { id: 'cert_1', type: 'cpr', organization: 'American Red Cross', issueDate: daysAgo(300), expiryDate: daysAhead(430), otherType: '' },
      { id: 'cert_2', type: 'hha', organization: 'California Department of Public Health', issueDate: daysAgo(900), expiryDate: daysAhead(560), otherType: '' },
    ],
  };
}

export function mariaTrainings(): TrainingsData {
  return {
    trainings: [
      { id: 'trn_1', name: 'Dementia care fundamentals', provider: 'Alzheimer’s Association', completionDate: daysAgo(120), hours: '8' },
      { id: 'trn_2', name: 'Safe patient handling and transfers', provider: 'CareAcademy', completionDate: daysAgo(75), hours: '4' },
    ],
  };
}

export function mariaTrainingUploads(days: number, licensed: boolean): Record<string, UploadItem> {
  const items: UploadItem[] = [
    upload('cert_cert_1', 'CPR certificate copy', true, 'cpr-card-2026.pdf', 210_000, days),
    upload('cert_cert_2', 'HHA certificate copy', true, 'hha-certificate.pdf', 388_000, days),
    upload('trn_trn_1', 'Dementia care fundamentals certificate', true, 'dementia-care-certificate.pdf', 174_000, days),
    upload('trn_trn_2', 'Safe patient handling certificate', true, 'patient-handling-certificate.pdf', 162_000, days),
  ];
  if (licensed) items.push(upload('license_copy', 'License copy', true, 'lvn-license.pdf', 240_000, days));
  return Object.fromEntries(items.map((u) => [u.slotId, u]));
}

export function informationData(education: EducationData['highestLevel'] = 'associate', personal?: Partial<PersonalData>) {
  return {
    personal: mariaPersonal(personal),
    addresses: mariaAddresses(),
    household: mariaHousehold(),
    education: mariaEducation(education),
  };
}

// ---------- The three seed requests ----------

/** 1. In progress: Information signed and approved, Background check open with consent not yet given. */
function seedInProgress(): ProviderRequest {
  const r = emptyRequest('req_in_progress', 21);
  r.title = 'Onboarding – Home Care Provider';
  r.modules[0] = {
    ...r.modules[0],
    status: 'approved',
    dataSubmittedAt: stamp(9, 15),
    submittedAt: stamp(9, 16),
    approvedAt: stamp(6, 11),
    data: informationData('associate'),
    uploads: mariaInfoUploads(10),
    esigns: mariaESigns(9),
  };
  r.modules[1] = { ...r.modules[1], status: 'open', backgroundCheckCleared: false };
  return recomputeStatus(r);
}

const EXPIRED_PROOF = 'Proof of address is expired, please upload a document from the last 90 days';

/** 2. Needs attention: Information rejected, proof of address rejected, hair color missing. */
function seedNeedsAttention(): ProviderRequest {
  const r = emptyRequest('req_needs_attention', 12);
  r.title = 'Onboarding – Live-in Caregiver';
  r.modules[0] = {
    ...r.modules[0],
    status: 'rejected',
    rejectionMessage: EXPIRED_PROOF,
    data: informationData('associate', { hairColor: '' }),
    uploads: mariaInfoUploads(5, 'rejected', EXPIRED_PROOF),
  };
  return recomputeStatus(r);
}

/** 3. Completed: every module approved, every document signed, HR approved. */
export function seedCompleted(id = 'req_completed'): ProviderRequest {
  const r = emptyRequest(id, 140);
  r.title = 'Onboarding – Licensed Home Health Nurse';
  r.modules = [
    {
      ...r.modules[0],
      status: 'approved',
      dataSubmittedAt: stamp(130),
      submittedAt: stamp(130),
      approvedAt: stamp(127),
      data: informationData('nursing_degree'),
      uploads: mariaInfoUploads(131),
      esigns: mariaESigns(130),
    },
    { ...r.modules[1], status: 'approved', submittedAt: stamp(126), approvedAt: stamp(126), backgroundCheckCleared: true, data: { confirm: mariaBackground() } },
    {
      ...r.modules[2],
      status: 'approved',
      submittedAt: stamp(122),
      approvedAt: stamp(118),
      data: { certificates: mariaCertificates(), trainings: mariaTrainings() },
      uploads: mariaTrainingUploads(122, true),
      esigns: { licensed_attestation: signed('licensed_attestation', 'Licensed Provider Attestation', true, 122) },
    },
    { ...r.modules[3], status: 'approved', submittedAt: stamp(118), approvedAt: stamp(112) },
  ];
  return recomputeStatus(r);
}

export function buildSeedRequests(): ProviderRequest[] {
  return [seedInProgress(), seedNeedsAttention(), seedCompleted()];
}
