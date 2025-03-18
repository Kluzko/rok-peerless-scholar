import { Header, ThemeProvider } from "@/components/common";
import {
  ControlPanel,
  DetectedText,
  MonitoredRegion,
} from "@/components/features/monitoring";
import { ScreenshotSection } from "@/components/features/selection";

import { HistoryList } from "@/components/features/history";

import { useScreenshotStore } from "@/stores/screenshotStore";

function App() {
  const { screenshotUrl } = useScreenshotStore();

  return (
    <ThemeProvider defaultTheme="light" storageKey="screen-text-reader-theme">
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Header />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ControlPanel />
            </div>

            <div className="lg:col-span-2 space-y-6">
              {screenshotUrl && <ScreenshotSection />}
              <MonitoredRegion />
              <DetectedText />
              <HistoryList />
            </div>
          </div>

          <footer className="mt-12 text-center text-muted-foreground text-sm">
            <p>Screen Text Reader &copy; 2025</p>
          </footer>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
