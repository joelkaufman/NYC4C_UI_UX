import * as React from 'react';
import { cn } from '@/lib/utils';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Odometer-style number: each digit rolls to its new value, rolling up from zero on first paint.
 * Digits are keyed from the right so the ones place keeps rolling when the number gains a digit.
 */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [shown, setShown] = React.useState(0);
  React.useEffect(() => {
    // One frame at zero so the first value rolls in rather than appearing.
    const raf = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const chars = String(Math.max(0, Math.round(shown))).split('');
  return (
    <span className={cn('tabular inline-flex', className)}>
      <span className="sr-only">{value}</span>
      <span className="inline-flex" aria-hidden>
        {chars.map((d, i) => {
          const place = chars.length - 1 - i;
          return (
            // clip-path, not overflow, so the digit keeps its text baseline.
            <span key={place} className="relative inline-block [clip-path:inset(0)]">
              <span className="invisible">0</span>
              <span
                className="motion-digit absolute inset-x-0 top-0 flex flex-col"
                style={{ transform: `translateY(-${Number(d) * 10}%)`, transitionDelay: `${place * 70}ms` }}
              >
                {DIGITS.map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
