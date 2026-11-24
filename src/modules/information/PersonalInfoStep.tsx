import { useFormContext } from 'react-hook-form';
import type { PersonalData } from '@/domain/data';
import type { PreviewSection, ProviderRequest, StepProps } from '@/domain/types';
import { issuesFromSchema } from '@/domain/validation';
import { Section } from '@/components/shared/Section';
import { StepForm, useBind } from '@/components/shared/step-context';
import { DateField, FieldRow, MultiSelectField, PhoneField, ReadOnlyField, SelectField, SSNField, TextField, YES_NO } from '@/components/shared/fields';
import { formatDate, maskSSN, todayIso } from '@/lib/format';
import {
  CONTACT_METHODS,
  COUNTRIES,
  ETHNICITIES,
  EYE_COLORS,
  GENDERS,
  HAIR_COLORS,
  LANGUAGES,
  optionLabel,
  optionLabels,
  POSITIONS,
  RACES,
  US_STATES,
} from '@/lib/options';
import { personalSchema } from './schema';

export { personalSchema as schema };

const DEFAULTS: PersonalData = {
  firstName: '',
  middleName: '',
  lastName: '',
  dob: '',
  email: '',
  primaryPhone: '',
  alternatePhone: '',
  preferredContact: '',
  usedAlias: '',
  aliasNames: '',
  gender: '',
  ssn: '',
  stateOfBirth: '',
  countryOfBirth: '',
  countryOfCitizenship: '',
  ethnicity: '',
  race: '',
  preferredLanguage: '',
  languagesSpoken: [],
  heightFeet: '',
  heightInches: '',
  weight: '',
  eyeColor: '',
  hairColor: '',
};

export function issues(data: unknown) {
  return issuesFromSchema(personalSchema, data);
}

/** "Full Name" on the sheet: read-only, built from the name parts. NMN (no middle name) is left out. */
export function fullName(d: Partial<PersonalData>) {
  const middle = d.middleName?.trim().toUpperCase() === 'NMN' ? '' : d.middleName;
  return [d.firstName, middle, d.lastName].map((p) => p?.trim()).filter(Boolean).join(' ');
}

function formatHeight(d: Partial<PersonalData>) {
  return d.heightFeet || d.heightInches ? `${d.heightFeet || 0} ft ${d.heightInches || 0} in` : '';
}

export function previewSections(data: unknown, request: ProviderRequest): PreviewSection[] {
  const d = (data ?? {}) as Partial<PersonalData>;
  const app = request.application;
  return [
    {
      title: 'Your details',
      items: [
        { label: 'First name', targetId: 'firstName', value: d.firstName },
        { label: 'Middle name', targetId: 'middleName', value: d.middleName },
        { label: 'Last name', targetId: 'lastName', value: d.lastName },
        { label: 'Full name', value: fullName(d) },
        { label: 'Date of birth', targetId: 'dob', value: formatDate(d.dob) },
        { label: 'Used a maiden or alias name', targetId: 'usedAlias', value: optionLabel(YES_NO, d.usedAlias) },
        ...(d.usedAlias === 'yes' ? [{ label: 'Maiden or alias names', targetId: 'aliasNames', value: d.aliasNames }] : []),
      ],
    },
    {
      title: 'Contact',
      items: [
        { label: 'Email', targetId: 'email', value: d.email },
        { label: 'Primary phone', targetId: 'primaryPhone', value: d.primaryPhone },
        { label: 'Alternate phone', targetId: 'alternatePhone', value: d.alternatePhone },
        { label: 'Preferred method of communication', targetId: 'preferredContact', value: optionLabel(CONTACT_METHODS, d.preferredContact) },
      ],
    },
    {
      title: 'Your application',
      items: [
        { label: 'Position', value: optionLabel(POSITIONS, app.position) },
        { label: 'Credentials', value: app.credentials },
        { label: 'Channel', value: app.channel },
        { label: 'Division', value: app.division },
      ],
    },
    {
      title: 'Demographics',
      items: [
        { label: 'Gender', targetId: 'gender', value: optionLabel(GENDERS, d.gender) },
        { label: 'Social Security number', targetId: 'ssn', value: maskSSN(d.ssn) },
        { label: 'State of birth', targetId: 'stateOfBirth', value: optionLabel(US_STATES, d.stateOfBirth) },
        { label: 'Country of birth', targetId: 'countryOfBirth', value: optionLabel(COUNTRIES, d.countryOfBirth) },
        { label: 'Country of citizenship', targetId: 'countryOfCitizenship', value: optionLabel(COUNTRIES, d.countryOfCitizenship) },
        { label: 'Ethnicity', targetId: 'ethnicity', value: optionLabel(ETHNICITIES, d.ethnicity) },
        { label: 'Race', targetId: 'race', value: optionLabel(RACES, d.race) },
        { label: 'Preferred language', targetId: 'preferredLanguage', value: optionLabel(LANGUAGES, d.preferredLanguage) },
        { label: 'Languages spoken', targetId: 'languagesSpoken', value: optionLabels(LANGUAGES, d.languagesSpoken), wide: true },
        { label: 'Height', targetId: 'heightFeet', value: formatHeight(d) },
        { label: 'Weight', targetId: 'weight', value: d.weight ? `${d.weight} lb` : '' },
        { label: 'Eye color', targetId: 'eyeColor', value: optionLabel(EYE_COLORS, d.eyeColor) },
        { label: 'Hair color', targetId: 'hairColor', value: optionLabel(HAIR_COLORS, d.hairColor) },
      ],
    },
  ];
}

