import { create } from "zustand";

interface AppState {
  visits: number;
  increaseVisits: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  visits: 0,
  increaseVisits: () => set((state) => ({ visits: state.visits + 1 })),
}));
