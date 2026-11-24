import type { ProviderRequest } from '@/domain/types';
import { recomputeStatus } from '@/domain/lifecycle';
import {
  emptyRequest,
  informationData,
  mariaBackground,
  mariaCertificates,
  mariaESigns,
  mariaInfoUploads,
  mariaTrainings,
  mariaTrainingUploads,
  seedCompleted,
} from './seed';

export type ScenarioId = 'fresh_start' | 'waiting_on_esign' | 'change_requested_information' | 'hr_rejected_training';

export const SCENARIOS: { id: ScenarioId; label: string; description: string }[] = [
  { id: 'fresh_start', label: 'Fresh start', description: 'One new request, nothing filled in.' },
  { id: 'waiting_on_esign', label: 'Waiting on e-sign', description: 'Information submitted; its documents are ready to sign.' },
  { id: 'change_requested_information', label: 'Change requested on Information', description: 'Provider asked to reopen an approved Information module.' },
  { id: 'hr_rejected_training', label: 'HR rejected back to Training', description: 'HR sent the file back; Training is reopened with a message.' },
];

const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();

function approvedThroughBackground(id: string): ProviderRequest {
  const r = emptyRequest(id, 18);
  r.modules[0] = {
    ...r.modules[0],
    status: 'approved',
    dataSubmittedAt: iso(8),
    submittedAt: iso(8),
    approvedAt: iso(6),
    data: informationData('associate'),
    uploads: mariaInfoUploads(9),
    esigns: mariaESigns(8),
  };
  r.modules[1] = { ...r.modules[1], status: 'approved', submittedAt: iso(4), approvedAt: iso(4), backgroundCheckCleared: false, data: { confirm: mariaBackground() } };
  return r;
}

export function buildScenario(id: ScenarioId): ProviderRequest[] {
  switch (id) {
    case 'fresh_start':
      return [recomputeStatus(emptyRequest('req_fresh'))];

    case 'waiting_on_esign': {
      const r = emptyRequest('req_esign', 18);
      const esigns = mariaESigns(1);
      esigns.employment_agreement = { ...esigns.employment_agreement, status: 'signed' };
      esigns.confidentiality_hipaa = { ...esigns.confidentiality_hipaa, status: 'waiting_for_signature', signedAt: undefined };
      esigns.direct_deposit = { ...esigns.direct_deposit, status: 'waiting_for_signature', signedAt: undefined };
      esigns.handbook_ack = { ...esigns.handbook_ack, status: 'waiting_for_signature', signedAt: undefined };
      r.modules[0] = { ...r.modules[0], dataSubmittedAt: iso(1), data: informationData('associate'), uploads: mariaInfoUploads(9), esigns };
      return [recomputeStatus(r)];
    }

    case 'change_requested_information': {
      const r = approvedThroughBackground('req_change');
      r.modules[0] = { ...r.modules[0], status: 'revert_requested', revertRequest: { reason: 'I moved last month and need to update my current address.', requestedAt: iso(0) } };
      r.modules[2] = { ...r.modules[2], status: 'open' };
      return [recomputeStatus(r)];
    }

    case 'hr_rejected_training': {
      const r = approvedThroughBackground('req_hr_rejected');
      r.modules[0] = { ...r.modules[0], data: informationData('nursing_degree') };
      r.modules[2] = {
        ...r.modules[2],
        status: 'rejected',
        rejectionMessage: 'Your CPR certificate copy is unreadable. Upload a clear scan showing the expiry date.',
        data: { certificates: mariaCertificates(), trainings: mariaTrainings() },
        uploads: (() => {
          const u = mariaTrainingUploads(2, true);
          u.cert_cert_1 = { ...u.cert_cert_1, status: 'rejected', rejectionReason: 'Unreadable scan. Upload a clear copy showing the expiry date.' };
          return u;
        })(),
        esigns: {
          licensed_attestation: { id: 'licensed_attestation', title: 'Licensed Provider Attestation', required: true, status: 'signed', providerEnvelopeId: 'env_seed_att', signedAt: iso(2) },
        },
      };
      return [recomputeStatus(r), seedCompleted()];
    }
  }
}
