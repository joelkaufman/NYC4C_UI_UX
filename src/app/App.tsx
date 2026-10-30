import * as React from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { startESignSync } from '@/mock/api';
import { useRequest } from '@/mock/store';
import { landingTarget, stepHref } from '@/domain/progress';
import { RequestListPage } from '@/pages/RequestListPage';
import { ProcessPage } from '@/pages/ProcessPage';
import { AdminPage } from '@/pages/AdminPage';
import { NotFound } from '@/pages/NotFound';
import { TopBar } from './TopBar';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{this.state.error.message}</p>
        <button
          type="button"
          className="mt-6 text-sm font-medium text-primary hover:underline"
          onClick={() => {
            this.setState({ error: undefined });
            window.location.assign('/');
          }}
        >
          Go to my requests
        </button>
      </div>
    );
  }
}

function Layout() {
  return (
    <div className="min-h-dvh bg-background">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:shadow-sm">
        Skip to content
      </a>
      <TopBar />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </div>
  );
}

/** /requests/:id → current module, first step with issues. */
function RequestRedirect() {
  const { requestId } = useParams();
  const request = useRequest(requestId);
  if (!request) return <NotFound />;
  const t = landingTarget(request);
  return <Navigate to={stepHref(request.id, t.moduleId, t.stepId)} replace />;
}

export function App() {
  React.useEffect(() => startESignSync(), []);
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TooltipProvider delayDuration={200}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<RequestListPage />} />
            <Route path="requests/:requestId" element={<RequestRedirect />} />
            <Route path="requests/:requestId/:moduleId/:stepId?" element={<ProcessPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <Toaster />
      </TooltipProvider>
    </BrowserRouter>
  );
}
