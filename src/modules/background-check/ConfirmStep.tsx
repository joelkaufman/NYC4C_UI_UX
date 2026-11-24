import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import { CheckCircle2, Clock } from 'lucide-react';
import type { BackgroundConfirmData, FingerprintSlot } from '@/domain/data';
import type { ModuleInstance, PreviewSection, ProviderRequest, StepProps } from '@/domain/types';
import { getPersonal, householdAdults, stepData } from '@/domain/conditions';
import { isBlank, issuesFromSchema, requireKeys, stepSchema } from '@/domain/validation';
import { Section } from '@/components/shared/Section';
import { StepForm, useBind } from '@/components/shared/step-context';
import { CheckboxField, DateTimeField, RadioGroupField, ReadOnlyField, TextareaField, TextField, YES_NO } from '@/components/shared/fields';
import { RepeatableList } from '@/components/shared/RepeatableList';
import { AddressTimeline } from '@/components/shared/AddressTimeline';
import { COMPANY_NAME } from '@/config';
import type { AddressesData } from '@/domain/data';
import { formatDateTime, maskSSN, todayIso, uid } from '@/lib/format';
import { useStore } from '@/mock/store';
import { toTimeline } from '@/modules/information/address-history';
import { memberName } from '@/modules/information/HouseholdStep';
import { fullName } from '@/modules/information/PersonalInfoStep';

const MAX_FINGERPRINT_SLOTS = 3;

export function buildSchema(request: ProviderRequest) {
  const helpers = householdAdults(request);
  return stepSchema<BackgroundConfirmData>((d, ctx) => {
    requireKeys(ctx, d, { livedOutsideState: 'Answer whether you lived outside the state in the last 5 years' });
    if (d.livedOutsideState === 'yes') requireKeys(ctx, d, { states: 'List the states you lived in' });
    const slots = d.fingerprintAvailability ?? [];
    if (!slots.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fingerprintAvailability'], message: 'Add at least one date and time you are available for fingerprinting' });
    }
    slots.forEach((s, i) =>
      requireKeys(ctx, s as unknown as Record<string, unknown>, { at: 'Choose a date and time' }, ['fingerprintAvailability', i]),
    );
    if (!d.authorize) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['authorize'], message: 'Authorize the background check' });
    }
    for (const h of helpers) {
      if (isBlank(d.helperConsents?.[h.id])) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['helperConsents', h.id], message: `Confirm consent for ${memberName(h) || 'household member'}` });
      }
    }
  });
}

export function issues(data: unknown, _instance: ModuleInstance, request: ProviderRequest) {
  return issuesFromSchema(buildSchema(request), data);
}

export function previewSections(data: unknown, request: ProviderRequest): PreviewSection[] {
  const d = (data ?? {}) as Partial<BackgroundConfirmData>;
  const helpers = householdAdults(request);
  return [
    {
      title: 'Fingerprint availability',
      items: (d.fingerprintAvailability ?? []).map((s, i) => ({ label: `Option ${i + 1}`, value: formatDateTime(s.at) })),
    },
    {
      title: 'Background check answers',
      items: [
        { label: 'Other names in the last 7 years', value: d.otherNames },
        { label: 'Lived outside the state in the last 5 years', value: d.livedOutsideState === 'yes' ? `Yes: ${d.states}` : d.livedOutsideState === 'no' ? 'No' : '' },
        { label: 'Authorization', value: d.authorize ? 'Given' : '' },
        ...helpers.map((h) => ({ label: `Consent for ${memberName(h)}`, value: d.helperConsents?.[h.id] ? 'Given' : '' })),
      ],
    },
  ];
}

