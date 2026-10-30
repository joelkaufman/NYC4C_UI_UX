---
version: 1
slug: "src-pages-processpage-tsx"
primary_target: "src/pages/ProcessPage.tsx"
related_targets: ["src/components/shared/StepShell.tsx","src/components/layout/ModuleSidebar.tsx","src/components/layout/StepPath.tsx"]
---

# Surface brief: Process view

Scope: `/requests/:requestId/:moduleId/:stepId`, the shell (top bar, header row with step path, module sidebar, StepShell content, sticky footer, module banners, issue list) and every step of the five seed modules. Visitor mode: Operate.

## Audience and job

A care provider, usually alone and often on a phone, returning to a half-finished onboarding request after a break or after HR sent something back. In under five seconds they must know which module is open, which step needs them, and what exactly is wrong. Secondary: a provider viewing an approved module read-only; an evaluator walking the demo script.

## Task, proof, constraints

Primary task: clear every issue in the current module and submit it. Proof is real state only: module statuses, step issues, upload and e-sign states, admin messages. The company name is a single placeholder constant. Visual world pinned by PROMPT.md §8 (Inter, slate neutrals, one deep-blue accent, fixed status triplets, 6/8px radii, borders not shadows, 8px grid, comfortable density). WCAG AA on all text; status is always icon + label + color; minimum 12px; tabular numerals for dates. Stack and file layout fixed by PROMPT.md §2 and §10. Code-led: no image generation in this harness, so no comp round.

## Confirmed decisions

- Scope: shell plus all modules (Information, Background check, E-sign, Training & Certificates, HR review).
- Phone (<1024px): sidebar becomes a compact module bar under the top bar (current module, status badge, progress; tap opens the module list as a bottom sheet). Step path becomes "Step 2 of 6 · Addresses" with a tap-to-open step list. Two-column grids collapse. Helper sheet is a full-width bottom sheet. Footer stays sticky. Content padding 16px.
- "Request changes" lives in the green approved banner on every step of that module, and on hover/expand in the sidebar on desktop.
- Module banners, one at a time, above the step title: rejected (danger, message, link to Preview), in review (info), approved (success, with "Request changes"), change requested (warning, reason, no action), change request declined (approved banner with the admin's note as a second line). Open modules show no banner. A URL into a locked_future module redirects to the current module.

## Direction contract

THESIS: One attention thread from request to field. The surface owns the idea that every level of zoom (sidebar module row, step path circle, banner, section header, field message) shows the same danger marker for the same problem, so the provider can follow the red from anywhere down to the exact input. It refuses the category default of a static breadcrumb over a long form with errors that only appear on submit.

OWN-WORLD: An Apple-style light interface for medical professionals (user direction 2026-10-29). Light translucent header with a hairline, grouped grey page (#F2F2F7), white panels with 16px corners and soft shadow, system font, near-black labels. A centred layout capped at 1480px. A left rail with a "‹ My requests" link, the request title, a progress block, and a vertical module stepper; the current module sits on a white rounded row. The step panel has a plain header (module glyph, "Module N of 5", module name), sub-step tabs with chevrons and a teal underline, then sections divided by hairlines, not boxes. Filled input fields, Apple-style segmented controls, soft filled tiles for uploads and documents. One clinical teal accent; green for approved; red and orange for problems; soft indigo for in review. "Request changes" lives only in the approved banner. DESIGN.md is the token authority.

STORY: The provider arrives and sees, left to right, which module is open, which step is flagged, the admin's message, and the field that caused it. They understand the portal already knows what is wrong and where. They fix the field, watch the step's "!" become "✓" within a debounced save, follow the footer's "N items need attention" button to the next issue, reach the Preview step with an empty issue list, and submit. For a locked or reviewed module they understand it is read-only and why, and where to request changes.

FIRST VIEWPORT (1440×900): top bar 56px white with bottom border, product name left, "Maria Gonzalez" with initials avatar and the gear right. Header row 64px: request title at left, step path centered-right with 24px numbered circles, step titles 13px beneath. Left rail 280px slate-50 with right border: five module rows at 44px minimum, number, title, one-line status text, 2px progress bar; the current row has a 3px blue-800 left bar and blue-50 ground; locked rows dimmed with Lock. Content region white, 40px padding, 760px column centered: module banner (if any) at top, step title 24/32 with the ghost "How to" button at right, description 14/20 muted, then Section cards stacked with 32px gaps, fields on an 8px grid with 16px rhythm and two-column rows for short pairs. Sticky footer inside the content area: white, top border, shadow-sm, Back ghost left, "2 items need attention" button centered when issues exist, Next primary right. The primary action always sits bottom-right of the content area.

FORM: Brief-pinned three-region app shell (PROMPT.md §7), confirmed by the user in a surface layout round (2026-10-29) over two dealt alternatives, an issue-queue rail and a single-scroll module; both remain switchable from the dev panel for testing. Signature interaction: the attention thread, including the live "!"→"✓" step transition on debounced save and the footer jump-to-next-issue control. Motion grammar: 150ms ease on color/background/border, 200ms on sheets and dialogs, nothing else.
seed:fa107768f73223ea

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Open decisions

- Whether the approved banner shows on every step of a completed request's modules or only the first step opened: builder's call, favouring every step for consistency.
