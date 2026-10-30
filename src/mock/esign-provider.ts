import type { ESignStatus } from '@/domain/types';
import { nowIso, uid } from '@/lib/format';

/** Interface the real e-sign vendor adapter will implement. */
export interface ESignProvider {
  createEnvelope(input: {
    templateId: string;
    signer: { name: string; email: string };
  }): Promise<{ envelopeId: string; status: ESignStatus }>;
  getStatus(envelopeId: string): Promise<ESignStatus>;
  sign(envelopeId: string): Promise<{ status: 'signed'; signedAt: string }>;
  void(envelopeId: string, reason: string): Promise<void>;
}

type StatusListener = (envelopeId: string, status: ESignStatus) => void;

/**
 * Mock vendor: envelopes start as `preparing` and flip to `waiting_for_signature`
 * after ~1.5s; `sign` resolves after ~800ms. Status changes are pushed to subscribers
 * so the store can mirror them, the way a webhook would.
 */
class MockESignProvider implements ESignProvider {
  private envelopes = new Map<string, ESignStatus>();
  private listeners = new Set<StatusListener>();

  subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(envelopeId: string, status: ESignStatus) {
    this.envelopes.set(envelopeId, status);
    this.listeners.forEach((l) => l(envelopeId, status));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createEnvelope(_input: { templateId: string; signer: { name: string; email: string } }): Promise<{ envelopeId: string; status: ESignStatus }> {
    const envelopeId = uid('env');
    this.envelopes.set(envelopeId, 'preparing');
    window.setTimeout(() => {
      if (this.envelopes.get(envelopeId) === 'preparing') this.emit(envelopeId, 'waiting_for_signature');
    }, 1500);
    return { envelopeId, status: 'preparing' };
  }

  /** Mock-only: restart the preparing → waiting flip for an envelope restored from storage. */
  resume(envelopeId: string) {
    this.envelopes.set(envelopeId, 'preparing');
    window.setTimeout(() => {
      if (this.envelopes.get(envelopeId) === 'preparing') this.emit(envelopeId, 'waiting_for_signature');
    }, 1500);
  }

  async getStatus(envelopeId: string): Promise<ESignStatus> {
    return this.envelopes.get(envelopeId) ?? 'waiting_for_signature';
  }

  sign(envelopeId: string): Promise<{ status: 'signed'; signedAt: string }> {
    return new Promise((resolve) => {
      window.setTimeout(() => {
        const signedAt = nowIso();
        this.envelopes.set(envelopeId, 'signed');
        resolve({ status: 'signed', signedAt });
      }, 800);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async void(envelopeId: string, _reason: string): Promise<void> {
    this.envelopes.set(envelopeId, 'rejected');
  }
}

export const mockESignProvider = new MockESignProvider();
