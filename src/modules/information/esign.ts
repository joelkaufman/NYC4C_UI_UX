import type { ESignItemDef, HelperDef } from '@/domain/types';

/** Signed on Information › Sign documents, once the information itself has been submitted. */
export function signDefs(): ESignItemDef[] {
  return [
    { id: 'employment_agreement', stepId: 'sign', title: 'Employment Agreement', description: 'Your role, pay rate and terms of employment.', required: true, templateId: 'tpl_employment' },
    { id: 'confidentiality_hipaa', stepId: 'sign', title: 'Confidentiality & HIPAA Acknowledgment', description: 'How you protect client health information.', required: true, templateId: 'tpl_hipaa' },
    { id: 'direct_deposit', stepId: 'sign', title: 'Direct Deposit Authorization', description: 'Lets payroll deposit your pay into your bank account.', required: true, templateId: 'tpl_direct_deposit' },
    { id: 'handbook_ack', stepId: 'sign', title: 'Handbook Acknowledgment', description: 'Confirms you received the employee handbook.', required: false, templateId: 'tpl_handbook' },
  ];
}

export const signHelper: HelperDef = {
  id: 'sign-now',
  label: 'What happens when I sign?',
  title: 'What happens when I click Sign now?',
  content: {
    paragraphs: [
      'Your documents are prepared from the information you submit, so they unlock once you submit it. When a document is ready, Sign now applies your electronic signature with today’s date. An electronic signature is legally binding, just like signing on paper.',
      'You can open a signed copy at any time from this page.',
    ],
    bullets: [
      'Documents marked Required must be signed before you can send Information to HR.',
      'If you edit your information again, new documents are prepared and you sign those instead.',
      'If a document shows Rejected, HR voided it. Request a new document and sign the new version.',
      'Signing does not share your Social Security number or bank details with anyone new.',
    ],
  },
};
