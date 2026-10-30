import { useFormContext } from 'react-hook-form';
import type { EducationData, License } from '@/domain/data';
import type { PreviewSection, StepProps } from '@/domain/types';
import { issuesFromSchema } from '@/domain/validation';
import { RepeatableList } from '@/components/shared/RepeatableList';
import { Section } from '@/components/shared/Section';
import { StepForm, useBind } from '@/components/shared/step-context';
import { DateField, FieldRow, ReadOnlyField, SelectField, TextField, type Option } from '@/components/shared/fields';
import { formatDate, uid } from '@/lib/format';
import { optionLabel, US_STATES } from '@/lib/options';
import { educationSchema } from './schema';

export { educationSchema as schema };

export const EDUCATION_LEVELS: Option[] = [
  { value: 'high_school', label: 'High school diploma or GED' },
  { value: 'some_college', label: 'Some college' },
  { value: 'associate', label: 'Associate degree' },
  { value: 'bachelor', label: 'Bachelor’s degree or higher' },
  { value: 'nursing_degree', label: 'Nursing degree (LVN, RN, BSN)' },
  { value: 'other_licensed', label: 'Other licensed profession' },
];

export function issues(data: unknown) {
  return issuesFromSchema(educationSchema, data);
}

export function previewSections(data: unknown): PreviewSection[] {
  const d = (data ?? {}) as Partial<EducationData>;
  const licenses = (d.licenses ?? []).filter(Boolean);
  return [
    {
      title: 'Education',
      items: [
        { label: 'Highest level', targetId: 'highestLevel', value: optionLabel(EDUCATION_LEVELS, d.highestLevel) },
        { label: 'School', targetId: 'school', value: d.school },
        { label: 'Field of study', value: d.fieldOfStudy },
        { label: 'Graduation year', targetId: 'graduationYear', value: d.graduationYear },
      ],
    },
    ...(licenses.length
      ? [
          {
            title: 'Licenses',
            items: licenses.map((l) => ({
              label: l.type || 'License',
              value: `${l.number} · ${l.state} · expires ${formatDate(l.expiry)}`,
              wide: true,
            })),
          },
        ]
      : []),
  ];
}

function LicenseEditor({ index }: { index: number }) {
  const bind = useBind();
  const p = `licenses.${index}`;
  return (
    <>
      <FieldRow>
        <TextField {...bind(`${p}.type`)} label="License type" required placeholder="For example Registered Nurse" />
        <TextField {...bind(`${p}.number`)} label="License number" required />
      </FieldRow>
      <FieldRow>
        <SelectField {...bind(`${p}.state`)} label="Issuing state" required options={US_STATES} />
        <DateField {...bind(`${p}.expiry`)} label="Expiry date" required />
      </FieldRow>
    </>
  );
}

function Fields() {
  const bind = useBind();
  const { watch } = useFormContext<EducationData>();
  const level = watch('highestLevel');
  const licensed = level === 'nursing_degree' || level === 'other_licensed';
  return (
    <>
      <Section title="Education" fields={['highestLevel', 'school', 'fieldOfStudy', 'graduationYear']}>
        <SelectField
          {...bind('highestLevel')}
          label="Highest level of education"
          required
          options={EDUCATION_LEVELS}
          help={licensed ? 'Licensed providers sign an attestation and upload a license copy in Training & Certificates.' : undefined}
        />
        <FieldRow>
          <TextField {...bind('school')} label="School" required={!!level && level !== 'high_school'} />
          <TextField {...bind('fieldOfStudy')} label="Field of study" />
        </FieldRow>
        <FieldRow>
          <TextField {...bind('graduationYear')} label="Graduation year" inputMode="numeric" maxLength={4} placeholder="YYYY" />
        </FieldRow>
      </Section>
      <Section
        title="Professional licenses"
        description={licensed ? 'Add the license that allows you to practice.' : 'Optional. Add any active professional licenses.'}
        fields={['licenses']}
      >
        <RepeatableList<License>
          name="licenses"
          noun="license"
          addLabel="Add license"
          emptyText={licensed ? 'No licenses added yet. Add your nursing or professional license.' : 'No licenses added.'}
          max={6}
          create={() => ({ id: uid('lic'), type: '', number: '', state: '', expiry: '' })}
          summary={(l) => ({
            title: l.type || 'New license',
            meta: [l.number, l.state, l.expiry ? `Expires ${formatDate(l.expiry)}` : null].filter(Boolean).join(' · '),
          })}
          renderEditor={(i) => <LicenseEditor index={i} />}
          renderReadOnly={(l) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField label="License type" value={l.type} />
              <ReadOnlyField label="License number" value={l.number} />
              <ReadOnlyField label="Issuing state" value={optionLabel(US_STATES, l.state)} />
              <ReadOnlyField label="Expiry date" value={formatDate(l.expiry)} />
            </div>
          )}
        />
      </Section>
    </>
  );
}

export function EducationStep({ request, instance, readOnly, step }: StepProps) {
  return (
    <StepForm
      requestId={request.id}
      moduleId={instance.id}
      stepId={step.id}
      defaults={{ highestLevel: '', school: '', fieldOfStudy: '', graduationYear: '', licenses: [] }}
      saved={instance.data[step.id]}
      readOnly={readOnly}
    >
      <Fields />
    </StepForm>
  );
}
