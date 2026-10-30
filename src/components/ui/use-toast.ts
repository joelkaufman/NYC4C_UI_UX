import * as React from 'react';
import type { ToastProps } from '@/components/ui/toast';

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 4000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
};

type State = { toasts: ToasterToast[] };

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };
let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

function setState(next: State) {
  memoryState = next;
  listeners.forEach((l) => l(memoryState));
}

function dismiss(id: string) {
  setState({ toasts: memoryState.toasts.map((t) => (t.id === id ? { ...t, open: false } : t)) });
  setTimeout(() => setState({ toasts: memoryState.toasts.filter((t) => t.id !== id) }), 300);
}

export function toast(props: Omit<ToasterToast, 'id'>) {
  const id = genId();
  const item: ToasterToast = {
    ...props,
    id,
    open: true,
    onOpenChange: (open) => {
      if (!open) dismiss(id);
    },
  };
  setState({ toasts: [item, ...memoryState.toasts].slice(0, TOAST_LIMIT) });
  setTimeout(() => dismiss(id), TOAST_REMOVE_DELAY);
  return { id, dismiss: () => dismiss(id) };
}

export function useToast() {
  const [state, setLocal] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.push(setLocal);
    return () => {
      const i = listeners.indexOf(setLocal);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);
  return { ...state, toast, dismiss };
}
