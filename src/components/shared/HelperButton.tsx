import { CircleHelp, FileText } from 'lucide-react';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsDesktop } from '@/hooks/use-media-query';
import type { HelperDef } from '@/domain/types';
import { cn } from '@/lib/utils';

/** Small ghost button that opens rich help in a Sheet: right on desktop, bottom on phones. */
export function HelperButton({ helper, compact = false, className }: { helper: HelperDef; compact?: boolean; className?: string }) {
  const desktop = useIsDesktop();
  const { content } = helper;
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-md font-medium text-primary transition-colors hover:bg-primary-subtle/50 focus-ring',
            compact ? 'h-6 px-1.5 text-2xs' : 'h-8 px-2.5 text-xs',
            className,
          )}
        >
          <CircleHelp className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden />
          {helper.label ?? 'How to'}
        </button>
      </SheetTrigger>
      <SheetContent side={desktop ? 'right' : 'bottom'}>
        <SheetHeader>
          <SheetTitle>{helper.title}</SheetTitle>
          <SheetDescription className="sr-only">Help for this step</SheetDescription>
        </SheetHeader>
        <SheetBody className="mt-4 space-y-4 text-sm leading-6 text-neutral-700">
          {content.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
          {content.bullets?.length ? (
            <ul className="list-disc space-y-1.5 pl-5 marker:text-neutral-400">
              {content.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          ) : null}
          {content.sample ? (
            <figure className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4">
              <div className="flex aspect-[4/3] items-center justify-center rounded-md border bg-card">
                <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                  <FileText className="h-6 w-6" aria-hidden />
                  <span className="text-xs">Sample document placeholder</span>
                </div>
              </div>
              <figcaption className="mt-3 text-xs text-muted-foreground">{content.sample}</figcaption>
            </figure>
          ) : null}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
