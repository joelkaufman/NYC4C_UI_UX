import * as React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import type { ModuleModel, StepStatus } from '@/domain/progress';
import { stepHref } from '@/domain/progress';
import type { StepIssue } from '@/domain/types';
import { ProgressBar, StatusIcon, toneText } from '@/components/shared/status';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { moduleProgressValue, moduleSpec, moduleStatusText, moduleTone } from './module-status';
import { StepCircle, stepStateLabel } from './StepPath';

/** Header strip: the five modules as connected segments (queue layout). */
export function ModuleStrip({ requestId, models, viewedModuleId }: { requestId: string; models: ModuleModel[]; viewedModuleId: string }) {
  return (
    <nav aria-label="Modules" className="min-w-0 flex-1">
      <ol className="flex items-stretch gap-1.5">
        {models.map((model, i) => {
          const { instance: m, def } = model;
          const locked = m.status === 'locked_future';
          const viewed = m.id === viewedModuleId;
          const spec = moduleSpec(model);
          const tone = moduleTone(model);
          const inner = (
            <>
              <span className="flex items-center gap-1.5">
                {locked ? <Lock className="h-3.5 w-3.5 shrink-0 text-neutral-500" aria-hidden /> : <StatusIcon spec={spec} className="h-3.5 w-3.5" />}
                <span className={cn('truncate text-xs font-medium', viewed ? 'text-foreground' : locked ? 'text-neutral-500' : 'text-neutral-700')}>
                  {i + 1}. {def.title}
                </span>
              </span>
              <ProgressBar value={moduleProgressValue(model)} tone={locked ? 'neutral' : tone} className="mt-1.5" />
            </>
          );
          return (
            <li key={m.id} className="min-w-0 flex-1">
              {locked ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div tabIndex={0} aria-disabled className="block cursor-not-allowed rounded-md px-2 py-1.5 focus-ring">
                      {inner}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Complete {models[i - 1]?.def.title} first</TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  to={stepHref(requestId, m.id)}
                  aria-current={viewed ? 'page' : undefined}
                  className={cn('block rounded-md px-2 py-1.5 transition-colors focus-ring', viewed ? 'bg-primary-subtle/50' : 'hover:bg-neutral-100')}
                >
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

interface QueueItem {
  stepId: string;
  stepTitle: string;
  issue: StepIssue;
  flagged: boolean;
}

/** Left rail led by the single next action, then everything open, then the steps (queue layout). */
export function QueueRail({
  model,
  currentStepId,
  onJump,
  onSelectStep,
}: {
  model: ModuleModel;
  currentStepId: string;
  onJump(stepId: string, targetId: string): void;
  onSelectStep(stepId: string): void;
}) {
  const editable = model.instance.status === 'open' || model.instance.status === 'rejected';
  const items: QueueItem[] = model.steps.flatMap((s) =>
    s.issues.map((issue) => ({ stepId: s.step.id, stepTitle: s.step.title, issue, flagged: s.state === 'issues' || model.instance.status === 'rejected' })),
  );
  const ordered = [...items.filter((i) => i.flagged), ...items.filter((i) => !i.flagged)];
  const next = ordered[0];
  const rest = ordered.slice(1);

  return (
    <aside aria-label="What to do next" className="sticky top-[120px] hidden h-[calc(100dvh-120px)] w-[320px] shrink-0 overflow-y-auto border-r bg-background px-4 py-6 lg:block">
      {editable && next ? (
        <section aria-label="Next up">
          <h2 className="px-1 text-xs font-medium text-muted-foreground">Next up</h2>
          <button
            type="button"
            onClick={() => onJump(next.stepId, next.issue.targetId)}
            className={cn(
              'group mt-2 w-full rounded-lg border bg-card p-4 text-left transition-colors focus-ring',
              next.flagged ? 'border-status-danger-fg/30 hover:border-status-danger-fg/60' : 'hover:border-neutral-300',
            )}
          >
            <span className={cn('flex items-center gap-1.5 text-xs', next.flagged ? toneText.danger : 'text-muted-foreground')}>
              {next.flagged ? <AlertCircle className="h-3.5 w-3.5" aria-hidden /> : null}
              {next.stepTitle}
            </span>
            <span className="mt-1 block text-sm font-medium text-foreground">{next.issue.message}</span>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
              Go to it
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:tranneutral-x-0.5" aria-hidden />
            </span>
          </button>
        </section>
      ) : editable ? (
        <div className="flex items-start gap-2 rounded-xl bg-status-success-bg p-4 text-sm text-status-success-fg">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Everything in {model.def.title} is complete. Submit it from the last step.
        </div>
      ) : null}

      {editable && rest.length ? (
        <section aria-label="Also open" className="mt-6">
          <h2 className="flex items-baseline justify-between px-1 text-xs font-medium text-muted-foreground">
            Also open <span className="tabular">{rest.length}</span>
          </h2>
          <ul className="mt-2 grid gap-0.5">
            {rest.map((it) => (
              <li key={`${it.stepId}-${it.issue.targetId}`}>
                <button
                  type="button"
                  onClick={() => onJump(it.stepId, it.issue.targetId)}
                  className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-neutral-100 focus-ring"
                >
                  {it.flagged ? (
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-danger-fg" aria-hidden />
                  ) : (
                    <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" aria-hidden />
                  )}
                  <span className="min-w-0">
                    <span className="block text-neutral-800">{it.issue.message}</span>
                    <span className="block text-muted-foreground">{it.stepTitle}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="Steps" className="mt-6 border-t pt-5">
        <h2 className="px-1 text-xs font-medium text-muted-foreground">
          Steps in {model.def.title} · {model.done} of {model.total} complete
        </h2>
        <ol className="mt-2 grid gap-0.5">
          {model.steps.map((s) => (
            <StepRow key={s.step.id} s={s} current={s.step.id === currentStepId} onSelect={() => onSelectStep(s.step.id)} />
          ))}
        </ol>
      </section>
    </aside>
  );
}

function StepRow({ s, current, onSelect, href }: { s: StepStatus; current: boolean; onSelect(): void; href?: string }) {
  return (
    <li>
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          onSelect();
        }}
        aria-current={current ? 'step' : undefined}
        className={cn('flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors focus-ring', current ? 'bg-primary-subtle/50' : 'hover:bg-neutral-100')}
      >
        <StepCircle status={s} current={current} className="h-5 w-5 text-2xs" />
        <span className={cn('min-w-0 flex-1 truncate text-sm', current ? 'font-medium text-foreground' : s.state === 'issues' ? 'text-status-danger-fg' : 'text-neutral-700')}>
          {s.step.title}
        </span>
        <span className="sr-only">{stepStateLabel(s, current)}</span>
      </a>
    </li>
  );
}

/** Module rail whose viewed module expands into a scroll-tracked step index (scroll layout). */
export function ScrollRail({
  requestId,
  models,
  viewed,
  activeStepId,
  onSelectStep,
}: {
  requestId: string;
  models: ModuleModel[];
  viewed: ModuleModel;
  activeStepId: string;
  onSelectStep(stepId: string): void;
}) {
  return (
    <aside aria-label="Modules" className="sticky top-[120px] hidden h-[calc(100dvh-120px)] w-[280px] shrink-0 overflow-y-auto border-r bg-background px-3 py-6 lg:block">
      <ol className="grid gap-0.5">
        {models.map((model, i) => {
          const { instance: m, def } = model;
          const locked = m.status === 'locked_future';
          const isViewed = m.id === viewed.instance.id;
          const spec = moduleSpec(model);
          return (
            <li key={m.id}>
              {locked ? (
                <div className="flex min-h-11 items-center gap-2 px-3 py-2 text-sm text-neutral-500" aria-disabled>
                  <span className="w-5 text-xs tabular">{i + 1}</span>
                  <span className="flex-1">{def.title}</span>
                  <Lock className="h-4 w-4" aria-hidden />
                </div>
              ) : (
                <Link
                  to={stepHref(requestId, m.id)}
                  aria-current={isViewed ? 'page' : undefined}
                  className={cn('flex min-h-11 items-center gap-2 rounded-md px-3 py-2 transition-colors focus-ring', isViewed ? 'font-medium text-foreground' : 'text-neutral-700 hover:bg-neutral-100')}
                >
                  <span className={cn('w-5 text-xs tabular', isViewed ? 'text-primary' : 'text-muted-foreground')}>{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm">{def.title}</span>
                    {!isViewed ? <span className={cn('block text-xs font-normal', moduleTone(model) === 'danger' ? toneText.danger : 'text-muted-foreground')}>{moduleStatusText(model)}</span> : null}
                  </span>
                  <StatusIcon spec={spec} />
                </Link>
              )}
              {isViewed ? (
                <ol className="mb-2 ml-[22px] mt-1 grid gap-0.5 border-l pl-3">
                  {viewed.steps.map((s) => (
                    <StepRow key={s.step.id} s={s} current={s.step.id === activeStepId} onSelect={() => onSelectStep(s.step.id)} />
                  ))}
                </ol>
              ) : null}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

/** Track the last section whose top has passed the line just below the sticky header. */
export function useActiveSection(ids: string[], initial: string) {
  const [active, setActive] = React.useState(initial);
  React.useEffect(() => {
    const onScroll = () => {
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(`section-${id}`);
        if (el && el.getBoundingClientRect().top <= 200) current = id;
      }
      setActive(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const t = window.setTimeout(onScroll, 120);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(t);
    };
  }, [ids.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  return [active, setActive] as const;
}
