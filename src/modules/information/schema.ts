import { z } from 'zod';
import type { AddressesData, EducationData, HouseholdData, PersonalData } from '@/domain/data';
import { isBlank, requireKeys, stepSchema } from '@/domain/validation';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digits = (v?: string) => (v ?? '').replace(/\D/g, '');

export const personalSchema = stepSchema<PersonalData>((d, ctx) => {
  requireKeys(ctx, d, {
    firstName: 'Enter your first name',
    lastName: 'Enter your last name',
    hasOtherName: 'Answer whether you have been known by another name',
    dob: 'Enter your date of birth',
    ssn: 'Enter your Social Security number',
    email: 'Enter your email address',
    mobile: 'Enter your mobile phone number',
    preferredContact: 'Choose how we should contact you',
    workAuth: 'Choose your work authorization status',
    paymentMethod: 'Choose how you want to be paid',
    emergencyName: 'Enter your emergency contact’s name',
    emergencyRelationship: 'Enter your emergency contact’s relationship to you',
    emergencyPhone: 'Enter your emergency contact’s phone number',
  });
  if (d.hasOtherName === 'yes') requireKeys(ctx, d, { previousName: 'Enter your previous legal name' });
  if (d.workAuth === 'visa') requireKeys(ctx, d, { visaType: 'Enter your visa type', visaExpiry: 'Enter your visa expiry date' });
  const add = (path: string, message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
  if (!isBlank(d.ssn) && digits(d.ssn).length !== 9) add('ssn', 'Enter all 9 digits of your Social Security number');
  if (!isBlank(d.email) && !EMAIL.test(d.email ?? '')) add('email', 'Enter an email address like name@example.com');
  if (!isBlank(d.mobile) && digits(d.mobile).length !== 10) add('mobile', 'Enter a 10-digit phone number');
  if (!isBlank(d.homePhone) && digits(d.homePhone).length !== 10) add('homePhone', 'Enter a 10-digit phone number');
  if (!isBlank(d.emergencyPhone) && digits(d.emergencyPhone).length !== 10) add('emergencyPhone', 'Enter a 10-digit phone number');
});

export const addressesSchema = stepSchema<AddressesData>((d, ctx) => {
  const list = d.addresses ?? [];
  const current = list.filter((a) => a?.current);
  if (!current.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['addresses'], message: 'Add your current address' });
  } else if (current.length > 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['addresses'], message: 'Only one address can be marked as current' });
  }
  list.forEach((a, i) => {
    requireKeys(
      ctx,
      a as unknown as Record<string, unknown>,
      {
        type: 'Choose the address type',
        street: 'Enter the street address',
        city: 'Enter the city',
        state: 'Choose the state',
        zip: 'Enter the ZIP code',
        from: 'Enter the date you moved in',
        ...(a?.current ? {} : { to: 'Enter the date you moved out' }),
      },
      ['addresses', i],
    );
    if (a?.zip && !/^\d{5}$/.test(a.zip)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['addresses', i, 'zip'], message: 'Enter a 5-digit ZIP code' });
    if (a?.from && a?.to && !a.current && a.to < a.from) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['addresses', i, 'to'], message: 'Move-out date must be after move-in date' });
  });
});

export const householdSchema = stepSchema<HouseholdData>((d, ctx) => {
  const list = d.members ?? [];
  if (d.livesAlone) return;
  if (!list.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['members'], message: 'Add household members or confirm you live alone' });
  }
  list.forEach((m, i) => {
    requireKeys(
      ctx,
      m as unknown as Record<string, unknown>,
      { name: 'Enter their full name', relationship: 'Enter their relationship to you', dob: 'Enter their date of birth' },
      ['members', i],
    );
    if (m?.helpsWithCare === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['members', i, 'helpsWithCare'], message: 'Answer whether they help with care' });
    }
  });
});

export const educationSchema = stepSchema<EducationData>((d, ctx) => {
  requireKeys(ctx, d, { highestLevel: 'Choose your highest level of education' });
  if (d.highestLevel && d.highestLevel !== 'high_school') {
    requireKeys(ctx, d, { school: 'Enter the school name' });
  }
  if (d.graduationYear && !/^(19|20)\d{2}$/.test(d.graduationYear)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['graduationYear'], message: 'Enter a 4-digit year' });
  }
  const licensed = d.highestLevel === 'nursing_degree' || d.highestLevel === 'other_licensed';
  const list = d.licenses ?? [];
  if (licensed && !list.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['licenses'], message: 'Add your professional license' });
  }
  list.forEach((l, i) =>
    requireKeys(
      ctx,
      l as unknown as Record<string, unknown>,
      { type: 'Enter the license type', number: 'Enter the license number', state: 'Choose the issuing state', expiry: 'Enter the expiry date' },
      ['licenses', i],
    ),
  );
});
