import * as React from 'react';
import { RotateCcw } from 'lucide-react';
import type { ESignStatus, ModuleId, ModuleInstance, ProviderRequest } from '@/domain/types';
import { getModuleDef } from '@/domain/registry';
import { api } from '@/mock/api';
import { LAYOUT_VARIANTS, useStore, type LayoutVariant } from '@/mock/store';
import { SCENARIOS, type ScenarioId } from '@/mock/scenarios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { esignStatusSpec, moduleStatusSpec, StatusBadge, uploadStatusSpec } from '@/components/shared/status';
import { cn } from '@/lib/utils';

const selectCls =
  'h-8 rounded-md border border-input bg-card px-2 text-xs text-foreground focus-ring disabled:opacity-50';

/** Toast tone follows the resulting status: approvals green, everything else neutral. */
async function run(label: string, fn: () => Promise<unknown>) {
  const success = /approved|accepted|cleared|signed|reset|loaded/i.test(label) && !/reject|declin|pending/i.test(label);
  try {
    await fn();
    toast({ variant: success ? 'success' : 'default', title: label });
  } catch (e) {
    toast({ variant: 'destructive', title: `${label} failed`, description: (e as Error).message });
  }
}

/** A button that expands into a reason input with Confirm / Cancel. */
function ReasonAction({
  label,
  placeholder,
  defaultValue = '',
  onConfirm,
  disabled,
  extra,
  variant = 'outline',
}: {
  label: string;
  placeholder: string;
  defaultValue?: string;
  onConfirm(reason: string): Promise<unknown>;
  disabled?: boolean;
  extra?: React.ReactNode;
  variant?: 'outline' | 'destructive';
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(defaultValue);
  const [busy, setBusy] = React.useState(false);
  if (!open) {
    return (
      <Button size="sm" variant={variant === 'destructive' ? 'outline' : variant} disabled={disabled} onClick={() => setOpen(true)} className={cn(variant === 'destructive' && 'text-status-danger-fg')}>
        {label}
      </Button>
    );
  }
  return (
    <div className="flex w-full flex-wrap items-center gap-2 rounded-md border bg-neutral-50 p-2">
      {extra}
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="h-8 min-w-[200px] flex-1 text-xs" autoFocus />
      <Button
        size="sm"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          await onConfirm(value);
          setBusy(false);
          setOpen(false);
        }}
      >
        Confirm
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}

