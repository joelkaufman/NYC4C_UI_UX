import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ESignItem,
  ESignStatus,
  ModuleId,
  Provider,
  ProviderRequest,
  UploadItem,
} from '@/domain/types';
import {
  approveModule,
  recomputeStatus,
  reopenModule,
  reopenModuleData,
  submitModule as submitModuleRule,
  submitModuleData,
  withModule,
} from '@/domain/lifecycle';
import { nowIso } from '@/lib/format';
import { buildSeedRequests, SEED_PROVIDER } from './seed';

export const STORE_KEY = 'onboarding-demo-v1';

export type LayoutVariant = 'classic' | 'queue' | 'scroll';
export const LAYOUT_VARIANTS: { id: LayoutVariant; label: string }[] = [
  { id: 'classic', label: 'Classic: module rail + step path' },
  { id: 'queue', label: 'Issue queue: next-up rail + module strip' },
  { id: 'scroll', label: 'Single scroll: whole module on one page' },
];

export interface StoreState {
  provider: Provider;
  requests: ProviderRequest[];
  /** `${requestId}:${moduleId}:${stepId}` for steps the provider has left at least once. */
  visited: Record<string, true>;
  /** Bumped when data is replaced wholesale, so open forms remount with fresh values. */
  dataVersion: number;
  /** Dev toggle: mock API calls fail ~30% of the time. Off by default. */
  simulateFailures: boolean;
  /** ISO time of the provider's last saved change (drafts, uploads, signatures). */
  lastSavedAt?: string;
  /** Layout exploration for the process view; switchable from the dev panel or ?layout=. */
  layoutVariant: LayoutVariant;
  setLayoutVariant(v: LayoutVariant): void;

  // Provider actions (sync; src/mock/api.ts wraps them in async calls)
  saveStepData(requestId: string, moduleId: ModuleId, stepId: string, data: unknown): void;
  setUpload(requestId: string, moduleId: ModuleId, item: UploadItem): void;
  removeUpload(requestId: string, moduleId: ModuleId, slotId: string): void;
  submitModule(requestId: string, moduleId: ModuleId): void;
  submitModuleData(requestId: string, moduleId: ModuleId): void;
  reopenModuleData(requestId: string, moduleId: ModuleId): void;
  requestRevert(requestId: string, moduleId: ModuleId, reason: string): void;
  addESign(requestId: string, moduleId: ModuleId, item: ESignItem): void;
  signESign(requestId: string, moduleId: ModuleId, esignId: string, signedAt: string): void;
  requestNewESignDocument(requestId: string, moduleId: ModuleId, esignId: string, envelopeId: string): void;
  setESignStatusByEnvelope(envelopeId: string, status: ESignStatus): void;

  // Admin actions
  adminRejectUpload(requestId: string, moduleId: ModuleId, slotId: string, reason: string): void;
  adminAcceptUpload(requestId: string, moduleId: ModuleId, slotId: string): void;
  adminApproveModule(requestId: string, moduleId: ModuleId): void;
  adminRejectModule(requestId: string, moduleId: ModuleId, message: string, reopenModuleId?: ModuleId): void;
  adminAcceptRevert(requestId: string, moduleId: ModuleId): void;
  adminDeclineRevert(requestId: string, moduleId: ModuleId, note: string): void;
  adminForceReopen(requestId: string, moduleId: ModuleId): void;
  adminForceApprove(requestId: string, moduleId: ModuleId): void;
  adminSetESignStatus(requestId: string, moduleId: ModuleId, esignId: string, status: ESignStatus, reason?: string): void;
  adminSetBackgroundCheckCleared(requestId: string, cleared: boolean): void;
  replaceRequests(requests: ProviderRequest[]): void;
  resetDemoData(): void;

