import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface User {
  address: string
  accessToken: string
  refreshToken: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,

        setUser: (user: User) => {
          set({
            user,
            isAuthenticated: true
          })
        }
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          isAuthenticated: state.isAuthenticated,
          user: state.user
        })
      }
    ),
    {
      name: 'auth-store'
    }
  )
)
