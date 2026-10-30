import { useFormContext } from 'react-hook-form';
import type { Certificate, CertificatesData } from '@/domain/data';
import type { ESignItemDef, ModuleInstance, PreviewSection, ProviderRequest, StepProps, UploadSlotDef } from '@/domain/types';
import { isLicensedProvider, stepData } from '@/domain/conditions';
import { isEditable } from '@/domain/lifecycle';
import { esignIssues, issuesFromSchema, uploadIssues } from '@/domain/validation';
import { ESignItem, useEnsureESigns } from '@/components/shared/ESignItem';
import { RepeatableList } from '@/components/shared/RepeatableList';
import { Section } from '@/components/shared/Section';
import { UploadSlot } from '@/components/shared/UploadSlot';
import { StepForm, useBind, useStepContext } from '@/components/shared/step-context';
import { DateField, FieldRow, ReadOnlyField, SelectField, TextField, type Option } from '@/components/shared/fields';
import { daysBetween, formatDate, parseDate, uid } from '@/lib/format';
import { optionLabel } from '@/lib/options';
import { certificatesSchema } from './schema';

export { certificatesSchema as schema };

export const CERT_TYPES: Option[] = [
  { value: 'cpr', label: 'CPR' },
  { value: 'first_aid', label: 'First Aid' },
  { value: 'cna', label: 'CNA' },
  { value: 'hha', label: 'HHA' },
  { value: 'other', label: 'Other' },
];

const PDF_IMG = ['application/pdf', 'image/jpeg', 'image/png'];

export function certLabel(c: Partial<Certificate>) {
  return c.type === 'other' ? c.otherType || 'Other certificate' : optionLabel(CERT_TYPES, c.type) || 'Certificate';
}

export function certificateSlots(request: ProviderRequest): UploadSlotDef[] {
  const certs = (stepData<CertificatesData>(request, 'training', 'certificates').certificates ?? []).filter(Boolean);
  const slots: UploadSlotDef[] = certs.map((c) => ({
    id: `cert_${c.id}`,
    stepId: 'certificates',
    label: c.type ? `${certLabel(c)} certificate copy` : 'Certificate copy',
    description: 'A copy showing your name and the expiry date.',
    required: true,
    accept: PDF_IMG,
    maxSizeMb: 10,
  }));
  if (isLicensedProvider(request)) {
    slots.push({ id: 'license_copy', stepId: 'certificates', label: 'License copy', description: 'Your current professional license, showing the license number.', required: true, accept: PDF_IMG, maxSizeMb: 10 });
  }
  return slots;
}

export function attestationDefs(request: ProviderRequest): ESignItemDef[] {
  return isLicensedProvider(request)
    ? [{ id: 'licensed_attestation', stepId: 'certificates', title: 'Licensed Provider Attestation', description: 'Confirms your license is active and in good standing.', required: true, templateId: 'tpl_attestation' }]
    : [];
}

export function issues(data: unknown, instance: ModuleInstance, request: ProviderRequest) {
  return [...issuesFromSchema(certificatesSchema, data), ...uploadIssues(instance, certificateSlots(request)), ...esignIssues(instance, attestationDefs(request))];
}

export function previewSections(data: unknown): PreviewSection[] {
  const list = ((data as CertificatesData | undefined)?.certificates ?? []).filter(Boolean);
  return [
    {
      title: 'Certificates',
      items: list.length
        ? list.map((c) => ({ label: certLabel(c), value: `${c.organization} · issued ${formatDate(c.issueDate)} · expires ${formatDate(c.expiryDate)}`, wide: true }))
        : [{ label: 'Certificates', value: 'None added', wide: true }],
    },
  ];
}

function ExpiryChip({ date }: { date?: string }) {
  const d = parseDate(date);
  if (!d) return null;
  const days = daysBetween(new Date(), d);
  if (days > 60) return null;
  return (
    <span className="inline-flex h-5 items-center rounded-full bg-status-warning-bg px-2 text-2xs font-medium text-status-warning-fg">
      {days < 0 ? 'Expired' : `Expires in ${days} days`}
    </span>
  );
}

