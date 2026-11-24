import type { ComponentType } from 'react';
import type { ZodTypeAny } from 'zod';

export type RequestStatus = 'not_started' | 'in_progress' | 'completed';

export type ModuleStatus =
  | 'locked_future' // previous module not approved yet
  | 'open' // current module, editable
  | 'in_review' // submitted, waiting for admin (only if module.requiresReview)
  | 'rejected' // admin rejected the review; module is open again, show rejection message
  | 'approved' // done and locked; fields read-only
  | 'revert_requested'; // provider asked admin to reopen an approved module

export type UploadStatus = 'missing' | 'uploaded' | 'rejected' | 'accepted';

export type ESignStatus = 'preparing' | 'waiting_for_signature' | 'signed' | 'rejected';

export type ModuleId = 'information' | 'background_check' | 'training' | 'hr_review';

export interface Provider {
  name: string;
  email: string;
}

/** Application details set by staff; the provider sees them read-only. */
export interface ApplicationInfo {
  position: string;
  credentials: string;
  channel: string;
  division: string;
}

export interface ProviderRequest {
  id: string;
  title: string; // e.g. "Onboarding – Home Care Provider"
  processType: 'onboarding';
  createdAt: string;
  status: RequestStatus;
  application: ApplicationInfo;
  modules: ModuleInstance[];
}

export interface ModuleInstance {
  id: ModuleId;
  status: ModuleStatus;
  requiresReview: boolean;
  rejectionMessage?: string;
  revertRequest?: { reason: string; requestedAt: string };
  revertDeclineNote?: string;
  /** Set when the module's data is submitted ahead of signing its documents; the data is locked from then on. */
  dataSubmittedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  /** Background check only: informational "cleared" flag toggled by admin. */
  backgroundCheckCleared?: boolean;
  data: Record<string, unknown>; // all step form data for this module, keyed by step id
  uploads: Record<string, UploadItem>; // keyed by upload slot id
  esigns: Record<string, ESignItem>; // keyed by e-sign item id
}

export interface UploadItem {
  slotId: string;
  label: string;
  required: boolean;
  status: UploadStatus;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  /** Object URL valid for the current session only. */
  previewUrl?: string;
  uploadedAt?: string;
  rejectionReason?: string;
}

export interface ESignItem {
  id: string;
  title: string; // e.g. "Employment Agreement"
  required: boolean;
  status: ESignStatus;
  providerEnvelopeId?: string;
  signedAt?: string;
  rejectionReason?: string;
}

export type StepIssueKind = 'missing_required' | 'rejected_upload' | 'esign_pending' | 'esign_rejected';

export interface StepIssue {
  kind: StepIssueKind;
  targetId: string; // field name, upload slot id or esign id
  message: string;
}

export interface ModuleValidation {
  stepIssues: Record<string, StepIssue[]>; // stepId -> issues
  isComplete: boolean; // no blocking issues
}

export interface PreviewItem {
  label: string;
  value?: string | null;
  /** Span the full row in the two-column preview grid. */
  wide?: boolean;
  /** Field name this item shows, so Preview can mark it when it has an open issue. */
  targetId?: string;
}

export interface PreviewSection {
  title: string;
  items: PreviewItem[];
  /** Optional one-line note shown under the section title. */
  note?: string;
}

export interface HelperContent {
  paragraphs?: string[];
  bullets?: string[];
  /** When present, a labelled sample-document placeholder is rendered. */
  sample?: string;
}

export interface HelperDef {
  id: string;
  /** Button label; defaults to "How to". */
  label?: string;
  title: string;
  content: HelperContent;
}

export interface UploadSlotDef {
  id: string;
  stepId: string;
  label: string;
  description?: string;
  required: boolean;
  accept: string[];
  maxSizeMb: number;
}

export interface ESignItemDef {
  id: string;
  stepId: string;
  title: string;
  description: string;
  required: boolean;
  templateId: string;
}

export interface StepProps {
  request: ProviderRequest;
  instance: ModuleInstance;
  moduleDef: ModuleDef;
  step: StepDef;
  readOnly: boolean;
  issues: StepIssue[];
}

export interface StepDef {
  id: string;
  title: string;
  description?: string;
  component: ComponentType<StepProps>;
  kind: 'form' | 'upload' | 'esign' | 'confirm' | 'preview' | 'custom';
  schema?: ZodTypeAny;
  helpers?: HelperDef[];
  previewSections?: (data: unknown, request: ProviderRequest) => PreviewSection[];
  issues?: (data: unknown, instance: ModuleInstance, request: ProviderRequest) => StepIssue[];
}

export interface ModuleDef {
  id: ModuleId;
  title: string;
  description: string;
  requiresReview: boolean;
  steps: StepDef[];
  uploadSlots(request: ProviderRequest): UploadSlotDef[];
  esignItems(request: ProviderRequest): ESignItemDef[];
  // returns validation state for the whole module given its instance + full request
  validate(instance: ModuleInstance, request: ProviderRequest): ModuleValidation;
}
