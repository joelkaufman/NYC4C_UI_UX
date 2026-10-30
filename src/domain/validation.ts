import type { ZodTypeAny } from 'zod';
import { z } from 'zod';
import type {
  ESignItemDef,
  ModuleDef,
  ModuleInstance,
  ModuleValidation,
  ProviderRequest,
  StepIssue,
  UploadSlotDef,
} from './types';

export function isBlank(v: unknown): boolean {
  return v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || v === false;
}

/** Add a custom issue for every listed key that is blank. */
export function requireKeys(
  ctx: z.RefinementCtx,
  obj: Record<string, unknown> | undefined,
  fields: Record<string, string>,
  prefix: (string | number)[] = [],
) {
  for (const [key, message] of Object.entries(fields)) {
    if (isBlank(obj?.[key])) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [...prefix, key], message });
  }
}

/** A permissive object schema whose refinements produce the step's issues. */
export function stepSchema<T>(refine: (data: Partial<T>, ctx: z.RefinementCtx) => void) {
  return z
    .record(z.unknown())
    .superRefine((data, ctx) => refine(data as Partial<T>, ctx));
}

export function issuesFromSchema(schema: ZodTypeAny, data: unknown): StepIssue[] {
  const res = schema.safeParse(data ?? {});
  if (res.success) return [];
  const seen = new Set<string>();
  const out: StepIssue[] = [];
  for (const i of res.error.issues) {
    const targetId = i.path.join('.');
    if (seen.has(targetId)) continue;
    seen.add(targetId);
    out.push({ kind: 'missing_required', targetId, message: i.message });
  }
  return out;
}

export function uploadIssues(instance: ModuleInstance, slots: UploadSlotDef[]): StepIssue[] {
  const out: StepIssue[] = [];
  for (const slot of slots) {
    const item = instance.uploads[slot.id];
    if (item?.status === 'rejected') {
      out.push({ kind: 'rejected_upload', targetId: slot.id, message: `${slot.label} was rejected. Upload a replacement.` });
    } else if (slot.required && (!item || item.status === 'missing')) {
      out.push({ kind: 'missing_required', targetId: slot.id, message: `Upload ${lowerFirst(slot.label)}` });
    }
  }
  return out;
}

export function esignIssues(instance: ModuleInstance, items: ESignItemDef[]): StepIssue[] {
  const out: StepIssue[] = [];
  for (const def of items) {
    const item = instance.esigns[def.id];
    if (item?.status === 'rejected') {
      out.push({ kind: 'esign_rejected', targetId: def.id, message: `${def.title} was rejected. Request a new document.` });
    } else if (def.required && item?.status !== 'signed') {
      out.push({ kind: 'esign_pending', targetId: def.id, message: `Sign the ${def.title}` });
    }
  }
  return out;
}

/** Validate every step of a module from its saved data. */
export function validateSteps(def: ModuleDef, instance: ModuleInstance, request: ProviderRequest): ModuleValidation {
  const stepIssues: Record<string, StepIssue[]> = {};
  let total = 0;
  for (const step of def.steps) {
    if (step.kind === 'preview') continue;
    const issues = step.issues ? step.issues(instance.data[step.id], instance, request) : [];
    stepIssues[step.id] = issues;
    total += issues.length;
  }
  for (const step of def.steps) {
    if (step.kind === 'preview') stepIssues[step.id] = [];
  }
  return { stepIssues, isComplete: total === 0 };
}

export function allIssues(v: ModuleValidation): { stepId: string; issue: StepIssue }[] {
  return Object.entries(v.stepIssues).flatMap(([stepId, list]) => list.map((issue) => ({ stepId, issue })));
}

function lowerFirst(s: string) {
  return /^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;
}