function CertEditor({ index }: { index: number }) {
  const bind = useBind();
  const { watch } = useFormContext<CertificatesData>();
  const p = `certificates.${index}`;
  const type = watch(`certificates.${index}.type`);
  return (
    <>
      <FieldRow>
        <SelectField {...bind(`${p}.type`)} label="Certificate type" required options={CERT_TYPES} />
        <TextField {...bind(`${p}.otherType`)} label="Certificate name" required hidden={type !== 'other'} />
      </FieldRow>
      <TextField {...bind(`${p}.organization`)} label="Issuing organization" required placeholder="For example American Red Cross" />
      <FieldRow>
        <DateField {...bind(`${p}.issueDate`)} label="Issue date" required />
        <DateField {...bind(`${p}.expiryDate`)} label="Expiry date" required />
      </FieldRow>
    </>
  );
}

function Fields({ request, instance, readOnly }: { request: ProviderRequest; instance: ModuleInstance; readOnly: boolean }) {
  const ctx = useStepContext();
  const licensed = isLicensedProvider(request);
  const license = certificateSlots(request).find((s) => s.id === 'license_copy');
  const attestation = attestationDefs(request);
  useEnsureESigns(request, instance.id, attestation, isEditable(instance.status));
  return (
    <>
      <Section
        title="Certificates"
        description="Add each active certificate and upload a copy of it."
        fields={['certificates', ...certificateSlots(request).filter((s) => s.id !== 'license_copy').map((s) => s.id)]}
      >
        <RepeatableList<Certificate>
          name="certificates"
          noun="certificate"
          addLabel="Add certificate"
          emptyText="No certificates added yet. Add CPR, First Aid, CNA or HHA certificates you hold."
          max={12}
          create={() => ({ id: uid('cert'), type: '', otherType: '', organization: '', issueDate: '', expiryDate: '' })}
          summary={(c) => ({
            title: c.type ? certLabel(c) : 'New certificate',
            meta: [c.organization, c.expiryDate ? `Expires ${formatDate(c.expiryDate)}` : null].filter(Boolean).join(' · '),
            chips: <ExpiryChip date={c.expiryDate} />,
          })}
          extraIssuePrefixes={(c) => [`cert_${c.id}`]}
          renderEditor={(i) => <CertEditor index={i} />}
          renderReadOnly={(c) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Certificate" value={certLabel(c)} />
              <ReadOnlyField label="Issuing organization" value={c.organization} />
              <ReadOnlyField label="Issue date" value={formatDate(c.issueDate)} />
              <ReadOnlyField label="Expiry date" value={formatDate(c.expiryDate)} />
            </div>
          )}
          renderAlways={(c) => {
            const slot = certificateSlots(request).find((s) => s.id === `cert_${c.id}`);
            return slot ? (
              <UploadSlot requestId={request.id} moduleId={instance.id} def={slot} item={instance.uploads[slot.id]} readOnly={readOnly} error={ctx.errorFor(slot.id)} compact />
            ) : null;
          }}
        />
      </Section>
      {licensed ? (
        <Section
          title="Professional license"
          description="Because you hold a nursing degree or other license, upload your license and sign the attestation."
          fields={['license_copy', 'licensed_attestation']}
        >
          {license ? (
            <UploadSlot requestId={request.id} moduleId={instance.id} def={license} item={instance.uploads[license.id]} readOnly={readOnly} error={ctx.errorFor(license.id)} />
          ) : null}
          {attestation.map((d) => (
            <ESignItem key={d.id} requestId={request.id} moduleId={instance.id} def={d} item={instance.esigns[d.id]} readOnly={readOnly} error={ctx.errorFor(d.id)} />
          ))}
        </Section>
      ) : null}
    </>
  );
}

export function CertificatesStep({ request, instance, readOnly, step }: StepProps) {
  return (
    <StepForm requestId={request.id} moduleId={instance.id} stepId={step.id} defaults={{ certificates: [] }} saved={instance.data[step.id]} readOnly={readOnly}>
      <Fields request={request} instance={instance} readOnly={readOnly} />
    </StepForm>
  );
}
