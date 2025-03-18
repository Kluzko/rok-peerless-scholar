import { create } from "zustand";
import { Region } from "../types";

interface SelectionState {
  selectedRegion: Region | null;
  isSelecting: boolean;
  setSelectedRegion: (region: Region | null) => void;
  setIsSelecting: (isSelecting: boolean) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedRegion: null,
  isSelecting: false,
  setSelectedRegion: (region) => set({ selectedRegion: region }),
  setIsSelecting: (isSelecting) => set({ isSelecting }),
}));
