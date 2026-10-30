import { Link, useMatch } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import { PRODUCT_NAME, PRODUCT_SUBTITLE } from '@/config';
import { useStore } from '@/mock/store';
import { formatDateTime, initials } from '@/lib/format';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import * as React from 'react';

// The dev admin panel is rarely opened; load it on demand.
const AdminPanel = React.lazy(() => import('@/admin/AdminPanel').then((m) => ({ default: m.AdminPanel })));

/** Navy band with a lime rule: wordmark left; save state, provider and dev panel right. */
export function TopBar() {
  const provider = useStore((s) => s.provider);
  const lastSavedAt = useStore((s) => s.lastSavedAt);
  const match = useMatch('/requests/:requestId/*');
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-black/[0.06] bg-white/80 text-foreground backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-full w-full max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 xl:px-12">
        <Link to="/" className="flex min-w-0 items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold tracking-[-0.02em] text-white" aria-hidden>
            {PRODUCT_NAME.split(' ').map((w) => w[0]).join('').slice(0, 2)}
          </span>
          
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[15px] font-semibold tracking-[-0.01em]">{PRODUCT_NAME}</span>
            <span className="hidden truncate text-xs text-muted-foreground sm:block">{PRODUCT_SUBTITLE}</span>
          </span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          {match && lastSavedAt ? (
            <div className="hidden items-center gap-2.5 md:flex" aria-live="polite">
              <span className="inline-flex items-center gap-1 rounded-full bg-status-success-bg px-2.5 py-0.5 text-2xs font-semibold text-status-success-fg">Saved</span>
              <span className="text-xs text-muted-foreground tabular">Last saved {formatDateTime(lastSavedAt)}</span>
            </div>
          ) : null}
          <div className="flex items-center gap-2.5">
            <span className="hidden text-sm text-foreground lg:inline">{provider.name}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--highlight-soft))] text-xs font-semibold text-[hsl(var(--highlight))]" aria-label={provider.name} role="img">
              {initials(provider.name)}
            </span>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-black/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Open dev admin panel"
                title="Dev admin panel"
              >
                <Settings2 className="h-4 w-4" aria-hidden />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="text-foreground sm:w-[520px] sm:max-w-[520px]">
              <SheetHeader>
                <SheetTitle>Dev admin panel</SheetTitle>
                <SheetDescription>
                  Simulate HR actions. <Link to="/admin" className="text-primary hover:underline">Open as page</Link>
                </SheetDescription>
              </SheetHeader>
              <SheetBody className="mt-4">
                <React.Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
                  <AdminPanel initialRequestId={match?.params.requestId} />
                </React.Suspense>
              </SheetBody>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
