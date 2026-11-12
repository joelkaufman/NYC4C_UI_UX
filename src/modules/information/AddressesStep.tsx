import { useFormContext } from 'react-hook-form';
import type { AddressesData, PreviousAddress } from '@/domain/data';
import type { PreviewSection, StepProps } from '@/domain/types';
import { issuesFromSchema } from '@/domain/validation';
import { RepeatableList } from '@/components/shared/RepeatableList';
import { Section } from '@/components/shared/Section';
import { StepForm, useBind } from '@/components/shared/step-context';
import { DateField, FieldRow, ReadOnlyField, TextField } from '@/components/shared/fields';
import { ADDRESS_LOOKBACK_YEARS } from '@/config';
import { formatDate, todayIso, uid } from '@/lib/format';
import { addressesSchema } from './schema';
import { addressHelper } from './helpers';
import { addressHistory, formatYears, moveOutFor, previousWithMoveOut } from './address-history';

export { addressesSchema as schema };

const DEFAULTS: AddressesData = { street: '', apt: '', city: '', state: '', zip: '', startDate: '', previousAddresses: [] };

export function issues(data: unknown) {
  return issuesFromSchema(addressesSchema, data);
}

export function formatAddress(a: { street?: string; apt?: string; city?: string; state?: string; zip?: string }) {
  const line1 = [a.street, a.apt].filter(Boolean).join(', ');
  const line2 = [a.city, [a.state, a.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return [line1, line2].filter(Boolean).join(', ');
}

export function previewSections(data: unknown): PreviewSection[] {
  const d = (data ?? {}) as Partial<AddressesData>;
  const h = addressHistory(d);
  const previous = previousWithMoveOut(d);
  return [
    {
      title: 'Current address',
      items: [
        { label: 'Address', targetId: 'street', value: formatAddress(d), wide: true },
        { label: 'Date started living at address', targetId: 'startDate', value: formatDate(d.startDate) },
        { label: 'Years at current address', value: formatYears(h.yearsAtCurrent) },
        { label: 'Prior years provided', value: formatYears(h.priorYearsProvided) },
        { label: 'Prior years needed', value: formatYears(h.priorYearsNeeded) },
        { label: 'Addresses validated', targetId: 'previousAddresses', value: h.validated ? 'Yes' : 'No' },
      ],
      note: h.message || undefined,
    },
    {
      title: 'Previous addresses',
      items: previous.length
        ? previous.map((a) => ({ label: `${formatDate(a.moveIn)} – ${formatDate(a.moveOut)}`, value: formatAddress(a), wide: true }))
        : [{ label: 'Previous addresses', value: h.priorYearsNeeded === 0 ? 'None needed' : '', wide: true }],
    },
  ];
}

function PreviousEditor({ index }: { index: number }) {
  const bind = useBind();
  const { watch } = useFormContext<AddressesData>();
  const p = `previousAddresses.${index}`;
  const all = watch() as AddressesData;
  const item = all.previousAddresses?.[index];
  return (
    <>
      <TextField {...bind(`${p}.street`)} label="Street" required autoComplete="off" />
      <FieldRow cols={3}>
        <TextField {...bind(`${p}.city`)} label="City" required autoComplete="off" />
        <TextField {...bind(`${p}.state`)} label="State" required autoComplete="off" />
        <TextField {...bind(`${p}.zip`)} label="ZIP code" required inputMode="numeric" maxLength={5} autoComplete="off" />
      </FieldRow>
      <FieldRow>
        <DateField {...bind(`${p}.moveIn`)} label="Move-in date" required max={all.startDate || todayIso()} />
        <ReadOnlyField label="Move-out date" value={item ? formatDate(moveOutFor(all, item.id)) : ''} />
      </FieldRow>
    </>
  );
}

function HistoryCheck() {
  const { watch } = useFormContext<AddressesData>();
  const h = addressHistory(watch() as AddressesData);
  return (
    <Section
      title="Address history check"
      description={`Worked out from your dates. Your history must cover the last ${ADDRESS_LOOKBACK_YEARS} years.`}
      readOnly
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <ReadOnlyField label="Years living at current address" value={formatYears(h.yearsAtCurrent)} />
        <ReadOnlyField label="Prior years provided" value={formatYears(h.priorYearsProvided)} />
        <ReadOnlyField label="Prior years needed" value={formatYears(h.priorYearsNeeded)} />
        <ReadOnlyField label="Addresses validated" value={h.validated ? 'Yes' : 'No'} />
        <ReadOnlyField label="Validation message" value={h.message || 'None'} className="sm:col-span-2" />
      </div>
    </Section>
  );
}

function Fields() {
  const bind = useBind();
  const { watch } = useFormContext<AddressesData>();
  const all = watch() as AddressesData;
  const needed = addressHistory(all).priorYearsNeeded;
  return (
    <>
      <Section title="Current address" fields={['street', 'apt', 'city', 'state', 'zip', 'startDate']}>
        <FieldRow className="sm:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
          <TextField {...bind('street')} label="Street" required autoComplete="address-line1" />
          <TextField {...bind('apt')} label="Apt" autoComplete="address-line2" />
        </FieldRow>
        <FieldRow cols={3}>
          <TextField {...bind('city')} label="City" required autoComplete="address-level2" />
          <TextField {...bind('state')} label="State" required autoComplete="address-level1" />
          <TextField {...bind('zip')} label="ZIP code" required inputMode="numeric" maxLength={5} autoComplete="postal-code" />
        </FieldRow>
        <FieldRow>
          <DateField {...bind('startDate')} label="Date you started living at this address" required max={todayIso()} />
        </FieldRow>
      </Section>

      <HistoryCheck />

      <Section
        title="Previous addresses"
        description={
          needed === 0
            ? `You have lived at your current address for over ${ADDRESS_LOOKBACK_YEARS} years, so no previous addresses are needed.`
            : 'Add each address you lived at before, newest first. Each move-out date is the move-in date of the address after it.'
        }
        fields={['previousAddresses']}
      >
        <RepeatableList<PreviousAddress>
          name="previousAddresses"
          noun="address"
          addLabel="Add previous address"
          emptyText="No previous addresses added yet."
          create={() => ({ id: uid('addr'), street: '', city: '', state: '', zip: '', moveIn: '' })}
          summary={(a) => ({
            title: a.street || 'New address',
            meta: [
              [a.city, a.state].filter(Boolean).join(', '),
              a.moveIn ? `${formatDate(a.moveIn)} – ${formatDate(moveOutFor(all, a.id)) || '…'}` : null,
            ]
              .filter(Boolean)
              .join(' · '),
          })}
          renderEditor={(i) => <PreviousEditor index={i} />}
          renderReadOnly={(a) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Address" value={formatAddress(a)} className="sm:col-span-2" />
              <ReadOnlyField label="Move-in date" value={formatDate(a.moveIn)} />
              <ReadOnlyField label="Move-out date" value={formatDate(moveOutFor(all, a.id))} />
            </div>
          )}
        />
      </Section>
    </>
  );
}

export function AddressesStep({ request, instance, readOnly, step }: StepProps) {
  return (
    <StepForm requestId={request.id} moduleId={instance.id} stepId={step.id} defaults={DEFAULTS} saved={instance.data[step.id]} readOnly={readOnly}>
      <Fields />
    </StepForm>
  );
}

export { addressHelper };
