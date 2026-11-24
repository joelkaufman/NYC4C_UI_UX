import type { ESignItem, ESignStatus, ModuleId, UploadItem } from '@/domain/types';
import { nowIso } from '@/lib/format';
import { mockESignProvider } from './esign-provider';
import { useStore } from './store';
import { buildScenario, type ScenarioId } from './scenarios';

/**
 * The mock "API". Every call resolves after 200–600ms so loading states are real.
 * When "Simulate failures" is on in the dev panel, roughly 30% of calls reject.
 */
export class ApiError extends Error {}

function delay() {
  return new Promise((r) => setTimeout(r, 200 + Math.random() * 400));
}

async function call<T>(fn: () => T | Promise<T>): Promise<T> {
  await delay();
  if (useStore.getState().simulateFailures && Math.random() < 0.3) {
    throw new ApiError('The server did not respond. Try again.');
  }
  return fn();
}

const s = () => useStore.getState();

/** Session-only object URLs for uploaded files, keyed by request/module/slot. */
const previewUrls = new Map<string, string>();
const urlKey = (requestId: string, moduleId: string, slotId: string) => `${requestId}:${moduleId}:${slotId}`;

export function getPreviewUrl(requestId: string, moduleId: string, slotId: string): string | undefined {
  return previewUrls.get(urlKey(requestId, moduleId, slotId));
}

export const api = {
  /** Drafts save locally and immediately so nothing typed is ever lost. */
  saveStepData(requestId: string, moduleId: ModuleId, stepId: string, data: unknown) {
    s().saveStepData(requestId, moduleId, stepId, data);
  },

  uploadFile(requestId: string, moduleId: ModuleId, slot: { id: string; label: string; required: boolean }, file: File) {
    return call(() => {
      const key = urlKey(requestId, moduleId, slot.id);
      const old = previewUrls.get(key);
      if (old) URL.revokeObjectURL(old);
      previewUrls.set(key, URL.createObjectURL(file));
      const item: UploadItem = {
        slotId: slot.id,
        label: slot.label,
        required: slot.required,
        status: 'uploaded',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: nowIso(),
      };
      s().setUpload(requestId, moduleId, item);
      return item;
    });
  },

  removeUpload(requestId: string, moduleId: ModuleId, slotId: string) {
    return call(() => {
      const key = urlKey(requestId, moduleId, slotId);
      const old = previewUrls.get(key);
      if (old) URL.revokeObjectURL(old);
      previewUrls.delete(key);
      s().removeUpload(requestId, moduleId, slotId);
    });
  },

  submitModule(requestId: string, moduleId: ModuleId) {
    return call(() => s().submitModule(requestId, moduleId));
  },

  /** Submit a module's data ahead of signing; its documents are prepared from it. */
  submitModuleData(requestId: string, moduleId: ModuleId) {
    return call(() => s().submitModuleData(requestId, moduleId));
  },

  /** Go back from signing to editing the module's data. */
  reopenModuleData(requestId: string, moduleId: ModuleId) {
    return call(() => s().reopenModuleData(requestId, moduleId));
  },

  requestRevert(requestId: string, moduleId: ModuleId, reason: string) {
    return call(() => s().requestRevert(requestId, moduleId, reason));
  },

  async createESign(
    requestId: string,
    moduleId: ModuleId,
    def: { id: string; title: string; required: boolean; templateId: string },
  ) {
    const { provider } = s();
    const { envelopeId, status } = await mockESignProvider.createEnvelope({ templateId: def.templateId, signer: provider });
    const item: ESignItem = { id: def.id, title: def.title, required: def.required, status, providerEnvelopeId: envelopeId };
    s().addESign(requestId, moduleId, item);
    return item;
  },

  signESign(requestId: string, moduleId: ModuleId, esignId: string) {
    return call(async () => {
      const req = s().requests.find((r) => r.id === requestId);
      const item = req?.modules.find((m) => m.id === moduleId)?.esigns[esignId];
      if (!item?.providerEnvelopeId) throw new ApiError('This document is not ready to sign yet.');
      const res = await mockESignProvider.sign(item.providerEnvelopeId);
      s().signESign(requestId, moduleId, esignId, res.signedAt);
    });
  },

  requestNewESignDocument(requestId: string, moduleId: ModuleId, esignId: string, templateId: string) {
    return call(async () => {
      const { envelopeId } = await mockESignProvider.createEnvelope({ templateId, signer: s().provider });
      s().requestNewESignDocument(requestId, moduleId, esignId, envelopeId);
    });
  },

  // ---- Admin (dev panel) ----
  admin: {
    rejectUpload: (r: string, m: ModuleId, slot: string, reason: string) => call(() => s().adminRejectUpload(r, m, slot, reason)),
    acceptUpload: (r: string, m: ModuleId, slot: string) => call(() => s().adminAcceptUpload(r, m, slot)),
    approveModule: (r: string, m: ModuleId) => call(() => s().adminApproveModule(r, m)),
    rejectModule: (r: string, m: ModuleId, message: string, reopen?: ModuleId) =>
      call(() => s().adminRejectModule(r, m, message, reopen)),
    acceptRevert: (r: string, m: ModuleId) => call(() => s().adminAcceptRevert(r, m)),
    declineRevert: (r: string, m: ModuleId, note: string) => call(() => s().adminDeclineRevert(r, m, note)),
    forceReopen: (r: string, m: ModuleId) => call(() => s().adminForceReopen(r, m)),
    forceApprove: (r: string, m: ModuleId) => call(() => s().adminForceApprove(r, m)),
    setESignStatus: (r: string, m: ModuleId, id: string, status: ESignStatus, reason?: string) =>
      call(() => s().adminSetESignStatus(r, m, id, status, reason)),
    setBackgroundCheckCleared: (r: string, cleared: boolean) => call(() => s().adminSetBackgroundCheckCleared(r, cleared)),
    resetDemoData: () => call(() => s().resetDemoData()),
    loadScenario: (id: ScenarioId) => call(() => s().replaceRequests(buildScenario(id))),
  },
};

/**
 * After a reload the mock vendor has forgotten its envelopes; restart the
 * preparing → waiting flip for anything still preparing, and mirror vendor pushes into the store.
 */
export function startESignSync() {
  const unsub = mockESignProvider.subscribe((envelopeId, status) => s().setESignStatusByEnvelope(envelopeId, status));
  for (const r of s().requests) {
    for (const m of r.modules) {
      for (const e of Object.values(m.esigns)) {
        if (e.status === 'preparing' && e.providerEnvelopeId) mockESignProvider.resume(e.providerEnvelopeId);
      }
    }
  }
  return unsub;
}
