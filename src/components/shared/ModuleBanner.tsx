import type * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import type { ModuleInstance } from '@/domain/types';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toneBadge, type Tone } from './status';

function Banner({
  tone,
  icon: Icon,
  title,
  children,
  action,
  role = 'status',
}: {
  tone: Tone;
  icon: LucideIcon;
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  role?: 'status' | 'alert';
}) {
  return (
    <div role={role} className={cn('flex gap-3 rounded-xl px-4 py-3.5', toneBadge[tone])}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          {children ? <div className="mt-0.5 text-sm text-neutral-700">{children}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

function BannerAction({ onClick, children }: { onClick(): void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="rounded-sm text-sm font-medium underline underline-offset-[3px] hover:no-underline focus-ring">
      {children}
    </button>
  );
}

/** The right banner for a module's status; placed above the step title on every step. */
export function ModuleBanner({
  instance,
  moduleTitle,
  onRequestChanges,
  onGoToPreview,
}: {
  instance: ModuleInstance;
  moduleTitle: string;
  onRequestChanges?(): void;
  onGoToPreview?(): void;
}) {
  switch (instance.status) {
    case 'rejected':
      return (
        <Banner
          tone="danger"
          icon={AlertCircle}
          role="alert"
          title={`HR sent ${moduleTitle} back for changes`}
          action={onGoToPreview ? <BannerAction onClick={onGoToPreview}>Review and resubmit</BannerAction> : undefined}
        >
          {instance.rejectionMessage}
        </Banner>
      );
    case 'in_review':
      return (
        <Banner tone="info" icon={Clock} title={`Submitted for review on ${formatDate(instance.submittedAt)}`}>
          We'll notify you when it is approved. Waiting for review, so changes can't be requested yet.
        </Banner>
      );
    case 'approved':
      return (
        <Banner
          tone="success"
          icon={CheckCircle2}
          title={`Approved on ${formatDate(instance.approvedAt)}`}
          action={onRequestChanges ? <BannerAction onClick={onRequestChanges}>Request changes</BannerAction> : undefined}
        >
          {instance.revertDeclineNote ? (
            <>
              <span className="font-medium">Your change request was declined.</span> {instance.revertDeclineNote}
            </>
          ) : (
            instance.id === 'hr_review' ? 'Your onboarding is complete.' : 'This module is locked. What you submitted is shown read-only.'
          )}
        </Banner>
      );
    case 'revert_requested':
      return (
        <Banner tone="warning" icon={RotateCcw} title="Change request sent to admin">
          {instance.revertRequest ? (
            <>
              <span className="font-medium">Your reason:</span> {instance.revertRequest.reason}
            </>
          ) : null}{' '}
          The module stays read-only until HR responds.
        </Banner>
      );
    default:
      return null;
  }
}
