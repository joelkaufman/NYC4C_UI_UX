import type { ESignItemDef, HelperDef, ModuleInstance, ProviderRequest, StepProps } from '@/domain/types';
import { usesDirectDeposit } from '@/domain/conditions';
import { esignIssues } from '@/domain/validation';
import { ESignItem, useEnsureESigns } from '@/components/shared/ESignItem';
import { useStepContext } from '@/components/shared/step-context';
import { isEditable } from '@/domain/lifecycle';

export function esignDefs(request: ProviderRequest): ESignItemDef[] {
  const defs: ESignItemDef[] = [
    { id: 'employment_agreement', stepId: 'documents', title: 'Employment Agreement', description: 'Your role, pay rate and terms of employment.', required: true, templateId: 'tpl_employment' },
    { id: 'confidentiality_hipaa', stepId: 'documents', title: 'Confidentiality & HIPAA Acknowledgment', description: 'How you protect client health information.', required: true, templateId: 'tpl_hipaa' },
  ];
  if (usesDirectDeposit(request)) {
    defs.push({ id: 'direct_deposit', stepId: 'documents', title: 'Direct Deposit Authorization', description: 'Lets payroll deposit your pay into your bank account.', required: true, templateId: 'tpl_direct_deposit' });
  }
  defs.push({ id: 'handbook_ack', stepId: 'documents', title: 'Handbook Acknowledgment', description: 'Confirms you received the employee handbook.', required: false, templateId: 'tpl_handbook' });
  return defs;
}

export const signHelper: HelperDef = {
  id: 'sign-now',
  label: 'What happens when I sign?',
  title: 'What happens when I click Sign now?',
  content: {
    paragraphs: [
      'Each document is prepared for you by our e-sign provider. When it is ready, Sign now applies your electronic signature with today’s date. An electronic signature is legally binding, just like signing on paper.',
      'You can open a signed copy at any time from this page.',
    ],
    bullets: [
      'Documents marked Required must be signed before you can finish.',
      'If a document shows Rejected, HR voided it. Request a new document and sign the new version.',
      'Signing does not share your Social Security number or bank details with anyone new.',
    ],
  },
};

export function issues(_data: unknown, instance: ModuleInstance, request: ProviderRequest) {
  return esignIssues(instance, esignDefs(request));
}

export function ESignStep({ request, instance, readOnly }: StepProps) {
  const ctx = useStepContext();
  const defs = esignDefs(request);
  useEnsureESigns(request, instance.id, defs, isEditable(instance.status));
  const required = defs.filter((d) => d.required);
  const signedCount = required.filter((d) => instance.esigns[d.id]?.status === 'signed').length;
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground tabular" aria-live="polite">
        {signedCount} of {required.length} required documents signed
      </p>
      {defs.map((d) => (
        <ESignItem key={d.id} requestId={request.id} moduleId={instance.id} def={d} item={instance.esigns[d.id]} readOnly={readOnly} error={ctx.errorFor(d.id)} />
      ))}
    </div>
  );
}
