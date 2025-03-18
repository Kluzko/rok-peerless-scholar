import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Settings } from "../types";

const DEFAULT_SETTINGS: Settings = {
  monitoringInterval: 1000,
  autoCopyText: false,
  maxHistoryItems: 50,
  saveHistory: true,
  theme: "light",
};

interface SettingsState {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: "screen-text-reader-settings",
    },
  ),
);
