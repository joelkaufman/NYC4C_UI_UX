import type { HelperDef } from '@/domain/types';

export const legalNameHelper: HelperDef = {
  id: 'legal-name',
  label: 'What counts as a legal name?',
  title: 'What counts as a legal name?',
  content: {
    paragraphs: [
      'Your legal name is the name printed on your government ID and Social Security card. The background check and payroll both match against it, so it must be exact.',
      'If the two documents show different names, use the one on your Social Security card and list the other as a maiden or alias name.',
    ],
    bullets: [
      'Include your full middle name if it appears on your ID. Enter NMN if you have none.',
      'Use hyphens and spaces exactly as printed.',
      'Do not use nicknames or initials unless they are your legal name.',
    ],
  },
};

export const addressHelper: HelperDef = {
  id: 'address-history',
  label: 'Why 5 years of addresses?',
  title: 'Why do we need 5 years of address history?',
  content: {
    paragraphs: [
      'State rules for home care providers require a background check in every county you have lived in during the last five years. Your address history tells the screening company where to search.',
      'Gaps longer than 30 days can delay your background check. If you were travelling, staying with family or between homes, add the address you used for mail during that time.',
    ],
    bullets: [
      'Start with your current address and the date you started living there.',
      'Add each previous address with the date you moved in. Its move-out date fills in from the address after it.',
      'Keep adding addresses until Prior years needed shows 0 years.',
    ],
  },
};

export const householdHelper: HelperDef = {
  id: 'household',
  title: 'Who counts as a household member?',
  content: {
    paragraphs: [
      'List everyone who lives with you, including children.',
      'Household members aged 18 or older need their own background check consent in the next module.',
    ],
  },
};

export const documentsHelper: HelperDef = {
  id: 'accepted-documents',
  label: 'Accepted documents',
  title: 'Accepted documents',
  content: {
    paragraphs: ['Upload a clear photo or scan of each document. All four corners must be visible and the text readable.'],
    bullets: [
      'Government photo ID: driver’s license, state ID card, or passport. Must not be expired.',
      'Social Security card: the card itself, or an SSA letter showing your full number.',
      'Proof of address: a utility bill, bank statement, lease or government letter issued in the last 90 days, showing your name and current address.',
      'Work authorization: permanent resident card, or an employment authorization document (EAD) or visa with I-94.',
    ],
    sample: 'Example of an acceptable proof of address: a utility bill with your name, current address and a date in the last 90 days clearly visible.',
  },
};
