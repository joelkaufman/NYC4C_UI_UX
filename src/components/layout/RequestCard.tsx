import { Link } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';
import type { ProviderRequest } from '@/domain/types';
import { currentModule } from '@/domain/lifecycle';
import { MODULE_TITLES } from '@/domain/module-titles';
import { Button } from '@/components/ui/button';
import { moduleStatusSpec, StatusBadge, type StatusSpec } from '@/components/shared/status';
import { AlertCircle, CheckCircle2, CircleDot, Clock } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ModuleTile } from '@/components/shared/ModuleTile';

export function requestStatus(r: ProviderRequest): StatusSpec {
  if (r.status === 'completed') return { tone: 'success', icon: CheckCircle2, label: 'Completed' };
  const needs = r.modules.some((m) => m.status === 'rejected' || Object.values(m.uploads).some((u) => u.status === 'rejected') || Object.values(m.esigns).some((e) => e.status === 'rejected'));
  if (needs) return { tone: 'danger', icon: AlertCircle, label: 'Needs attention' };
  const cur = currentModule(r);
  if (cur?.status === 'in_review') return { tone: 'info', icon: Clock, label: 'In review' };
  if (r.status === 'not_started') return { tone: 'neutral', icon: CircleDot, label: 'Not started' };
  return { tone: 'primary', icon: CircleDot, label: 'In progress' };
}


export function RequestCard({ request }: { request: ProviderRequest }) {
  const status = requestStatus(request);
  const approved = request.modules.filter((m) => m.status === 'approved').length;
  const total = request.modules.length;
  const cur = currentModule(request);
  const curDef = cur ? { title: MODULE_TITLES[cur.id] } : undefined;
  const action = request.status === 'completed' ? 'View' : request.status === 'not_started' ? 'Start' : 'Continue';
  const href = `/requests/${request.id}`;

  return (
    <article className="relative overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.05)]">
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-[-0.015em] text-foreground">
              <Link to={href} className="rounded-sm hover:underline focus-ring">
                {request.title}
              </Link>
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground tabular">Started {formatDate(request.createdAt)}</p>
          </div>
          <StatusBadge spec={status} />
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex flex-col gap-0.5 text-xs sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <span className="min-w-0 text-neutral-700">
              {cur && curDef ? (
                <span className="inline-flex items-center gap-2">
                  <ModuleTile id={cur.id} size="sm" className="h-6 w-6 [&_svg]:h-3.5 [&_svg]:w-3.5" />
                  <span>
                    Current: <span className="font-medium text-foreground">{curDef.title}</span> · {moduleStatusSpec[cur.status].label}
                  </span>
                </span>
              ) : (
                'All modules approved'
              )}
            </span>
            <span className="shrink-0 whitespace-nowrap text-muted-foreground tabular">
              {approved} of {total} approved
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200" role="progressbar" aria-valuenow={Math.round((approved / total) * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Modules approved">
            <div className="h-full rounded-full bg-[hsl(var(--lime))] transition-[width] duration-500 ease-out" style={{ width: `${(approved / total) * 100}%` }} />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <ul className="flex flex-wrap gap-1.5" aria-label="Modules">
            {request.modules.map((m) => {
              const spec = moduleStatusSpec[m.status];
              const Icon = m.status === 'locked_future' ? Lock : spec.icon;
              return (
                <li
                  key={m.id}
                  className={cn(
                    'inline-flex h-6 items-center gap-1 rounded-full border px-2 text-2xs font-medium',
                    m.status === 'locked_future' ? 'border-neutral-200 text-neutral-500' : 'border-transparent',
                    m.status !== 'locked_future' && {
                      'bg-status-success-bg text-status-success-fg': spec.tone === 'success',
                      'bg-status-danger-bg text-status-danger-fg': spec.tone === 'danger',
                      'bg-status-info-bg text-status-info-fg': spec.tone === 'info',
                      'bg-primary-subtle/60 text-primary': spec.tone === 'primary',
                      'bg-status-warning-bg text-status-warning-fg': spec.tone === 'warning',
                    },
                  )}
                  title={`${MODULE_TITLES[m.id]}: ${spec.label}`}
                >
                  <Icon className="h-3 w-3" aria-hidden />
                  {MODULE_TITLES[m.id]}
                  <span className="sr-only">: {spec.label}</span>
                </li>
              );
            })}
          </ul>
          <Button asChild variant={request.status === 'completed' ? 'outline' : 'default'} className="self-start sm:self-auto">
            <Link to={href}>
              {action}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
