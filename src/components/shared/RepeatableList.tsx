import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { AlertCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStepContext } from './step-context';

export interface EntrySummary {
  title: React.ReactNode;
  meta?: React.ReactNode;
  chips?: React.ReactNode;
}

/**
 * Add / edit / remove entries rendered as cards, one inline editor open at a time.
 * Entries live in react-hook-form under `name`; editors bind to `${name}.${index}.field`.
 */
export function RepeatableList<T extends { id: string }>({
  name,
  noun,
  addLabel,
  emptyText,
  min = 0,
  max,
  create,
  summary,
  renderEditor,
  renderReadOnly,
  renderAlways,
  extraIssuePrefixes,
  disabled,
}: {
  name: string;
  noun: string;
  addLabel: string;
  emptyText: string;
  min?: number;
  max?: number;
  create(): T;
  summary(item: T, index: number): EntrySummary;
  renderEditor(index: number, item: T): React.ReactNode;
  renderReadOnly(item: T, index: number): React.ReactNode;
  /** Rendered under every entry in edit and view states (e.g. a per-entry upload). */
  renderAlways?(item: T, index: number): React.ReactNode;
  extraIssuePrefixes?(item: T, index: number): string[];
  disabled?: boolean;
}) {
  const { watch, setValue } = useFormContext();
  const ctx = useStepContext();
  const items = ((watch(name) as T[] | undefined) ?? []).filter(Boolean);
  // Open the entry an issue link points at (?focus=name.index.field).
  const [editing, setEditing] = React.useState<string | null>(() => {
    const focus = new URLSearchParams(window.location.search).get('focus');
    const m = focus ? new RegExp(`^${name.replace(/\./g, '\\.')}\\.(\\d+)\\.`).exec(focus) : null;
    const list = ((watch(name) as T[] | undefined) ?? []).filter(Boolean);
    return m ? list[Number(m[1])]?.id ?? null : null;
  });
  const listRef = React.useRef<HTMLDivElement>(null);
  const readOnly = ctx.readOnly;
  const errorAtList = ctx.errorFor(name);

  const add = () => {
    const item = create();
    setValue(name, [...items, item], { shouldDirty: true });
    setEditing(item.id);
  };

  const close = (index: number) => {
    ctx.reveal(`${name}.${index}`);
    // Per-entry targets outside the entry's path (e.g. its upload slot) are revealed too.
    extraIssuePrefixes?.(items[index], index).forEach((p) => ctx.touch(p));
    setEditing(null);
  };

  const remove = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    setValue(name, next, { shouldDirty: true });
    setEditing(null);
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>('[data-add]')?.focus());
  };

  if (readOnly) {
    if (!items.length) return <p className="text-sm text-muted-foreground">None added.</p>;
    return (
      <div className="grid gap-3">
        {items.map((item, i) => (
          <div key={item.id} className="rounded-xl bg-[hsl(var(--field))] ring-1 ring-inset ring-[hsl(var(--field-edge))] p-4">
            {renderReadOnly(item, i)}
            {renderAlways ? <div className="mt-4">{renderAlways(item, i)}</div> : null}
          </div>
        ))}
      </div>
    );
  }

  const canAdd = !disabled && (max === undefined || items.length < max);

  return (
    <div ref={listRef} className="grid gap-3" id={name} tabIndex={-1}>
      {items.length === 0 ? (
        <div
          className={cn(
            'flex flex-col items-start gap-3 rounded-xl border-[1.5px] border-dashed border-neutral-300 px-4 py-5 sm:flex-row sm:items-center sm:justify-between',
            errorAtList && 'border-status-danger-fg/50',
          )}
        >
          <p className="text-sm text-muted-foreground">{emptyText}</p>
          {canAdd ? (
            <Button type="button" variant="outline" size="sm" onClick={add} data-add>
              <Plus aria-hidden />
              {addLabel}
            </Button>
          ) : null}
        </div>
      ) : null}

      {items.map((item, i) => {
        const prefixes = [`${name}.${i}`, ...(extraIssuePrefixes?.(item, i) ?? [])];
        const count = ctx.visibleCount(prefixes);
        const isEditing = editing === item.id;
        const s = summary(item, i);
        return (
          <div
            key={item.id}
            className={cn(
              'overflow-hidden rounded-xl ring-1 ring-inset transition-shadow',
              isEditing ? 'bg-card shadow-[0_2px_10px_rgba(16,40,48,0.08)] ring-[hsl(var(--primary)/0.35)]' : 'bg-[hsl(var(--field))] ring-[hsl(var(--field-edge))]',
              count > 0 && !isEditing && 'ring-status-danger-fg/40',
            )}
          >
            <div className="flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">{s.title}</span>
                  {s.chips}
                </div>
                {s.meta ? <div className="mt-0.5 text-xs text-muted-foreground tabular">{s.meta}</div> : null}
                {count > 0 && !isEditing ? (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-status-danger-fg">
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden />
                    {count === 1 ? '1 item needs attention' : `${count} items need attention`}
                  </p>
                ) : null}
              </div>
              {!isEditing ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(item.id)} aria-label={`Edit ${noun} ${i + 1}`}>
                    <Pencil aria-hidden />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  {items.length > min ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(i)}
                      aria-label={`Remove ${noun} ${i + 1}`}
                      className="text-muted-foreground hover:text-status-danger-fg"
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
            {isEditing ? (
              <div className="grid gap-4 border-t px-4 pb-4 pt-4">
                {renderEditor(i, item)}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  {items.length > min ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(i)}
                      className="text-status-danger-fg hover:bg-status-danger-bg"
                    >
                      <Trash2 aria-hidden />
                      Remove {noun}
                    </Button>
                  ) : (
                    <span />
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={() => close(i)}>
                    Done
                  </Button>
                </div>
              </div>
            ) : null}
            {renderAlways ? <div className="border-t px-4 py-4">{renderAlways(item, i)}</div> : null}
          </div>
        );
      })}

      {items.length > 0 && canAdd ? (
        <div>
          <Button type="button" variant="outline" size="sm" onClick={add} data-add>
            <Plus aria-hidden />
            {addLabel}
          </Button>
        </div>
      ) : null}
      {errorAtList ? (
        <p className="flex items-center gap-1.5 text-xs text-status-danger-fg">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden />
          {errorAtList}
        </p>
      ) : null}
    </div>
  );
}
