import { useState } from "react";
import { Settings } from "lucide-react";
import { SettingsModal } from "./SettingsModal";

// Import Shadcn components
import { Button } from "@/components/ui/button";

export function Header() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="mb-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <span className="mr-2 text-primary">👁️</span>
          Screen Text Reader
        </h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSettings(true)}
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
      <p className="text-muted-foreground mt-2">
        Extract and monitor text from any area of your screen
      </p>

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </header>
  );
}
