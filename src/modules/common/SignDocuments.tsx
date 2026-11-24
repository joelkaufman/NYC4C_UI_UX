import * as React from 'react';
import { FileSignature, Lock } from 'lucide-react';
import type { ESignItemDef, ModuleInstance, ProviderRequest } from '@/domain/types';
import { isDataEditable, isSigning } from '@/domain/lifecycle';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { ESignItem, useEnsureESigns } from '@/components/shared/ESignItem';
import { api } from '@/mock/api';

/**
 * A module's documents to sign. They are prepared from the module's data, so they stay locked
 * until that data is submitted; then they can be signed, and once the module is sent they are read-only.
 */
export function SignDocuments({
  request,
  instance,
  defs,
  title,
}: {
  request: ProviderRequest;
  instance: ModuleInstance;
  defs: ESignItemDef[];
  /** Heading, when the list sits inside a longer page. */
  title?: string;
}) {
  const signing = isSigning(instance);
  const locked = isDataEditable(instance);
  const [reopening, setReopening] = React.useState(false);
  useEnsureESigns(request, instance.id, defs, signing);
  if (!defs.length) return null;
  const required = defs.filter((d) => d.required);
  const signedCount = required.filter((d) => instance.esigns[d.id]?.status === 'signed').length;

  const editAgain = async () => {
    setReopening(true);
    try {
      await api.reopenModuleData(request.id, instance.id);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not reopen your information', description: (e as Error).message });
    } finally {
      setReopening(false);
    }
  };

  return (
    <div className="grid gap-3">
      <div>
        {title ? <h2 className="mb-1 text-[17px] font-semibold tracking-[-0.01em] text-foreground">{title}</h2> : null}
        <p className="text-sm text-muted-foreground tabular" aria-live="polite">
          {locked
            ? 'These are prepared from your information. Submit it on the previous step, then sign them here.'
            : `${signedCount} of ${required.length} required documents signed`}
        </p>
      </div>
      {locked ? (
        <ul className="divide-y divide-white rounded-xl bg-[hsl(var(--field))] ring-1 ring-inset ring-[hsl(var(--field-edge))]">
          {defs.map((d) => (
            <li key={d.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex min-w-0 items-start gap-3">
                <FileSignature className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
                <div className="min-w-0">
                  <div className="text-sm text-foreground">{d.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.required ? 'Required' : 'Optional'} · {d.description}
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 self-start text-xs text-muted-foreground sm:self-auto">
                <Lock className="h-3.5 w-3.5" aria-hidden />
                Available after you submit
              </span>
            </li>
          ))}
        </ul>
      ) : (
        defs.map((d) => <ESignItem key={d.id} requestId={request.id} moduleId={instance.id} def={d} item={instance.esigns[d.id]} readOnly={!signing} />)
      )}
      {signing ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-1">
          <p className="text-xs text-muted-foreground">Need to change something? Editing your information replaces these documents with new ones to sign.</p>
          <Button type="button" variant="outline" size="sm" onClick={editAgain} loading={reopening}>
            Edit information
          </Button>
        </div>
      ) : null}
    </div>
  );
}
