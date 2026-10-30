# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Fixed by the brief (PROMPT.md §2): React 18 + TypeScript on Vite; Tailwind CSS + shadcn/ui (Radix primitives) for all UI components; react-router v6; react-hook-form + zod; Zustand store persisted to localStorage under `onboarding-demo-v1`; lucide-react icons; Geist via `@fontsource-variable/geist` (the font changed from the brief's Inter at the user's request). No backend and no login: every "API" call lives in `src/mock/api.ts`, returns a Promise with a 200–600ms artificial delay, and has a failure toggle for testing error toasts. Architecture is hand-coded React per step with shared primitives and a typed module/step registry (`src/domain/registry.ts`) so the shell is generic. Project structure is prescribed in PROMPT.md §10.

## Users

**Primary: care providers** (home care workers, nurses, licensed providers) being onboarded as employees by a home care organization. They complete one or more onboarding requests over several sessions: entering personal, address, household, education and payment details; uploading identity and compliance documents; consenting to a background check; e-signing agreements; and recording certificates and trainings. They return after admin feedback to fix rejected uploads or resubmit a module.

Context (confirmed): mixed. Many providers complete this at home on their own device, and a large share will attempt it on a phone even though the brief targets desktop. Each visit may be short and interrupted, so the portal must always put them on the exact module and step that needs attention, and never lose draft input.

**Secondary: HR / admin staff**, who review submitted modules, reject uploads with a reason, approve or reject reviews, accept or decline change requests, and clear background checks. In this prototype they are represented only by the hidden dev admin panel (`/admin` and the gear Sheet); a real admin portal UX is out of scope.

**Evaluators of the prototype**: HR and leadership watching the demo script, the engineering team building the backend and real e-sign integration against it, and real providers in usability tests (see Purpose).

## Product Purpose

A provider onboarding portal where a provider completes **requests** (processes); each request is an ordered sequence of **modules**; each module is an ordered sequence of **steps** that collect inputs, file uploads and e-signatures. Modules are sequential, lock when submitted, and some go through admin review. The portal exists so providers can finish compliance onboarding themselves, with clear status at every level (request, module, step, upload, e-sign item), and so HR can review and send work back without email or paper.

This deliverable is a **front-end prototype** serving three confirmed purposes at once:

1. **Stakeholder demo**: walk HR and leadership through the acceptance demo script (PROMPT.md §11) to get buy-in before a real build.
2. **Reference implementation for engineering**: the store actions, `ESignProvider` interface, registry, and validation shapes are the contract a backend and real e-sign vendor will later implement.
3. **Usability testing with real providers**: validate that the module/step model, status language, helper content and recovery paths (rejected upload, rejected review, change request) are understandable.

Success: all ten items of the demo script work end to end; state persists across reload; `npm run typecheck` and ESLint pass; a reader of `ARCHITECTURE.md` can add a module/step or swap the mock e-sign provider; and a provider can always tell what to do next and why.

## Positioning

The mechanism that distinguishes this portal from a generic form builder or onboarding packet: a **sequential, review-gated module model with issue-driven focus**. Exactly one module is current; opening a request lands on that module's first step with issues; validation, uploads, e-sign and admin decisions all collapse into one aggregated `StepIssue` list that drives the step path, the preview, the submit gate and the sidebar. Admin actions (reject upload, reject review, accept revert) reopen precisely the right module while preserving all entered data, and later modules re-lock automatically. Conditional fields, uploads and e-sign items are derived from live form values with plain predicates, so the same shell serves every process type.

## Operating Context

- **Processes and modules (seed onboarding):** Information (review required) → Background check (no review, admin "cleared" chip is informational) → E-sign (auto-completes when required items are signed) → Training & Certificates (review required) → HR review (admin-only, auto-submits to in_review on unlock, completion screen when approved). Full step lists in PROMPT.md §6.
- **Module lifecycle:** `locked_future` → `open` → (`in_review` → `rejected` → resubmit) → `approved` → `revert_requested` → back to `open` with later modules re-locked. Rules in PROMPT.md §4.
- **Uploads:** per-slot label, description, required flag, accepted types, max size, status (`missing` / `uploaded` / `rejected` / `accepted`); mock storage keeps name/size/type and an object URL with a placeholder fallback after reload.
- **E-sign:** `preparing` → `waiting_for_signature` → `signed`, or `rejected` → "Request new document" back to `preparing`. Mock provider flips to waiting after ~1.5s and signs after ~800ms. No signing UI, state buttons only.
- **Admin simulation:** dev admin panel with per-module approve/reject/accept revert/decline revert/force reopen/force approve, per-upload accept/reject with reason, per-e-sign status set, background check cleared toggle, "Reset demo data", and "Load scenario" presets (Fresh start, Waiting on e-sign, Change requested on Information, HR rejected back to Training).
- **Seed data:** three requests for one provider, "Maria Gonzalez": in progress, needs attention, completed (PROMPT.md §9).
- **Routes:** `/` request list; `/requests/:requestId` redirects to current module + first step with issues; `/requests/:requestId/:moduleId/:stepId` process view; `/admin`.
- **Sessions:** multi-session, interrupted; form data auto-saves (debounced) on change; the whole store persists to localStorage.
- **Documents involved:** government photo ID, Social Security card, proof of address (issued in the last 90 days), work authorization document, resume, license copy, certificate and training certificates; e-sign documents: Employment Agreement, Confidentiality & HIPAA Acknowledgment, Direct Deposit Authorization, Handbook Acknowledgment, Licensed Provider Attestation.

