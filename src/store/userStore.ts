import { getAddressWalletFromLS } from '@/utils/auth'
import { create } from 'zustand'

interface UserState {
  nomToken: number
  addressWallet: string
  setAddressWallet: (address: string) => void
  setNomToken: (amount: number) => void
  addToken: (amount: number) => void
  spendToken: (amount: number) => boolean
}

export const useUserStore = create<UserState>((set, get) => ({
  nomToken: 100,
  addressWallet: getAddressWalletFromLS(),
  setNomToken: (amount) => set({ nomToken: amount }),
  setAddressWallet: (address: string) => set({ addressWallet: address }),
  addToken: (amount) => set((state) => ({ nomToken: state.nomToken + amount })),
  spendToken: (amount) => {
    if (get().nomToken >= amount) {
      set((state) => ({ nomToken: state.nomToken - amount }))
      return true
    }
    return false
  }
}))
