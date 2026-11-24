import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, FileSignature, FileText } from 'lucide-react';
import type { PreviewSection, StepProps } from '@/domain/types';
import { isDataEditable, isSigning } from '@/domain/lifecycle';
import { allIssues } from '@/domain/validation';
import { stepHref } from '@/domain/progress';
import { IssueList } from '@/components/shared/IssueList';
import { ReadOnlyField } from '@/components/shared/fields';
import { esignStatusSpec, StatusBadge, uploadStatusSpec } from '@/components/shared/status';
import { cn } from '@/lib/utils';
import { SignDocuments } from './SignDocuments';

export function PreviewSectionCard({
  section,
  className,
  issueFor,
}: {
  section: PreviewSection;
  className?: string;
  issueFor?(targetId?: string): string | undefined;
}) {
  return (
    <section className={cn('border-t pt-6 first-of-type:border-t-0 first-of-type:pt-0', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-[15px] font-medium text-neutral-600">{section.title}</h3>
      </div>
      {section.note ? (
        <p className="mt-1 flex items-start gap-1.5 text-xs text-status-warning-fg">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            <span className="sr-only">Warning: </span>
            {section.note}
          </span>
        </p>
      ) : null}
      <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {section.items.map((item, i) => (
          <ReadOnlyField
            key={`${item.label}-${i}`}
            label={item.label}
            value={item.value}
            issue={issueFor?.(item.targetId)}
            className={item.wide ? 'sm:col-span-2' : undefined}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Generic review step: every step's preview sections read-only, uploads and e-signs with
 * status, and the module's issue list with jump links. Submit lives in the footer.
 * Once the module is submitted it doubles as the summary of everything done in it.
 */
export function PreviewConfirmStep({ request, instance, moduleDef }: StepProps) {
  const navigate = useNavigate();
  const validation = moduleDef.validate(instance, request);
  const titles = Object.fromEntries(moduleDef.steps.map((s) => [s.id, s.title]));
  // Documents signed on a step of their own come after this one, so they are not listed as things to fix first.
  const signSteps = new Set(moduleDef.steps.filter((s) => s.kind === 'esign').map((s) => s.id));
  const issueRefs = allIssues(validation)
    .filter(({ stepId }) => !signSteps.has(stepId))
    .map(({ stepId, issue }) => ({ stepId, stepTitle: titles[stepId], issue }));
  const uploads = moduleDef.uploadSlots(request);
  const allSigns = moduleDef.esignItems(request);
  const signLater = allSigns.filter((d) => signSteps.has(d.stepId));
  const esigns = allSigns.filter((d) => !signSteps.has(d.stepId));
  const editable = isDataEditable(instance);

  return (
    <>
      {editable ? (
        issueRefs.length ? (
          <IssueList items={issueRefs} onJump={(stepId, targetId) => navigate(stepHref(request.id, instance.id, stepId, targetId))} />
        ) : (
          <div role="status" className="flex items-center gap-2 rounded-xl bg-status-success-bg px-4 py-3 text-sm text-status-success-fg">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            <span>
              <span className="font-semibold">Everything is complete.</span>{' '}
              <span className="text-neutral-700">{signLater.length
                  ? 'Submit your information, then sign your documents on the next step.'
                  : moduleDef.requiresReview
                    ? 'Submit to send this module to HR for review.'
                    : 'Submit to continue.'}</span>
            </span>
          </div>
        )
      ) : null}

      {moduleDef.steps
        .filter((s) => s.previewSections)
        .map((s) => {
          const sections = s.previewSections!(instance.data[s.id], request);
          return (
            <div key={s.id} className="grid gap-4">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-foreground">{s.title}</h2>
                {editable ? (
                  <button
                    type="button"
                    onClick={() => navigate(stepHref(request.id, instance.id, s.id))}
                    className="rounded-sm text-xs font-medium text-primary hover:underline focus-ring"
                  >
                    Edit
                  </button>
                ) : null}
              </div>
              {sections.map((sec) => (
                <PreviewSectionCard
                  key={sec.title}
                  section={sec}
                 
                  issueFor={(t) => (editable && t ? validation.stepIssues[s.id]?.find((i) => i.targetId === t)?.message : undefined)}
                />
              ))}
            </div>
          );
        })}

      {uploads.length ? (
        <div className="grid gap-4">
          <h2 className="text-sm font-semibold text-foreground">Uploads</h2>
          <ul className="divide-y divide-white rounded-xl bg-[hsl(var(--field))] ring-1 ring-inset ring-[hsl(var(--field-edge))]">
            {uploads.map((slot) => {
              const item = instance.uploads[slot.id];
              const status = item?.status ?? 'missing';
              return (
                <li key={slot.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
                    <div className="min-w-0">
                      <div className="text-sm text-foreground">
                        {slot.label}
                        {!slot.required ? <span className="ml-1.5 text-xs text-muted-foreground">Optional</span> : null}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{item?.fileName ?? 'No file'}</div>
                      {status === 'rejected' && item?.rejectionReason ? <div className="text-xs text-status-danger-fg">{item.rejectionReason}</div> : null}
                    </div>
                  </div>
                  <StatusBadge spec={uploadStatusSpec[status]} className="self-start sm:self-auto" />
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {esigns.length ? (
        <div className="grid gap-4">
          <h2 className="text-sm font-semibold text-foreground">Documents to sign</h2>
          <ul className="divide-y divide-white rounded-xl bg-[hsl(var(--field))] ring-1 ring-inset ring-[hsl(var(--field-edge))]">
            {esigns.map((def) => {
              const item = instance.esigns[def.id];
              const status = item?.status ?? 'preparing';
              return (
                <li key={def.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex items-center gap-3">
                    <FileSignature className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
                    <span className="text-sm text-foreground">{def.title}</span>
                  </div>
                  <StatusBadge spec={esignStatusSpec[status]} spin={status === 'preparing'} className="self-start sm:self-auto" />
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* The summary shows the signed documents; until the module is sent they live on their own step. */}
      {editable || isSigning(instance) ? null : <SignDocuments request={request} instance={instance} defs={signLater} title="Signed documents" />}
    </>
  );
}
