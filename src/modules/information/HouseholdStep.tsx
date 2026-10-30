import { useFormContext } from 'react-hook-form';
import type { HouseholdData, HouseholdMember } from '@/domain/data';
import type { PreviewSection, StepProps } from '@/domain/types';
import { issuesFromSchema } from '@/domain/validation';
import { RepeatableList } from '@/components/shared/RepeatableList';
import { Section } from '@/components/shared/Section';
import { StepForm, useBind } from '@/components/shared/step-context';
import { CheckboxField, DateField, FieldRow, RadioGroupField, ReadOnlyField, TextField, YES_NO } from '@/components/shared/fields';
import { formatDate, uid } from '@/lib/format';
import { householdSchema } from './schema';

export { householdSchema as schema };

export function issues(data: unknown) {
  return issuesFromSchema(householdSchema, data);
}

export function previewSections(data: unknown): PreviewSection[] {
  const d = (data ?? {}) as Partial<HouseholdData>;
  if (d.livesAlone) return [{ title: 'Household members', items: [{ label: 'Household', value: 'Lives alone, no household members', wide: true }] }];
  const list = (d.members ?? []).filter(Boolean);
  return [
    {
      title: 'Household members',
      items: list.length
        ? list.map((m) => ({
            label: m.relationship || 'Member',
            value: `${m.name}${m.dob ? `, born ${formatDate(m.dob)}` : ''}${m.livesWithYou ? ' · Lives with you' : ''}${m.helpsWithCare ? ' · Helps with care' : ''}`,
            wide: true,
          }))
        : [{ label: 'Members', value: '', wide: true }],
    },
  ];
}

function MemberEditor({ index }: { index: number }) {
  const bind = useBind();
  const { watch, setValue } = useFormContext<HouseholdData>();
  const p = `members.${index}`;
  const helps = watch(`members.${index}.helpsWithCare`);
  const helpsBind = bind(`${p}.helpsWithCare`);
  return (
    <>
      <FieldRow>
        <TextField {...bind(`${p}.name`)} label="Full name" required />
        <TextField {...bind(`${p}.relationship`)} label="Relationship to you" required placeholder="For example Daughter" />
      </FieldRow>
      <FieldRow>
        <DateField {...bind(`${p}.dob`)} label="Date of birth" required />
        <div className="flex items-end pb-2">
          <CheckboxField {...bind<boolean>(`${p}.livesWithYou`)} label="Lives with you" />
        </div>
      </FieldRow>
      <RadioGroupField
        {...helpsBind}
        value={helps === undefined ? '' : helps ? 'yes' : 'no'}
        onChange={(v) => setValue(`members.${index}.helpsWithCare`, v === 'yes', { shouldDirty: true })}
        label="Does this person help you provide care?"
        required
        options={YES_NO}
        help="People who help with care need their own background check consent."
      />
    </>
  );
}

function Fields() {
  const bind = useBind();
  const { watch } = useFormContext<HouseholdData>();
  const livesAlone = watch('livesAlone');
  return (
    <Section title="Household members" description="Everyone who lives with you, and anyone who helps you provide care." fields={['members']}>
      <CheckboxField {...bind<boolean>('livesAlone')} label="I live alone and have no household members" />
      {!livesAlone ? (
        <RepeatableList<HouseholdMember>
          name="members"
          noun="member"
          addLabel="Add household member"
          emptyText="No household members added yet."
          max={12}
          create={() => ({ id: uid('hh'), name: '', relationship: '', dob: '', livesWithYou: true, helpsWithCare: undefined })}
          summary={(m) => ({
            title: m.name || 'New household member',
            meta: [m.relationship, m.dob ? `Born ${formatDate(m.dob)}` : null, m.livesWithYou ? 'Lives with you' : null].filter(Boolean).join(' · '),
            chips: m.helpsWithCare ? (
              <span className="inline-flex h-5 items-center rounded-full bg-status-info-bg px-2 text-2xs font-medium text-status-info-fg">
                Helps with care
              </span>
            ) : null,
          })}
          renderEditor={(i) => <MemberEditor index={i} />}
          renderReadOnly={(m) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Full name" value={m.name} />
              <ReadOnlyField label="Relationship" value={m.relationship} />
              <ReadOnlyField label="Date of birth" value={formatDate(m.dob)} />
              <ReadOnlyField label="Lives with you" value={m.livesWithYou ? 'Yes' : 'No'} />
              <ReadOnlyField label="Helps with care" value={m.helpsWithCare === undefined ? '' : m.helpsWithCare ? 'Yes' : 'No'} />
            </div>
          )}
        />
      ) : null}
    </Section>
  );
}

export function HouseholdStep({ request, instance, readOnly, step }: StepProps) {
  return (
    <StepForm
      requestId={request.id}
      moduleId={instance.id}
      stepId={step.id}
      defaults={{ members: [], livesAlone: false }}
      saved={instance.data[step.id]}
      readOnly={readOnly}
    >
      <Fields />
    </StepForm>
  );
}
