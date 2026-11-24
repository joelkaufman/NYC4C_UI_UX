# Architecture

## Model

- `ProviderRequest` → `ModuleInstance[]` → step data, uploads and e-signs (`src/domain/types.ts`).
- `src/domain/registry.ts` lists the ordered `ModuleDef`s per process type. The shell (sidebar, step path, footer, banners, landing) is generic over this registry and never names a specific module.
- `src/domain/lifecycle.ts` owns the status rules: sequential unlocking, submit with or without review, HR review auto-submitting on unlock, and `reopenModule`, which reopens a module and locks every later one while keeping their data. Admin rejection, accepted change requests and HR send-backs all go through it.
- `src/domain/validation.ts` turns each step's zod schema and its upload and e-sign requirements into `StepIssue[]`. One aggregated issue list drives the step path icons, the sidebar progress, the footer's "N items need attention" jump, the Preview issue list and the submit gate.
- `src/domain/conditions.ts` holds the plain predicates for conditional fields, uploads and e-signs. They read live saved data, so visibility and required-ness recalculate as the provider types.

Drafts save to the store 300ms after each change and immediately on blur, so issues always reflect what is on screen.

## Add a step to an existing module

1. Create `src/modules/<module>/<Name>Step.tsx` exporting:
   - the component, receiving `StepProps`;
   - `schema`, built with `stepSchema` and `requireKeys` from `src/domain/validation.ts`;
   - `issues(data, instance, request)`, usually `issuesFromSchema(schema, data)` plus `uploadIssues` or `esignIssues`;
   - `previewSections(data, request)` if the step should appear on Submit & sign.
2. Wrap form content in `StepForm` and bind fields with `useBind()`:
   ```tsx
   const bind = useBind();
   <Section title="Contact" fields={['email']}>
     <TextField {...bind('email')} label="Email" required />
   </Section>
   ```
   The `fields` prop lets the section show its own issue count.
3. Add the step to the module's `steps` array in `src/modules/<module>/index.ts`, before the preview step. If the step declares uploads or e-signs, include them in the module's `uploadSlots(request)` or `esignItems(request)`.

Use the shared primitives (`Section`, the field components, `RepeatableList`, `UploadSlot`, `ESignItem`, `HelperButton`) so inputs, uploads and signatures look and behave identically everywhere.

## Add a module

1. Create `src/modules/<new-module>/index.ts` exporting a `ModuleDef` with `id`, `title`, `description`, `requiresReview`, `steps`, `uploadSlots`, `esignItems` and `validate` (usually `validateSteps(def, instance, request)`).
2. Add its id to `ModuleId` in `src/domain/types.ts` and to `MODULE_ORDER` in `src/domain/lifecycle.ts`.
3. Register it in `PROCESS_REGISTRY` in `src/domain/registry.ts`, in order.
4. Add it to `emptyRequest` in `src/mock/seed.ts` and to `REVIEW` there.

A module whose last step has inputs or uploads should end with the generic `PreviewConfirmStep` (`kind: 'preview'`). Single-step modules can use `kind: 'confirm'` (Submit in the footer) or `kind: 'esign'` (Finish in the footer).

## Swap the mock e-sign provider for a real one

The contract is the `ESignProvider` interface in `src/mock/esign-provider.ts`:

```ts
interface ESignProvider {
  createEnvelope(input: { templateId: string; signer: { name: string; email: string } }): Promise<{ envelopeId: string; status: ESignStatus }>;
  getStatus(envelopeId: string): Promise<ESignStatus>;
  sign(envelopeId: string): Promise<{ status: 'signed'; signedAt: string }>;
  void(envelopeId: string, reason: string): Promise<void>;
}
```

1. Implement it against the vendor's API, usually through your backend so vendor credentials never reach the browser. `sign` typically becomes "get the vendor's embedded signing URL and open it"; resolve once the vendor reports the envelope completed.
2. Replace `mockESignProvider` in `src/mock/api.ts` with the new implementation.
3. Status pushes: the mock calls `subscribe` listeners when an envelope moves from preparing to ready. With a real vendor, feed webhook events or polling of `getStatus` into `useStore.getState().setESignStatusByEnvelope(envelopeId, status)`.
4. Remove the mock-only `resume` call in `startESignSync`.

Each `ESignItemDef` carries a `templateId`; map those to the vendor's templates.

## Swap the mock API for a backend

Every action goes through `src/mock/api.ts`, whose function names mirror the store actions (`saveStepData`, `uploadFile`, `submitModule`, `requestRevert`, and the `admin.*` group). Replace their bodies with HTTP calls and have the store hydrate from the responses. Business rules in `src/domain/lifecycle.ts` belong on the server once one exists; the client copies can then be deleted or kept for optimistic updates.