function ModuleCard({ request, m }: { request: ProviderRequest; m: ModuleInstance }) {
  const def = getModuleDef(m.id);
  const [reopenTarget, setReopenTarget] = React.useState<ModuleId>('training');
  const r = request.id;
  const uploads = Object.values(m.uploads);
  const esigns = Object.values(m.esigns);
  const earlier = request.modules.filter((x) => x.id !== 'hr_review');

  return (
    <div className="rounded-md border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium">{def.title}</div>
        <StatusBadge spec={moduleStatusSpec[m.status]} />
      </div>
      {m.rejectionMessage ? <p className="mt-1 text-xs text-status-danger-fg">Message: {m.rejectionMessage}</p> : null}
      {m.revertRequest ? <p className="mt-1 text-xs text-status-warning-fg">Change request: {m.revertRequest.reason}</p> : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Button size="sm" variant="outline" disabled={m.status !== 'in_review'} onClick={() => run(`${def.title} approved`, () => api.admin.approveModule(r, m.id))}>
          Approve review
        </Button>
        <ReasonAction
          label="Reject review"
          variant="destructive"
          disabled={m.status !== 'in_review'}
          placeholder="Message to the provider"
          defaultValue={m.id === 'hr_review' ? 'Your CPR certificate copy is unreadable. Upload a clear scan.' : 'Please correct the highlighted items and resubmit.'}
          extra={
            m.id === 'hr_review' ? (
              <label className="flex items-center gap-1.5 text-xs">
                Reopen
                <select className={selectCls} value={reopenTarget} onChange={(e) => setReopenTarget(e.target.value as ModuleId)}>
                  {earlier.map((x) => (
                    <option key={x.id} value={x.id}>
                      {getModuleDef(x.id).title}
                    </option>
                  ))}
                </select>
              </label>
            ) : undefined
          }
          onConfirm={(msg) => run(`${def.title} rejected`, () => api.admin.rejectModule(r, m.id, msg, m.id === 'hr_review' ? reopenTarget : undefined))}
        />
        <Button size="sm" variant="outline" disabled={m.status !== 'revert_requested'} onClick={() => run('Change request accepted', () => api.admin.acceptRevert(r, m.id))}>
          Accept revert
        </Button>
        <ReasonAction
          label="Decline revert"
          disabled={m.status !== 'revert_requested'}
          placeholder="Note to the provider"
          defaultValue="The details on file are correct. Contact HR if anything changed."
          onConfirm={(note) => run('Change request declined', () => api.admin.declineRevert(r, m.id, note))}
        />
        <Button size="sm" variant="ghost" disabled={m.status === 'open' || m.status === 'locked_future'} onClick={() => run(`${def.title} reopened`, () => api.admin.forceReopen(r, m.id))}>
          Force reopen
        </Button>
        <Button size="sm" variant="ghost" disabled={m.status === 'approved'} onClick={() => run(`${def.title} approved`, () => api.admin.forceApprove(r, m.id))}>
          Force approve
        </Button>
      </div>

      {m.id === 'background_check' ? (
        <label className="mt-3 flex items-center gap-2 text-xs">
          <Checkbox checked={!!m.backgroundCheckCleared} onCheckedChange={(c) => run(c ? 'Background check cleared' : 'Background check set to pending', () => api.admin.setBackgroundCheckCleared(r, c === true))} />
          Background check cleared
        </label>
      ) : null}

      {uploads.length ? (
        <div className="mt-3 border-t pt-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">Uploads</div>
          <ul className="grid gap-2">
            {uploads.map((u) => (
              <li key={u.slotId} className="grid gap-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate">
                    {u.label} <span className="text-muted-foreground">· {u.fileName}</span>
                  </span>
                  <StatusBadge spec={uploadStatusSpec[u.status]} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" disabled={u.status === 'accepted'} onClick={() => run(`${u.label} accepted`, () => api.admin.acceptUpload(r, m.id, u.slotId))}>
                    Accept
                  </Button>
                  <ReasonAction
                    label="Reject"
                    variant="destructive"
                    placeholder="Reason"
                    defaultValue="Document is expired, please upload one from the last 90 days"
                    onConfirm={(reason) => run(`${u.label} rejected`, () => api.admin.rejectUpload(r, m.id, u.slotId, reason))}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {esigns.length ? (
        <div className="mt-3 border-t pt-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">E-sign</div>
          <ul className="grid gap-2">
            {esigns.map((e) => (
              <ESignAdminRow key={e.id} requestId={r} moduleId={m.id} id={e.id} title={e.title} status={e.status} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ESignAdminRow({ requestId, moduleId, id, title, status }: { requestId: string; moduleId: ModuleId; id: string; title: string; status: ESignStatus }) {
  const [next, setNext] = React.useState<ESignStatus>(status === 'rejected' ? 'waiting_for_signature' : 'rejected');
  const [reason, setReason] = React.useState('The document was voided by HR. Request a new one.');
  return (
    <li className="grid gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="min-w-0 truncate">{title}</span>
        <StatusBadge spec={esignStatusSpec[status]} spin={status === 'preparing'} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <select className={selectCls} value={next} onChange={(e) => setNext(e.target.value as ESignStatus)} aria-label={`New status for ${title}`}>
          {(Object.keys(esignStatusSpec) as ESignStatus[]).map((s) => (
            <option key={s} value={s}>
              {esignStatusSpec[s].label}
            </option>
          ))}
        </select>
        {next === 'rejected' ? (
          <Input value={reason} onChange={(e) => setReason(e.target.value)} className="h-8 min-w-[160px] flex-1 text-xs" aria-label="Reason" />
        ) : null}
        <Button size="sm" variant="outline" onClick={() => run(`${title}: ${esignStatusSpec[next].label}`, () => api.admin.setESignStatus(requestId, moduleId, id, next, reason))}>
          Set
        </Button>
      </div>
    </li>
  );
}

/** Dev-only panel that simulates admin actions. Plain and functional by design. */
export function AdminPanel({ initialRequestId }: { initialRequestId?: string }) {
  const requests = useStore((s) => s.requests);
  const simulateFailures = useStore((s) => s.simulateFailures);
  const setSimulateFailures = useStore((s) => s.setSimulateFailures);
  const layoutVariant = useStore((s) => s.layoutVariant);
  const setLayoutVariant = useStore((s) => s.setLayoutVariant);
  const [selected, setSelected] = React.useState(initialRequestId ?? requests[0]?.id);
  const [scenario, setScenario] = React.useState<ScenarioId>('fresh_start');
  const request = requests.find((r) => r.id === selected) ?? requests[0];

  React.useEffect(() => {
    if (initialRequestId && requests.some((r) => r.id === initialRequestId)) setSelected(initialRequestId);
  }, [initialRequestId, requests]);

  return (
    <div className="grid gap-5 text-sm">
      <div className="grid gap-2 rounded-md border bg-neutral-50 p-3">
        <div className="text-xs font-medium text-muted-foreground">Global</div>
        <div className="flex flex-wrap items-center gap-2">
          <select className={selectCls} value={scenario} onChange={(e) => setScenario(e.target.value as ScenarioId)} aria-label="Scenario">
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <Button size="sm" variant="outline" onClick={() => run(`Loaded “${SCENARIOS.find((s) => s.id === scenario)?.label}”`, () => api.admin.loadScenario(scenario))}>
            Load scenario
          </Button>
          <Button size="sm" variant="outline" onClick={() => run('Demo data reset', () => api.admin.resetDemoData())}>
            <RotateCcw aria-hidden />
            Reset demo data
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{SCENARIOS.find((s) => s.id === scenario)?.description}</p>
        <label className="flex items-center gap-2 text-xs">
          <Checkbox checked={simulateFailures} onCheckedChange={(c) => setSimulateFailures(c === true)} />
          Simulate API failures (about 30% of calls)
        </label>
        <label className="flex flex-wrap items-center gap-2 text-xs">
          Process view layout
          <select className={selectCls} value={layoutVariant} onChange={(e) => setLayoutVariant(e.target.value as LayoutVariant)}>
            {LAYOUT_VARIANTS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {request ? (
        <>
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Request
            <select className={cn(selectCls, 'h-9 text-sm')} value={request.id} onChange={(e) => setSelected(e.target.value)}>
              {requests.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.id})
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3">
            {request.modules.map((m) => (
              <ModuleCard key={m.id} request={request} m={m} />
            ))}
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">No requests. Reset the demo data or load a scenario.</p>
      )}
    </div>
  );
}
