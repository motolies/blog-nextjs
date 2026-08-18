import {create} from 'zustand'

interface LoadingState {
    isLoading: boolean
    setLoading: () => void
    cancelLoading: () => void
}

export const useLoadingStore = create<LoadingState>((set) => ({
    isLoading: false,
    setLoading: () => set({isLoading: true}),
    cancelLoading: () => set({isLoading: false}),
}))
