import { Link } from 'react-router-dom';
import { Check, ChevronLeft, Lock } from 'lucide-react';
import { useCountUp } from '@/hooks/use-count-up';
import type { ModuleModel } from '@/domain/progress';
import { stepHref } from '@/domain/progress';
import { toneText } from '@/components/shared/status';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { moduleRailMeta, moduleStatusText, requestProgress } from './module-status';
import { ModuleTile } from '@/components/shared/ModuleTile';

function RailCircle({ model, index, viewed }: { model: ModuleModel; index: number; viewed: boolean }) {
  const s = model.instance.status;
  const base = 'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular transition-colors duration-150';
  if (s === 'approved') {
    return (
      <span className={cn(base, 'bg-[hsl(var(--status-success-fg))] text-white shadow-[0_0_0_3px_hsl(var(--status-success-bg))]')} aria-hidden>
        <Check className="motion-check-pop h-4 w-4" strokeWidth={3.5} />
      </span>
    );
  }
  if (model.flagged) return <span className={cn(base, 'border-2 border-status-danger-fg bg-status-danger-bg text-status-danger-fg')} aria-hidden>!</span>;
  if (viewed || s === 'open') return <span className={cn(base, 'bg-primary text-primary-foreground')} aria-hidden>{index + 1}</span>;
  return <span className={cn(base, 'border-2 border-neutral-300 bg-card text-neutral-500')} aria-hidden>{index + 1}</span>;
}

/** Vertical numbered stepper of modules, joined by a rail that turns lime as modules are approved. */
export function ModuleList({
  requestId,
  models,
  viewedModuleId,
  onNavigate,
}: {
  requestId: string;
  models: ModuleModel[];
  viewedModuleId: string;
  onNavigate?(): void;
}) {
  return (
    <ol className="flex flex-col">
      {models.map((model, i) => {
        const { instance: m, def } = model;
        const viewed = m.id === viewedModuleId;
        const locked = m.status === 'locked_future';
        const previousTitle = i > 0 ? models[i - 1].def.title : undefined;
        const meta = moduleRailMeta(model);
        const last = i === models.length - 1;
        const statusText = moduleStatusText(model, previousTitle);

        const row = (
          <span
            className={cn('flex min-h-11 items-center gap-3 rounded-xl py-2 pr-3', viewed && '-ml-2 bg-primary-subtle pl-2')}
          >
            <RailCircle model={model} index={i} viewed={viewed} />
            <ModuleTile id={m.id} size="sm" muted={locked} />
            <span title={def.title} className={cn('min-w-0 flex-1 truncate text-sm leading-5', locked ? 'font-medium text-neutral-600' : viewed ? 'font-semibold text-primary' : 'font-semibold text-[hsl(var(--label))]')}>
              {def.title}
            </span>
            {m.status === 'approved' ? (
              <span className="sr-only">{meta.text}</span>
            ) : locked ? (
              <span className="shrink-0 text-neutral-500">
                <Lock className="h-3.5 w-3.5" aria-hidden />
                <span className="sr-only">{meta.text}</span>
              </span>
            ) : (
              <span className={cn('shrink-0 text-xs font-semibold tabular', toneText[meta.tone])}>{meta.text}</span>
            )}
          </span>
        );

        return (
          <li key={m.id} className="relative min-w-0">
            {!last ? (
              <span
                className={cn('absolute left-[13px] top-[30px] h-[calc(100%-16px)] w-0.5', m.status === 'approved' ? 'bg-[hsl(var(--status-success-fg))]' : 'bg-neutral-300')}
                aria-hidden
              />
            ) : null}
            {locked ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div tabIndex={0} aria-disabled aria-label={`${def.title}. Locked. Complete ${previousTitle} first.`} className="block cursor-not-allowed rounded-md focus-ring">
                    {row}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">Complete {previousTitle} first</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                to={stepHref(requestId, m.id)}
                onClick={onNavigate}
                aria-current={viewed ? 'page' : undefined}
                aria-label={`${def.title}. ${statusText}`}
                className="block rounded-md focus-ring"
              >
                {row}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Left rail: back link, request name, overall progress, then the module stepper. */
export function ModuleSidebar(props: Parameters<typeof ModuleList>[0] & { requestTitle: string; createdAt: string }) {
  const { pct, remaining } = requestProgress(props.models);
  const shownPct = useCountUp(pct);
  const current = props.models.find((m) => m.instance.status === 'open' || m.instance.status === 'rejected');
  return (
    <aside aria-label="Request progress" className="sticky top-14 hidden h-[calc(100dvh-56px)] -ml-3 w-[272px] shrink-0 overflow-y-auto py-8 pl-3 pr-1 lg:block xl:w-[292px]">
      <Link
        to="/"
        className="-ml-1 inline-flex h-9 items-center gap-0.5 rounded-lg px-1 text-[15px] text-primary transition-opacity hover:opacity-70 focus-ring"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
        My requests
      </Link>

      <h2 className="mt-5 text-[22px] font-semibold leading-7 tracking-[-0.02em] text-[hsl(var(--label))]">{props.requestTitle}</h2>
      <p className="mt-1 text-xs text-muted-foreground tabular">Started {formatDate(props.createdAt)}</p>

      <div className="mt-6">
        <div className="flex items-end justify-between">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="text-[28px] font-semibold leading-none tracking-[-0.02em] text-primary tabular" aria-label={`${pct}%`}>
            {shownPct}%
          </span>
        </div>
        <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-primary/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Overall progress">
          <div className="h-full rounded-full bg-[hsl(var(--lime))] transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2.5 text-[13px] text-muted-foreground">
          {remaining && current
            ? `${remaining} ${remaining === 1 ? 'item' : 'items'} left in ${current.def.title}`
            : pct === 100
              ? 'Every module is complete'
              : 'Waiting on HR'}
        </p>
      </div>

      <div className="mt-5">
        <ModuleList {...props} />
      </div>
    </aside>
  );
}
