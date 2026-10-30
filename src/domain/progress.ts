import type { ModuleDef, ModuleInstance, ModuleValidation, ProviderRequest, StepDef, StepIssue } from './types';
import { getModuleDef } from './registry';
import { currentModule, isEditable } from './lifecycle';
import { allIssues } from './validation';

export type StepState = 'complete' | 'issues' | 'untouched';

export interface StepStatus {
  step: StepDef;
  index: number;
  issues: StepIssue[];
  state: StepState;
}

export interface ModuleModel {
  def: ModuleDef;
  instance: ModuleInstance;
  validation: ModuleValidation;
  steps: StepStatus[];
  done: number;
  total: number;
  issueCount: number;
  /** Editable module whose issues are showing at some level (visited, touched, rejected). */
  flagged: boolean;
}

function stepHasContent(instance: ModuleInstance, def: ModuleDef, step: StepDef, request: ProviderRequest): boolean {
  if (instance.data[step.id] !== undefined) return true;
  if (def.uploadSlots(request).some((s) => s.stepId === step.id && instance.uploads[s.id])) return true;
  return def.esignItems(request).some((e) => e.stepId === step.id && instance.esigns[e.id]);
}

export function buildModuleModel(
  request: ProviderRequest,
  instance: ModuleInstance,
  visited: Record<string, true>,
): ModuleModel {
  const def = getModuleDef(instance.id);
  const validation = def.validate(instance, request);
  const editable = isEditable(instance.status);
  const issueCount = allIssues(validation).length;

  const steps: StepStatus[] = def.steps.map((step, index) => {
    const issues = validation.stepIssues[step.id] ?? [];
    let state: StepState;
    if (instance.status === 'locked_future') state = 'untouched';
    else if (!editable) state = 'complete';
    else {
      // "Left" = the provider opened this step and moved on. Only that (or an HR rejection) turns a step red.
      const left = !!visited[`${request.id}:${instance.id}:${step.id}`];
      const flaggable = left || instance.status === 'rejected';
      const hasContent = left || stepHasContent(instance, def, step, request);
      if (step.kind === 'preview') {
        state = validation.isComplete ? 'complete' : left ? 'issues' : 'untouched';
      } else if (issues.length) {
        // Documents waiting for a signature are work to do, not problems; only a rejection flags them.
        const onlyPendingSignatures = issues.every((i) => i.kind === 'esign_pending');
        state = flaggable && !onlyPendingSignatures ? 'issues' : 'untouched';
      } else {
        state = hasContent || step.kind === 'esign' ? 'complete' : 'untouched';
      }
    }
    return { step, index, issues, state };
  });

  const done = steps.filter((s) => s.state === 'complete').length;
  const flagged = editable && issueCount > 0 && (instance.status === 'rejected' || steps.some((s) => s.state === 'issues'));
  return { def, instance, validation, steps, done, total: steps.length, issueCount, flagged };
}

/** Where opening a request should land: current module, first step with issues, else its first step. */
export function landingTarget(request: ProviderRequest): { moduleId: string; stepId: string } {
  const mod = currentModule(request) ?? request.modules[request.modules.length - 1];
  return { moduleId: mod.id, stepId: moduleLandingStep(request, mod) };
}

export function stepHref(requestId: string, moduleId: string, stepId?: string, focus?: string) {
  const path = `/requests/${requestId}/${moduleId}${stepId ? `/${stepId}` : ''}`;
  return `${path}${focus ? `?focus=${encodeURIComponent(focus)}` : ''}`;
}

/**
 * Editable module: its first step with issues, else its first step.
 * Completed (read-only) module: its last step, the summary of what was submitted.
 */
export function moduleLandingStep(request: ProviderRequest, instance: ModuleInstance): string {
  const def = getModuleDef(instance.id);
  if (!isEditable(instance.status)) return def.steps[def.steps.length - 1].id;
  const v = def.validate(instance, request);
  const first = def.steps.find((s) => s.kind !== 'preview' && (v.stepIssues[s.id]?.length ?? 0) > 0);
  return first ? first.id : def.steps[0].id;
}
