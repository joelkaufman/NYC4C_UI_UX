import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { AlertCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import type { AddressesData, PreviousAddress } from '@/domain/data';
import type { PreviewSection, StepProps } from '@/domain/types';
import { issuesFromSchema } from '@/domain/validation';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/shared/Section';
import { StepForm, useBind, useStepContext } from '@/components/shared/step-context';
import { DateField, FieldRow, ReadOnlyField, TextField } from '@/components/shared/fields';
import { ADDRESS_LOOKBACK_YEARS } from '@/config';
import { formatDate, todayIso, uid } from '@/lib/format';
import { cn } from '@/lib/utils';
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
      ],
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

const NAME = 'previousAddresses';

/** Previous addresses as a table (address, from, to); one row at a time opens an editor beneath it. */
function PreviousAddressTable() {
  const { watch, setValue } = useFormContext<AddressesData>();
  const ctx = useStepContext();
  const all = watch() as AddressesData;
  const items = (all.previousAddresses ?? []).filter(Boolean);
  // Open the row an issue link points at (?focus=previousAddresses.index.field).
  const [editing, setEditing] = React.useState<string | null>(() => {
    const m = /^previousAddresses\.(\d+)\./.exec(new URLSearchParams(window.location.search).get('focus') ?? '');
    return m ? items[Number(m[1])]?.id ?? null : null;
  });
  const addRef = React.useRef<HTMLButtonElement>(null);
  const errorAtList = ctx.errorFor(NAME);

  const add = () => {
    const item: PreviousAddress = { id: uid('addr'), street: '', city: '', state: '', zip: '', moveIn: '' };
    setValue(NAME, [...items, item], { shouldDirty: true });
    setEditing(item.id);
  };
  const close = (index: number) => {
    ctx.reveal(`${NAME}.${index}`);
    setEditing(null);
  };
  const remove = (index: number) => {
    setValue(NAME, items.filter((_, i) => i !== index), { shouldDirty: true });
    setEditing(null);
    requestAnimationFrame(() => addRef.current?.focus());
  };

  if (ctx.readOnly && !items.length) return <p className="text-sm text-muted-foreground">None added.</p>;

  const th = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
  return (
    <div className="grid gap-3" id={NAME} tabIndex={-1}>
      {items.length ? (
        <div className="overflow-x-auto rounded-xl ring-1 ring-inset ring-[hsl(var(--field-edge))]">
          <table className="w-full min-w-[30rem] border-collapse text-sm">
            <thead className="bg-[hsl(var(--field))]">
              <tr>
                <th scope="col" className={th}>Address</th>
                <th scope="col" className={th}>From</th>
                <th scope="col" className={th}>To</th>
                {ctx.readOnly ? null : (
                  <th scope="col" className={th}>
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.map((a, i) => {
                const count = ctx.visibleCount([`${NAME}.${i}`]);
                const isEditing = editing === a.id;
                return (
                  <React.Fragment key={a.id}>
                    <tr className={cn('border-t align-top', isEditing && 'bg-card')}>
                      <td className="px-3 py-2.5 text-foreground">
                        {formatAddress(a) || <span className="text-muted-foreground">New address</span>}
                        {count > 0 && !isEditing ? (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-status-danger-fg">
                            <AlertCircle className="h-3.5 w-3.5" aria-hidden />
                            {count === 1 ? '1 item needs attention' : `${count} items need attention`}
                          </p>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 tabular">{formatDate(a.moveIn)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 tabular">{formatDate(moveOutFor(all, a.id))}</td>
                      {ctx.readOnly ? null : (
                        <td className="px-1 py-1 text-right">
                          {isEditing ? null : (
                            <div className="flex justify-end gap-1">
                              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(a.id)} aria-label={`Edit address ${i + 1}`}>
                                <Pencil aria-hidden />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(i)}
                                aria-label={`Remove address ${i + 1}`}
                                className="text-muted-foreground hover:text-status-danger-fg"
                              >
                                <Trash2 aria-hidden />
                              </Button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                    {isEditing ? (
                      <tr className="bg-card">
                        <td colSpan={4} className="px-3 pb-4 pt-1">
                          <div className="grid gap-4">
                            <PreviousEditor index={i} />
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)} className="text-status-danger-fg hover:bg-status-danger-bg">
                                <Trash2 aria-hidden />
                                Remove address
                              </Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => close(i)}>
                                Done
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No previous addresses added yet.</p>
      )}
      {ctx.readOnly ? null : (
        <div>
          <Button ref={addRef} type="button" variant="outline" size="sm" onClick={add} data-add>
            <Plus aria-hidden />
            Add previous address
          </Button>
        </div>
      )}
      {errorAtList ? (
        <p className="flex items-center gap-1.5 text-xs text-status-danger-fg">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden />
          {errorAtList}
        </p>
      ) : null}
    </div>
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
        <PreviousAddressTable />
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
