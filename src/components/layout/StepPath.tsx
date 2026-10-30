import * as React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import type { StepStatus } from '@/domain/progress';
import { cn } from '@/lib/utils';

export function StepCircle({ status, current, className }: { status: StepStatus; current: boolean; className?: string }) {
  const { state, index } = status;
  const issues = state === 'issues';
  return (
    <span
      className={cn(
        'relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-semibold tabular transition-colors duration-150',
        issues && 'border-2 border-status-danger-fg bg-status-danger-bg text-status-danger-fg',
        !issues && current && 'bg-primary text-primary-foreground',
        !issues && !current && state === 'complete' && 'border-2 border-status-success-fg bg-card text-status-success-fg',
        !issues && !current && state === 'untouched' && 'border-2 border-neutral-300 bg-card text-neutral-500',
        className,
      )}
      aria-hidden
    >
      {issues ? (
        <span key="issue" className="motion-check-pop">!</span>
      ) : state === 'complete' && !current ? (
        <Check key="done" className="motion-check-pop h-3.5 w-3.5" strokeWidth={3} />
      ) : (
        index + 1
      )}
    </span>
  );
}

export function stepStateLabel(s: StepStatus, current: boolean) {
  const base = s.state === 'issues' ? `${s.issues.length === 1 ? '1 item needs' : `${s.issues.length} items need`} attention` : s.state === 'complete' ? 'Complete' : 'Not started';
  return current ? `Current step, ${base.toLowerCase()}` : base;
}

/** Sub-step tabs: circle + label, chevrons between, lime underline on the current step. Arrow keys move. */
export function StepPath({
  steps,
  currentStepId,
  onSelect,
  label,
}: {
  steps: StepStatus[];
  currentStepId: string;
  onSelect(stepId: string): void;
  label: string;
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = Math.min(steps.length - 1, i + 1);
    if (e.key === 'ArrowLeft') next = Math.max(0, i - 1);
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = steps.length - 1;
    if (next >= 0) {
      e.preventDefault();
      refs.current[next]?.focus();
    }
  };

  return (
    <nav aria-label={label} className="min-w-0 overflow-x-auto">
      <ol className="flex items-stretch">
        {steps.map((s, i) => {
          const current = s.step.id === currentStepId;
          return (
            <li key={s.step.id} className="flex shrink-0 items-stretch">
              {i > 0 ? <ChevronRight className="mx-0.5 h-4 w-4 self-center text-neutral-400 xl:mx-1" aria-hidden /> : null}
              <button
                ref={(el) => (refs.current[i] = el)}
                type="button"
                onClick={() => onSelect(s.step.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                aria-current={current ? 'step' : undefined}
                aria-label={`Step ${i + 1}: ${s.step.title}. ${stepStateLabel(s, current)}`}
                className={cn(
                  'group -mb-px flex h-12 items-center gap-2 border-b-[3px] px-2 transition-colors xl:px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                  current ? 'border-[hsl(var(--lime))]' : 'border-transparent hover:border-neutral-200',
                )}
              >
                <StepCircle status={s} current={current} />
                <span
                  className={cn(
                    'whitespace-nowrap text-[13px] xl:text-sm',
                    current ? 'font-semibold text-primary' : s.state === 'issues' ? 'text-status-danger-fg' : 'text-neutral-700 group-hover:text-foreground',
                  )}
                >
                  {s.step.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
