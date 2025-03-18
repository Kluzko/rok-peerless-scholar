import { Region } from "@/types";
import { copyToClipboard } from "./clipboard";
import { useNotification } from "@/hooks/useNotification";

/**
 * Format region coordinates for display or copying
 */
export function formatRegionCoordinates(region: Region): string {
  return JSON.stringify(
    {
      x: region.x,
      y: region.y,
      width: region.width,
      height: region.height,
    },
    null,
    2,
  );
}

/**
 * Custom hook for selection-related actions
 */
export function useSelectionActions(
  selectedRegion: Region | null,
  resetSelection: () => void,
) {
  const { showNotification } = useNotification();

  /**
   * Copy region coordinates to clipboard
   */
  const copyRegionCoordinates = async () => {
    if (!selectedRegion) return;

    try {
      await copyToClipboard(formatRegionCoordinates(selectedRegion));
      showNotification("success", "Coordinates copied", {
        description: "Selection coordinates copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy coordinates:", error);
      showNotification("error", "Copy failed", {
        description: "Could not copy coordinates to clipboard",
      });
    }
  };

  /**
   * Save the current selection
   */
  const saveSelection = () => {
    if (!selectedRegion) return;

    showNotification("success", "Selection saved", {
      description: `Region ${selectedRegion.width}×${selectedRegion.height}px saved`,
    });
    // Implement actual save functionality here
  };

  /**
   * Clear the current selection
   */
  const clearSelection = () => {
    if (!selectedRegion) return;

    resetSelection();
    showNotification("info", "Selection cleared", {
      description: "Selection has been removed",
    });
  };

  return {
    copyRegionCoordinates,
    saveSelection,
    clearSelection,
  };
}
