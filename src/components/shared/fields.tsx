import * as React from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate, formatPhone, formatSSN, maskSSN } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useStepContext, type BindProps } from './step-context';
import { HelperButton } from './HelperButton';
import type { HelperDef } from '@/domain/types';

export interface Option {
  value: string;
  label: string;
}

interface CommonProps {
  label: string;
  required?: boolean;
  help?: React.ReactNode;
  hidden?: boolean;
  helper?: HelperDef;
  className?: string;
}

// ---------------------------------------------------------------- frame

export function FieldLabel({ htmlFor, id, label, required, helper }: { htmlFor?: string; id?: string; label: string; required?: boolean; helper?: HelperDef }) {
  return (
    <div className="flex min-h-5 items-center justify-between gap-2">
      <label htmlFor={htmlFor} id={id} className="text-[13px] font-medium text-[hsl(var(--label))] transition-colors duration-150 group-focus-within/field:text-primary">
        {label}
        {required ? (
          <>
            <span className="ml-0.5 text-status-danger-fg" aria-hidden>
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : null}
      </label>
      {helper ? <HelperButton helper={helper} compact /> : null}
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="motion-note-in flex items-start gap-1.5 text-xs text-status-danger-fg">
      <AlertCircle className="mt-[3px] h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}

function describedBy(id: string, help?: React.ReactNode, error?: string) {
  return [error ? `${id}-error` : null, help ? `${id}-help` : null].filter(Boolean).join(' ') || undefined;
}

function FieldFrame({
  id,
  label,
  required,
  help,
  error,
  helper,
  className,
  children,
  labelAsGroup,
}: CommonProps & { id: string; error?: string; children: React.ReactNode; labelAsGroup?: boolean }) {
  return (
    <div className={cn('group/field grid min-w-0 content-start gap-1', className)} data-field={id}>
      <FieldLabel htmlFor={labelAsGroup ? undefined : id} id={`${id}-label`} label={label} required={required} helper={helper} />
      {children}
      <FieldError id={`${id}-error`} message={error} />
      {help ? (
        <p id={`${id}-help`} className="text-xs text-muted-foreground">
          {help}
        </p>
      ) : null}
    </div>
  );
}

/** Read-only rendering: label muted 13px over value 14px neutral-900. */
export function ReadOnlyField({ label, value, className, issue }: { label: string; value?: React.ReactNode; className?: string; issue?: string }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={cn('grid min-w-0 content-start gap-0.5', className)}>
      <div className="text-xs text-muted-foreground">{label}</div>
      {issue ? (
        <div className="flex items-start gap-1.5 text-sm text-status-danger-fg">
          <AlertCircle className="mt-[3px] h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{empty ? 'Missing' : value}</span>
          <span className="sr-only">: {issue}</span>
        </div>
      ) : (
        <div className={cn('break-words text-sm tabular', empty ? 'text-muted-foreground' : 'text-foreground')}>
          {empty ? 'Not provided' : value}
        </div>
      )}
    </div>
  );
}

export function FieldRow({ cols = 2, className, children }: { cols?: 2 | 3; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('grid gap-3', cols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]', className)}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------- inputs

/** True once a required field holds a value the step's validation accepts. */
function useDone(id: string, required: boolean | undefined, value: unknown, error?: string) {
  const ctx = useStepContext();
  const filled = value !== undefined && value !== null && String(value).trim() !== '';
  return !!required && filled && !error && !ctx.issues.some((i) => i.targetId === id);
}

/** Small green check inside a completed required field. */
function DoneMark({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-status-success-fg">
      <CheckCircle2 className="motion-check-pop h-4 w-4" aria-hidden />
      <span className="sr-only">Complete</span>
    </span>
  );
}

type TextProps = BindProps<string | undefined> &
  CommonProps & {
    placeholder?: string;
    type?: 'text' | 'email' | 'tel' | 'number';
    autoComplete?: string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
    maxLength?: number;
  };

export function TextField({ id, value, onChange, onBlur, error, readOnly, hidden, label, required, help, helper, className, placeholder, type = 'text', autoComplete, inputMode, maxLength }: TextProps) {
  const done = useDone(id, required, value, error);
  if (hidden) return null;
  if (readOnly) return <ReadOnlyField label={label} value={value} className={className} />;
  return (
    <FieldFrame id={id} label={label} required={required} help={help} error={error} helper={helper} className={className}>
      <div className="relative">
      <Input
        className={done ? 'pr-9' : undefined}
        id={id}
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        invalid={!!error}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-required={required || undefined}
        aria-describedby={describedBy(id, help, error)}
      />
      <DoneMark show={done} />
      </div>
    </FieldFrame>
  );
}

export function TextareaField({ id, value, onChange, onBlur, error, readOnly, hidden, label, required, help, helper, className, placeholder }: TextProps) {
  if (hidden) return null;
  if (readOnly) return <ReadOnlyField label={label} value={value} className={className} />;
  return (
    <FieldFrame id={id} label={label} required={required} help={help} error={error} helper={helper} className={className}>
      <Textarea
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        invalid={!!error}
        placeholder={placeholder}
        rows={3}
        aria-required={required || undefined}
        aria-describedby={describedBy(id, help, error)}
      />
    </FieldFrame>
  );
}

export function DateField({ id, value, onChange, onBlur, error, readOnly, hidden, label, required, help, helper, className, max, min }: TextProps & { max?: string; min?: string }) {
  const done = useDone(id, required, value, error);
  if (hidden) return null;
  if (readOnly) return <ReadOnlyField label={label} value={formatDate(value)} className={className} />;
  return (
    <FieldFrame id={id} label={label} required={required} help={help} error={error} helper={helper} className={className}>
      <div className="relative">
      <Input
        className={done ? 'pr-9' : undefined}
        id={id}
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        invalid={!!error}
        max={max}
        min={min}
        aria-required={required || undefined}
        aria-describedby={describedBy(id, help, error)}
      />
      <DoneMark show={done} />
      </div>
    </FieldFrame>
  );
}

export function SelectField({ id, value, onChange, onBlur, error, readOnly, hidden, label, required, help, helper, className, options, placeholder = 'Select…' }: TextProps & { options: Option[] }) {
  if (hidden) return null;
  const selected = options.find((o) => o.value === value);
  if (readOnly) return <ReadOnlyField label={label} value={selected?.label} className={className} />;
  return (
    <FieldFrame id={id} label={label} required={required} help={help} error={error} helper={helper} className={className}>
      <Select
        value={value || undefined}
        onValueChange={(v) => {
          onChange(v);
          onBlur();
        }}
      >
        <SelectTrigger id={id} invalid={!!error} aria-required={required || undefined} aria-describedby={describedBy(id, help, error)} onBlur={onBlur}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldFrame>
  );
}

export function RadioGroupField({ id, value, onChange, onBlur, error, readOnly, hidden, label, required, help, helper, className, options, inline = true }: TextProps & { options: Option[]; inline?: boolean }) {
  if (hidden) return null;
  if (readOnly) return <ReadOnlyField label={label} value={options.find((o) => o.value === value)?.label} className={className} />;
  return (
    <FieldFrame id={id} label={label} required={required} help={help} error={error} helper={helper} className={className} labelAsGroup>
      {/* Segmented control: one bordered track, the chosen option filled navy. */}
      <RadioGroupPrimitive.Root
        value={value ?? ''}
        onValueChange={(v) => {
          onChange(v);
          onBlur();
        }}
        aria-labelledby={`${id}-label`}
        aria-required={required || undefined}
        aria-describedby={describedBy(id, help, error)}
        orientation={inline ? 'horizontal' : 'vertical'}
        className={cn(
          'inline-flex max-w-full flex-wrap gap-1 justify-self-start rounded-[8px] bg-[hsl(var(--field))] p-0.5 ring-1 ring-inset ring-[hsl(var(--field-edge))]',
          error && 'ring-1 ring-inset ring-status-danger-fg/50',
          !inline && 'flex-col',
        )}
      >
        {options.map((o, i) => (
          <RadioGroupPrimitive.Item
            key={o.value}
            id={i === 0 ? id : `${id}-${o.value}`}
            value={o.value}
            className="h-8 min-w-14 rounded-[6px] px-3 text-sm font-medium text-neutral-600 transition-[background-color,color,box-shadow] duration-150 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=checked]:bg-primary data-[state=checked]:font-semibold data-[state=checked]:text-primary-foreground data-[state=checked]:shadow-[0_1px_2px_hsl(var(--primary)/0.25)]"
          >
            {o.label}
          </RadioGroupPrimitive.Item>
        ))}
      </RadioGroupPrimitive.Root>
    </FieldFrame>
  );
}

export const YES_NO: Option[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export function CheckboxField({
  id,
  value,
  onChange,
  onBlur,
  error,
  readOnly,
  hidden,
  label,
  required,
  help,
  className,
}: BindProps<boolean | undefined> & CommonProps) {
  if (hidden) return null;
  if (readOnly) {
    return <ReadOnlyField label={label} value={value ? 'Yes' : 'No'} className={className} />;
  }
  return (
    <div className={cn('grid gap-1.5', className)} data-field={id}>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-foreground">
        <Checkbox
          id={id}
          checked={!!value}
          onCheckedChange={(c) => {
            onChange(c === true);
            onBlur();
          }}
          invalid={!!error}
          className="mt-0.5"
          aria-required={required || undefined}
          aria-describedby={describedBy(id, help, error)}
        />
        <span>
          {label}
          {required ? (
            <>
              <span className="ml-0.5 text-status-danger-fg" aria-hidden>
                *
              </span>
              <span className="sr-only"> (required)</span>
            </>
          ) : null}
        </span>
      </label>
      <div className="pl-7">
        <FieldError id={`${id}-error`} message={error} />
        {help ? (
          <p id={`${id}-help`} className="text-xs text-muted-foreground">
            {help}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function PhoneField(props: TextProps) {
  if (props.hidden) return null;
  if (props.readOnly) return <ReadOnlyField label={props.label} value={props.value} className={props.className} />;
  return (
    <TextField
      {...props}
      type="tel"
      inputMode="tel"
      autoComplete={props.autoComplete ?? 'tel'}
      placeholder={props.placeholder ?? '(555) 555-0100'}
      onChange={(v) => props.onChange(formatPhone(v))}
    />
  );
}

/** Masked except while editing or when revealed; shows the last four digits only. */
export function SSNField({ id, value, onChange, onBlur, error, readOnly, hidden, label, required, help, helper, className }: TextProps) {
  const [revealed, setRevealed] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  if (hidden) return null;
  const toggle = (
    <button
      type="button"
      onClick={() => setRevealed((r) => !r)}
      className="inline-flex items-center gap-1 rounded-sm text-xs font-medium text-primary hover:underline focus-ring"
      aria-pressed={revealed}
      aria-controls={readOnly ? undefined : id}
    >
      {revealed ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
      {revealed ? 'Hide' : 'Show'}
    </button>
  );
  if (readOnly) {
    return (
      <div className={cn('grid content-start gap-0.5', className)}>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="flex items-center gap-3 text-sm tabular">
          {value ? (revealed ? formatSSN(value) : maskSSN(value)) : <span className="text-muted-foreground">Not provided</span>}
          {value ? toggle : null}
        </div>
      </div>
    );
  }
  const shown = focused || revealed ? formatSSN(value) : maskSSN(value);
  return (
    <FieldFrame id={id} label={label} required={required} help={help} error={error} helper={helper} className={className}>
      <div className="relative">
        <Input
          id={id}
          value={value ? shown : ''}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur();
          }}
          onChange={(e) => onChange(formatSSN(e.target.value))}
          invalid={!!error}
          inputMode="numeric"
          autoComplete="off"
          placeholder="123-45-6789"
          className="pr-20 tabular"
          aria-required={required || undefined}
          aria-describedby={describedBy(id, help, error)}
        />
        <div className="absolute inset-y-0 right-3 flex items-center">{value ? toggle : null}</div>
      </div>
    </FieldFrame>
  );
}
