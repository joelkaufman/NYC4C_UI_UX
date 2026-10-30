import * as React from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { ModuleId } from '@/domain/types';
import { currentModuleId, isEditable } from '@/domain/lifecycle';
import { buildModuleModel, landingTarget, moduleLandingStep, stepHref } from '@/domain/progress';
import { useRequest, useStore, visitKey } from '@/mock/store';
import { api } from '@/mock/api';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { StepShell } from '@/components/shared/StepShell';
import { ModuleBanner } from '@/components/shared/ModuleBanner';
import { StepIssuesProvider } from '@/components/shared/step-context';
import { RequestChangesDialog } from '@/components/shared/RequestChangesDialog';
import { ModuleSidebar } from '@/components/layout/ModuleSidebar';
import { MODULE_HUES, MODULE_ICONS } from '@/components/layout/module-status';
import { MobileProcessBar } from '@/components/layout/MobileProcessBar';
import { StepCircle, StepPath } from '@/components/layout/StepPath';
import { StepFooter, type FooterPrimary } from '@/components/layout/StepFooter';
import { BackgroundClearedChip } from '@/modules/background-check/ConfirmStep';
import { NotFound } from './NotFound';
import { ModuleStrip, QueueRail, ScrollRail, useActiveSection } from '@/components/layout/variants';
import { IssueList } from '@/components/shared/IssueList';
import { HelperButton } from '@/components/shared/HelperButton';
import { ProgressBar } from '@/components/shared/status';
import { CheckCircle2 } from 'lucide-react';
import type { ModuleModel } from '@/domain/progress';
import type { ProviderRequest, StepDef } from '@/domain/types';
import type { FooterPrimary as Primary } from '@/components/layout/StepFooter';
import type { LayoutVariant } from '@/mock/store';

/** Find the element an issue points at, falling back to its closest rendered ancestor path. */
function findTarget(targetId: string): HTMLElement | null {
  const parts = targetId.split('.');
  while (parts.length) {
    const id = parts.join('.');
    const el = document.getElementById(id) ?? document.querySelector<HTMLElement>(`[data-field="${CSS.escape(id)}"]`);
    if (el) return el;
    parts.pop();
  }
  return null;
}

function focusTarget(targetId: string) {
  const el = findTarget(targetId);
  if (!el) return false;
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  const focusable = el.matches('input,button,textarea,select,[tabindex]') ? el : el.querySelector<HTMLElement>('input,button,textarea,[role="radio"],[tabindex]');
  (focusable ?? el).focus({ preventScroll: true });
  return true;
}

