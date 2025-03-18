import { create } from "zustand";

interface ScreenshotState {
  screenshotUrl: string | null;
  monitoredRegionUrl: string | null;
  screenshotWidth: number;
  screenshotHeight: number;
  isLoading: boolean;
  setScreenshot: (url: string, width: number, height: number) => void;
  setMonitoredRegion: (url: string) => void;
  resetScreenshot: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useScreenshotStore = create<ScreenshotState>((set) => ({
  screenshotUrl: null,
  monitoredRegionUrl: null,
  screenshotWidth: 0,
  screenshotHeight: 0,
  isLoading: false,
  setScreenshot: (url, width, height) =>
    set({
      screenshotUrl: url,
      screenshotWidth: width,
      screenshotHeight: height,
      isLoading: false,
    }),
  setMonitoredRegion: (url) => set({ monitoredRegionUrl: url }),
  resetScreenshot: () =>
    set({
      screenshotUrl: null,
      monitoredRegionUrl: null,
      screenshotWidth: 0,
      screenshotHeight: 0,
    }),
  setLoading: (isLoading) => set({ isLoading }),
}));
