import * as React from 'react';
import { AlertCircle, CheckCircle2, FileSignature, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import type { ESignItem as ESignItemType, ESignItemDef, ModuleId, ProviderRequest } from '@/domain/types';
import { api } from '@/mock/api';
import { formatDate, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { esignStatusSpec, StatusBadge } from './status';
import { MODULE_HUES } from '@/components/layout/module-status';

const creating = new Set<string>();

/** Create envelopes for applicable items that do not exist yet. */
export function useEnsureESigns(request: ProviderRequest, moduleId: ModuleId, defs: ESignItemDef[], enabled: boolean) {
  const instance = request.modules.find((m) => m.id === moduleId);
  const missing = defs.filter((d) => !instance?.esigns[d.id]).map((d) => d.id).join(',');
  React.useEffect(() => {
    if (!enabled || !missing) return;
    for (const def of defs) {
      const key = `${request.id}:${moduleId}:${def.id}`;
      if (instance?.esigns[def.id] || creating.has(key)) continue;
      creating.add(key);
      api.createESign(request.id, moduleId, def).finally(() => creating.delete(key));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, missing, request.id, moduleId]);
}

/** One card per document; one primary action that depends on state. */
export function ESignItem({
  requestId,
  moduleId,
  def,
  item,
  readOnly,
  error,
}: {
  requestId: string;
  moduleId: ModuleId;
  def: ESignItemDef;
  item?: ESignItemType;
  readOnly: boolean;
  error?: string;
}) {
  const [busy, setBusy] = React.useState(false);
  const [viewing, setViewing] = React.useState(false);
  const status = item?.status ?? 'preparing';
  const spec = esignStatusSpec[status];
  const rejected = status === 'rejected';

  const sign = async () => {
    setBusy(true);
    try {
      await api.signESign(requestId, moduleId, def.id);
      toast({ variant: 'success', title: `${def.title} signed` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Signing failed', description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const renew = async () => {
    setBusy(true);
    try {
      await api.requestNewESignDocument(requestId, moduleId, def.id, def.templateId);
      toast({ title: 'New document requested', description: 'It will be ready to sign in a moment.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not request a new document', description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  let action: React.ReactNode = null;
  if (status === 'signed') {
    action = (
      <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-0.5">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-status-success-fg tabular">
          <CheckCircle2 className="motion-check-pop h-4 w-4" aria-hidden />
          Signed {formatDate(item?.signedAt)}
        </span>
        <button type="button" onClick={() => setViewing(true)} className="rounded-sm text-xs font-medium text-primary hover:underline focus-ring">
          View signed copy
        </button>
      </div>
    );
  } else if (!readOnly) {
    if (status === 'preparing') {
      action = (
        <Button id={def.id} type="button" disabled variant="outline">
          <Loader2 className="animate-spin" aria-hidden />
          Preparing document…
        </Button>
      );
    } else if (status === 'waiting_for_signature') {
      action = (
        <Button id={def.id} type="button" onClick={sign} loading={busy}>
          {busy ? 'Signing…' : 'Sign now'}
        </Button>
      );
    } else if (rejected) {
      action = (
        <Button id={def.id} type="button" variant="outline" onClick={renew} loading={busy}>
          Request new document
        </Button>
      );
    }
  }

  return (
    <div
      data-field={def.id}
      className={cn(
        'overflow-hidden rounded-xl',
        rejected ? 'bg-status-danger-bg/60 ring-1 ring-inset ring-status-danger-fg/30' : 'bg-[hsl(var(--field))] ring-1 ring-inset ring-[hsl(var(--field-edge))]',
        error && !rejected && 'ring-1 ring-inset ring-status-danger-fg/40',
      )}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-6 shrink-0 items-center justify-center" style={{ color: MODULE_HUES.information.fg }}>
            <FileSignature className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium text-foreground">{def.title}</h3>
              {status !== 'signed' ? <StatusBadge spec={spec} spin={status === 'preparing'} /> : null}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {def.required ? 'Required' : 'Optional'} · {def.description}
            </p>
          </div>
        </div>
        {action ? <div className="flex shrink-0 sm:justify-end">{action}</div> : null}
      </div>
      {rejected ? (
        <div className="flex items-start gap-2 border-t border-status-danger-fg/20 bg-status-danger-bg px-4 py-2.5 text-xs text-status-danger-fg sm:px-5">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            <span className="font-medium">Document rejected:</span> {item?.rejectionReason ?? 'The document was voided.'}
          </span>
        </div>
      ) : null}
      {error && !rejected ? (
        <p className="flex items-center gap-1.5 border-t border-status-danger-fg/20 px-4 py-2 text-xs text-status-danger-fg sm:px-5">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden />
          {error}
        </p>
      ) : null}
      <Dialog open={viewing} onOpenChange={setViewing}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{def.title}</DialogTitle>
            <DialogDescription className="tabular">Signed {formatDateTime(item?.signedAt)}</DialogDescription>
          </DialogHeader>
          <div className="flex aspect-[3/4] max-h-[50vh] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
            <FileText className="h-8 w-8 text-neutral-400" aria-hidden />
            <p className="text-sm text-foreground">Signed copy placeholder</p>
            <p className="max-w-xs text-xs text-muted-foreground">The e-sign vendor will provide the signed PDF here once it is connected.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