const DEMOGRAPHIC_FIELDS = [
  'gender', 'ssn', 'stateOfBirth', 'countryOfBirth', 'countryOfCitizenship', 'ethnicity', 'race',
  'preferredLanguage', 'languagesSpoken', 'heightFeet', 'heightInches', 'weight', 'eyeColor', 'hairColor',
];

function Fields({ request }: { request: ProviderRequest }) {
  const bind = useBind();
  const { watch } = useFormContext<PersonalData>();
  const usedAlias = watch('usedAlias');
  const app = request.application;

  return (
    <>
      <Section
        title="Your details"
        description="Enter your name exactly as it appears on your government ID."
        fields={['firstName', 'middleName', 'lastName', 'dob', 'usedAlias', 'aliasNames']}
      >
        <FieldRow cols={3} className="sm:grid-cols-3">
          <TextField {...bind('firstName')} label="First name" required autoComplete="given-name" />
          <TextField {...bind('middleName')} label="Middle name" required autoComplete="additional-name" help="Enter NMN if you have no middle name." />
          <TextField {...bind('lastName')} label="Last name" required autoComplete="family-name" />
        </FieldRow>
        <FieldRow>
          <ReadOnlyField label="Full name" value={fullName(watch())} />
          <DateField {...bind('dob')} label="Date of birth" required max={todayIso()} />
        </FieldRow>
        <FieldRow>
          <SelectField {...bind('usedAlias')} label="Have you ever used a maiden or alias name?" required options={YES_NO} />
          <TextField
            {...bind('aliasNames')}
            label="Maiden or alias names"
            required
            hidden={usedAlias !== 'yes'}
            help="Separate more than one name with commas."
          />
        </FieldRow>
      </Section>

      <Section title="Contact" fields={['email', 'primaryPhone', 'alternatePhone', 'preferredContact']}>
        <FieldRow>
          <TextField {...bind('email')} label="Email" required type="email" inputMode="email" autoComplete="email" />
          <SelectField {...bind('preferredContact')} label="Preferred method of communication" required options={CONTACT_METHODS} />
        </FieldRow>
        <FieldRow>
          <PhoneField {...bind('primaryPhone')} label="Primary phone" required />
          <PhoneField {...bind('alternatePhone')} label="Alternate phone" required />
        </FieldRow>
      </Section>

      <Section title="Your application" description="Set by HR. Contact HR if anything here is wrong." readOnly>
        <div className="grid gap-4 sm:grid-cols-4">
          <ReadOnlyField label="Position" value={optionLabel(POSITIONS, app.position)} />
          <ReadOnlyField label="Credentials" value={app.credentials} />
          <ReadOnlyField label="Channel" value={app.channel} />
          <ReadOnlyField label="Division" value={app.division} />
        </div>
      </Section>

      <Section title="Demographics" fields={DEMOGRAPHIC_FIELDS}>
        <FieldRow>
          <SelectField {...bind('gender')} label="Gender" required options={GENDERS} />
          <SSNField {...bind('ssn')} label="Social Security number" required help="Used for payroll and your background check." />
        </FieldRow>
        <FieldRow cols={3} className="sm:grid-cols-3">
          <SelectField {...bind('stateOfBirth')} label="State of birth" required options={US_STATES} />
          <SelectField {...bind('countryOfBirth')} label="Country of birth" required options={COUNTRIES} />
          <SelectField {...bind('countryOfCitizenship')} label="Country of citizenship" required options={COUNTRIES} />
        </FieldRow>
        <FieldRow>
          <SelectField {...bind('ethnicity')} label="Ethnicity" required options={ETHNICITIES} />
          <SelectField {...bind('race')} label="Race" required options={RACES} />
        </FieldRow>
        <FieldRow>
          <SelectField {...bind('preferredLanguage')} label="Preferred language" required options={LANGUAGES} />
        </FieldRow>
        <MultiSelectField {...bind<string[]>('languagesSpoken')} label="Languages spoken" required options={LANGUAGES} help="Choose every language you speak." />
        <FieldRow cols={3} className="sm:grid-cols-3">
          <TextField {...bind('heightFeet')} label="Height (feet)" required type="number" inputMode="numeric" placeholder="For example 5" />
          <TextField {...bind('heightInches')} label="Height (inches)" required type="number" inputMode="numeric" placeholder="For example 6" />
          <TextField {...bind('weight')} label="Weight (pounds)" required type="number" inputMode="decimal" placeholder="For example 150" />
        </FieldRow>
        <FieldRow>
          <SelectField {...bind('eyeColor')} label="Eye color" required options={EYE_COLORS} />
          <SelectField {...bind('hairColor')} label="Hair color" required options={HAIR_COLORS} />
        </FieldRow>
      </Section>
    </>
  );
}

export function PersonalInfoStep({ request, instance, readOnly, step }: StepProps) {
  return (
    <StepForm requestId={request.id} moduleId={instance.id} stepId={step.id} defaults={DEFAULTS} saved={instance.data[step.id]} readOnly={readOnly}>
      <Fields request={request} />
    </StepForm>
  );
}
