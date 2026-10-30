# Build prompt: Provider Onboarding Portal (React, mock data, mock e-sign)

## 1. Goal

Build a **provider (employee) portal** where a provider completes one or more **requests** (processes). Each request is a sequence of **modules**; each module is a sequence of **steps**. Steps collect inputs, file uploads and e-signatures. Modules lock when submitted, some go through admin review, and the UI always focuses the provider on the current open module and the first step that still needs attention.

This is a **front-end prototype**: React with an in-memory/localStorage mock store, mock data, a mock e-sign provider, and a hidden **dev admin panel** used to simulate admin actions (reject an upload, approve/reject a review, revert a module, change e-sign state). There is no backend and no login.

## 2. Stack (fixed)

- React 18 + TypeScript, Vite
- Tailwind CSS + shadcn/ui (Radix primitives) for all UI components
- react-router v6 for routing
- react-hook-form + zod for forms and validation
- Zustand for the mock store, persisted to localStorage (with a "Reset demo data" action)
- lucide-react for icons
- No backend calls. All "API" functions live in `src/mock/api.ts` and return Promises with a small artificial delay so loading states are real.

Architecture choice: **hand-coded React per step**. Every step is its own component. Shared primitives (`Field`, `UploadSlot`, `ESignItem`, `Section`, `HelperButton`, `RepeatableList`) guarantee that inputs, uploads and e-sign requests look and behave identically across all steps. Module/step *metadata* (ids, titles, order, review flag) is declared in a typed registry so the shell (sidebar, header path, progress, navigation) is generic.

## 3. Domain model

Define these types in `src/domain/types.ts`:

```ts
type RequestStatus = 'not_started' | 'in_progress' | 'completed';

type ModuleStatus =
  | 'locked_future'   // previous module not approved yet
  | 'open'            // current module, editable
  | 'in_review'       // submitted, waiting for admin (only if module.requiresReview)
  | 'rejected'        // admin rejected the review; module is open again, show rejection message
  | 'approved'        // done and locked; fields read-only
  | 'revert_requested'; // provider asked admin to reopen an approved module

type UploadStatus = 'missing' | 'uploaded' | 'rejected' | 'accepted';

type ESignStatus = 'preparing' | 'waiting_for_signature' | 'signed' | 'rejected';

interface ProviderRequest {
  id: string;
  title: string;            // e.g. "Onboarding – Home Care Provider"
  processType: 'onboarding';
  createdAt: string;
  status: RequestStatus;
  modules: ModuleInstance[];
}

interface ModuleInstance {
  id: string;               // 'information' | 'background_check' | 'esign' | 'training' | 'hr_review'
  status: ModuleStatus;
  requiresReview: boolean;
  rejectionMessage?: string;
  revertRequest?: { reason: string; requestedAt: string };
  submittedAt?: string;
  approvedAt?: string;
  data: Record<string, unknown>;   // all step form data for this module, keyed by step id
  uploads: Record<string, UploadItem>;   // keyed by upload slot id
  esigns: Record<string, ESignItem>;     // keyed by e-sign item id
}

interface UploadItem {
  slotId: string;
  label: string;
  required: boolean;
  status: UploadStatus;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
  rejectionReason?: string;
}

interface ESignItem {
  id: string;
  title: string;            // e.g. "Employment Agreement"
  required: boolean;
  status: ESignStatus;
  providerEnvelopeId?: string;
  signedAt?: string;
  rejectionReason?: string;
}
```

The module registry (`src/domain/registry.ts`) declares, per process type, the ordered modules and their ordered steps:

