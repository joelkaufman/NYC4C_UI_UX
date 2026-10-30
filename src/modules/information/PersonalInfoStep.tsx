import { useFormContext } from 'react-hook-form';
import type { PersonalData } from '@/domain/data';
import type { PreviewSection, StepProps } from '@/domain/types';
import { issuesFromSchema } from '@/domain/validation';
import { Section } from '@/components/shared/Section';
import { StepForm, useBind } from '@/components/shared/step-context';
import {
  DateField,
  FieldRow,
  PhoneField,
  RadioGroupField,
  SelectField,
  SSNField,
  TextField,
  YES_NO,
  type Option,
} from '@/components/shared/fields';
import { formatDate, maskSSN } from '@/lib/format';
import { optionLabel } from '@/lib/options';
import { personalSchema } from './schema';

export { personalSchema as schema };

export const GENDERS: Option[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'nonbinary', label: 'Non-binary' },
  { value: 'not_listed', label: 'Not listed' },
  { value: 'prefer_not', label: 'Prefer not to say' },
];
export const CONTACT_METHODS: Option[] = [
  { value: 'mobile', label: 'Mobile phone' },
  { value: 'email', label: 'Email' },
  { value: 'home', label: 'Home phone' },
];
export const WORK_AUTH: Option[] = [
  { value: 'citizen', label: 'U.S. citizen' },
  { value: 'permanent_resident', label: 'Permanent resident' },
  { value: 'visa', label: 'Visa holder' },
];
export const PAYMENT: Option[] = [
  { value: 'direct_deposit', label: 'Direct deposit' },
  { value: 'check', label: 'Paper check' },
];

const DEFAULTS: PersonalData = {
  firstName: '',
  middleName: '',
  lastName: '',
  hasOtherName: '',
  previousName: '',
  dob: '',
  ssn: '',
  gender: '',
  email: '',
  mobile: '',
  homePhone: '',
  preferredContact: '',
  workAuth: '',
  visaType: '',
  visaExpiry: '',
  paymentMethod: '',
  emergencyName: '',
  emergencyRelationship: '',
  emergencyPhone: '',
};

export function issues(data: unknown) {
  return issuesFromSchema(personalSchema, data);
}

export function previewSections(data: unknown): PreviewSection[] {
  const d = (data ?? {}) as Partial<PersonalData>;
  const name = [d.firstName, d.middleName, d.lastName].filter(Boolean).join(' ');
  return [
    {
      title: 'Identity',
      items: [
        { label: 'Legal name', targetId: 'firstName', value: name },
        ...(d.hasOtherName === 'yes' ? [{ label: 'Previous legal name', targetId: 'previousName', value: d.previousName }] : [{ label: 'Known by another name', targetId: 'hasOtherName', value: optionLabel(YES_NO, d.hasOtherName) }]),
        { label: 'Date of birth', targetId: 'dob', value: formatDate(d.dob) },
        { label: 'Social Security number', targetId: 'ssn', value: maskSSN(d.ssn) },
        { label: 'Gender', value: optionLabel(GENDERS, d.gender) },
      ],
    },
    {
      title: 'Contact',
      items: [
        { label: 'Email', targetId: 'email', value: d.email },
        { label: 'Mobile phone', targetId: 'mobile', value: d.mobile },
        { label: 'Home phone', targetId: 'homePhone', value: d.homePhone },
        { label: 'Preferred contact', targetId: 'preferredContact', value: optionLabel(CONTACT_METHODS, d.preferredContact) },
      ],
    },
    {
      title: 'Work authorization',
      items: [
        { label: 'Status', targetId: 'workAuth', value: optionLabel(WORK_AUTH, d.workAuth) },
        ...(d.workAuth === 'visa'
          ? [
              { label: 'Visa type', targetId: 'visaType', value: d.visaType },
              { label: 'Visa expiry', targetId: 'visaExpiry', value: formatDate(d.visaExpiry) },
            ]
          : []),
      ],
    },
    { title: 'Payment', items: [{ label: 'Payment method', targetId: 'paymentMethod', value: optionLabel(PAYMENT, d.paymentMethod) }] },
    {
      title: 'Emergency contact',
      items: [
        { label: 'Name', targetId: 'emergencyName', value: d.emergencyName },
        { label: 'Relationship', targetId: 'emergencyRelationship', value: d.emergencyRelationship },
        { label: 'Phone', targetId: 'emergencyPhone', value: d.emergencyPhone },
      ],
    },
  ];
}

