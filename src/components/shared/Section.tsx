import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import type { HelperDef } from '@/domain/types';
import { cn } from '@/lib/utils';
import { HelperButton } from './HelperButton';
import { useStepContext } from './step-context';

/**
 * Titled card grouping fields by responsibility. When any field named in `fields`
 * shows an error, the card's header carries the count: one step of the attention thread.
 */
export function Section({
  title,
  description,
  helper,
  fields,
  readOnly: readOnlyProp,
  className,
  children,
  aside,
}: {
  title: string;
  description?: React.ReactNode;
  helper?: HelperDef;
  /** Field names (or name prefixes) inside this section, for its issue count. */
  fields?: string[];
  readOnly?: boolean;
  className?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  const ctx = useStepContext();
  const readOnly = readOnlyProp ?? ctx.readOnly;
  const count = fields?.length ? ctx.visibleCount(fields) : 0;
  const id = React.useId();
  return (
    <section
      aria-labelledby={id}
      className={cn(
        'border-t pt-8 first:border-t-0 first:pt-0',
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={id} className="text-[19px] font-semibold tracking-[-0.015em] text-[hsl(var(--label))]">
              {title}
            </h2>
            {count > 0 ? (
              <span className="motion-note-in inline-flex h-5 items-center gap-1 rounded-full bg-status-danger-bg px-2.5 text-2xs font-medium text-status-danger-fg">
                <AlertCircle className="h-3 w-3" aria-hidden />
                {count === 1 ? '1 item needs attention' : `${count} items need attention`}
              </span>
            ) : null}
          </div>
          {description ? <p className="mt-1 text-[13px] text-muted-foreground">{description}</p> : null}
        </div>
        {aside}
        {helper ? <HelperButton helper={helper} /> : null}
      </header>
      <div className={cn('mt-5 grid gap-4 [&>*]:min-w-0', readOnly && 'gap-y-5')}>{children}</div>
    </section>
  );
}
