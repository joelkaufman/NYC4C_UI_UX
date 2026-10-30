import type { ModuleInstance, ProviderRequest, StepProps, UploadSlotDef } from '@/domain/types';
import { requiresWorkAuthDocument } from '@/domain/conditions';
import { uploadIssues } from '@/domain/validation';
import { Section } from '@/components/shared/Section';
import { UploadSlot } from '@/components/shared/UploadSlot';
import { useStepContext } from '@/components/shared/step-context';

const IMG_PDF = ['application/pdf', 'image/jpeg', 'image/png'];

export function documentSlots(request: ProviderRequest): UploadSlotDef[] {
  const slots: UploadSlotDef[] = [
    { id: 'photo_id', stepId: 'documents', label: 'Government photo ID', description: 'Driver’s license, state ID or passport. Front side, not expired.', required: true, accept: IMG_PDF, maxSizeMb: 10 },
    { id: 'ssn_card', stepId: 'documents', label: 'Social Security card', description: 'The card, or an SSA letter showing your full number.', required: true, accept: IMG_PDF, maxSizeMb: 10 },
    { id: 'proof_of_address', stepId: 'documents', label: 'Proof of address', description: 'Upload a proof of address issued in the last 90 days.', required: true, accept: IMG_PDF, maxSizeMb: 10 },
  ];
  if (requiresWorkAuthDocument(request)) {
    slots.push({ id: 'work_auth_doc', stepId: 'documents', label: 'Work authorization document', description: 'Permanent resident card, or EAD / visa with I-94.', required: true, accept: IMG_PDF, maxSizeMb: 10 });
  }
  slots.push({
    id: 'resume',
    stepId: 'documents',
    label: 'Resume',
    description: 'Helps HR match you with clients.',
    required: false,
    accept: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSizeMb: 5,
  });
  return slots;
}

export function issues(_data: unknown, instance: ModuleInstance, request: ProviderRequest) {
  return uploadIssues(instance, documentSlots(request));
}

export function DocumentsStep({ request, instance, readOnly }: StepProps) {
  const ctx = useStepContext();
  const slots = documentSlots(request);
  const ids = slots.map((s) => s.id);
  const identity = slots.filter((s) => ['photo_id', 'ssn_card', 'work_auth_doc'].includes(s.id));
  const other = slots.filter((s) => !identity.includes(s));
  const render = (s: UploadSlotDef) => (
    <UploadSlot key={s.id} requestId={request.id} moduleId={instance.id} def={s} item={instance.uploads[s.id]} readOnly={readOnly} error={ctx.errorFor(s.id)} />
  );
  return (
    <>
      <Section title="Identity documents" fields={ids.filter((id) => identity.some((s) => s.id === id))}>
        {identity.map(render)}
      </Section>
      <Section title="Address and experience" fields={ids.filter((id) => other.some((s) => s.id === id))}>
        {other.map(render)}
      </Section>
    </>
  );
}
