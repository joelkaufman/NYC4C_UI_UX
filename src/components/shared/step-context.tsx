import * as React from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import type { ModuleId, StepIssue } from '@/domain/types';
import { api } from '@/mock/api';

interface StepContextValue {
  readOnly: boolean;
  issues: StepIssue[];
  /** Show every issue on the step, not only touched fields. */
  showAll: boolean;
  touched: Set<string>;
  touch(name: string): void;
  /** Reveal every issue under a prefix, e.g. when an entry editor is closed. */
  reveal(prefix: string): void;
  errorFor(name: string): string | undefined;
  /** Count of visible errors whose target starts with any prefix. */
  visibleCount(prefixes: string[]): number;
}

const StepContext = React.createContext<StepContextValue | null>(null);
/** Flushes the debounced draft save so issues reflect what is on screen. */
const FlushContext = React.createContext<() => void>(() => {});

export function useStepContext(): StepContextValue {
  const ctx = React.useContext(StepContext);
  if (!ctx) {
    return {
      readOnly: true,
      issues: [],
      showAll: false,
      touched: new Set(),
      touch: () => {},
      reveal: () => {},
      errorFor: () => undefined,
      visibleCount: () => 0,
    };
  }
  return ctx;
}

export function StepIssuesProvider({
  readOnly,
  issues,
  showAll,
  children,
}: {
  readOnly: boolean;
  issues: StepIssue[];
  showAll: boolean;
  children: React.ReactNode;
}) {
  const [touched, setTouched] = React.useState<Set<string>>(() => new Set());
  const value = React.useMemo<StepContextValue>(() => {
    const visible = (i: StepIssue) =>
      !readOnly &&
      (showAll ||
        touched.has(i.targetId) ||
        [...touched].some((t) => t.endsWith('.*') && i.targetId.startsWith(t.slice(0, -1))));
    const add = (name: string) =>
      setTouched((prev) => {
        if (prev.has(name)) return prev;
        const next = new Set(prev);
        next.add(name);
        return next;
      });
    return {
      readOnly,
      issues,
      showAll,
      touched,
      touch: add,
      reveal: (prefix) => add(`${prefix}.*`),
      errorFor: (name) => {
        const hit = issues.find((i) => i.targetId === name);
        return hit && visible(hit) ? hit.message : undefined;
      },
      visibleCount: (prefixes) =>
        issues.filter((i) => visible(i) && prefixes.some((p) => i.targetId === p || i.targetId.startsWith(`${p}.`))).length,
    };
  }, [readOnly, issues, showAll, touched]);
  return <StepContext.Provider value={value}>{children}</StepContext.Provider>;
}

/**
 * Wraps a step's form: react-hook-form state seeded from the store, auto-saved
 * (debounced 300ms) on every change, flushed on unmount.
 */
export function StepForm<T extends object>({
  requestId,
  moduleId,
  stepId,
  defaults,
  saved,
  readOnly,
  children,
}: {
  requestId: string;
  moduleId: ModuleId;
  stepId: string;
  defaults: T;
  saved: unknown;
  readOnly: boolean;
  children: React.ReactNode;
}) {
  const form = useForm<T>({
    defaultValues: { ...defaults, ...((saved as Partial<T>) ?? {}) } as never,
  });
  const flushRef = React.useRef<() => void>(() => {});

  React.useEffect(() => {
    if (readOnly) return;
    let timer: number | undefined;
    let pending: unknown = undefined;
    const flush = () => {
      window.clearTimeout(timer);
      if (pending !== undefined) {
        api.saveStepData(requestId, moduleId, stepId, pending);
        pending = undefined;
      }
    };
    flushRef.current = flush;
    const sub = form.watch((values) => {
      pending = structuredClone(values);
      window.clearTimeout(timer);
      timer = window.setTimeout(flush, 300);
    });
    return () => {
      sub.unsubscribe();
      flush();
      flushRef.current = () => {};
    };
  }, [form, readOnly, requestId, moduleId, stepId]);

  const flush = React.useCallback(() => flushRef.current(), []);

  return (
    <FlushContext.Provider value={flush}>
    <FormProvider {...form}>
      <form onSubmit={(e) => e.preventDefault()} noValidate className="contents">
        {children}
      </form>
    </FormProvider>
    </FlushContext.Provider>
  );
}

export function useFlush() {
  return React.useContext(FlushContext);
}

export interface BindProps<V = unknown> {
  id: string;
  name: string;
  value: V;
  onChange(value: V): void;
  onBlur(): void;
  error?: string;
  readOnly: boolean;
}

/** `bind('emergencyPhone')` → value/onChange/error/readOnly props for a field. */
export function useBind() {
  const { watch, setValue } = useFormContext();
  const ctx = useStepContext();
  const flush = React.useContext(FlushContext);
  return React.useCallback(
    <V = string,>(name: string): BindProps<V> => ({
      id: name,
      name,
      value: watch(name) as V,
      onChange: (v: V) => setValue(name, v, { shouldDirty: true }),
      onBlur: () => {
        flush();
        ctx.touch(name);
      },
      error: ctx.errorFor(name),
      readOnly: ctx.readOnly,
    }),
    [watch, setValue, ctx, flush],
  );
}
