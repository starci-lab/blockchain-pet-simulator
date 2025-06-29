import { create } from 'zustand'

interface UserState {
  nomToken: number
  setNomToken: (amount: number) => void
  addToken: (amount: number) => void
  spendToken: (amount: number) => boolean
}

export const useUserStore = create<UserState>((set, get) => ({
  nomToken: 100, // User mới vào có 100 token
  setNomToken: (amount) => set({ nomToken: amount }),
  addToken: (amount) => set((state) => ({ nomToken: state.nomToken + amount })),
  spendToken: (amount) => {
    if (get().nomToken >= amount) {
      set((state) => ({ nomToken: state.nomToken - amount }))
      return true
    }
    return false
  }
}))
