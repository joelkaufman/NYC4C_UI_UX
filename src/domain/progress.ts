import type { ModuleDef, ModuleInstance, ModuleValidation, ProviderRequest, StepDef, StepIssue } from './types';
import { getModuleDef } from './registry';
import { currentModule, isDataEditable, isEditable, isSigning } from './lifecycle';
import { allIssues, isBlank } from './validation';

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
  /** Issues that are something to fix; excludes documents simply waiting for a signature. */
  problemCount: number;
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
        // Signatures still to collect are work to do, not problems.
        const onlyPendingSignatures = allIssues(validation).every(({ issue }) => issue.kind === 'esign_pending');
        state = validation.isComplete || instance.dataSubmittedAt ? 'complete' : left && !onlyPendingSignatures ? 'issues' : 'untouched';
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
  // Documents still waiting for a signature are work to do, not something to fix.
  const problemCount = allIssues(validation).filter(({ issue }) => issue.kind !== 'esign_pending').length;
  const flagged = editable && problemCount > 0 && (instance.status === 'rejected' || steps.some((s) => s.state === 'issues'));
  return { def, instance, validation, steps, done, total: steps.length, issueCount, problemCount, flagged };
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
 * The one step shown once a module's data is locked: its last step while documents are being signed,
 * then its preview step (the summary of everything done in the module), or the last step if it has none.
 */
export function lockedStep(def: ModuleDef, instance: ModuleInstance): StepDef {
  const last = def.steps[def.steps.length - 1];
  if (isSigning(instance)) return last;
  return def.steps.find((s) => s.kind === 'preview') ?? last;
}

/**
 * Editable module: its first step with issues, else its first step.
 * Submitted or completed (read-only) module: its locked step.
 */
export function moduleLandingStep(request: ProviderRequest, instance: ModuleInstance): string {
  const def = getModuleDef(instance.id);
  if (!isDataEditable(instance)) return lockedStep(def, instance).id;
  const v = def.validate(instance, request);
  const first = def.steps.find((s) => s.kind !== 'preview' && (v.stepIssues[s.id]?.length ?? 0) > 0);
  return first ? first.id : def.steps[0].id;
}

/**
 * Required items on one step: what is still missing, plus every filled value, upload or signature
 * whose removal would make it missing. Steps only report what is missing, so the filled side is probed.
 */
export function stepProgress(step: StepDef, instance: ModuleInstance, request: ProviderRequest): { done: number; total: number } {
  if (!step.issues) return { done: 0, total: 0 };
  const check = step.issues;
  const data = instance.data[step.id];
  const missing = check(data, instance, request);
  const flagsMissing = (d: unknown, inst: ModuleInstance, target: string) => check(d, inst, request).some((i) => i.targetId === target);

  let done = 0;
  for (const path of filledPaths(data)) {
    if (flagsMissing(withoutPath(data, path), instance, path.join('.'))) done += 1;
  }
  for (const [id, item] of Object.entries(instance.uploads)) {
    if (item.status === 'missing' || item.status === 'rejected') continue;
    const uploads = { ...instance.uploads };
    delete uploads[id];
    if (flagsMissing(data, { ...instance, uploads }, id)) done += 1;
  }
  for (const [id, item] of Object.entries(instance.esigns)) {
    if (item.status !== 'signed') continue;
    const esigns = { ...instance.esigns };
    delete esigns[id];
    if (flagsMissing(data, { ...instance, esigns }, id)) done += 1;
  }
  return { done, total: done + missing.length };
}

function filledPaths(value: unknown, prefix: (string | number)[] = []): (string | number)[][] {
  if (Array.isArray(value)) return value.flatMap((v, i) => filledPaths(v, [...prefix, i]));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => filledPaths(v, [...prefix, k]));
  return prefix.length && !isBlank(value) ? [prefix] : [];
}

function withoutPath(value: unknown, path: (string | number)[]): unknown {
  if (!path.length) return undefined;
  const [head, ...rest] = path;
  if (Array.isArray(value)) return value.map((v, i) => (i === head ? withoutPath(v, rest) : v));
  const obj = (value ?? {}) as Record<string, unknown>;
  return { ...obj, [head]: withoutPath(obj[head], rest) };
}
