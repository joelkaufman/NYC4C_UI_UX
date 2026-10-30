import * as React from 'react';
import type { HelperDef } from '@/domain/types';
import { HelperButton } from './HelperButton';
import { cn } from '@/lib/utils';

/** Common step frame: banner, title, description, helpers, content, footer slot. */
export function StepShell({
  title,
  description,
  helpers,
  banner,
  meta,
  footer,
  titleInTabs = false,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  helpers?: HelperDef[];
  banner?: React.ReactNode;
  meta?: React.ReactNode;
  footer?: React.ReactNode;
  /** The sub-step tabs already name this step on desktop: keep the title for screen readers and phones only. */
  titleInTabs?: boolean;
  children: React.ReactNode;
}) {
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    // Move focus to the step title on step change for keyboard and screen reader users.
    const dialogOpen = !!document.querySelector('[role="dialog"][data-state="open"]');
    if (!dialogOpen && !new URLSearchParams(window.location.search).get('focus')) {
      headingRef.current?.focus({ preventScroll: true });
    }
  }, [title]);

  return (
    <div className="flex min-h-full flex-col">
      {banner ? <div className="step-measure px-4 pt-6 sm:px-6">{banner}</div> : null}
      <header
        className={cn(
          'step-measure flex flex-col gap-2 px-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6',
          titleInTabs ? 'pt-5 lg:pt-6' : 'border-b pb-6 pt-6',
        )}
      >
        <div className="min-w-0 flex-1">
          <h1 ref={headingRef} tabIndex={-1} className={cn('text-2xl font-semibold tracking-[-0.02em] text-[hsl(var(--label))] outline-none', titleInTabs && 'lg:sr-only')}>
            {title}
          </h1>
          {description ? <p className={cn('max-w-[68ch] text-[15px] text-muted-foreground', titleInTabs ? 'mt-1.5 lg:mt-0' : 'mt-1.5')}>{description}</p> : null}
          {meta ? <div className="mt-3">{meta}</div> : null}
        </div>
        {helpers?.length ? (
          <div className="-ml-2.5 flex flex-wrap gap-1 sm:-mt-1 sm:ml-0">
            {helpers.map((h) => (
              <HelperButton key={h.id} helper={h} />
            ))}
          </div>
        ) : null}
      </header>
      <div className="step-measure motion-step-enter grid flex-1 content-start gap-8 px-4 pb-10 pt-6 sm:px-6 [&>*]:min-w-0">{children}</div>
      {footer}
    </div>
  );
}
