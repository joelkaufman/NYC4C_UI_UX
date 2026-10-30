import type { Training, TrainingsData } from '@/domain/data';
import type { ModuleInstance, PreviewSection, ProviderRequest, StepProps, UploadSlotDef } from '@/domain/types';
import { stepData } from '@/domain/conditions';
import { issuesFromSchema, uploadIssues } from '@/domain/validation';
import { RepeatableList } from '@/components/shared/RepeatableList';
import { Section } from '@/components/shared/Section';
import { UploadSlot } from '@/components/shared/UploadSlot';
import { StepForm, useBind, useStepContext } from '@/components/shared/step-context';
import { DateField, FieldRow, ReadOnlyField, TextField } from '@/components/shared/fields';
import { formatDate, uid } from '@/lib/format';
import { trainingsSchema } from './schema';

export { trainingsSchema as schema };

export function trainingSlots(request: ProviderRequest): UploadSlotDef[] {
  const list = (stepData<TrainingsData>(request, 'training', 'trainings').trainings ?? []).filter(Boolean);
  return list.map((t) => ({
    id: `trn_${t.id}`,
    stepId: 'trainings',
    label: t.name ? `${t.name} certificate` : 'Certificate of completion',
    description: 'Certificate of completion showing your name and the date.',
    required: true,
    accept: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSizeMb: 10,
  }));
}

export function issues(data: unknown, instance: ModuleInstance, request: ProviderRequest) {
  return [...issuesFromSchema(trainingsSchema, data), ...uploadIssues(instance, trainingSlots(request))];
}

export function previewSections(data: unknown): PreviewSection[] {
  const list = ((data as TrainingsData | undefined)?.trainings ?? []).filter(Boolean);
  const hours = list.reduce((sum, t) => sum + (Number(t.hours) || 0), 0);
  return [
    {
      title: 'Trainings',
      note: list.length ? undefined : undefined,
      items: list.length
        ? [
            ...list.map((t) => ({ label: t.name || 'Training', value: `${t.provider} · completed ${formatDate(t.completionDate)} · ${t.hours} h`, wide: true })),
            { label: 'Total hours', value: String(hours) },
          ]
        : [{ label: 'Trainings', value: '', wide: true }],
    },
  ];
}

function TrainingEditor({ index }: { index: number }) {
  const bind = useBind();
  const p = `trainings.${index}`;
  return (
    <>
      <FieldRow>
        <TextField {...bind(`${p}.name`)} label="Training name" required />
        <TextField {...bind(`${p}.provider`)} label="Provider" required placeholder="Who delivered the training" />
      </FieldRow>
      <FieldRow>
        <DateField {...bind(`${p}.completionDate`)} label="Completion date" required max={new Date().toISOString().slice(0, 10)} />
        <TextField {...bind(`${p}.hours`)} label="Hours" required inputMode="decimal" placeholder="For example 4" />
      </FieldRow>
    </>
  );
}

function Fields({ request, instance, readOnly }: { request: ProviderRequest; instance: ModuleInstance; readOnly: boolean }) {
  const ctx = useStepContext();
  return (
    <Section
      title="Trainings"
      description="Add at least one completed training with its certificate of completion."
      fields={['trainings', ...trainingSlots(request).map((s) => s.id)]}
    >
      <RepeatableList<Training>
        name="trainings"
        noun="training"
        addLabel="Add training"
        emptyText="No trainings added yet. Add a training you have completed."
        max={30}
        create={() => ({ id: uid('trn'), name: '', provider: '', completionDate: '', hours: '' })}
        summary={(t) => ({
          title: t.name || 'New training',
          meta: [t.provider, t.completionDate ? `Completed ${formatDate(t.completionDate)}` : null, t.hours ? `${t.hours} h` : null].filter(Boolean).join(' · '),
        })}
        extraIssuePrefixes={(t) => [`trn_${t.id}`]}
        renderEditor={(i) => <TrainingEditor index={i} />}
        renderReadOnly={(t) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <ReadOnlyField label="Training" value={t.name} />
            <ReadOnlyField label="Provider" value={t.provider} />
            <ReadOnlyField label="Completion date" value={formatDate(t.completionDate)} />
            <ReadOnlyField label="Hours" value={t.hours} />
          </div>
        )}
        renderAlways={(t) => {
          const slot = trainingSlots(request).find((s) => s.id === `trn_${t.id}`);
          return slot ? (
            <UploadSlot requestId={request.id} moduleId={instance.id} def={slot} item={instance.uploads[slot.id]} readOnly={readOnly} error={ctx.errorFor(slot.id)} compact />
          ) : null;
        }}
      />
    </Section>
  );
}

export function TrainingsStep({ request, instance, readOnly, step }: StepProps) {
  return (
    <StepForm requestId={request.id} moduleId={instance.id} stepId={step.id} defaults={{ trainings: [] }} saved={instance.data[step.id]} readOnly={readOnly}>
      <Fields request={request} instance={instance} readOnly={readOnly} />
    </StepForm>
  );
}
