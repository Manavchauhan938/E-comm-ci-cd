import { create } from 'zustand';

let toastId = 0;

export const useUiStore = create((set, get) => ({
  darkMode: false,
  cartDrawerOpen: false,
  toasts: [],
  toggleDarkMode: () => {
    const next = !get().darkMode;
    document.documentElement.classList.toggle('dark', next);
    set({ darkMode: next });
  },
  setDarkMode: (darkMode) => {
    document.documentElement.classList.toggle('dark', darkMode);
    set({ darkMode });
  },
  openCartDrawer: () => set({ cartDrawerOpen: true }),
  closeCartDrawer: () => set({ cartDrawerOpen: false }),
  toast: ({ type = 'info', message }) => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
