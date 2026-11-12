# Provider Onboarding Portal (prototype)

A front-end prototype of a provider (employee) portal. A provider completes **requests**; each request is an ordered list of **modules**; each module is an ordered list of **steps** that collect inputs, uploads and e-signatures. Everything runs in the browser: a Zustand store persisted to `localStorage`, mock data, a mock e-sign provider, and a hidden dev admin panel that simulates HR.

There is no backend and no login.

## Run it

```bash
npm i
npm run dev        # http://localhost:5173
npm run typecheck  # tsc, no emit
npm run lint       # eslint
npm run build      # production build into dist/
```

Requires Node 18 or newer.

## Using the dev admin panel

Open it with the gear button at the right of the top bar (it opens as a side sheet on the current request), or go to `/admin` for a full page.

- **Global:** load a scenario preset, reset all demo data to the seeds, and toggle **Simulate API failures** to make about 30% of mock API calls fail so error toasts can be seen.
- **Request:** pick a request. Each module card shows its status and these actions, enabled only when they apply:
  - Approve review / Reject review (with a message). On **HR review**, reject also asks which earlier module to reopen.
  - Accept revert / Decline revert (with a note) for change requests.
  - Force reopen / Force approve, to jump states quickly.
- **Uploads:** Accept, or Reject with a reason. The provider sees the reason on the slot and must replace the file.
- **E-sign:** set any item to Preparing, Ready to sign, Signed or Rejected (with a reason).
- **Background check:** toggle the informational "cleared" flag.

Scenario presets: *Fresh start*, *Waiting on e-sign*, *Change requested on Information*, *HR rejected back to Training*.

Pressing Escape first dismisses the newest toast, then the panel.

## Demo script

1. Open `/`. Three requests show with progress and status badges.
2. Open **Onboarding – Live-in Caregiver**. It lands on Information › Personal info with the red rejection banner. The hair color field is highlighted, and the step path shows "!" on Personal info and Documents.
3. Choose a hair color; the step's "!" turns into a check. Go to Documents, replace the rejected proof of address, open Preview & confirm, check that the issue list is gone, and click **Resubmit module**. Information is now in review, fields are read-only and Background check stays locked.
4. Open the admin panel and click **Approve review** on Information. Background check unlocks and the app moves there.
5. Background check shows the summary from Information and one consent row per household member aged 18 or older. Answer, consent, and **Submit**. E-sign unlocks.
6. E-sign items go from Preparing to Ready to sign. **Sign now** signs an item. In the admin panel set one item to Rejected, then recover with **Request new document**. **Finish** enables only when every required item is signed.
7. Training: add a certificate without its upload and the entry shows an issue; add the upload and it clears. If Education's highest level is a nursing degree or other licensed profession, the Licensed Provider Attestation and License copy appear. Submit; Training goes to review. Approve it in the panel and HR review goes to review automatically.
8. From an approved Information module, click **Request changes** (in the green banner or the sidebar), give a reason, then **Accept revert** in the panel. Information reopens, later modules lock again, and entered data is kept.
9. Load the *HR rejected back to Training* scenario, or reject HR review in the panel and choose Training. Training reopens with HR's message.
10. Reload at any point; state persists. **Reset demo data** restores the seeds.

## Where things live

```
src/
  app/            router, layout, top bar, globals.css (theme tokens)
  config.ts       placeholder product and company names, address look-back
  domain/         types, registry, lifecycle rules, validation, conditions, progress
  mock/           store, api, seed, esign-provider, scenarios
  components/
    ui/           shadcn/ui primitives
    shared/       Section, fields, RepeatableList, AddressTimeline, UploadSlot,
                  ESignItem, HelperButton, StepShell, ModuleBanner, IssueList
    layout/       RequestCard, ModuleSidebar, StepPath, StepFooter, MobileProcessBar
  modules/        one folder per module; one file per step
  admin/          dev admin panel
  pages/          RequestListPage, ProcessPage, AdminPage
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for how to add a module or step and how to swap in a real e-sign provider.

## Placeholders to replace

- `PRODUCT_NAME` and `COMPANY_NAME` in `src/config.ts`.
- Helper sheet copy in `src/modules/*/helpers.ts` and inline in step files was written for the prototype and needs HR and legal review.
- E-sign document descriptions, the HR checklist and the completion screen's start date are illustrative.
- "Maria Gonzalez" and all seed data are fictional fixtures.
# NYC4C-HR-Onboarding
