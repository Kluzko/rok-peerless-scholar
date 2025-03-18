import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TextHistoryItem } from "../types";
import { useSettingsStore } from "./settingsStore";

interface TextState {
  currentText: string;
  textHistory: TextHistoryItem[];
  lastUpdateTime: string | null;
  isMonitoring: boolean;
  ocrReady: boolean;
  updateText: (text: string, timestamp: string) => void;
  setIsMonitoring: (isMonitoring: boolean) => void;
  setOcrReady: (ready: boolean) => void;
  clearHistory: () => void;
}

export const useTextStore = create<TextState>()(
  persist(
    (set, get) => ({
      currentText: "",
      textHistory: [],
      lastUpdateTime: null,
      isMonitoring: false,
      ocrReady: false,
      updateText: (text, timestamp) => {
        // Only add to history if different from last entry
        const { textHistory } = get();

        set({ currentText: text, lastUpdateTime: timestamp });

        if (text && (!textHistory.length || text !== textHistory[0].text)) {
          const newItem = {
            id: Date.now(),
            text,
            timestamp,
          };

          const maxItems = useSettingsStore.getState().settings.maxHistoryItems;
          const newHistory = [newItem, ...textHistory].slice(0, maxItems);

          set({ textHistory: newHistory });
        }
      },
      setIsMonitoring: (isMonitoring) => set({ isMonitoring }),
      setOcrReady: (ready) => set({ ocrReady: ready }),
      clearHistory: () => set({ textHistory: [] }),
    }),
    {
      name: "screen-text-reader-history",
      partialize: (state) => ({
        textHistory: state.textHistory,
      }),
    },
  ),
);