  markVisited(keys: string[]): void;
  setSimulateFailures(on: boolean): void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => {
      const update = (requestId: string, fn: (r: ProviderRequest) => ProviderRequest) =>
        set((s) => ({ requests: s.requests.map((r) => (r.id === requestId ? fn(r) : r)) }));
      const touchSaved = () => set({ lastSavedAt: nowIso() });

      return {
        provider: SEED_PROVIDER,
        requests: buildSeedRequests(),
        visited: {},
        dataVersion: 0,
        simulateFailures: false,
        layoutVariant: 'classic',
        setLayoutVariant: (layoutVariant) => set({ layoutVariant }),

        saveStepData: (requestId, moduleId, stepId, data) => {
          update(requestId, (r) =>
            recomputeStatus(withModule(r, moduleId, (m) => ({ ...m, data: { ...m.data, [stepId]: data } }))),
          );
          touchSaved();
        },

        setUpload: (requestId, moduleId, item) => {
          update(requestId, (r) =>
            recomputeStatus(withModule(r, moduleId, (m) => ({ ...m, uploads: { ...m.uploads, [item.slotId]: item } }))),
          );
          touchSaved();
        },

        removeUpload: (requestId, moduleId, slotId) =>
          update(requestId, (r) =>
            withModule(r, moduleId, (m) => {
              const uploads = { ...m.uploads };
              delete uploads[slotId];
              return { ...m, uploads };
            }),
          ),

        submitModule: (requestId, moduleId) => update(requestId, (r) => submitModuleRule(r, moduleId, nowIso())),

        submitModuleData: (requestId, moduleId) => update(requestId, (r) => submitModuleData(r, moduleId, nowIso())),

        reopenModuleData: (requestId, moduleId) => update(requestId, (r) => reopenModuleData(r, moduleId)),

        requestRevert: (requestId, moduleId, reason) =>
          update(requestId, (r) =>
            withModule(r, moduleId, (m) => ({
              ...m,
              status: 'revert_requested',
              revertRequest: { reason, requestedAt: nowIso() },
              revertDeclineNote: undefined,
            })),
          ),

        addESign: (requestId, moduleId, item) =>
          update(requestId, (r) =>
            withModule(r, moduleId, (m) => ({ ...m, esigns: { ...m.esigns, [item.id]: item } })),
          ),

        signESign: (requestId, moduleId, esignId, signedAt) =>
          update(requestId, (r) =>
            withModule(r, moduleId, (m) => ({
              ...m,
              esigns: {
                ...m.esigns,
                [esignId]: { ...m.esigns[esignId], status: 'signed', signedAt, rejectionReason: undefined },
              },
            })),
          ),

        requestNewESignDocument: (requestId, moduleId, esignId, envelopeId) =>
          update(requestId, (r) =>
            withModule(r, moduleId, (m) => ({
              ...m,
              esigns: {
                ...m.esigns,
                [esignId]: {
                  ...m.esigns[esignId],
                  status: 'preparing',
                  providerEnvelopeId: envelopeId,
                  rejectionReason: undefined,
                  signedAt: undefined,
                },
              },
            })),
          ),

        setESignStatusByEnvelope: (envelopeId, status) =>
          set((s) => ({
            requests: s.requests.map((r) => ({
              ...r,
              modules: r.modules.map((m) => {
                const hit = Object.values(m.esigns).find((e) => e.providerEnvelopeId === envelopeId);
                if (!hit || hit.status !== 'preparing') return m;
                return { ...m, esigns: { ...m.esigns, [hit.id]: { ...hit, status } } };
              }),
            })),
          })),

        adminRejectUpload: (requestId, moduleId, slotId, reason) =>
          update(requestId, (r) =>
            withModule(r, moduleId, (m) =>
              m.uploads[slotId]
                ? { ...m, uploads: { ...m.uploads, [slotId]: { ...m.uploads[slotId], status: 'rejected', rejectionReason: reason } } }
                : m,
            ),
          ),

        adminAcceptUpload: (requestId, moduleId, slotId) =>
          update(requestId, (r) =>
            withModule(r, moduleId, (m) =>
              m.uploads[slotId]
                ? { ...m, uploads: { ...m.uploads, [slotId]: { ...m.uploads[slotId], status: 'accepted', rejectionReason: undefined } } }
                : m,
            ),
          ),

        adminApproveModule: (requestId, moduleId) => update(requestId, (r) => approveModule(r, moduleId, nowIso())),

        adminRejectModule: (requestId, moduleId, message, reopenModuleId) =>
          update(requestId, (r) => reopenModule(r, reopenModuleId ?? moduleId, 'rejected', message)),

        adminAcceptRevert: (requestId, moduleId) => update(requestId, (r) => reopenModule(r, moduleId, 'open')),

        adminDeclineRevert: (requestId, moduleId, note) =>
          update(requestId, (r) =>
            withModule(r, moduleId, (m) => ({
              ...m,
              status: 'approved',
              revertRequest: undefined,
              revertDeclineNote: note || 'Your change request was declined.',
            })),
          ),

        adminForceReopen: (requestId, moduleId) => update(requestId, (r) => reopenModule(r, moduleId, 'open')),

        adminForceApprove: (requestId, moduleId) => update(requestId, (r) => approveModule(r, moduleId, nowIso())),

        adminSetESignStatus: (requestId, moduleId, esignId, status, reason) =>
          update(requestId, (r) =>
            withModule(r, moduleId, (m) =>
              m.esigns[esignId]
                ? {
                    ...m,
                    esigns: {
                      ...m.esigns,
                      [esignId]: {
                        ...m.esigns[esignId],
                        status,
                        rejectionReason: status === 'rejected' ? reason || 'The document was voided.' : undefined,
                        signedAt: status === 'signed' ? m.esigns[esignId].signedAt ?? nowIso() : undefined,
                      },
                    },
                  }
                : m,
            ),
          ),

        adminSetBackgroundCheckCleared: (requestId, cleared) =>
          update(requestId, (r) => withModule(r, 'background_check', (m) => ({ ...m, backgroundCheckCleared: cleared }))),

        replaceRequests: (requests) => set((s) => ({ requests, visited: {}, dataVersion: s.dataVersion + 1 })),

        resetDemoData: () =>
          set((s) => ({ requests: buildSeedRequests(), visited: {}, dataVersion: s.dataVersion + 1 })),

        markVisited: (keys) =>
          set((s) => {
            if (keys.every((k) => s.visited[k])) return s;
            const visited = { ...s.visited };
            keys.forEach((k) => (visited[k] = true));
            return { visited };
          }),

        setSimulateFailures: (on) => set({ simulateFailures: on }),
      };
    },
    {
      name: STORE_KEY,
      // 2: Information fields replaced from the onboarding fields sheet; older saved data is dropped and reseeded.
      // 3: New Application fields added (name, contact, application details, fingerprint availability).
      // 4: E-sign module removed; its documents are signed on Information › Submit & sign.
      version: 4,
      partialize: (s) => ({
        requests: s.requests.map((r) => ({
          ...r,
          // Object URLs die with the page; never persist them.
          modules: r.modules.map((m) => ({
            ...m,
            uploads: Object.fromEntries(
              Object.entries(m.uploads).map(([k, u]) => [k, { ...u, previewUrl: undefined }]),
            ),
          })),
        })),
        visited: s.visited,
        dataVersion: s.dataVersion,
        simulateFailures: s.simulateFailures,
        layoutVariant: s.layoutVariant,
        lastSavedAt: s.lastSavedAt,
      }),
    },
  ),
);

export function visitKey(requestId: string, moduleId: string, stepId: string) {
  return `${requestId}:${moduleId}:${stepId}`;
}

export function useRequest(requestId: string | undefined) {
  return useStore((s) => s.requests.find((r) => r.id === requestId));
}