```ts
interface StepDef {
  id: string;
  title: string;
  component: React.ComponentType<StepProps>;
  kind: 'form' | 'upload' | 'esign' | 'confirm' | 'preview' | 'custom';
}
interface ModuleDef {
  id: string;
  title: string;
  description: string;
  requiresReview: boolean;
  steps: StepDef[];
  // returns validation state for the whole module given its instance + full request
  validate(instance: ModuleInstance, request: ProviderRequest): ModuleValidation;
}
interface ModuleValidation {
  stepIssues: Record<string, StepIssue[]>; // stepId -> issues
  isComplete: boolean;                      // no blocking issues
}
interface StepIssue {
  kind: 'missing_required' | 'rejected_upload' | 'esign_pending' | 'esign_rejected';
  targetId: string;   // field name, upload slot id or esign id
  message: string;
}
```

## 4. Business rules

### 4.1 Modules are sequential
- Module N is `locked_future` until module N-1 is `approved`.
- Exactly one module is "current" (the first that is not `approved`). The UI opens on it.
- When a request is opened, navigate to the current module and to its **first step that has issues** (missing required, rejected upload, pending/rejected e-sign). If none, open its first step.

### 4.2 Submitting a module
- The last step of any module that contains inputs or uploads is a **Preview & Confirm** step. It renders every section of the module read-only (same layout as the forms, just disabled), lists uploads with their status, lists e-sign items with status, and shows a "Submit module" button.
- Submit is disabled while the module has blocking issues. Show the issue list above the button with links that jump to the offending step.
- On submit:
  - if `requiresReview` → status `in_review`. All fields read-only. Next module stays locked. Banner: "Submitted for review on {date}. We'll notify you when it is approved."
  - else → status `approved` immediately, next module unlocks, navigate to it.
- Modules whose only content is e-sign items (the E-sign module) auto-complete when all required items are `signed` (no preview step needed); show a "Finish" button on the last step that becomes enabled when all required items are signed.

### 4.3 Locked modules and revert
- `approved` and `in_review` modules are read-only everywhere (fields disabled, no upload/remove, no sign actions).
- An `approved` module shows a "Request changes" button. It opens a dialog asking for a reason, then sets status `revert_requested` and shows a banner "Change request sent to admin". The admin panel can accept (module and **all later modules** go back: this module → `open`, later modules → `locked_future`, their data is kept) or decline (status back to `approved`, show the decline note).
- `in_review` modules cannot be reverted by the provider (show hint "Waiting for review").

### 4.4 Review rejection
- Admin rejects with a message → module status `rejected`, editable again, red banner at the top of every step of that module with the message and a "Resubmit" path via the preview step. Resubmitting sets `in_review` again and clears the message.

### 4.5 Uploads
- Each upload slot has: label, description, required flag, accepted types, max size, status, and (when uploaded) file name, size, date, "View" and "Replace"/"Remove" actions.
- Admin can reject an upload with a reason → status `rejected`, slot shows red outline + reason; the provider must replace it (replacing sets status back to `uploaded` and clears the reason).
- Uploads are editable until the module is submitted. After that they are read-only unless the module is rejected or reverted.
- Mock implementation: no real upload; store name/size/type and a fake object URL for "View" (use `URL.createObjectURL` while the session lives, fall back to a placeholder preview after reload).

### 4.6 E-sign
- States: `preparing` → `waiting_for_signature` → `signed`; or → `rejected` (from admin/provider panel).
- Shared `ESignItem` card: title, status badge, description, and one primary action depending on state:
  - `preparing`: disabled button "Preparing document…" with spinner.
  - `waiting_for_signature`: button "Sign now". Clicking it calls `mockESignProvider.sign(envelopeId)` which resolves after ~800ms and sets `signed`. (No signing UI; state buttons only.)
  - `signed`: green badge with signed date and a "View signed copy" link (placeholder).
  - `rejected`: red badge, reason, button "Request new document" → state back to `preparing`, then auto-advances to `waiting_for_signature` after ~1.5s (simulating the provider re-preparing the envelope).
- E-sign items can be conditional (see 4.8). Items that are not applicable are not shown and not required.

