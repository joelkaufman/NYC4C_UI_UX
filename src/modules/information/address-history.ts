import { ADDRESS_LOOKBACK_YEARS } from '@/config';
import type { Address, AddressesData, PreviousAddress } from '@/domain/data';
import { formatMonthYear, parseDate } from '@/lib/format';

const YEAR_MS = 365.25 * 86_400_000;
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Previous addresses, newest move-in first, each with its derived move-out date. */
export function previousWithMoveOut(d: Partial<AddressesData>): (PreviousAddress & { moveOut: string })[] {
  const list = (d.previousAddresses ?? []).filter(Boolean);
  const sorted = [...list].sort((a, b) => (b.moveIn || '').localeCompare(a.moveIn || ''));
  return sorted.map((p, i) => ({ ...p, moveOut: i === 0 ? d.startDate ?? '' : sorted[i - 1].moveIn }));
}

/** Read-only move-out date for one previous address: the move-in date of the next newer address. */
export function moveOutFor(d: Partial<AddressesData>, id: string): string {
  return previousWithMoveOut(d).find((p) => p.id === id)?.moveOut ?? '';
}

export interface AddressHistory {
  yearsAtCurrent: number | null;
  priorYearsNeeded: number | null;
  priorYearsProvided: number;
  validated: boolean;
  message: string;
}

/** The sheet's read-only address fields, derived from what the provider entered. */
export function addressHistory(d: Partial<AddressesData>, today = new Date()): AddressHistory {
  const start = parseDate(d.startDate);
  if (!start) {
    return {
      yearsAtCurrent: null,
      priorYearsNeeded: null,
      priorYearsProvided: 0,
      validated: false,
      message: 'Enter the date you started living at your current address.',
    };
  }
  const yearsAtCurrent = Math.max(0, (today.getTime() - start.getTime()) / YEAR_MS);
  const needed = Math.max(0, ADDRESS_LOOKBACK_YEARS - yearsAtCurrent);
  const dated = previousWithMoveOut(d).map((p) => parseDate(p.moveIn)).filter((x): x is Date => !!x && x < start);
  const oldest = dated.length ? dated[dated.length - 1] : null;
  const provided = oldest ? (start.getTime() - oldest.getTime()) / YEAR_MS : 0;
  // Compare at display precision so 4.96 provided against 5.0 needed reads the same as it validates.
  const validated = round1(provided) >= round1(needed);
  const lookbackStart = new Date(today);
  lookbackStart.setFullYear(today.getFullYear() - ADDRESS_LOOKBACK_YEARS);
  const missing = round1(needed - provided);
  return {
    yearsAtCurrent: round1(yearsAtCurrent),
    priorYearsNeeded: round1(needed),
    priorYearsProvided: round1(provided),
    validated,
    message: validated
      ? ''
      : `Your address history is incomplete. Add previous addresses covering ${missing} more ${missing === 1 ? 'year' : 'years'}, back to ${formatMonthYear(lookbackStart.toISOString())}.`,
  };
}

export const formatYears = (n: number | null) => (n === null ? '' : `${n} ${n === 1 ? 'year' : 'years'}`);

/** Current and previous addresses as dated periods, for the address timeline. */
export function toTimeline(d: Partial<AddressesData>): Address[] {
  const out: Address[] = [];
  if (d.startDate) {
    out.push({ id: 'current', street: d.street ?? '', unit: d.apt, city: d.city ?? '', state: d.state ?? '', zip: d.zip ?? '', from: d.startDate, current: true });
  }
  for (const p of previousWithMoveOut(d)) {
    if (p.moveIn) out.push({ id: p.id, street: p.street, city: p.city, state: p.state, zip: p.zip, from: p.moveIn, to: p.moveOut, current: false });
  }
  return out;
}
