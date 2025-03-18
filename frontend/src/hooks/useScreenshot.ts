import { useMutation } from "@tanstack/react-query";
import { takeScreenshot } from "@/lib/api";
import { useScreenshotStore } from "@/stores/screenshotStore";
import { useSelectionStore } from "@/stores/selectionStore";
import { useNotification } from "./useNotification";

export function useScreenshot() {
  const { setScreenshot, setLoading, resetScreenshot } = useScreenshotStore();
  const { showNotification } = useNotification();
  const { setSelectedRegion } = useSelectionStore();

  const screenshotMutation = useMutation({
    mutationFn: takeScreenshot,
    onMutate: () => {
      setLoading(true);
      resetScreenshot();
      setSelectedRegion(null);

      // Show loading notification
      showNotification("info", "Taking screenshot...");
    },
    onSuccess: (imageUrl) => {
      const img = new Image();

      img.onload = () => {
        setScreenshot(imageUrl, img.naturalWidth, img.naturalHeight);

        showNotification("success", "Screenshot captured", {
          description: "Now select a region to monitor",
        });
      };

      img.onerror = () => {
        showNotification("error", "Failed to load screenshot", {
          description: "Could not load the captured image",
        });
        setLoading(false);
      };

      img.src = imageUrl;
    },
    onError: (error: unknown) => {
      console.error("Error taking screenshot:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      showNotification("error", "Screenshot failed", {
        description: errorMessage,
      });
      setLoading(false);
    },
  });

  return {
    takeScreenshot: () => screenshotMutation.mutate(),
    isLoading: screenshotMutation.isPending,
  };
}
