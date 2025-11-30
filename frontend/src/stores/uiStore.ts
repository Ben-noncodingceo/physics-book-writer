import { create } from 'zustand';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Modals
  latexHeaderModalOpen: boolean;
  setLatexHeaderModalOpen: (open: boolean) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  latexHeaderModalOpen: false,
  setLatexHeaderModalOpen: (open) => set({ latexHeaderModalOpen: open }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: Math.random().toString(36).substr(2, 9) },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
