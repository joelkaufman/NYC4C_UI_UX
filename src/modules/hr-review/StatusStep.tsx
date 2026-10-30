import { CalendarDays, CheckCircle2, Circle, Clock, Lock } from 'lucide-react';
import type { StepProps } from '@/domain/types';
import { formatDate } from '@/lib/format';

const CHECKLIST = [
  'Your identity matches your documents',
  'Your address history covers the last 5 years',
  'Background check results for you and household helpers',
  'Signed employment agreement and acknowledgments',
  'Certificates and trainings are current',
  'License is active, for licensed providers',
];

export function StatusStep({ instance, request }: StepProps) {
  const docsSigned = request.modules.reduce((n, m) => n + Object.values(m.esigns).filter((e) => e.status === 'signed').length, 0);
  const filesAccepted = request.modules.reduce((n, m) => n + Object.values(m.uploads).filter((u) => u.status === 'accepted').length, 0);
  if (instance.status === 'approved') {
    return (
      <div className="grid gap-6">
        <section className="rounded-xl bg-card p-6 sm:p-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-success-bg">
            <CheckCircle2 className="h-5 w-5 text-status-success-fg" aria-hidden />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-foreground">You're all set</h2>
          <p className="mt-1 max-w-[56ch] text-sm text-muted-foreground">
            HR approved your file on {formatDate(instance.approvedAt)}. Your onboarding is complete and every module is locked. You can still open any module to view what you submitted.
          </p>
          <dl className="mt-6 grid gap-4 border-t pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Your onboarding</dt>
              <dd className="mt-0.5 text-sm text-foreground tabular">
                {formatDate(request.createdAt)} to {formatDate(instance.approvedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Completed</dt>
              <dd className="mt-0.5 text-sm text-foreground tabular">
                {request.modules.length} modules · {docsSigned} documents signed · {filesAccepted} files accepted
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                Start date
              </dt>
              <dd className="mt-0.5 text-sm text-foreground">Your coordinator will confirm your start date</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Next step</dt>
              <dd className="mt-0.5 text-sm text-foreground">Watch for a scheduling call from your care coordinator</dd>
            </div>
          </dl>
        </section>
      </div>
    );
  }

  if (instance.status === 'locked_future') {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-[hsl(var(--field))] ring-1 ring-inset ring-[hsl(var(--field-edge))] p-6 text-sm text-muted-foreground">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        HR review starts automatically when Training & Certificates is approved.
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="rounded-xl bg-[hsl(var(--field))] ring-1 ring-inset ring-[hsl(var(--field-edge))] p-6 sm:p-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-info-bg">
          <Clock className="h-5 w-5 text-status-info-fg" aria-hidden />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Your file is with HR</h2>
        <p className="mt-1 max-w-[56ch] text-sm text-muted-foreground">
          Sent on {formatDate(instance.submittedAt)}. There is nothing for you to do right now. If HR needs something, the module that needs changes reopens with a message.
        </p>
      </section>
      <section className="rounded-xl bg-[hsl(var(--field))] ring-1 ring-inset ring-[hsl(var(--field-edge))] p-6">
        <h2 className="text-base font-semibold text-foreground">What HR checks</h2>
        <ul className="mt-4 grid gap-3">
          {CHECKLIST.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-neutral-700">
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