### 4.7 Step indicators and required fields
- Required fields show a red asterisk; when touched/submitted and empty, red border + message. In Preview and in the header path, use the aggregated `StepIssue` list.
- Header path (breadcrumb/stepper of the module's steps): each step shows a state icon: ✓ complete, ● current, ! has issues (red), ○ untouched. Clicking a step navigates (see 4.9).
- Left sidebar module list: each module shows a status badge/icon (locked, open with progress "2/5 steps", in review, rejected, approved, change requested) and a thin progress bar. Request list cards show overall progress = approved modules / total modules plus the current module name and status.

### 4.8 Conditional fields, uploads and e-signs
Implement with simple predicates in code (no rule engine). Examples that must work in the seed process:
- Information › Personal: "Have you been known by another name?" (yes/no) → shows required "Previous legal name".
- Information › Personal: "Work authorization" (citizen / permanent resident / visa) → visa shows required "Visa type" and "Expiry date"; permanent resident / visa makes the **Documents** step require an extra upload "Work authorization document".
- Information › Household: "Does anyone in your household help with care?" → when yes, Background check module requires a consent row per helper (list rendered from household members with `helpsWithCare = true`).
- Information › Education: "Highest level" = nursing degree / other licensed → Training module shows the required e-sign "Licensed Provider Attestation" and an upload "License copy"; otherwise those are hidden.
- E-sign module: "Direct deposit authorization" e-sign item only appears if Information › Personal "Payment method" = direct deposit.

Rule: visibility and required-ness are recalculated from the live form values; hidden fields are excluded from validation and from the preview.

### 4.9 Navigation
- Within the **current open module** (open or rejected) the provider can jump freely between its steps via the header path; "Next" moves to the following step and "Back" to the previous one. Next does not block on validation, it just saves the draft; issues remain visible in the path and in the preview.
- Steps of `approved` / `in_review` modules are viewable read-only. Steps of `locked_future` modules are not clickable (show a lock and tooltip "Complete {previous module} first").
- Form data is auto-saved to the store on change (debounced) so switching steps never loses data.

## 5. Shared components (`src/components/shared`)

All must share one visual language (same label style, spacing, help text, error text, disabled/read-only look):

- `Section` – titled card grouping fields by responsibility (e.g. "Identity", "Contact", "Emergency contact"). Optional description and optional `HelperButton`.
- `Field` wrappers over shadcn inputs: `TextField`, `SelectField`, `DateField`, `RadioGroupField`, `CheckboxField`, `PhoneField`, `SSNField` (masked, last-4 reveal), all accepting `required`, `readOnly`, `help`, `hidden`.
- `RepeatableList` – add/edit/remove multiple entries rendered as cards with an inline form (used for addresses, household members, certificates, trainings). Supports `min`, `max`, empty state, per-entry validation summary.
- `AddressTimeline` – vertical timeline rendering addresses by from/to dates, flags gaps > 30 days and overlaps as warnings, "Current address" chip. Must cover a configurable look-back (seed: last 5 years, show warning if coverage incomplete).
- `UploadSlot` – drop zone / file picker, status badge, rejection reason, view/replace/remove, read-only mode.
- `ESignItem` – card per 4.6.
- `HelperButton` – small "?" / "How to" button opening a Sheet or Dialog with rich help content (text, bullet list, optional image placeholder, optional sample document). Each step can declare one or more helpers; some fields can have their own.
- `StepShell` – common step frame: title, description, helper buttons, module banners (rejected / in review / change requested), content, footer with Back / Next (or Submit / Finish on last step).
- `ModuleBanner` – renders the right banner for module status.
- `IssueList` – list of `StepIssue`s with jump links.

## 6. The onboarding process (seed definition)

### Module 1 – Information (`requiresReview: true`)
1. **Personal info** – sections: Identity (first/middle/last name, other name yes/no → previous name, DOB, SSN, gender optional), Contact (email, mobile, home phone optional, preferred contact), Work authorization (status → visa fields), Payment (payment method: direct deposit / check), Emergency contact (name, relationship, phone). Helper: "What counts as a legal name?"
2. **Addresses** – `RepeatableList` of addresses (type: home / mailing / previous; street, unit, city, state, zip, from, to, current flag) + `AddressTimeline`. Requirement: at least one current address; warn on gaps in the last 5 years. Helper: "Why do we need 5 years of address history?"
3. **Household members** – `RepeatableList` (name, relationship, DOB, lives with you, helps with care yes/no). Optional list; may be empty with an explicit checkbox "I live alone / no household members".
4. **Education** – highest level (select), school, field of study, graduation year, licenses (repeatable: type, number, state, expiry). Conditional per 4.8.
5. **Documents** – `UploadSlot`s: Government photo ID (required), Social Security card (required), Proof of address (required), Work authorization document (conditional required), Resume (optional). Helper: "Accepted documents".
6. **Preview & Confirm** – generic preview step.

### Module 2 – Background check (`requiresReview: false`, but completion is gated by admin "cleared" flag; see note)
1. **Confirm** – read-only summary pulled from Information (full name, DOB, SSN last 4, address history, household helpers). Fields: "Other names used in the last 7 years" (optional text), "Have you lived outside the state in the last 5 years?" (yes/no → list states). Required consent checkbox "I authorize {Company} to perform a background check" + consent rows for each household helper (each required). Submit button on this step (no separate preview because it is a single step; reuse the preview styling for the summary block).
   - Note: on submit the module becomes `approved` immediately (no review) so the E-sign module unlocks, but the module card shows a secondary "Background check: pending / cleared" chip that the admin panel toggles. This is informational only.

### Module 3 – E-sign (`requiresReview: false`)
1. **E-sign** – list of `ESignItem`s: Employment Agreement (required), Confidentiality & HIPAA Acknowledgment (required), Direct Deposit Authorization (conditional), Handbook Acknowledgment (optional). "Finish" enables when all required are `signed`. Helper: "What happens when I click Sign now?"

### Module 4 – Training & Certificates (`requiresReview: true`)
1. **Certificates** – `RepeatableList`: certificate type (CPR, First Aid, CNA, HHA, other), issuing organization, issue date, expiry date, and a **required `UploadSlot` per entry**. Conditional: License copy upload + Licensed Provider Attestation e-sign (per 4.8).
2. **Trainings** – `RepeatableList`: training name, provider, completion date, hours, required certificate upload per entry. Minimum one training entry required.
3. **Preview & Confirm**.

### Module 5 – HR review (`requiresReview: true`, admin-only)
1. **Status** – no inputs. Shows: "Your file is with HR", a checklist of what HR verifies (read-only), and, once approved, a completion screen ("You're all set", start date placeholder). This module auto-submits (goes to `in_review`) as soon as it unlocks. Admin approves/rejects from the panel; rejection message shows here and reopens the module the admin names (the panel lets you pick which earlier module to reopen, which uses the same revert mechanics as 4.3).

## 7. Screens and layout

### Routes
- `/` – request list
- `/requests/:requestId` – redirects to current module + first step with issues
- `/requests/:requestId/:moduleId/:stepId` – process view
- `/admin` – dev admin panel (also openable as a right-side Sheet from a small gear button fixed bottom-right on every page)

### Request list (`/`)
- Page header "My requests".
- Card per request: title, created date, status badge, progress bar (approved modules / total), text "Current: {module title} · {module status}", list of module chips with status icons, primary button "Continue" / "Start" / "View".
- Completed requests sorted last.

### Process view (`/requests/:id/:module/:step`)
Three regions, desktop-first (min 1024px), gracefully stacking on narrow widths:
- **Header**: request title, back link to list, and the **step path** of the current module (horizontal stepper with status icons, clickable per 4.9).
- **Left sidebar (~280px)**: module list with number, title, status badge, progress bar and short status text. Current module highlighted. Locked modules dimmed with lock icon. Approved modules show a checkmark and the "Request changes" affordance on hover/expand.
- **Right content**: `StepShell` with the step component. Fields grouped into `Section`s. Required fields marked and red when invalid. Footer: Back / Next (or Submit / Finish), sticky at the bottom of the content area.
- The current module's banner (rejected / in review / change requested) appears at the top of the content region on every step of that module.

See section 8 for the visual design direction.

## 8. UI design direction

The portal is used by professionals (care providers, nurses, HR staff). The look must be **modern, clean, calm and serious**: a compliance/HR tool, not a consumer app. Optimise for readability of long forms and quick recognition of status. Reference points: Linear, Stripe Dashboard, Vercel, Workday's newer screens. No illustrations, gradients, playful mascots or rounded "bubbly" shapes.

### Principles
- Content first: generous whitespace, strong typographic hierarchy, few borders, no decorative elements.
- Low visual noise: one accent color, semantic colors only for status, everything else neutral.
- Predictable: identical patterns for every field, upload and e-sign item; status is always communicated with the same badge, icon and color triplet.
- Quiet by default, loud only for problems: errors and rejections are the most prominent thing on a screen when present.

### Theme tokens (configure as shadcn CSS variables in `globals.css`)
- Font: Inter (via `@fontsource-variable/inter`), fallback system-ui. Tabular numerals for dates/amounts (`font-variant-numeric: tabular-nums`).
- Type scale: page title 24/32 semibold; section title 16/24 semibold; label 13/20 medium; body/input 14/20 regular; help and meta text 13/20 in muted color. Never below 12px.
- Neutrals: slate scale. Page background `slate-50`, cards/surfaces white, borders `slate-200`, primary text `slate-900`, secondary text `slate-600`, placeholder `slate-400`.
- Primary accent: deep blue, `#1E40AF` (blue-800) for buttons/links/active states, `#1D4ED8` on hover, `#DBEAFE` for subtle selected backgrounds. Use it sparingly: primary button, links, active step, focus ring.
- Semantic: success `#15803D` (green-700) on `#F0FDF4`; warning `#B45309` (amber-700) on `#FFFBEB`; danger `#B91C1C` (red-700) on `#FEF2F2`; info/in-review `#1D4ED8` on `#EFF6FF`; locked/neutral `slate-500` on `slate-100`. Each status uses text color + tinted background + 1px border of the same hue at 20% opacity.
- Radius: 6px for inputs/buttons/badges, 8px for cards, no pill shapes except small status badges (full radius allowed there only).
- Shadows: none on cards by default; borders instead. A single soft shadow (`shadow-sm`) only for sticky footers, sheets and popovers.
- Spacing: 8px grid. Card padding 24px, field vertical rhythm 16px, section gap 32px, max form width 760px centered in the content area.
- Density: comfortable, not compact. Inputs 36px high, buttons 36px, sidebar rows 44px.
- Dark mode: not required for the prototype; keep tokens in CSS variables so it can be added.

### Status system (used everywhere: request cards, sidebar, step path, uploads, e-sign)
| State | Icon (lucide) | Color |
|---|---|---|
| Locked / future | `Lock` | neutral |
| Open / current | `CircleDot` | primary |
| Has issues / rejected | `AlertCircle` | danger |
| In review / pending | `Clock` | info |
| Approved / signed / accepted | `CheckCircle2` | success |
| Warning (gap, expiring) | `AlertTriangle` | warning |
| Change requested | `RotateCcw` | warning |

Badges are text + icon, 12px medium, sentence case ("In review", "Needs attention"). Never color alone: always pair with icon and label for accessibility.

### Layout details
- Top bar: 56px, white, bottom border; left: product name in semibold, right: provider name with initials avatar, and the gear for the dev admin panel.
- Request list: max width 960px, cards in a single column, each card with a 4px left accent in its status color.
- Process view: sidebar 280px with a right border on `slate-50` background; content area white with 40px padding; the step path lives in a 64px header row under the top bar, with the request title to its left.
- Step path: numbered circles 24px, connected by 1px lines; current step filled primary, complete steps success outline with check, issue steps danger outline with "!", future steps neutral. Step titles under the circles, 13px.
- Sidebar module rows: number, title, one-line status text, thin 2px progress bar under the title; current module has a primary left bar and `blue-50` background.
- Forms: labels above inputs, help text below, two-column grid for short related fields (first/last name, city/state/zip) and single column otherwise. Required marker is a red asterisk after the label; invalid state is red border + 13px red message under the input; do not shake or animate.
- Read-only rendering: definition list layout (label in muted 13px, value in 14px `slate-900`), same sections and order as the editable form, with a subtle "Read only" or "Locked" chip in the section header.
- Banners (module rejected / in review / change requested): full-width within the content column, tinted background per semantic color, icon, bold one-line title, message, optional action link. Placed above the step title.
- Footer: sticky bottom bar inside the content area, white with top border, Back as ghost button on the left, Next/Submit as primary on the right; a short summary text in the middle when issues exist ("2 items need attention").
- Upload slot: dashed 1px border drop zone in `slate-300`, hover `slate-400`; once uploaded it becomes a solid-border row with file icon, name, size, date and actions; rejected state turns the border red and shows the reason in a red text block under the row.
- E-sign item: solid-border card with document icon, title, meta line, status badge on the right, primary action button aligned right; signed state shows a green check and the date in place of the button.
- Helper buttons: small ghost button with `CircleHelp` icon and the text "How to" or a specific label; opens a right Sheet (420px) with a title, short paragraphs, bullet list, optional sample image placeholder. Never a tooltip for anything longer than one sentence.
- Empty states: short, factual text with one primary action ("No addresses added yet. Add your current address to start."). No illustrations.
- Loading: skeletons for lists and forms, spinner inside buttons for in-flight actions, toast (bottom-right, 4s) for success and error results of mock API calls.

### Motion and interaction
- Transitions limited to 150ms ease on hover/focus/background and 200ms for sheets/dialogs. No page transition animations, no bouncing.
- Focus ring: 2px primary ring with 2px offset on every interactive element; full keyboard operability for stepper, lists, dialogs.
- Contrast: WCAG AA on all text, including muted and placeholder text on their backgrounds.
- Copy tone: short, direct, neutral. Sentence case for titles and buttons. Say what to do and why ("Upload a proof of address issued in the last 90 days"), avoid exclamation marks and jokes.

## 9. Mock layer

### Store (`src/mock/store.ts`)
Zustand store holding `requests: ProviderRequest[]`, persisted under key `onboarding-demo-v1`. Actions mirror a future API:
`saveStepData`, `setUpload`, `removeUpload`, `submitModule`, `requestRevert`, `signESign`, `requestNewESignDocument`, plus admin actions `adminRejectUpload`, `adminAcceptUpload`, `adminApproveModule`, `adminRejectModule`, `adminAcceptRevert`, `adminDeclineRevert`, `adminSetESignStatus`, `adminSetBackgroundCheckCleared`, `resetDemoData`.

All actions go through `src/mock/api.ts`, which wraps them in a Promise with 200–600ms delay and random (seeded off) failure toggle for testing error toasts.

### Mock e-sign provider (`src/mock/esign-provider.ts`)
Interface the real provider will later implement:
```ts
interface ESignProvider {
  createEnvelope(input: { templateId: string; signer: { name: string; email: string } }): Promise<{ envelopeId: string; status: ESignStatus }>;
  getStatus(envelopeId: string): Promise<ESignStatus>;
  sign(envelopeId: string): Promise<{ status: 'signed'; signedAt: string }>;
  void(envelopeId: string, reason: string): Promise<void>;
}
```
Mock behaviour: `createEnvelope` returns `preparing` and flips to `waiting_for_signature` after 1.5s; `sign` resolves after 800ms.

### Dev admin panel (`/admin` and the gear Sheet)
Select a request → for each module show status and buttons: Approve review, Reject review (with message), Accept revert, Decline revert, Force reopen, Force approve. For each upload: Accept / Reject (reason). For each e-sign: set status (any of the four) with optional reason. Background check: toggle cleared. Global: "Reset demo data", "Load scenario" dropdown (see seeds). Keep it plain and functional; it is a dev tool.

### Seed data (`src/mock/seed.ts`)
Three requests for the same provider (no login; show provider name "Maria Gonzalez" in the top bar):
1. **Onboarding – in progress**: Information `approved`; Background check `open` with consent not yet given; Information contains one address gap warning and a household helper so a helper consent row appears. Also mark the Information › Documents "Proof of address" upload as `accepted` and seed a `rejected` state scenario via the admin panel rather than in seed (keep seed consistent with an approved module).
2. **Onboarding – needs attention**: Information `rejected` with message "Proof of address is expired, please upload a document from the last 90 days"; the Proof of address upload is `rejected` with the same reason; Personal info is missing "Emergency contact phone" so opening the request lands on Personal info with issues shown. Later modules locked.
3. **Onboarding – completed**: every module `approved`, all e-signs `signed`, HR review approved; opens read-only with the completion screen.

Also provide "Load scenario" presets in the admin panel: *Fresh start*, *Waiting on e-sign*, *Change requested on Information*, *HR rejected back to Training*.

## 10. Project structure

```
src/
  app/            router, layout, top bar, providers
  domain/         types.ts, registry.ts, validation.ts, conditions.ts (predicates from 4.8)
  mock/           store.ts, api.ts, seed.ts, esign-provider.ts, scenarios.ts
  components/
    shared/       Section, fields, RepeatableList, AddressTimeline, UploadSlot, ESignItem, HelperButton, StepShell, ModuleBanner, IssueList
    layout/       RequestList card, ModuleSidebar, StepPath, StepFooter
  modules/
    information/  PersonalInfoStep, AddressesStep, HouseholdStep, EducationStep, DocumentsStep, schema.ts (zod), validate.ts
    background-check/
    esign/
    training/
    hr-review/
    common/       PreviewConfirmStep (generic, reads a module's "preview sections" from each step's exported `previewSections(data)`)
  pages/          RequestListPage, ProcessPage, AdminPage
```
Each step exports: the component, its zod schema, `previewSections(data, request)` for the generic preview, and `issues(data, instance, request)` used by the module validator.

## 11. Acceptance checklist (demo script)

1. Open `/`, see three requests with correct progress and badges.
2. Open request 2: lands on Information › Personal info with the rejection banner and the missing-field highlighted; the step path shows "!" on Personal info and Documents.
3. Fix the field, go to Documents, replace the rejected upload, go to Preview, confirm all issues gone, Submit → module `in_review`, fields read-only, next module still locked.
4. Open admin panel, approve Information → Background check unlocks and the app navigates there.
5. Background check shows the summary pulled from Information and a consent row per household helper; submit → E-sign unlocks.
6. E-sign: items go `preparing` → `waiting_for_signature`; "Sign now" signs; set one to `rejected` from the admin panel and recover with "Request new document"; Finish enables only when required items are signed; Direct Deposit item appears only if payment method was direct deposit.
7. Training: add a certificate without its upload → entry shows an issue; add the upload; nursing degree selected in Education makes the attestation e-sign and license upload appear; submit → `in_review`; admin approves → HR review auto `in_review`.
8. From an approved Information module, click "Request changes", give a reason, admin accepts → Information reopens, later modules lock again, data preserved; resubmit path works.
9. Admin rejects HR review and picks Training to reopen → Training opens with the message.
10. Reload the page at any point: state persists. "Reset demo data" restores seeds.

## 12. Out of scope

Real authentication, real file storage, real e-sign vendor integration, admin portal UX beyond the dev panel, notifications/email, i18n, mobile-first design (must not break on mobile, but optimise for desktop).

## 13. Deliverables

- Runnable project (`npm i && npm run dev`), README with the demo script in section 11 and how to use the admin panel.
- Type-safe throughout (`npm run typecheck` passes), ESLint clean.
- A short `ARCHITECTURE.md` explaining how to add a new module/step and how to swap the mock e-sign provider for a real one.