## Capabilities and Constraints

- Domain types, registry interfaces, validation shapes and store action names are fixed by PROMPT.md §3 and §9 and must be kept as the engineering contract.
- Every step exports its component, zod schema, `previewSections(data, request)` and `issues(data, instance, request)`.
- Conditional logic (PROMPT.md §4.8) is plain predicates in `src/domain/conditions.ts`; hidden fields are excluded from validation and preview.
- Address history must cover a configurable look-back (seed 5 years) with gap (>30 days) and overlap warnings.
- Required: WCAG AA contrast on all text; status never conveyed by color alone (icon + label always); full keyboard operability of stepper, lists, dialogs; 2px focus ring on every interactive element.
- Desktop-first (min 1024px) by the brief, but confirmed that many providers will use a phone: layouts must stack gracefully and remain fully usable on narrow widths even though mobile is not the optimisation target.
- Dark mode not required; keep tokens as CSS variables so it can be added.
- Out of scope: real auth, real file storage, real e-sign vendor, admin portal UX beyond the dev panel, notifications/email, i18n, mobile-first design.
- Deliverables: runnable project (`npm i && npm run dev`), README with the demo script and admin panel usage, typecheck and ESLint clean, `ARCHITECTURE.md` on adding modules/steps and swapping the e-sign provider.
- **Undecided (placeholder):** the product/company name. Use a neutral placeholder ("Provider Portal" in the top bar, "the Agency" in consent text) and keep it in one constant so it can be replaced.

## Brand Commitments

No organisation name, logo or legal identity is supplied; the product name stays a placeholder ("Provider Portal") kept in `src/config.ts`.

Visual direction (confirmed by the user, 2026-10-29), superseding PROMPT.md §8's palette and type where they conflict:
- Layout and furniture follow the user's reference screenshot of a secure client portal: a dark header band with a coloured rule beneath it, a pale blue-grey page, a left rail with a progress panel and a vertical numbered module stepper, and a white step panel headed "Step N of M · Module" with sub-step tabs separated by chevrons and a lime underline on the current tab. Field labels are navy and semibold, Yes/No questions use a segmented toggle.
- Type is the platform system font (San Francisco on Apple devices, Geist as fallback).
- Look (confirmed 2026-10-29, latest of several user directions): an Apple-style light interface for onboarding medical professionals. No dark bands: a light translucent header with a hairline, Apple's grouped grey background, white panels with 16px corners and soft depth instead of borders, the system font (San Francisco on Apple devices), near-black labels, filled input fields and Apple-style segmented controls. One clinical teal accent for actions, selection and progress; no per-module colours. Approved is green; red and orange are for problems; soft indigo marks "in review". Clean and relaxed.
- Do not copy the reference's own brand (its logo, name or wording).

Copy tone: short, direct, neutral, sentence case, no exclamation marks or jokes.

## Evidence on Hand

- `PROMPT.md`: the complete build brief, including domain model, business rules, seed process, visual direction tokens, mock layer and acceptance checklist. It is the single source of requirements.
- Seed provider name "Maria Gonzalez" and the three seed requests are specified; they are demo fixtures, not real people.
- No real documents, logos, legal copy, testimonials, or company data exist. Do not fabricate a company identity, legal agreement text, or real-looking personal data beyond the specified seeds; use clearly labelled placeholders for sample documents and signed copies.

## Product Principles

1. **Always show the next action.** Every screen answers "what do I do now and why": the current module, the first step with issues, and the issue list with jump links.
2. **One status language everywhere.** Request cards, sidebar, step path, uploads and e-sign items use the same state → icon → color → label triplets; never color alone.
3. **Quiet by default, loud for problems.** Errors, rejections and admin messages are the most prominent thing on screen when present; everything else is neutral and calm.
4. **Nothing entered is ever lost.** Drafts auto-save, state persists across reload, reverts and rejections preserve data, and locked modules stay readable.
5. **The prototype is the contract.** Types, store actions, registry and the e-sign interface are written as the real system's API so engineering can build against them unchanged.

## Accessibility & Inclusion

WCAG AA contrast on all text including muted and placeholder text; status communicated with icon + label + color; full keyboard operability for the stepper, repeatable lists, sheets and dialogs; visible 2px focus ring on all interactive elements; no shaking or bouncing error animations; minimum text size 12px. Providers vary widely in digital confidence and many will be on a phone, so helper content ("How to") must be reachable per step and per field, in plain language.
