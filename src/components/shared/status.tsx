import type { LucideIcon } from 'lucide-react';
import { AlertCircle, AlertTriangle, CheckCircle2, CircleDot, Clock, Loader2, Lock, RotateCcw } from 'lucide-react';
import type { ESignStatus, ModuleStatus, UploadStatus } from '@/domain/types';
import { cn } from '@/lib/utils';

/** One status vocabulary for every surface: request cards, sidebar, step path, uploads, e-sign. */
export type Tone = 'neutral' | 'primary' | 'danger' | 'info' | 'success' | 'warning';

export const toneText: Record<Tone, string> = {
  neutral: 'text-status-neutral-fg',
  primary: 'text-primary',
  danger: 'text-status-danger-fg',
  info: 'text-status-info-fg',
  success: 'text-status-success-fg',
  warning: 'text-status-warning-fg',
};

export const toneBadge: Record<Tone, string> = {
  neutral: 'bg-status-neutral-bg text-status-neutral-fg',
  primary: 'bg-primary-subtle/60 text-primary',
  danger: 'bg-status-danger-bg text-status-danger-fg',
  info: 'bg-status-info-bg text-status-info-fg',
  success: 'bg-status-success-bg text-status-success-fg',
  warning: 'bg-status-warning-bg text-status-warning-fg',
};

export const toneBar: Record<Tone, string> = {
  neutral: 'bg-neutral-300',
  primary: 'bg-primary',
  danger: 'bg-status-danger-fg',
  info: 'bg-status-info-fg',
  success: 'bg-status-success-fg',
  warning: 'bg-status-warning-fg',
};

export interface StatusSpec {
  tone: Tone;
  icon: LucideIcon;
  label: string;
}

export const moduleStatusSpec: Record<ModuleStatus, StatusSpec> = {
  locked_future: { tone: 'neutral', icon: Lock, label: 'Locked' },
  open: { tone: 'primary', icon: CircleDot, label: 'In progress' },
  in_review: { tone: 'info', icon: Clock, label: 'In review' },
  rejected: { tone: 'danger', icon: AlertCircle, label: 'Needs attention' },
  approved: { tone: 'success', icon: CheckCircle2, label: 'Approved' },
  revert_requested: { tone: 'warning', icon: RotateCcw, label: 'Change requested' },
};

export const uploadStatusSpec: Record<UploadStatus, StatusSpec> = {
  missing: { tone: 'neutral', icon: CircleDot, label: 'Not uploaded' },
  uploaded: { tone: 'info', icon: Clock, label: 'Uploaded' },
  rejected: { tone: 'danger', icon: AlertCircle, label: 'Rejected' },
  accepted: { tone: 'success', icon: CheckCircle2, label: 'Accepted' },
};

export const esignStatusSpec: Record<ESignStatus, StatusSpec> = {
  preparing: { tone: 'neutral', icon: Loader2, label: 'Preparing' },
  waiting_for_signature: { tone: 'primary', icon: CircleDot, label: 'Ready to sign' },
  signed: { tone: 'success', icon: CheckCircle2, label: 'Signed' },
  rejected: { tone: 'danger', icon: AlertCircle, label: 'Rejected' },
};

export const warningSpec: StatusSpec = { tone: 'warning', icon: AlertTriangle, label: 'Warning' };

export function StatusBadge({
  spec,
  label,
  className,
  spin,
}: {
  spec: StatusSpec;
  label?: string;
  className?: string;
  spin?: boolean;
}) {
  const Icon = spec.icon;
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-2xs font-medium',
        toneBadge[spec.tone],
        className,
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', spin && 'animate-spin')} aria-hidden />
      {label ?? spec.label}
    </span>
  );
}

export function StatusIcon({ spec, className }: { spec: StatusSpec; className?: string }) {
  const Icon = spec.icon;
  return <Icon className={cn('h-4 w-4 shrink-0', toneText[spec.tone], className)} aria-label={spec.label} />;
}

export function ProgressBar({ value, tone = 'primary', className, label }: { value: number; tone?: Tone; className?: string; label?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={cn('h-0.5 w-full overflow-hidden rounded-full bg-neutral-200', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out', toneBar[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}
