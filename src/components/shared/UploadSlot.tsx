import * as React from 'react';
import { AlertCircle, Eye, FileText, RefreshCw, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import type { ModuleId, UploadItem, UploadSlotDef } from '@/domain/types';
import { api, getPreviewUrl } from '@/mock/api';
import { formatBytes, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { StatusBadge, uploadStatusSpec } from './status';
import { FieldError } from './fields';
import { MODULE_HUES } from '@/components/layout/module-status';

const EXT_LABEL: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/heic': 'HEIC',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
};

function acceptsFile(file: File, accept: string[]) {
  if (!accept.length) return true;
  if (accept.includes(file.type)) return true;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return accept.some((a) => EXT_LABEL[a]?.toLowerCase() === ext || (a === 'image/jpeg' && ext === 'jpeg'));
}

/**
 * Drop zone / file picker with status, rejection reason, view / replace / remove, and read-only mode.
 * The primary control carries id = slot id so issue links can focus it.
 */
export function UploadSlot({
  requestId,
  moduleId,
  def,
  item,
  readOnly,
  error,
  compact,
}: {
  requestId: string;
  moduleId: ModuleId;
  def: UploadSlotDef;
  item?: UploadItem;
  readOnly: boolean;
  /** Visible issue message, if any (missing required). */
  error?: string;
  compact?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [busy, setBusy] = React.useState<null | 'upload' | 'remove'>(null);
  const [pendingName, setPendingName] = React.useState<string>();
  const [localError, setLocalError] = React.useState<string>();
  const [viewing, setViewing] = React.useState(false);

  const has = item && item.status !== 'missing';
  const types = def.accept.map((a) => EXT_LABEL[a] ?? a).join(', ');
  const constraint = `${types} · up to ${def.maxSizeMb} MB`;

  const pick = () => inputRef.current?.click();

  const handleFile = async (file?: File) => {
    if (!file) return;
    setLocalError(undefined);
    if (!acceptsFile(file, def.accept)) {
      setLocalError(`That file type is not accepted. Use ${types}.`);
      return;
    }
    if (file.size > def.maxSizeMb * 1024 * 1024) {
      setLocalError(`That file is ${formatBytes(file.size)}. The limit is ${def.maxSizeMb} MB.`);
      return;
    }
    setBusy('upload');
    setPendingName(file.name);
    try {
      await api.uploadFile(requestId, moduleId, def, file);
      toast({ variant: 'success', title: `${def.label} uploaded` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Upload failed', description: (e as Error).message });
    } finally {
      setBusy(null);
      setPendingName(undefined);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async () => {
    setBusy('remove');
    try {
      await api.removeUpload(requestId, moduleId, def.id);
      toast({ title: `${def.label} removed` });
      requestAnimationFrame(() => document.getElementById(def.id)?.focus());
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not remove the file', description: (e as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      className="sr-only"
      tabIndex={-1}
      aria-hidden
      accept={def.accept.join(',')}
      onChange={(e) => handleFile(e.target.files?.[0])}
    />
  );

  const header = (
    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <div className="text-xs font-medium text-foreground">
        {def.label}
        {def.required ? (
          <>
            <span className="ml-0.5 text-status-danger-fg" aria-hidden>
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        ) : (
          <span className="ml-1.5 font-normal text-muted-foreground">Optional</span>
        )}
      </div>
    </div>
  );

  const shownError = localError ?? error;

  // Uploading
  if (busy === 'upload') {
    return (
      <div data-field={def.id}>
        {header}
        <div className="flex items-center gap-3 rounded-xl bg-[hsl(var(--field))] ring-1 ring-inset ring-[hsl(var(--field-edge))] px-4 py-3" aria-live="polite">
          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-foreground">{pendingName}</div>
            <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-neutral-200">
              <div className="h-full w-1/3 animate-[upload_1s_ease-in-out_infinite] rounded-full bg-primary" />
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Uploading…</span>
        </div>
      </div>
    );
  }

  // Empty slot
  if (!has) {
    if (readOnly) {
      return (
        <div data-field={def.id}>
          {header}
          <div className="flex items-center gap-3 rounded-xl bg-[hsl(var(--field))] ring-1 ring-inset ring-[hsl(var(--field-edge))] px-4 py-3 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" aria-hidden />
            Not uploaded
          </div>
        </div>
      );
    }
    return (
      <div data-field={def.id}>
        {header}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            'flex flex-col gap-3 rounded-xl border-[1.5px] border-dashed border-neutral-300 bg-card px-4 transition-colors hover:border-neutral-400 sm:flex-row sm:items-center',
            compact ? 'py-3' : 'py-4',
            dragOver && 'border-primary bg-primary-subtle/30',
            shownError && 'border-status-danger-fg/60 hover:border-status-danger-fg',
          )}
        >
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Upload className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              {def.description ? <p className="text-sm text-neutral-700">{def.description}</p> : null}
              <p className="text-xs text-muted-foreground">
                <span className="hidden sm:inline">Drag a file here or choose one. </span>
                {constraint}
              </p>
            </div>
          </div>
          <Button
            id={def.id}
            type="button"
            variant="outline"
            size="sm"
            onClick={pick}
            aria-describedby={shownError ? `${def.id}-error` : undefined}
            className="self-start sm:self-auto"
          >
            Choose file
          </Button>
          {fileInput}
        </div>
        <div className="mt-1.5">
          <FieldError id={`${def.id}-error`} message={shownError} />
        </div>
      </div>
    );
  }

  // Has a file
  const rejected = item.status === 'rejected';
  const spec = uploadStatusSpec[item.status];
  return (
    <div data-field={def.id}>
      {header}
      <div className={cn('motion-note-in overflow-hidden rounded-xl', rejected ? 'bg-status-danger-bg/60 ring-1 ring-inset ring-status-danger-fg/30' : 'bg-[hsl(var(--field))] ring-1 ring-inset ring-[hsl(var(--field-edge))]')}>
        <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
            <span
              className="flex h-9 w-6 shrink-0 items-center justify-center"
              style={rejected ? undefined : { color: MODULE_HUES[moduleId].fg }}
            >
              <FileText className={cn('h-[18px] w-[18px]', rejected && 'text-status-danger-fg')} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">{item.fileName}</div>
              <div className="text-xs text-muted-foreground tabular">
                {formatBytes(item.fileSize)} · <span className="hidden sm:inline">Uploaded </span>
                {formatDate(item.uploadedAt)}
              </div>
            </div>
            <StatusBadge spec={spec} />
          </div>
          <div className="-mx-2 flex flex-nowrap items-center gap-0.5 sm:mx-0 sm:justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => setViewing(true)}>
              <Eye aria-hidden />
              View
            </Button>
            {!readOnly ? (
              <>
                <Button id={def.id} type="button" variant={rejected ? 'default' : 'ghost'} size="sm" onClick={pick} className={rejected ? 'mx-1' : undefined}>
                  <RefreshCw aria-hidden />
                  Replace
                </Button>
                {!rejected ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={remove}
                    loading={busy === 'remove'}
                    aria-label={`Remove ${def.label}`}
                    className="text-muted-foreground hover:text-status-danger-fg"
                  >
                    {busy === 'remove' ? null : <Trash2 aria-hidden />}
                  </Button>
                ) : null}
                {fileInput}
              </>
            ) : null}
          </div>
        </div>
        {rejected && item.rejectionReason ? (
          <div className="flex items-start gap-2 border-t border-status-danger-fg/20 bg-status-danger-bg px-4 py-2.5 text-xs text-status-danger-fg">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <div>
              <span className="font-medium">Rejected by HR:</span> {item.rejectionReason}
              {!readOnly ? <span className="block text-neutral-700">Replace the file to send it again.</span> : null}
            </div>
          </div>
        ) : null}
      </div>
      {localError ? (
        <div className="mt-1.5">
          <FieldError id={`${def.id}-error`} message={localError} />
        </div>
      ) : null}
      <FilePreviewDialog open={viewing} onOpenChange={setViewing} item={item} url={getPreviewUrl(requestId, moduleId, def.id)} />
    </div>
  );
}

function FilePreviewDialog({ open, onOpenChange, item, url }: { open: boolean; onOpenChange(o: boolean): void; item: UploadItem; url?: string }) {
  const isImage = item.fileType?.startsWith('image/');
  const isPdf = item.fileType === 'application/pdf';
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">{item.fileName}</DialogTitle>
          <DialogDescription className="tabular">
            {item.label} · {formatBytes(item.fileSize)} · Uploaded {formatDate(item.uploadedAt)}
          </DialogDescription>
        </DialogHeader>
        {url && isImage ? (
          <img src={url} alt={item.label} className="max-h-[60vh] w-full rounded-md border object-contain" />
        ) : url && isPdf ? (
          <iframe src={url} title={item.fileName} className="h-[60vh] w-full rounded-md border" />
        ) : (
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
            <FileText className="h-8 w-8 text-neutral-400" aria-hidden />
            <p className="text-sm text-foreground">Preview not available</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              This prototype does not store files. Previews work only in the session the file was chosen in.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
