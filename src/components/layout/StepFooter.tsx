import type * as React from 'react';
import { AlertCircle, ArrowDown, ArrowLeft, ArrowRight, CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FooterPrimary {
  label: string;
  onClick(): void;
  disabled?: boolean;
  loading?: boolean;
  arrow?: boolean;
  hint?: string;
}

/** Sticky footer inside the content area: Back left, attention jump centre, primary right. */
export function StepFooter({
  onBack,
  primary,
  attention,
  attentionTone = 'danger',
  onAttention,
  note,
  progress,
}: {
  onBack?(): void;
  primary?: FooterPrimary;
  attention?: number;
  /** danger when issues are showing; neutral while required work is simply not done yet. */
  attentionTone?: 'danger' | 'neutral';
  onAttention?(): void;
  note?: React.ReactNode;
  /** Required items done on the current step. Drawn as a hairline along the top edge. */
  progress?: { done: number; total: number };
}) {
  if (!onBack && !primary && !attention && !note) return null;
  return (
    <div className="sticky bottom-0 z-10 border-t bg-card lg:rounded-b-2xl shadow-[0_-1px_3px_0_rgb(15_23_42/0.06)]">
      {progress && progress.total > 0 ? (
        <div
          className="absolute inset-x-0 -top-px h-[3px] bg-[hsl(var(--lime)/0.15)]"
          role="progressbar"
          aria-valuenow={progress.done}
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-label={`${progress.done} of ${progress.total} required items on this step complete`}
        >
          <div
            className="h-full rounded-r-full bg-[hsl(var(--lime))] transition-[width] duration-500 ease-out"
            style={{ width: `${(progress.done / progress.total) * 100}%` }}
          />
        </div>
      ) : null}
      <div className="step-measure flex h-16 w-full items-center gap-2 px-4 sm:px-6">
        <div className="flex-1">
          {onBack ? (
            <Button type="button" variant="ghost" onClick={onBack}>
              <ArrowLeft aria-hidden />
              Back
            </Button>
          ) : null}
        </div>
        <div className="flex min-w-0 shrink justify-center">
          {attention ? (
            <button
              type="button"
              onClick={onAttention}
              title="Go to the next item"
              className={
                attentionTone === 'danger'
                  ? 'inline-flex h-9 items-center gap-1.5 rounded-full bg-status-danger-bg px-3.5 text-xs font-medium text-status-danger-fg transition-colors hover:bg-status-danger-fg/15 focus-ring sm:text-sm'
                  : 'inline-flex h-9 items-center gap-1.5 rounded-full bg-[hsl(var(--field))] px-3.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-[hsl(var(--field-hover))] focus-ring sm:text-sm'
              }
            >
              {attentionTone === 'danger' ? <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> : <CircleDot className="h-4 w-4 shrink-0" aria-hidden />}
              <span className="truncate">
                {attentionTone === 'danger'
                  ? attention === 1
                    ? '1 needs attention'
                    : `${attention} need attention`
                  : `${attention} to complete`}
              </span>
              <ArrowDown className="hidden h-3.5 w-3.5 shrink-0 opacity-70 sm:block" aria-hidden />
            </button>
          ) : note ? (
            <span className="truncate text-xs text-muted-foreground">{note}</span>
          ) : null}
        </div>
        <div className="flex flex-1 justify-end">
          {primary ? (
            <Button type="button" onClick={primary.onClick} disabled={primary.disabled} loading={primary.loading} title={primary.hint}>
              {primary.label}
              {primary.arrow && !primary.loading ? <ArrowRight aria-hidden /> : null}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
