import { AlertCircle, ClipboardCheck, GraduationCap, ShieldCheck, UserRound, type LucideIcon } from 'lucide-react';
import type { ModuleId } from '@/domain/types';
import type { ModuleModel } from '@/domain/progress';
import { moduleStatusSpec, type StatusSpec, type Tone } from '@/components/shared/status';

const plural = (n: number) => (n === 1 ? '1 item' : `${n} items`);

/** Status triplet for a module row/badge; an open module with showing issues reads as danger. */
export function moduleSpec(model: ModuleModel): StatusSpec {
  if (model.flagged) return { tone: 'danger', icon: AlertCircle, label: 'Needs attention' };
  return moduleStatusSpec[model.instance.status];
}
import { formatDate } from '@/lib/format';

export function moduleStatusText(model: ModuleModel, previousTitle?: string): string {
  const { instance: m, done, total } = model;
  switch (m.status) {
    case 'locked_future':
      return previousTitle ? `Complete ${previousTitle} first` : 'Locked';
    case 'open':
      if (model.flagged) return `${plural(model.problemCount)} ${model.problemCount === 1 ? 'needs' : 'need'} attention`;
      if (total === 1) return model.issueCount ? `${plural(model.issueCount)} to complete` : 'Ready to submit';
      return `${done} of ${total} steps complete`;
    case 'rejected':
      if (model.problemCount) return `${plural(model.problemCount)} ${model.problemCount === 1 ? 'needs' : 'need'} attention`;
      return model.issueCount ? `${plural(model.issueCount)} to complete` : 'Ready to submit';
    case 'in_review':
      return m.id === 'hr_review' ? `With HR since ${formatDate(m.submittedAt)}` : `In review since ${formatDate(m.submittedAt)}`;
    case 'approved':
      return m.id === 'background_check'
        ? `Approved · check ${m.backgroundCheckCleared ? 'cleared' : 'pending'}`
        : `Approved ${formatDate(m.approvedAt)}`;
    case 'revert_requested':
      return 'Change requested';
  }
}

export function moduleProgressValue(model: ModuleModel): number {
  const s = model.instance.status;
  if (s === 'approved' || s === 'in_review' || s === 'revert_requested') return 1;
  if (s === 'locked_future') return 0;
  return model.total ? model.done / model.total : 0;
}

export function moduleTone(model: ModuleModel): Tone {
  if (model.flagged) return 'danger';
  switch (model.instance.status) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'in_review':
      return 'info';
    case 'revert_requested':
      return 'warning';
    case 'open':
      return 'primary';
    default:
      return 'neutral';
  }
}


/** One shared brand green for every module: the system uses a single colour family, not per-module hues. */
const MODULE_GREEN = { fg: '#03682F', bg: '#E9F5E5', wash: '#F4FAF1', ink: '#005223' };
export const MODULE_HUES: Record<ModuleId, { fg: string; bg: string; wash: string; ink: string }> = {
  information: MODULE_GREEN,
  background_check: MODULE_GREEN,
  training: MODULE_GREEN,
  hr_review: MODULE_GREEN,
};

export const MODULE_ICONS: Record<ModuleId, LucideIcon> = {
  information: UserRound,
  background_check: ShieldCheck,
  training: GraduationCap,
  hr_review: ClipboardCheck,
};

/** Short right-hand count/state for a rail row, in the reference's "10/13 · Locked" register. */
export function moduleRailMeta(model: ModuleModel): { text: string; tone: Tone } {
  const s = model.instance.status;
  if (s === 'locked_future') return { text: 'Locked', tone: 'warning' };
  if (s === 'approved') return { text: 'Approved', tone: 'success' };
  if (s === 'in_review') return { text: 'In review', tone: 'info' };
  if (s === 'revert_requested') return { text: 'Change requested', tone: 'warning' };
  if (model.flagged) return { text: `${model.problemCount} to fix`, tone: 'danger' };
  return { text: `${model.done}/${model.total}`, tone: 'success' };
}

/** Whole-request progress: share of steps complete, counting approved modules in full. */
export function requestProgress(models: ModuleModel[]) {
  let done = 0;
  let total = 0;
  for (const m of models) {
    total += m.total;
    done += m.instance.status === 'approved' || m.instance.status === 'in_review' || m.instance.status === 'revert_requested' ? m.total : m.done;
  }
  const current = models.find((m) => m.instance.status === 'open' || m.instance.status === 'rejected');
  return { pct: total ? Math.round((done / total) * 100) : 0, remaining: current?.issueCount ?? 0 };
}
