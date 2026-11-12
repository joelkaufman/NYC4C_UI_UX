import { useFormContext } from 'react-hook-form';
import type { PersonalData } from '@/domain/data';
import type { PreviewSection, StepProps } from '@/domain/types';
import { issuesFromSchema } from '@/domain/validation';
import { Section } from '@/components/shared/Section';
import { StepForm, useBind } from '@/components/shared/step-context';
import { FieldRow, MultiSelectField, SelectField, SSNField, TextField, YES_NO } from '@/components/shared/fields';
import { maskSSN } from '@/lib/format';
import {
  COUNTRIES,
  ETHNICITIES,
  EYE_COLORS,
  GENDERS,
  HAIR_COLORS,
  LANGUAGES,
  optionLabel,
  optionLabels,
  RACES,
  US_STATES,
} from '@/lib/options';
import { personalSchema } from './schema';

export { personalSchema as schema };

const DEFAULTS: PersonalData = {
  middleName: '',
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
  height: '',
  weight: '',
  eyeColor: '',
  hairColor: '',
};

export function issues(data: unknown) {
  return issuesFromSchema(personalSchema, data);
}

export function previewSections(data: unknown): PreviewSection[] {
  const d = (data ?? {}) as Partial<PersonalData>;
  return [
    {
      title: 'Name',
      items: [
        { label: 'Middle name', targetId: 'middleName', value: d.middleName },
        { label: 'Used a maiden or alias name', targetId: 'usedAlias', value: optionLabel(YES_NO, d.usedAlias) },
        ...(d.usedAlias === 'yes' ? [{ label: 'Maiden or alias names', targetId: 'aliasNames', value: d.aliasNames }] : []),
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
        { label: 'Height', targetId: 'height', value: d.height ? `${d.height} in` : '' },
        { label: 'Weight', targetId: 'weight', value: d.weight ? `${d.weight} lb` : '' },
        { label: 'Eye color', targetId: 'eyeColor', value: optionLabel(EYE_COLORS, d.eyeColor) },
        { label: 'Hair color', targetId: 'hairColor', value: optionLabel(HAIR_COLORS, d.hairColor) },
      ],
    },
  ];
}

const DEMOGRAPHIC_FIELDS = [
  'gender', 'ssn', 'stateOfBirth', 'countryOfBirth', 'countryOfCitizenship', 'ethnicity', 'race',
  'preferredLanguage', 'languagesSpoken', 'height', 'weight', 'eyeColor', 'hairColor',
];

function Fields() {
  const bind = useBind();
  const { watch } = useFormContext<PersonalData>();
  const usedAlias = watch('usedAlias');

  return (
    <>
      <Section title="Name" description="Enter your name exactly as it appears on your government ID." fields={['middleName', 'usedAlias', 'aliasNames']}>
        <FieldRow>
          <TextField {...bind('middleName')} label="Middle name" required autoComplete="additional-name" help="Enter NMN if you have no middle name." />
          <SelectField {...bind('usedAlias')} label="Have you ever used a maiden or alias name?" required options={YES_NO} />
        </FieldRow>
        <TextField
          {...bind('aliasNames')}
          label="Maiden or alias names"
          required
          hidden={usedAlias !== 'yes'}
          help="Separate more than one name with commas."
        />
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
        <FieldRow>
          <TextField {...bind('height')} label="Height (inches)" required type="number" inputMode="decimal" placeholder="For example 66" />
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
      <Fields />
    </StepForm>
  );
}
