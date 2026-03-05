import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'apple';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => {
        document.documentElement.dataset.theme = theme;
        set({ theme });
      },
      toggleTheme: () =>
        set((state) => {
          const next = state.theme === 'dark' ? 'apple' : 'dark';
          document.documentElement.dataset.theme = next;
          return { theme: next };
        }),
    }),
    { name: 'rdh-theme' }
  )
);

// Sync data-theme attribute when store rehydrates from localStorage
useThemeStore.subscribe((state) => {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = state.theme;
  }
});
