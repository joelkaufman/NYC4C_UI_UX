import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import type { ModuleModel, StepStatus } from '@/domain/progress';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ModuleList } from './ModuleSidebar';
import { ModuleTile } from '@/components/shared/ModuleTile';
import { StepCircle, stepStateLabel } from './StepPath';

/** Below 1024px: the current module (tap for the list of all modules), then a scrollable strip of its steps. */
export function MobileProcessBar({
  requestId,
  requestTitle,
  models,
  viewed,
  steps,
  currentStepId,
  onSelectStep,
}: {
  requestId: string;
  requestTitle: string;
  models: ModuleModel[];
  viewed: ModuleModel;
  steps: StepStatus[];
  currentStepId: string;
  onSelectStep(stepId: string): void;
}) {
  const [modulesOpen, setModulesOpen] = React.useState(false);
  const moduleNumber = models.findIndex((m) => m.instance.id === viewed.instance.id) + 1;

  // Keep the current step chip centred in the strip as the provider moves through steps.
  const stripRef = React.useRef<HTMLOListElement>(null);
  React.useEffect(() => {
    const strip = stripRef.current;
    const chip = strip?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!strip || !chip) return;
    strip.scrollTo({ left: chip.offsetLeft - (strip.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
  }, [currentStepId]);

  return (
    <div className="sticky top-14 z-20 border-b border-black/[0.06] bg-white/85 backdrop-blur-xl backdrop-saturate-150 lg:hidden">
      <button
        type="button"
        onClick={() => setModulesOpen(true)}
        className="block w-full px-4 pb-3 pt-2.5 text-left focus-ring"
        aria-haspopup="dialog"
        aria-label={`Module ${moduleNumber} of ${models.length}: ${viewed.def.title}. Show all modules`}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="truncate text-2xs font-semibold uppercase tracking-[0.06em] text-muted-foreground tabular">
            Module {moduleNumber} of {models.length}
          </span>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary">
            All modules
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </span>
        </span>
        <span className="mt-1.5 flex items-center gap-2.5">
          <ModuleTile id={viewed.instance.id} size="sm" />
          <span className="min-w-0 truncate text-base font-semibold tracking-[-0.01em] text-foreground">{viewed.def.title}</span>
        </span>
      </button>

      {steps.length > 1 ? (
        <nav aria-label={`Steps in ${viewed.def.title}`} className="border-t border-black/[0.06]">
          <ol ref={stripRef} className="flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {steps.map((s, i) => {
              const isCurrent = s.step.id === currentStepId;
              return (
                <li key={s.step.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectStep(s.step.id)}
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-label={`Step ${i + 1} of ${steps.length}: ${s.step.title}. ${stepStateLabel(s, isCurrent)}`}
                    className={cn(
                      'flex h-9 items-center gap-2 rounded-full pl-1.5 pr-3 text-xs transition-colors focus-ring',
                      isCurrent ? 'bg-primary-subtle font-semibold text-primary' : 'font-medium text-neutral-600 hover:bg-neutral-100',
                    )}
                  >
                    <StepCircle status={s} current={isCurrent} />
                    <span className="whitespace-nowrap">{s.step.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      <Sheet open={modulesOpen} onOpenChange={setModulesOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Modules</SheetTitle>
            <SheetDescription>{requestTitle}</SheetDescription>
          </SheetHeader>
          <SheetBody className="mt-2 px-5 pt-1">
            <ModuleList
              requestId={requestId}
              models={models}
              viewedModuleId={viewed.instance.id}
              onNavigate={() => setModulesOpen(false)}
            />
          </SheetBody>
        </SheetContent>
      </Sheet>

    </div>
  );
}
