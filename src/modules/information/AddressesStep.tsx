import { useFormContext } from 'react-hook-form';
import type { Address, AddressesData } from '@/domain/data';
import type { PreviewSection, StepProps } from '@/domain/types';
import { issuesFromSchema } from '@/domain/validation';
import { AddressTimeline, analyzeAddresses } from '@/components/shared/AddressTimeline';
import { RepeatableList } from '@/components/shared/RepeatableList';
import { Section } from '@/components/shared/Section';
import { StepForm, useBind } from '@/components/shared/step-context';
import { CheckboxField, DateField, FieldRow, ReadOnlyField, SelectField, TextField, type Option } from '@/components/shared/fields';
import { ADDRESS_LOOKBACK_YEARS } from '@/config';
import { formatDate, formatMonthYear, uid } from '@/lib/format';
import { optionLabel, US_STATES } from '@/lib/options';
import { addressesSchema } from './schema';
import { addressHelper } from './helpers';

export { addressesSchema as schema };

export const ADDRESS_TYPES: Option[] = [
  { value: 'home', label: 'Home' },
  { value: 'mailing', label: 'Mailing' },
  { value: 'previous', label: 'Previous' },
];

export function issues(data: unknown) {
  return issuesFromSchema(addressesSchema, data);
}

export function formatAddress(a: Partial<Address>) {
  const line1 = [a.street, a.unit].filter(Boolean).join(', ');
  const line2 = [a.city, [a.state, a.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  return [line1, line2].filter(Boolean).join(', ');
}

export function previewSections(data: unknown): PreviewSection[] {
  const list = ((data as AddressesData | undefined)?.addresses ?? []).filter(Boolean);
  const analysis = analyzeAddresses(list);
  return [
    {
      title: 'Address history',
      note: analysis.warnings.length ? analysis.warnings.join(' · ') : undefined,
      items: list.length
        ? list.map((a) => ({
            label: `${optionLabel(ADDRESS_TYPES, a.type) || 'Address'}${a.current ? ' · Current' : ''}`,
            value: `${formatAddress(a)} (${formatMonthYear(a.from)} – ${a.current ? 'Present' : formatMonthYear(a.to)})`,
            wide: true,
          }))
        : [{ label: 'Addresses', value: '', wide: true }],
    },
  ];
}

function AddressEditor({ index }: { index: number }) {
  const bind = useBind();
  const { watch } = useFormContext<AddressesData>();
  const p = `addresses.${index}`;
  const current = watch(`addresses.${index}.current`);
  return (
    <>
      <FieldRow>
        <SelectField {...bind(`${p}.type`)} label="Address type" required options={ADDRESS_TYPES} />
        <div className="flex items-end pb-2">
          <CheckboxField {...bind<boolean>(`${p}.current`)} label="This is my current address" />
        </div>
      </FieldRow>
      <FieldRow className="sm:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <TextField {...bind(`${p}.street`)} label="Street address" required autoComplete="address-line1" />
        <TextField {...bind(`${p}.unit`)} label="Unit" autoComplete="address-line2" />
      </FieldRow>
      <FieldRow cols={3}>
        <TextField {...bind(`${p}.city`)} label="City" required autoComplete="address-level2" />
        <SelectField {...bind(`${p}.state`)} label="State" required options={US_STATES} />
        <TextField {...bind(`${p}.zip`)} label="ZIP code" required inputMode="numeric" maxLength={5} autoComplete="postal-code" />
      </FieldRow>
      <FieldRow>
        <DateField {...bind(`${p}.from`)} label="Moved in" required />
        <DateField {...bind(`${p}.to`)} label="Moved out" required hidden={!!current} />
      </FieldRow>
    </>
  );
}

function Fields() {
  const { watch } = useFormContext<AddressesData>();
  const list = (watch('addresses') ?? []).filter(Boolean);
  return (
    <>
      <Section
        title="Addresses"
        description="Start with your current address."
        fields={['addresses']}
      >
        <RepeatableList<Address>
          name="addresses"
          noun="address"
          addLabel="Add address"
          emptyText="No addresses added yet. Add your current address to start."
          create={() => ({
            id: uid('addr'),
            type: list.length ? 'previous' : 'home',
            street: '',
            unit: '',
            city: '',
            state: '',
            zip: '',
            from: '',
            to: '',
            current: !list.some((a) => a.current),
          })}
          summary={(a) => ({
            title: [a.street, a.unit].filter(Boolean).join(', ') || 'New address',
            meta: [
              [a.city, a.state].filter(Boolean).join(', '),
              a.from ? `${formatMonthYear(a.from)} – ${a.current ? 'Present' : formatMonthYear(a.to) || '…'}` : null,
            ]
              .filter(Boolean)
              .join(' · '),
            chips: a.current ? (
              <span className="inline-flex h-5 items-center rounded-full bg-primary-subtle/60 px-2 text-2xs font-medium text-primary">
                Current address
              </span>
            ) : (
              <span className="text-2xs text-muted-foreground">{optionLabel(ADDRESS_TYPES, a.type)}</span>
            ),
          })}
          renderEditor={(i) => <AddressEditor index={i} />}
          renderReadOnly={(a) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField label={optionLabel(ADDRESS_TYPES, a.type) + (a.current ? ' · Current' : '')} value={formatAddress(a)} className="sm:col-span-2" />
              <ReadOnlyField label="Moved in" value={formatDate(a.from)} />
              <ReadOnlyField label="Moved out" value={a.current ? 'Present' : formatDate(a.to)} />
            </div>
          )}
        />
      </Section>
      <Section title={`${ADDRESS_LOOKBACK_YEARS}-year history`} description="Built from the dates above. Gaps over 30 days are flagged." readOnly={false}>
        <AddressTimeline addresses={list} />
      </Section>
    </>
  );
}

export function AddressesStep({ request, instance, readOnly, step }: StepProps) {
  return (
    <StepForm requestId={request.id} moduleId={instance.id} stepId={step.id} defaults={{ addresses: [] }} saved={instance.data[step.id]} readOnly={readOnly}>
      <Fields />
    </StepForm>
  );
}

export { addressHelper };