function Fields() {
  const bind = useBind();
  const { watch } = useFormContext<PersonalData>();
  const hasOtherName = watch('hasOtherName');
  const workAuth = watch('workAuth');
  const payment = watch('paymentMethod');

  return (
    <>
      <Section
        title="Identity"
        description="Enter your name exactly as it appears on your government ID."
        fields={['firstName', 'middleName', 'lastName', 'hasOtherName', 'previousName', 'dob', 'ssn', 'gender']}
      >
        <FieldRow cols={3} className="sm:grid-cols-3">
          <TextField {...bind('firstName')} label="First name" required autoComplete="given-name" />
          <TextField {...bind('middleName')} label="Middle name" autoComplete="additional-name" />
          <TextField {...bind('lastName')} label="Last name" required autoComplete="family-name" />
        </FieldRow>
        <RadioGroupField {...bind('hasOtherName')} label="Have you been known by another name?" required options={YES_NO} help="For example a maiden name or a name before a legal change." />
        <TextField {...bind('previousName')} label="Previous legal name" required hidden={hasOtherName !== 'yes'} />
        <FieldRow>
          <DateField {...bind('dob')} label="Date of birth" required max={new Date().toISOString().slice(0, 10)} />
          <SSNField {...bind('ssn')} label="Social Security number" required help="Used for payroll and your background check." />
        </FieldRow>
        <FieldRow>
          <SelectField {...bind('gender')} label="Gender" options={GENDERS} placeholder="Optional" />
        </FieldRow>
      </Section>

      <Section title="Contact" fields={['email', 'mobile', 'homePhone', 'preferredContact']}>
        <TextField {...bind('email')} label="Email" type="email" required autoComplete="email" inputMode="email" />
        <FieldRow>
          <PhoneField {...bind('mobile')} label="Mobile phone" required autoComplete="tel-national" />
          <PhoneField {...bind('homePhone')} label="Home phone" />
        </FieldRow>
        <RadioGroupField {...bind('preferredContact')} label="Preferred way to contact you" required options={CONTACT_METHODS} />
      </Section>

      <Section
        title="Work authorization"
        description={
          workAuth === 'permanent_resident' || workAuth === 'visa'
            ? 'You will be asked to upload a work authorization document in the Documents step.'
            : undefined
        }
        fields={['workAuth', 'visaType', 'visaExpiry']}
      >
        <RadioGroupField {...bind('workAuth')} label="Work authorization status" required options={WORK_AUTH} />
        {workAuth === 'visa' ? (
          <FieldRow>
            <TextField {...bind('visaType')} label="Visa type" required placeholder="For example H-1B" />
            <DateField {...bind('visaExpiry')} label="Visa expiry date" required />
          </FieldRow>
        ) : null}
      </Section>

      <Section
        title="Payment"
        description={payment === 'direct_deposit' ? 'You will sign a direct deposit authorization in the E-sign module.' : undefined}
        fields={['paymentMethod']}
      >
        <RadioGroupField {...bind('paymentMethod')} label="How do you want to be paid?" required options={PAYMENT} />
      </Section>

      <Section title="Emergency contact" description="Someone we can call if something happens while you are working." fields={['emergencyName', 'emergencyRelationship', 'emergencyPhone']}>
        <FieldRow>
          <TextField {...bind('emergencyName')} label="Full name" required autoComplete="off" />
          <TextField {...bind('emergencyRelationship')} label="Relationship" required placeholder="For example Spouse" />
        </FieldRow>
        <FieldRow>
          <PhoneField {...bind('emergencyPhone')} label="Phone" required autoComplete="off" />
        </FieldRow>
      </Section>
    </>
  );
}

export function PersonalInfoStep({ request, instance, readOnly, step }: StepProps) {
  return (
    <StepForm requestId={request.id} moduleId={instance.id} stepId={step.id} defaults={DEFAULTS} saved={instance.data[step.id]} readOnly={readOnly}>
      <Fields />
    </StepForm>
  );
}
