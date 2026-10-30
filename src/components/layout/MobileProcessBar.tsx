import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import type { ModuleModel, StepStatus } from '@/domain/progress';
import { ProgressBar, StatusBadge } from '@/components/shared/status';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ModuleList } from './ModuleSidebar';
import { ModuleTile } from '@/components/shared/ModuleTile';
import { moduleProgressValue, moduleSpec, moduleTone } from './module-status';
import { StepCircle, stepStateLabel } from './StepPath';

/** Below 1024px: compact module bar and step counter, each opening a bottom sheet. */
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
  const [stepsOpen, setStepsOpen] = React.useState(false);
  const idx = steps.findIndex((s) => s.step.id === currentStepId);
  const current = steps[idx];
  const moduleNumber = models.findIndex((m) => m.instance.id === viewed.instance.id) + 1;

  return (
    <div className="sticky top-14 z-20 border-b border-black/[0.06] bg-white/85 backdrop-blur-xl backdrop-saturate-150 lg:hidden">
      <button
        type="button"
        onClick={() => setModulesOpen(true)}
        className="flex w-full items-center gap-3 px-4 pb-2 pt-3 text-left focus-ring"
        aria-haspopup="dialog"
      >
        <ModuleTile id={viewed.instance.id} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-2xs text-muted-foreground">{requestTitle}</span>
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {moduleNumber}. {viewed.def.title}
            </span>
            <StatusBadge spec={moduleSpec(viewed)} />
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      </button>
      <div className="px-4">
        <ProgressBar value={moduleProgressValue(viewed)} tone={moduleTone(viewed)} label={`${viewed.def.title} progress`} />
      </div>
      {steps.length > 1 && current ? (
        <button
          type="button"
          onClick={() => setStepsOpen(true)}
          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left focus-ring"
          aria-haspopup="dialog"
          aria-label={`Step ${idx + 1} of ${steps.length}: ${current.step.title}. Show all steps`}
        >
          <StepCircle status={current} current className="h-5 w-5 text-2xs" />
          <span className="min-w-0 flex-1 truncate text-xs text-foreground">
            <span className="text-muted-foreground tabular">
              Step {idx + 1} of {steps.length} ·{' '}
            </span>
            {current.step.title}
          </span>
          {steps.some((s) => s.state === 'issues') ? (
            <span className="text-2xs font-medium text-status-danger-fg">
              {steps.filter((s) => s.state === 'issues').length} with issues
            </span>
          ) : null}
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      ) : (
        <div className="h-2" />
      )}

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

      <Sheet open={stepsOpen} onOpenChange={setStepsOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{viewed.def.title}</SheetTitle>
            <SheetDescription>
              {viewed.done} of {viewed.total} steps complete
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="mt-2 px-5 pt-1">
            <ol className="grid gap-0.5">
              {steps.map((s) => {
                const isCurrent = s.step.id === currentStepId;
                return (
                  <li key={s.step.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setStepsOpen(false);
                        onSelectStep(s.step.id);
                      }}
                      aria-current={isCurrent ? 'step' : undefined}
                      className={cn(
                        'flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors focus-ring',
                        isCurrent ? 'bg-primary-subtle/50' : 'hover:bg-neutral-100',
                      )}
                    >
                      <StepCircle status={s} current={isCurrent} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground">{s.step.title}</span>
                        <span className={cn('block text-xs', s.state === 'issues' ? 'text-status-danger-fg' : 'text-muted-foreground')}>
                          {stepStateLabel(s, false)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  );
}
