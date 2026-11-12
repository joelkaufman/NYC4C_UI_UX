import { z } from 'zod';
import type { AddressesData, EducationData, HouseholdData, PersonalData } from '@/domain/data';
import { isBlank, requireKeys, stepSchema } from '@/domain/validation';
import { todayIso } from '@/lib/format';
import { ADDRESS_LOOKBACK_YEARS } from '@/config';
import { addressHistory } from './address-history';

const digits = (v?: string) => (v ?? '').replace(/\D/g, '');
const positive = (v?: string) => /^\d+(\.\d+)?$/.test((v ?? '').trim()) && Number(v) > 0;

export const personalSchema = stepSchema<PersonalData>((d, ctx) => {
  const add = (path: string, message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
  requireKeys(ctx, d, {
    middleName: 'Enter your middle name, or NMN if you have none',
    usedAlias: 'Answer whether you have ever used a maiden or alias name',
    gender: 'Choose your gender',
    ssn: 'Enter your Social Security number',
    stateOfBirth: 'Choose your state of birth',
    countryOfBirth: 'Choose your country of birth',
    countryOfCitizenship: 'Choose your country of citizenship',
    ethnicity: 'Choose your ethnicity',
    race: 'Choose your race',
    preferredLanguage: 'Choose your preferred language',
    height: 'Enter your height in inches',
    weight: 'Enter your weight in pounds',
    eyeColor: 'Choose your eye color',
    hairColor: 'Choose your hair color',
  });
  if (d.usedAlias === 'yes') requireKeys(ctx, d, { aliasNames: 'Enter every maiden or alias name you have used' });
  if (!(d.languagesSpoken ?? []).length) add('languagesSpoken', 'Choose every language you speak');
  if (!isBlank(d.ssn) && digits(d.ssn).length !== 9) add('ssn', 'Enter all 9 digits of your Social Security number');
  if (!isBlank(d.height) && !positive(d.height)) add('height', 'Enter your height as a number of inches');
  if (!isBlank(d.weight) && !positive(d.weight)) add('weight', 'Enter your weight as a number of pounds');
});

const ZIP = /^\d{5}$/;

export const addressesSchema = stepSchema<AddressesData>((d, ctx) => {
  const add = (path: (string | number)[], message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
  requireKeys(ctx, d, {
    street: 'Enter your street address',
    city: 'Enter your city',
    state: 'Enter your state',
    zip: 'Enter your ZIP code',
    startDate: 'Enter the date you started living at this address',
  });
  if (d.zip && !ZIP.test(d.zip)) add(['zip'], 'Enter a 5-digit ZIP code');
  if (d.startDate && d.startDate > todayIso()) add(['startDate'], 'Start date cannot be in the future');
  (d.previousAddresses ?? []).forEach((a, i) => {
    requireKeys(
      ctx,
      a as unknown as Record<string, unknown>,
      { street: 'Enter the street address', city: 'Enter the city', state: 'Enter the state', zip: 'Enter the ZIP code', moveIn: 'Enter the date you moved in' },
      ['previousAddresses', i],
    );
    if (a?.zip && !ZIP.test(a.zip)) add(['previousAddresses', i, 'zip'], 'Enter a 5-digit ZIP code');
    if (a?.moveIn && d.startDate && a.moveIn >= d.startDate) {
      add(['previousAddresses', i, 'moveIn'], 'Move-in date must be before you started living at your current address');
    }
  });
  // "Addresses Validated" is required: the history must reach back the full look-back.
  if (d.startDate && !addressHistory(d).validated) add(['previousAddresses'], `Add previous addresses until your history covers the last ${ADDRESS_LOOKBACK_YEARS} years`);
});

export const householdSchema = stepSchema<HouseholdData>((d, ctx) => {
  (d.members ?? []).forEach((m, i) => {
    requireKeys(
      ctx,
      m as unknown as Record<string, unknown>,
      {
        firstName: 'Enter their first name',
        lastName: 'Enter their last name',
        gender: 'Choose their gender',
        dob: 'Enter their date of birth',
        relationship: 'Enter their relationship to you',
      },
      ['members', i],
    );
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
