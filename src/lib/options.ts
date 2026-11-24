import type { Option } from '@/components/shared/fields';

export const US_STATES: Option[] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'], ['CO', 'Colorado'],
  ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'],
  ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'],
  ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'],
  ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'],
  ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
  ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'], ['SD', 'South Dakota'],
  ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
  ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
].map(([value, label]) => ({ value, label }));

export const optionLabel = (options: Option[], value?: string | null) => options.find((o) => o.value === value)?.label ?? value ?? '';

const opts = (pairs: [string, string][]): Option[] => pairs.map(([value, label]) => ({ value, label }));

export const GENDERS: Option[] = opts([['male', 'Male'], ['female', 'Female']]);

export const CONTACT_METHODS: Option[] = opts([['phone', 'Phone'], ['email', 'Email']]);
export const POSITIONS: Option[] = opts([['clinician', 'Clinician'], ['doctor', 'Doctor'], ['peer', 'Peer']]);

const COUNTRY_CODES =
  'AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR XK KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW'.split(' ');
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
/** Every country, by ISO 3166 alpha-2 code, sorted by English name. */
export const COUNTRIES: Option[] = COUNTRY_CODES.map((value) => ({ value, label: regionNames.of(value) ?? value })).sort((a, b) =>
  a.label.localeCompare(b.label),
);

// Placeholder lists: the sheet names these picklists without giving their options.
export const ETHNICITIES: Option[] = opts([
  ['hispanic', 'Hispanic or Latino'],
  ['not_hispanic', 'Not Hispanic or Latino'],
  ['prefer_not', 'Prefer not to say'],
]);
export const RACES: Option[] = opts([
  ['american_indian', 'American Indian or Alaska Native'],
  ['asian', 'Asian'],
  ['black', 'Black or African American'],
  ['pacific_islander', 'Native Hawaiian or Other Pacific Islander'],
  ['white', 'White'],
  ['two_or_more', 'Two or more races'],
  ['other', 'Other'],
  ['prefer_not', 'Prefer not to say'],
]);
export const LANGUAGES: Option[] = opts([
  ['english', 'English'], ['spanish', 'Spanish'], ['mandarin', 'Chinese (Mandarin)'], ['cantonese', 'Chinese (Cantonese)'],
  ['russian', 'Russian'], ['haitian_creole', 'Haitian Creole'], ['bengali', 'Bengali'], ['korean', 'Korean'],
  ['arabic', 'Arabic'], ['yiddish', 'Yiddish'], ['french', 'French'], ['italian', 'Italian'], ['polish', 'Polish'],
  ['urdu', 'Urdu'], ['hindi', 'Hindi'], ['punjabi', 'Punjabi'], ['tagalog', 'Tagalog'], ['vietnamese', 'Vietnamese'],
  ['portuguese', 'Portuguese'], ['greek', 'Greek'], ['hebrew', 'Hebrew'], ['japanese', 'Japanese'], ['german', 'German'],
  ['albanian', 'Albanian'], ['ukrainian', 'Ukrainian'], ['farsi', 'Farsi'], ['turkish', 'Turkish'],
  ['asl', 'American Sign Language'], ['other', 'Other'],
]);
export const EYE_COLORS: Option[] = opts([
  ['black', 'Black'], ['blue', 'Blue'], ['brown', 'Brown'], ['gray', 'Gray'], ['green', 'Green'], ['hazel', 'Hazel'],
  ['maroon', 'Maroon'], ['multicolored', 'Multicolored'], ['other', 'Other'],
]);
export const HAIR_COLORS: Option[] = opts([
  ['bald', 'Bald'], ['black', 'Black'], ['blond', 'Blond'], ['brown', 'Brown'], ['gray', 'Gray'], ['red', 'Red'],
  ['sandy', 'Sandy'], ['white', 'White'], ['other', 'Other'],
]);

export const optionLabels = (options: Option[], values?: string[] | null) =>
  (values ?? []).map((v) => optionLabel(options, v)).filter(Boolean).join(', ');
