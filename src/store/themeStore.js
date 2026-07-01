import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: getInitialTheme(),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    { name: 'myhub-theme' }
  )
)
