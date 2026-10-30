import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import type { ModuleId } from '@/domain/types';
import { api } from '@/mock/api';
import { FieldError } from './fields';

export function RequestChangesDialog({
  open,
  onOpenChange,
  requestId,
  moduleId,
  moduleTitle,
  laterModules,
}: {
  open: boolean;
  onOpenChange(open: boolean): void;
  requestId: string;
  moduleId: ModuleId;
  moduleTitle: string;
  laterModules: string[];
}) {
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState<string>();
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setReason('');
      setError(undefined);
    }
  }, [open]);

  const send = async () => {
    if (!reason.trim()) {
      setError('Tell HR what you need to change.');
      return;
    }
    setBusy(true);
    try {
      await api.requestRevert(requestId, moduleId, reason.trim());
      toast({ variant: 'success', title: 'Change request sent to admin' });
      onOpenChange(false);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not send the request', description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request changes to {moduleTitle}</DialogTitle>
          <DialogDescription>
            HR reviews your request. If they accept it, {moduleTitle} reopens for editing
            {laterModules.length ? ` and ${laterModules.join(', ')} lock again until you resubmit` : ''}. Nothing you entered is lost.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <label htmlFor="revert-reason" className="text-xs font-medium">
            What do you need to change?
            <span className="ml-0.5 text-status-danger-fg" aria-hidden>
              *
            </span>
          </label>
          <Textarea
            id="revert-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(undefined);
            }}
            invalid={!!error}
            placeholder="For example: I moved and need to update my current address."
            aria-describedby={error ? 'revert-reason-error' : undefined}
            autoFocus
          />
          <FieldError id="revert-reason-error" message={error} />
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={send} loading={busy}>
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
