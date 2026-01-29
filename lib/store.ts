import { create } from 'zustand'
import { Kartela } from '@/types/kartela'

interface KartelaStore {
  currentKartela: Kartela | null
  searchHistory: Kartela[]
  isLoading: boolean
  error: string | null
  
  setCurrentKartela: (kartela: Kartela | null) => void
  addToHistory: (kartela: Kartela) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useKartelaStore = create<KartelaStore>((set) => ({
  currentKartela: null,
  searchHistory: [],
  isLoading: false,
  error: null,
  
  setCurrentKartela: (kartela) => set({ currentKartela: kartela }),
  
  addToHistory: (kartela) =>
    set((state) => ({
      searchHistory: [kartela, ...state.searchHistory.filter(k => k.id !== kartela.id)].slice(0, 10)
    })),
    
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
}))
