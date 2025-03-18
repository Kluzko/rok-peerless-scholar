import { Tv, RotateCw } from "lucide-react";
import { useScreenshotStore } from "@/stores/screenshotStore";
import { useTextStore } from "@/stores/textStore";

// Import Shadcn components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MonitoredRegion() {
  const { monitoredRegionUrl } = useScreenshotStore();
  const { isMonitoring } = useTextStore();

  if (!isMonitoring) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Tv className="mr-2 h-5 w-5" /> Monitored Region
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-96 text-center relative rounded-md border">
          {monitoredRegionUrl ? (
            <img
              className="max-w-full"
              src={monitoredRegionUrl}
              alt="Monitored Region"
            />
          ) : (
            <div className="flex items-center justify-center p-8 bg-muted">
              <div className="text-center">
                <RotateCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">
                  Waiting for first screenshot...
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
