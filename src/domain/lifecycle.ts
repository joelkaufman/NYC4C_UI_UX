import type { ModuleId, ModuleInstance, ModuleStatus, ProviderRequest } from './types';

export const MODULE_ORDER: ModuleId[] = ['information', 'background_check', 'esign', 'training', 'hr_review'];

export function moduleIndex(id: ModuleId): number {
  return MODULE_ORDER.indexOf(id);
}

/**
 * The first module that is neither approved nor waiting on a change request;
 * undefined when the request is complete.
 */
export function currentModule(request: ProviderRequest): ModuleInstance | undefined {
  return request.modules.find((m) => m.status !== 'approved' && m.status !== 'revert_requested');
}

export function currentModuleId(request: ProviderRequest): ModuleId {
  return currentModule(request)?.id ?? request.modules[request.modules.length - 1].id;
}

export function isEditable(status: ModuleStatus): boolean {
  return status === 'open' || status === 'rejected';
}

export function isReadOnly(status: ModuleStatus): boolean {
  return !isEditable(status);
}

function moduleTouched(m: ModuleInstance): boolean {
  return Object.keys(m.data).length > 0 || Object.keys(m.uploads).length > 0 || Object.keys(m.esigns).length > 0;
}

export function recomputeStatus(request: ProviderRequest): ProviderRequest {
  const allApproved = request.modules.every((m) => m.status === 'approved');
  const touched = request.modules.some((m) => moduleTouched(m) || (m.status !== 'open' && m.status !== 'locked_future'));
  return { ...request, status: allApproved ? 'completed' : touched ? 'in_progress' : 'not_started' };
}

export function withModule(
  request: ProviderRequest,
  id: ModuleId,
  fn: (m: ModuleInstance) => ModuleInstance,
): ProviderRequest {
  return { ...request, modules: request.modules.map((m) => (m.id === id ? fn(m) : m)) };
}

function unlockNext(request: ProviderRequest, afterId: ModuleId, now: string): ProviderRequest {
  const idx = request.modules.findIndex((m) => m.id === afterId);
  const next = request.modules[idx + 1];
  if (!next || next.status !== 'locked_future') return request;
  if (next.id === 'hr_review') {
    // HR review auto-submits as soon as it unlocks.
    return withModule(request, next.id, (m) => ({
      ...m,
      status: 'in_review',
      submittedAt: now,
      rejectionMessage: undefined,
    }));
  }
  return withModule(request, next.id, (m) => ({ ...m, status: 'open' }));
}

export function approveModule(request: ProviderRequest, id: ModuleId, now: string): ProviderRequest {
  const r = withModule(request, id, (m) => ({
    ...m,
    status: 'approved',
    approvedAt: now,
    rejectionMessage: undefined,
    revertRequest: undefined,
  }));
  return recomputeStatus(unlockNext(r, id, now));
}

export function submitModule(request: ProviderRequest, id: ModuleId, now: string): ProviderRequest {
  const m = request.modules.find((x) => x.id === id);
  if (!m) return request;
  if (m.requiresReview) {
    return recomputeStatus(
      withModule(request, id, (x) => ({ ...x, status: 'in_review', submittedAt: now, rejectionMessage: undefined })),
    );
  }
  return approveModule(request, id, now);
}

/**
 * Reopen a module and lock every later module again. Data, uploads and e-signs are kept.
 */
export function reopenModule(
  request: ProviderRequest,
  id: ModuleId,
  status: 'open' | 'rejected',
  message?: string,
): ProviderRequest {
  const idx = moduleIndex(id);
  return recomputeStatus({
    ...request,
    modules: request.modules.map((m) => {
      const mi = moduleIndex(m.id);
      if (mi < idx) return m;
      if (mi === idx) {
        return {
          ...m,
          status,
          rejectionMessage: status === 'rejected' ? message : undefined,
          revertRequest: undefined,
          revertDeclineNote: undefined,
          approvedAt: undefined,
          submittedAt: undefined,
        };
      }
      return {
        ...m,
        status: 'locked_future',
        rejectionMessage: undefined,
        revertRequest: undefined,
        revertDeclineNote: undefined,
        approvedAt: undefined,
        submittedAt: undefined,
      };
    }),
  });
}
