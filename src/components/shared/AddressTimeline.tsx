import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ADDRESS_GAP_DAYS, ADDRESS_LOOKBACK_YEARS } from '@/config';
import type { Address } from '@/domain/data';
import { daysBetween, formatDate, formatMonthYear, parseDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface TimelineRow {
  kind: 'address' | 'gap' | 'overlap';
  address?: Address;
  from: Date;
  to: Date;
  days: number;
}

export interface TimelineAnalysis {
  rows: TimelineRow[];
  coverageStart?: Date;
  lookbackStart: Date;
  complete: boolean;
  warnings: string[];
}

function humanDuration(days: number) {
  if (days < 60) return `${days} days`;
  const months = Math.round(days / 30.4);
  return months < 24 ? `${months} months` : `${Math.round(months / 12)} years`;
}

export function analyzeAddresses(addresses: Address[], lookbackYears = ADDRESS_LOOKBACK_YEARS): TimelineAnalysis {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lookbackStart = new Date(today);
  lookbackStart.setFullYear(today.getFullYear() - lookbackYears);

  const periods = addresses
    .map((a) => {
      const from = parseDate(a.from);
      const to = a.current ? today : parseDate(a.to);
      return from && to ? { address: a, from, to } : null;
    })
    .filter((p): p is { address: Address; from: Date; to: Date } => !!p && p.from <= p.to)
    .sort((a, b) => b.from.getTime() - a.from.getTime());

  const rows: TimelineRow[] = [];
  const warnings: string[] = [];
  periods.forEach((p, i) => {
    rows.push({ kind: 'address', address: p.address, from: p.from, to: p.to, days: daysBetween(p.from, p.to) });
    const older = periods[i + 1];
    if (!older) return;
    const gap = daysBetween(older.to, p.from);
    if (gap > ADDRESS_GAP_DAYS && older.to >= lookbackStart) {
      rows.push({ kind: 'gap', from: older.to, to: p.from, days: gap });
      warnings.push(`Gap of ${humanDuration(gap)} between ${formatDate(older.to.toISOString())} and ${formatDate(p.from.toISOString())}`);
    } else if (gap < 0) {
      rows.push({ kind: 'overlap', from: p.from, to: older.to, days: -gap });
      warnings.push(`Two addresses overlap by ${humanDuration(-gap)}`);
    }
  });

  const coverageStart = periods.length ? periods[periods.length - 1].from : undefined;
  const complete = !!coverageStart && coverageStart <= lookbackStart;
  if (periods.length && !complete) {
    warnings.push(`History starts ${formatMonthYear(coverageStart!.toISOString())}. Add addresses back to ${formatMonthYear(lookbackStart.toISOString())}.`);
  }
  return { rows, coverageStart, lookbackStart, complete, warnings };
}

/** Vertical timeline of addresses by date, with gaps and overlaps called out as warnings. */
export function AddressTimeline({ addresses, lookbackYears = ADDRESS_LOOKBACK_YEARS }: { addresses: Address[]; lookbackYears?: number }) {
  const a = analyzeAddresses(addresses, lookbackYears);
  if (!a.rows.length) {
    return <p className="text-sm text-muted-foreground">Add addresses with dates to see your {lookbackYears}-year history.</p>;
  }
  const issues = a.warnings.length;
  return (
    <div>
      <div
        className={cn(
          'mb-4 flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-xs',
          issues
            ? 'bg-status-warning-bg text-status-warning-fg'
            : 'bg-status-success-bg text-status-success-fg',
        )}
      >
        {issues ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden /> : <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />}
        <span>
          {issues
            ? `${issues === 1 ? '1 thing' : `${issues} things`} to check in your ${lookbackYears}-year history. You can still continue; HR may ask about it.`
            : `Your last ${lookbackYears} years are covered without gaps.`}
        </span>
      </div>
      <ol className="relative">
        {a.rows.map((row, i) => {
          const last = i === a.rows.length - 1;
          if (row.kind === 'address' && row.address) {
            const ad = row.address;
            return (
              <li key={`a-${ad.id}`} className="relative grid grid-cols-[16px_minmax(0,1fr)] gap-x-3 pb-4">
                {!last ? <span className="absolute left-[7px] top-4 h-full w-px bg-neutral-200" aria-hidden /> : null}
                <span
                  className={cn(
                    'relative mt-1 h-3.5 w-3.5 rounded-full border-2 bg-card',
                    ad.current ? 'border-primary' : 'border-neutral-400',
                  )}
                  aria-hidden
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {[ad.street, ad.unit].filter(Boolean).join(', ') || 'Address'}
                    </span>
                    {ad.current ? (
                      <span className="inline-flex h-5 items-center rounded-full bg-primary-subtle/60 px-2 text-2xs font-medium text-primary">
                        Current address
                      </span>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground tabular">
                    {[ad.city, ad.state, ad.zip].filter(Boolean).join(', ')} · {formatMonthYear(ad.from)} – {ad.current ? 'Present' : formatMonthYear(ad.to)}
                  </div>
                </div>
              </li>
            );
          }
          return (
            <li key={`g-${i}`} className="relative grid grid-cols-[16px_minmax(0,1fr)] gap-x-3 pb-4">
              {!last ? <span className="absolute left-[7px] top-0 h-full w-px border-l border-dashed border-status-warning-fg/50" aria-hidden /> : null}
              <AlertTriangle className="relative mt-0.5 h-4 w-4 bg-card text-status-warning-fg" aria-hidden />
              <div className="text-xs text-status-warning-fg tabular">
                <span className="font-medium">{row.kind === 'gap' ? `Gap of ${humanDuration(row.days)}` : `Overlap of ${humanDuration(row.days)}`}</span>
                <span className="text-neutral-600">
                  {' '}
                  · {formatDate(row.from.toISOString())} – {formatDate(row.to.toISOString())}
                </span>
              </div>
            </li>
          );
        })}
        {!a.complete && a.coverageStart ? (
          <li className="grid grid-cols-[16px_minmax(0,1fr)] gap-x-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-status-warning-fg" aria-hidden />
            <div className="text-xs text-status-warning-fg">
              <span className="font-medium">History incomplete.</span>{' '}
              <span className="text-neutral-600">
                Starts {formatMonthYear(a.coverageStart.toISOString())}; needs to reach {formatMonthYear(a.lookbackStart.toISOString())}.
              </span>
            </div>
          </li>
        ) : null}
      </ol>
    </div>
  );
}
