import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../lib/api'

interface User {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  userType: 'HELPER' | 'SEEKER' | 'ADMIN'
  verificationStatus: string
  profileImageUrl?: string
  walletBalanceEgp?: number
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  updateUser: (data: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),

      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null })
        delete api.defaults.headers.common['Authorization']
      },
    }),
    {
      name: 'wasla-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)
