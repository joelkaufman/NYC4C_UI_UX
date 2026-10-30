import { AlertCircle, ArrowRight } from 'lucide-react';
import type { StepIssue } from '@/domain/types';

export interface IssueRef {
  stepId: string;
  stepTitle: string;
  issue: StepIssue;
}

/** StepIssues with jump links, grouped by step. */
export function IssueList({ items, onJump, title }: { items: IssueRef[]; onJump(stepId: string, targetId: string): void; title?: string }) {
  if (!items.length) return null;
  const groups = new Map<string, IssueRef[]>();
  items.forEach((i) => groups.set(i.stepId, [...(groups.get(i.stepId) ?? []), i]));
  return (
    <div role="alert" className="overflow-hidden rounded-xl bg-status-danger-bg/70">
      <div className="flex items-center gap-2 px-4 pb-1 pt-3.5 text-status-danger-fg">
        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
        <p className="text-sm font-semibold">
          {title ?? (items.length === 1 ? '1 item needs attention before you can submit' : `${items.length} items need attention before you can submit`)}
        </p>
      </div>
      <div className="divide-y divide-status-danger-fg/10">
        {[...groups.entries()].map(([stepId, list]) => (
          <div key={stepId} className="px-4 py-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{list[0].stepTitle}</p>
            <ul className="grid gap-1">
              {list.map(({ issue }) => (
                <li key={`${issue.kind}-${issue.targetId}`}>
                  <button
                    type="button"
                    onClick={() => onJump(stepId, issue.targetId)}
                    className="group inline-flex items-center gap-1.5 rounded-sm text-left text-sm text-primary hover:underline focus-ring"
                  >
                    {issue.message}
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:tranneutral-x-0.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
