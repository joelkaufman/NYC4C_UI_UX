import type { HouseholdData, HouseholdMember } from '@/domain/data';
import type { PreviewSection, StepProps } from '@/domain/types';
import { issuesFromSchema } from '@/domain/validation';
import { RepeatableList } from '@/components/shared/RepeatableList';
import { Section } from '@/components/shared/Section';
import { StepForm, useBind } from '@/components/shared/step-context';
import { DateField, FieldRow, ReadOnlyField, SelectField, TextField } from '@/components/shared/fields';
import { formatDate, todayIso, uid } from '@/lib/format';
import { GENDERS, optionLabel } from '@/lib/options';
import { householdSchema } from './schema';

export { householdSchema as schema };

export const memberName = (m: Partial<HouseholdMember>) => [m.firstName, m.lastName].filter(Boolean).join(' ');

export function issues(data: unknown) {
  return issuesFromSchema(householdSchema, data);
}

export function previewSections(data: unknown): PreviewSection[] {
  const list = ((data as Partial<HouseholdData> | undefined)?.members ?? []).filter(Boolean);
  return [
    {
      title: 'Household members',
      items: list.length
        ? list.map((m) => ({
            label: m.relationship || 'Member',
            value: [memberName(m), optionLabel(GENDERS, m.gender), m.dob ? `born ${formatDate(m.dob)}` : null].filter(Boolean).join(', '),
            wide: true,
          }))
        : [{ label: 'Household', value: 'No household members', wide: true }],
    },
  ];
}

function MemberEditor({ index }: { index: number }) {
  const bind = useBind();
  const p = `members.${index}`;
  return (
    <>
      <FieldRow>
        <TextField {...bind(`${p}.firstName`)} label="First name" required />
        <TextField {...bind(`${p}.lastName`)} label="Last name" required />
      </FieldRow>
      <FieldRow cols={3} className="sm:grid-cols-3">
        <SelectField {...bind(`${p}.gender`)} label="Gender" required options={GENDERS} />
        <DateField {...bind(`${p}.dob`)} label="Date of birth" required max={todayIso()} />
        <TextField {...bind(`${p}.relationship`)} label="Relationship" required placeholder="For example Daughter" />
      </FieldRow>
    </>
  );
}

function Fields() {
  return (
    <Section title="Household members" description="Everyone who lives with you. Leave the list empty if you live alone." fields={['members']}>
      <RepeatableList<HouseholdMember>
        name="members"
        noun="member"
        addLabel="Add household member"
        emptyText="No household members added."
        max={12}
        create={() => ({ id: uid('hh'), firstName: '', lastName: '', gender: '', dob: '', relationship: '' })}
        summary={(m) => ({
          title: memberName(m) || 'New household member',
          meta: [m.relationship, m.dob ? `Born ${formatDate(m.dob)}` : null].filter(Boolean).join(' · '),
        })}
        renderEditor={(i) => <MemberEditor index={i} />}
        renderReadOnly={(m) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <ReadOnlyField label="First name" value={m.firstName} />
            <ReadOnlyField label="Last name" value={m.lastName} />
            <ReadOnlyField label="Gender" value={optionLabel(GENDERS, m.gender)} />
            <ReadOnlyField label="Date of birth" value={formatDate(m.dob)} />
            <ReadOnlyField label="Relationship" value={m.relationship} />
          </div>
        )}
      />
    </Section>
  );
}

export function HouseholdStep({ request, instance, readOnly, step }: StepProps) {
  return (
    <StepForm requestId={request.id} moduleId={instance.id} stepId={step.id} defaults={{ members: [] }} saved={instance.data[step.id]} readOnly={readOnly}>
      <Fields />
    </StepForm>
  );
}
