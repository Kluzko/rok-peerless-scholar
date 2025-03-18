import { Camera, Play, Pause } from "lucide-react";
import { useScreenshot } from "@/hooks/useScreenshot";
import { useTextMonitoring } from "@/hooks/useTextMonitoring";
import { useSelectionStore } from "@/stores/selectionStore";

// Import Shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ControlPanel() {
  const { takeScreenshot, isLoading: isScreenshotLoading } = useScreenshot();
  const {
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    isStarting,
    isStopping,
    lastUpdateTime,
    connectionStatus,
  } = useTextMonitoring();
  const { selectedRegion } = useSelectionStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Button
            className="w-full"
            variant={
              isMonitoring || isScreenshotLoading ? "secondary" : "default"
            }
            onClick={takeScreenshot}
            disabled={isMonitoring || isScreenshotLoading}
          >
            <Camera className="mr-2 h-4 w-4" />
            {isScreenshotLoading ? "Taking Screenshot..." : "Take Screenshot"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Click and drag on the screenshot to select an area
          </p>
        </div>

        {selectedRegion && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Selected Region</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="region-x">X</Label>
                <Input
                  id="region-x"
                  type="number"
                  value={selectedRegion.x}
                  readOnly
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="region-y">Y</Label>
                <Input
                  id="region-y"
                  type="number"
                  value={selectedRegion.y}
                  readOnly
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="region-width">Width</Label>
                <Input
                  id="region-width"
                  type="number"
                  value={selectedRegion.width}
                  readOnly
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="region-height">Height</Label>
                <Input
                  id="region-height"
                  type="number"
                  value={selectedRegion.height}
                  readOnly
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <Button
            variant="default"
            className="flex-1"
            onClick={() => startMonitoring()}
            disabled={!selectedRegion || isMonitoring || isStarting}
          >
            <Play className="mr-2 h-4 w-4" />
            {isStarting ? "Starting..." : "Start"}
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => stopMonitoring()}
            disabled={!isMonitoring || isStopping}
          >
            <Pause className="mr-2 h-4 w-4" />
            {isStopping ? "Stopping..." : "Stop"}
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Status</h3>
          <div className="bg-muted p-3 rounded-md">
            <div className="flex items-center mb-1">
              <span className="text-sm mr-2">Monitoring:</span>
              <span
                className={`font-medium ${isMonitoring ? "text-green-500" : "text-red-500"}`}
              >
                {isMonitoring ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex items-center mb-1">
              <span className="text-sm mr-2">Last Update:</span>
              <span className="font-medium">
                {lastUpdateTime
                  ? new Date(lastUpdateTime).toLocaleTimeString()
                  : "--"}
              </span>
            </div>
            <div className="flex items-center mb-1">
              <span className="text-sm mr-2">Connection:</span>
              <span
                className={`inline-block w-3 h-3 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
                title={
                  connectionStatus === "connected"
                    ? "Connected to server"
                    : "Disconnected from server"
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