/** Read-only summary pulled from Information, in the preview styling. */
function Summary({ request }: { request: ProviderRequest }) {
  const p = getPersonal(request);
  const provider = useStore((s) => s.provider);
  const addresses = toTimeline(stepData<AddressesData>(request, 'information', 'addresses'));
  const helpers = householdAdults(request);
  return (
    <section className="border-b pb-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-foreground">From your Information</h2>
        <span className="text-xs text-muted-foreground">To change these, request changes to Information.</span>
      </div>
      <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-3">
        <ReadOnlyField label="Name" value={fullName(p) || provider.name} />
        <ReadOnlyField label="Maiden or alias names" value={p.usedAlias === 'yes' ? p.aliasNames : p.usedAlias === 'no' ? 'None' : ''} />
        <ReadOnlyField label="Social Security number" value={maskSSN(p.ssn)} />
      </div>
      <div className="mt-6">
        <div className="mb-3 text-xs text-muted-foreground">Address history</div>
        <AddressTimeline addresses={addresses} />
      </div>
      <div className="mt-2">
        <div className="mb-1 text-xs text-muted-foreground">Household members aged 18 or older</div>
        {helpers.length ? (
          <ul className="grid gap-1 text-sm text-foreground">
            {helpers.map((h) => (
              <li key={h.id}>
                {memberName(h)} <span className="text-muted-foreground">· {h.relationship}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">None</p>
        )}
      </div>
    </section>
  );
}

function Fields({ request }: { request: ProviderRequest }) {
  const bind = useBind();
  const { watch } = useFormContext<BackgroundConfirmData>();
  const outside = watch('livedOutsideState');
  const helpers = householdAdults(request);
  return (
    <>
      <Section
        title="Fingerprint availability"
        description={`Give up to ${MAX_FINGERPRINT_SLOTS} dates and times you could attend a fingerprint appointment.`}
        fields={['fingerprintAvailability']}
      >
        <RepeatableList<FingerprintSlot>
          name="fingerprintAvailability"
          noun="option"
          addLabel="Add date and time"
          emptyText="No dates and times added yet."
          max={MAX_FINGERPRINT_SLOTS}
          create={() => ({ id: uid('fp'), at: '' })}
          summary={(s, i) => ({ title: formatDateTime(s.at) || 'New option', meta: `Option ${i + 1}` })}
          renderEditor={(i) => <DateTimeField {...bind(`fingerprintAvailability.${i}.at`)} label="Date and time" required min={`${todayIso()}T00:00`} />}
          renderReadOnly={(s) => <ReadOnlyField label="Date and time" value={formatDateTime(s.at)} />}
        />
      </Section>
      <Section title="Your answers" fields={['otherNames', 'livedOutsideState', 'states']}>
        <TextField {...bind('otherNames')} label="Other names used in the last 7 years" help="Optional. Include maiden names and legal name changes." />
        <RadioGroupField {...bind('livedOutsideState')} label="Have you lived outside the state in the last 5 years?" required options={YES_NO} />
        {outside === 'yes' ? <TextareaField {...bind('states')} label="Which states?" required placeholder="For example Nevada (2021–2022)" /> : null}
      </Section>
      <Section title="Consent" description="Each person must agree before the screening company can search their records." fields={['authorize', 'helperConsents']}>
        <CheckboxField {...bind<boolean>('authorize')} label={`I authorize ${COMPANY_NAME} to perform a background check`} required />
        {helpers.map((h) => (
          <CheckboxField
            key={h.id}
            {...bind<boolean>(`helperConsents.${h.id}`)}
            label={`${memberName(h)} (${h.relationship}) authorizes ${COMPANY_NAME} to perform a background check`}
            required
            help="Confirm you have their permission. They may be contacted to verify."
          />
        ))}
      </Section>
    </>
  );
}

export function BackgroundClearedChip({ instance }: { instance: ModuleInstance }) {
  if (instance.status !== 'approved') return null;
  return instance.backgroundCheckCleared ? (
    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-status-success-bg px-2 text-2xs font-medium text-status-success-fg">
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
      Background check: cleared
    </span>
  ) : (
    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-status-info-bg px-2 text-2xs font-medium text-status-info-fg">
      <Clock className="h-3.5 w-3.5" aria-hidden />
      Background check: pending
    </span>
  );
}

export function ConfirmStep({ request, instance, readOnly, step }: StepProps) {
  return (
    <>
      <Summary request={request} />
      <StepForm
        requestId={request.id}
        moduleId={instance.id}
        stepId={step.id}
        defaults={{ fingerprintAvailability: [], otherNames: '', livedOutsideState: '', states: '', authorize: false, helperConsents: {} }}
        saved={instance.data[step.id]}
        readOnly={readOnly}
      >
        <Fields request={request} />
      </StepForm>
    </>
  );
}
