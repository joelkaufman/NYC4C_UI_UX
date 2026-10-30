import { AdminPanel } from '@/admin/AdminPanel';

export function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold">Dev admin panel</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Simulates HR and e-sign vendor actions for the prototype. Not part of the provider experience.</p>
      <AdminPanel />
    </div>
  );
}
