import { create } from "zustand";

export interface Toast {
  id: string;
  message: string;
  variant: "default" | "success" | "danger" | "teal";
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts.slice(-3), { ...t, id }] }));
    const duration = t.duration ?? 2500;
    if (duration > 0) setTimeout(() => useToastStore.getState().dismiss(id), duration);
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (message: string, opts: Partial<Omit<Toast, "id" | "message">> = {}) =>
  useToastStore.getState().push({ message, variant: "default", ...opts });