export function ProcessPage() {
  const { requestId, moduleId, stepId } = useParams();
  const request = useRequest(requestId);
  const visited = useStore((s) => s.visited);
  const dataVersion = useStore((s) => s.dataVersion);
  const markVisited = useStore((s) => s.markVisited);
  const storedLayout = useStore((s) => s.layoutVariant);
  const setLayoutVariant = useStore((s) => s.setLayoutVariant);
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const focus = search.get('focus');
  const layoutParam = search.get('layout') as LayoutVariant | null;
  React.useEffect(() => {
    if (layoutParam && ['classic', 'queue', 'scroll'].includes(layoutParam)) setLayoutVariant(layoutParam);
  }, [layoutParam, setLayoutVariant]);
  const layout: LayoutVariant = layoutParam && ['classic', 'queue', 'scroll'].includes(layoutParam) ? layoutParam : storedLayout;
  const [revealAll, setRevealAll] = React.useState(false);
  const [changesFor, setChangesFor] = React.useState<ModuleId | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const jumpIndex = React.useRef(0);

  // Follow the "current module" when it moves (approval, revert, HR rejection) if we were on it.
  const currentId = request ? currentModuleId(request) : undefined;
  const prevCurrent = React.useRef(currentId);
  React.useEffect(() => {
    if (!request || !currentId) return;
    if (prevCurrent.current && prevCurrent.current !== currentId && moduleId === prevCurrent.current) {
      const t = landingTarget(request);
      navigate(stepHref(request.id, t.moduleId, t.stepId), { replace: true });
    }
    prevCurrent.current = currentId;
  }, [currentId, moduleId, navigate, request]);

  const instance = request?.modules.find((m) => m.id === moduleId);
  const models = React.useMemo(
    () => (request ? request.modules.map((m) => buildModuleModel(request, m, visited)) : []),
    [request, visited],
  );
  const model = models.find((m) => m.instance.id === moduleId);
  const step = model?.def.steps.find((s) => s.id === stepId);

  // Mark a step visited once the provider moves on from it, so its issues show next time.
  const stepKey = request && moduleId && stepId ? visitKey(request.id, moduleId, stepId) : undefined;
  const lastKey = React.useRef(stepKey);
  React.useEffect(() => {
    if (lastKey.current && lastKey.current !== stepKey) markVisited([lastKey.current]);
    lastKey.current = stepKey;
  }, [stepKey, markVisited]);


  React.useEffect(() => {
    setRevealAll(false);
    jumpIndex.current = 0;
  }, [moduleId, stepId]);

  // Jump to ?focus=target after render.
  React.useEffect(() => {
    if (!focus) return;
    const t = window.setTimeout(() => {
      focusTarget(focus);
      setSearch(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('focus');
          return next;
        },
        { replace: true },
      );
    }, 60);
    return () => window.clearTimeout(t);
  }, [focus, stepId, setSearch]);

  if (!request) return <NotFound />;
  if (!instance || !model || instance.status === 'locked_future') {
    const t = landingTarget(request);
    return <Navigate to={stepHref(request.id, t.moduleId, t.stepId)} replace />;
  }
  // Completed modules show only their last step (the summary); earlier step links redirect there.
  const lastStep = model.def.steps[model.def.steps.length - 1];
  if (!step || (!isEditable(instance.status) && step.id !== lastStep.id && layout !== 'scroll')) {
    return <Navigate to={stepHref(request.id, instance.id, moduleLandingStep(request, instance))} replace />;
  }

  const def = model.def;
  const editable = isEditable(instance.status);
  const readOnly = !editable;
  const stepIndex = def.steps.indexOf(step);
  const stepStatus = model.steps[stepIndex];
  const showAll = revealAll || !!focus || !!visited[visitKey(request.id, instance.id, step.id)] || instance.status === 'rejected';
  const moduleIdx = request.modules.indexOf(instance);
  const nextModule = request.modules[moduleIdx + 1];
  const previewStep = def.steps.find((s) => s.kind === 'preview');

  const go = (sid: string, target?: string) => navigate(stepHref(request.id, instance.id, sid, target));

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.submitModule(request.id, instance.id);
      toast({
        variant: 'success',
        title: def.requiresReview ? `${def.title} submitted for review` : `${def.title} complete`,
        description: def.requiresReview ? "We'll notify you when it is approved." : nextModule ? `${nextModule ? models[moduleIdx + 1].def.title : ''} is now open.` : undefined,
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Submit failed', description: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  // Footer primary action
  let primary: FooterPrimary | undefined;
  if (editable && (step.kind === 'preview' || step.kind === 'confirm' || step.kind === 'esign')) {
    const label =
      step.kind === 'esign' ? 'Finish' : step.kind === 'confirm' ? 'Submit' : instance.status === 'rejected' ? 'Resubmit module' : 'Submit module';
    primary = {
      label,
      onClick: submit,
      disabled: !model.validation.isComplete,
      loading: submitting,
      hint: model.validation.isComplete ? undefined : 'Resolve the items that need attention first',
    };
  } else if (stepIndex < def.steps.length - 1) {
    primary = { label: 'Next', onClick: () => go(def.steps[stepIndex + 1].id), arrow: true };
  } else if (readOnly && nextModule && nextModule.status !== 'locked_future') {
    primary = { label: `Go to ${models[moduleIdx + 1].def.title}`, onClick: () => navigate(stepHref(request.id, nextModule.id)), arrow: true };
  }

  const submitStep = def.steps.find((s) => s.kind === 'preview' || s.kind === 'confirm' || s.kind === 'esign');
  let scrollPrimary: FooterPrimary | undefined;
  if (editable && submitStep) {
    scrollPrimary = {
      label: submitStep.kind === 'esign' ? 'Finish' : submitStep.kind === 'confirm' ? 'Submit' : instance.status === 'rejected' ? 'Resubmit module' : 'Submit module',
      onClick: submit,
      disabled: !model.validation.isComplete,
      loading: submitting,
    };
  } else if (readOnly && nextModule && nextModule.status !== 'locked_future') {
    scrollPrimary = { label: `Go to ${models[moduleIdx + 1].def.title}`, onClick: () => navigate(stepHref(request.id, nextModule.id)), arrow: true };
  }

  // Attention jump: cycle this step's issues, then move to the next step that has any.
  const attention = editable && step.kind !== 'preview' ? model.issueCount : 0;
  const onAttention = () => {
    const here = stepStatus.issues;
    if (here.length) {
      setRevealAll(true);
      const target = here[jumpIndex.current % here.length];
      jumpIndex.current += 1;
      window.setTimeout(() => focusTarget(target.targetId), 30);
      return;
    }
    const order = [...model.steps.slice(stepIndex + 1), ...model.steps.slice(0, stepIndex)];
    const next = order.find((s) => s.issues.length);
    if (next) go(next.step.id, next.issues[0].targetId);
  };

  const hasBanner = ['rejected', 'in_review', 'approved', 'revert_requested'].includes(instance.status);
  const banner =
    !hasBanner || (instance.id === 'hr_review' && instance.status !== 'approved') ? null : (
      <ModuleBanner
        instance={instance}
        moduleTitle={def.title}
        onRequestChanges={instance.status === 'approved' && instance.id !== 'hr_review' ? () => setChangesFor(instance.id) : undefined}
        onGoToPreview={previewStep && step.id !== previewStep.id ? () => go(previewStep.id) : undefined}
      />
    );

  const StepComponent = step.component;
  const ModuleGlyph = MODULE_ICONS[instance.id];
  const changesModel = changesFor ? models.find((m) => m.instance.id === changesFor) : undefined;
  const laterModules = changesModel
    ? models.slice(models.indexOf(changesModel) + 1).filter((m) => m.instance.status !== 'locked_future').map((m) => m.def.title)
    : [];

  return (
    <div className="flex min-h-[calc(100dvh-56px)] flex-col">
      {/* Header row for the alternate layouts only (desktop) */}
      <div className={cn('sticky top-14 z-20 h-16 items-center border-b bg-card', layout === 'classic' ? 'hidden' : 'hidden lg:flex')}>
        <div className="flex w-[280px] min-w-0 shrink-0 items-center gap-2 pl-6 pr-2 xl:w-auto xl:max-w-[400px] xl:min-w-[280px]">
          <Link to="/" className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-ring" aria-label="Back to my requests">
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
          <span className="truncate text-sm font-medium text-foreground" title={request.title}>
            {request.title}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 justify-center px-8">
          <div className="w-full max-w-[760px]">
            {layout === 'queue' ? (
              <ModuleStrip requestId={request.id} models={models} viewedModuleId={instance.id} />
            ) : layout === 'scroll' ? (
              <div className="flex items-center gap-4">
                <span className="shrink-0 text-sm font-medium text-foreground">{def.title}</span>
                <ProgressBar value={model.total ? model.done / model.total : 0} tone={model.flagged ? 'danger' : 'primary'} className="h-1 flex-1" />
                <span className="shrink-0 text-xs text-muted-foreground tabular">
                  {model.done} of {model.total} sections complete
                </span>
              </div>
            ) : model.steps.length > 1 ? (
              <StepPath steps={model.steps} currentStepId={step.id} onSelect={(sid) => go(sid)} label={`Steps in ${def.title}`} />
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{def.title}</span> · {step.title}
              </p>
            )}
          </div>
        </div>
      </div>

      <MobileProcessBar
        requestId={request.id}
        requestTitle={request.title}
        models={models}
        viewed={model}
        steps={editable ? model.steps : model.steps.slice(-1)}
        currentStepId={step.id}
        onSelectStep={(sid) => go(sid)}
      />

      {layout === 'scroll' ? (
        <ScrollModuleView
          key={`${instance.id}:${dataVersion}:${instance.status}`}
          request={request}
          models={models}
          model={model}
          initialStepId={step.id}
          banner={banner}
          readOnly={readOnly}
          revealAll={revealAll || !!focus}
          visited={visited}
          primary={scrollPrimary}
          onRevealAll={() => setRevealAll(true)}
          note={readOnly && instance.id !== 'hr_review' ? 'Read only' : undefined}
        />
      ) : (
      <div className="mx-auto flex w-full max-w-[1480px] flex-1 lg:gap-8 lg:px-8 xl:gap-10 xl:px-12">
        {layout === 'queue' ? (
          <QueueRail model={model} currentStepId={step.id} onJump={(sid, target) => (sid === step.id ? (setRevealAll(true), window.setTimeout(() => focusTarget(target), 30)) : go(sid, target))} onSelectStep={(sid) => go(sid)} />
        ) : (
        <ModuleSidebar
          requestId={request.id}
          requestTitle={request.title}
          createdAt={request.createdAt}
          models={models}
          viewedModuleId={instance.id}
        />
        )}
        <main id="main" className="min-w-0 flex-1 lg:py-8">
          <div
            className="min-h-full bg-card lg:rounded-2xl lg:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.05)]"
          >
          {layout === 'classic' ? (
            <>
              <div
                className="hidden items-center gap-4 border-b px-6 py-4 lg:flex lg:px-8"
              >
                <span className="flex h-10 w-8 shrink-0 items-center justify-center" style={{ color: MODULE_HUES[instance.id].fg }} aria-hidden>
                  <ModuleGlyph className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block text-[13px] text-muted-foreground tabular">
                    Module {moduleIdx + 1} of {request.modules.length}
                  </span>
                  <span className="block truncate text-xl font-semibold leading-7 tracking-[-0.02em]">{def.title}</span>
                </div>
              </div>
              {model.steps.length > 1 && editable ? (
                <div className="hidden border-b px-3 lg:block lg:px-5">
                  <StepPath steps={model.steps} currentStepId={step.id} onSelect={(sid) => go(sid)} label={`Steps in ${def.title}`} />
                </div>
              ) : null}
            </>
          ) : null}
          <StepIssuesProvider key={`${instance.id}:${step.id}`} readOnly={readOnly} issues={stepStatus.issues} showAll={showAll}>
            <StepShell
              title={
                step.kind === 'preview' && readOnly
                  ? 'What you submitted'
                  : instance.id === 'hr_review' && instance.status === 'approved'
                    ? 'Onboarding complete'
                    : step.title
              }
              titleInTabs={layout === 'classic' && model.steps.length > 1 && editable}
              description={
                step.kind === 'preview' && readOnly
                  ? `Everything in ${def.title} as HR received it. Read only.`
                  : instance.id === 'hr_review' && instance.status === 'approved'
                    ? 'Thank you for completing every module.'
                    : step.description
              }
              helpers={step.helpers}
              banner={banner}
              meta={instance.id === 'background_check' && instance.status === 'approved' ? <BackgroundClearedChip instance={instance} /> : undefined}
              footer={
                <StepFooter
                  onBack={stepIndex > 0 && editable ? () => go(def.steps[stepIndex - 1].id) : undefined}
                  primary={primary}
                  attention={attention}
                  attentionTone={model.flagged ? 'danger' : 'neutral'}
                  onAttention={onAttention}
                  note={
                    editable && model.validation.isComplete && previewStep && step.id !== previewStep.id ? (
                      <button
                        type="button"
                        onClick={() => go(previewStep.id)}
                        className="motion-note-in inline-flex h-9 max-w-full items-center gap-1.5 rounded-full bg-status-success-bg px-3.5 text-xs font-medium text-status-success-fg transition-colors hover:bg-status-success-fg/15 focus-ring sm:text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="truncate">
                          <span className="hidden sm:inline">Everything in {def.title} is complete · </span>Review and submit
                        </span>
                      </button>
                    ) : undefined
                  }
                />
              }
            >
              <StepComponent
                key={`${dataVersion}:${instance.status}`}
                request={request}
                instance={instance}
                moduleDef={def}
                step={step}
                readOnly={readOnly}
                issues={stepStatus.issues}
              />
            </StepShell>
          </StepIssuesProvider>
          </div>
        </main>
      </div>
      )}

      {changesModel ? (
        <RequestChangesDialog
          open={!!changesFor}
          onOpenChange={(o) => !o && setChangesFor(null)}
          requestId={request.id}
          moduleId={changesModel.instance.id}
          moduleTitle={changesModel.def.title}
          laterModules={laterModules}
        />
      ) : null}
    </div>
  );
}

/** Scroll layout: every step of the module stacked on one page, with a scroll-tracked index. */
function ScrollModuleView({
  request,
  models,
  model,
  initialStepId,
  banner,
  readOnly,
  revealAll,
  visited,
  primary,
  onRevealAll,
  note,
}: {
  request: ProviderRequest;
  models: ModuleModel[];
  model: ModuleModel;
  initialStepId: string;
  banner: React.ReactNode;
  readOnly: boolean;
  revealAll: boolean;
  visited: Record<string, true>;
  primary?: Primary;
  onRevealAll(): void;
  note?: string;
}) {
  const { def, instance } = model;
  const ids = def.steps.map((s) => s.id);
  const [active, setActive] = useActiveSection(ids, initialStepId);
  const scrollTo = (id: string) => {
    setActive(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  React.useEffect(() => {
    if (initialStepId !== ids[0]) window.setTimeout(() => document.getElementById(`section-${initialStepId}`)?.scrollIntoView({ block: 'start' }), 50);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const jump = (_stepId: string, target: string) => {
    onRevealAll();
    window.setTimeout(() => focusTarget(target), 40);
  };
  const flaggedItems = model.steps.flatMap((s) => s.issues.map((issue) => ({ stepId: s.step.id, stepTitle: s.step.title, issue })));
  const editable = !readOnly;

  const renderStep = (s: StepDef, index: number) => {
    const status = model.steps[index];
    if (s.kind === 'preview') {
      return (
        <section key={s.id} id={`section-${s.id}`} className="border-t pt-10">
          <h2 className="text-lg font-semibold text-foreground">Review and submit</h2>
          <p className="mt-1 text-sm text-muted-foreground">Everything above is what HR will review.</p>
          <div className="mt-6">
            {editable ? (
              flaggedItems.length ? (
                <IssueList items={flaggedItems} onJump={jump} />
              ) : (
                <div role="status" className="flex items-center gap-2 rounded-xl bg-status-success-bg px-4 py-3 text-sm text-status-success-fg">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="font-semibold">Everything is complete.</span>
                </div>
              )
            ) : (
              <p className="text-sm text-muted-foreground">This module is locked.</p>
            )}
          </div>
        </section>
      );
    }
    const Comp = s.component;
    const showAll = revealAll || !!visited[visitKey(request.id, instance.id, s.id)] || instance.status === 'rejected';
    return (
      <section key={s.id} id={`section-${s.id}`} className={cn(index > 0 && 'border-t pt-10')}>
        <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <StepCircleInline status={status} />
            <div>
              <h2 className="text-lg font-semibold text-foreground">{s.title}</h2>
              {s.description ? <p className="mt-0.5 text-sm text-muted-foreground">{s.description}</p> : null}
            </div>
          </div>
          {s.helpers?.map((h) => <HelperButton key={h.id} helper={h} />)}
        </header>
        <StepIssuesProvider readOnly={readOnly} issues={status.issues} showAll={showAll}>
          <div className="grid gap-8 [&>*]:min-w-0">
            <Comp request={request} instance={instance} moduleDef={def} step={s} readOnly={readOnly} issues={status.issues} />
          </div>
        </StepIssuesProvider>
      </section>
    );
  };

  return (
    <div className="flex flex-1">
      <ScrollRail requestId={request.id} models={models} viewed={model} activeStepId={active} onSelectStep={scrollTo} />
      <main id="main" className="min-w-0 flex-1 bg-card">
        <div className="mx-auto w-full max-w-[760px] px-4 pb-10 pt-6 sm:px-6 lg:px-0 lg:pt-10">
          {banner ? <div className="mb-6">{banner}</div> : null}
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-foreground">{def.title}</h1>
          <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">{def.description}</p>
          <div className="mt-10 grid gap-10">{def.steps.map(renderStep)}</div>
        </div>
        <StepFooter
          primary={primary}
          attention={editable ? model.issueCount : 0}
          attentionTone={model.flagged ? 'danger' : 'neutral'}
          onAttention={() => flaggedItems[0] && jump(flaggedItems[0].stepId, flaggedItems[0].issue.targetId)}
          note={note}
        />
      </main>
    </div>
  );
}

function StepCircleInline({ status }: { status: ModuleModel['steps'][number] }) {
  return <StepCircle status={status} current={false} />;
}
