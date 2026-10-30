import { z } from 'zod';
import type { CertificatesData, TrainingsData } from '@/domain/data';
import { requireKeys, stepSchema } from '@/domain/validation';

export const certificatesSchema = stepSchema<CertificatesData>((d, ctx) => {
  (d.certificates ?? []).forEach((c, i) => {
    requireKeys(
      ctx,
      c as unknown as Record<string, unknown>,
      {
        type: 'Choose the certificate type',
        organization: 'Enter the issuing organization',
        issueDate: 'Enter the issue date',
        expiryDate: 'Enter the expiry date',
        ...(c?.type === 'other' ? { otherType: 'Name the certificate' } : {}),
      },
      ['certificates', i],
    );
    if (c?.issueDate && c?.expiryDate && c.expiryDate < c.issueDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['certificates', i, 'expiryDate'], message: 'Expiry date must be after the issue date' });
    }
  });
});

export const trainingsSchema = stepSchema<TrainingsData>((d, ctx) => {
  const list = d.trainings ?? [];
  if (!list.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['trainings'], message: 'Add at least one training' });
  list.forEach((t, i) => {
    requireKeys(
      ctx,
      t as unknown as Record<string, unknown>,
      { name: 'Enter the training name', provider: 'Enter the training provider', completionDate: 'Enter the completion date', hours: 'Enter the number of hours' },
      ['trainings', i],
    );
    if (t?.hours && !(Number(t.hours) > 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['trainings', i, 'hours'], message: 'Enter hours as a number greater than 0' });
    }
  });
});
