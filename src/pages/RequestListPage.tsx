import * as React from 'react';
import { AlertCircle, CheckCircle2, CircleDot } from 'lucide-react';
import { useStore } from '@/mock/store';
import { RequestCard, requestStatus } from '@/components/layout/RequestCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { api } from '@/mock/api';

export function RequestListPage() {
  const requests = useStore((s) => s.requests);
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    // Simulate the list fetch so the loading state is real.
    const t = window.setTimeout(() => setReady(true), 350);
    return () => window.clearTimeout(t);
  }, []);
  const provider = useStore((s) => s.provider);
  const firstName = provider.name.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const counts = requests.reduce(
    (acc, r) => {
      const s = requestStatus(r).label;
      if (s === 'Needs attention') acc.attention += 1;
      else if (s === 'Completed') acc.done += 1;
      else acc.open += 1;
      return acc;
    },
    { attention: 0, open: 0, done: 0 },
  );
  const parts = [
    counts.attention ? `${counts.attention} ${counts.attention === 1 ? 'request needs' : 'requests need'} your attention` : null,
    counts.open ? `${counts.open} in progress` : null,
    counts.done ? `${counts.done} complete` : null,
  ].filter(Boolean);
  const summary = requests.length ? `${parts.join(' · ')}.` : 'Your onboarding requests appear here.';
  const sorted = [...requests].sort((a, b) => Number(a.status === 'completed') - Number(b.status === 'completed'));

  return (
    <div className="mx-auto w-full max-w-[960px] px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <h1 className="text-[34px] font-bold leading-10 tracking-[-0.03em] text-[hsl(var(--label))]">
          {greeting}, {firstName}
        </h1>
        {requests.length ? (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Summary">
            {counts.attention ? (
              <li className="inline-flex h-7 items-center gap-1.5 rounded-full bg-status-danger-bg px-3 text-[13px] font-medium text-status-danger-fg">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden />
                {counts.attention} needs attention
              </li>
            ) : null}
            {counts.open ? (
              <li className="inline-flex h-7 items-center gap-1.5 rounded-full bg-[hsl(var(--highlight-soft))] px-3 text-[13px] font-medium text-[hsl(var(--highlight))]">
                <CircleDot className="h-3.5 w-3.5" aria-hidden />
                {counts.open} in progress
              </li>
            ) : null}
            {counts.done ? (
              <li className="inline-flex h-7 items-center gap-1.5 rounded-full bg-status-success-bg px-3 text-[13px] font-medium text-status-success-fg">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                {counts.done} complete
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="mt-1 text-[15px] text-muted-foreground">{summary}</p>
        )}
      </header>
      {!ready ? (
        <div className="grid gap-4" aria-busy>
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-6">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="mt-2 h-3 w-32" />
              <Skeleton className="mt-6 h-1 w-full" />
              <div className="mt-6 flex gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length ? (
        <div className="grid gap-4">
          {sorted.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-neutral-300 p-6">
          <p className="text-sm text-muted-foreground">You have no requests. When HR starts a process for you it appears here.</p>
          <Button variant="outline" size="sm" onClick={() => api.admin.resetDemoData()}>
            Restore demo data
          </Button>
        </div>
      )}
    </div>
  );
}
