import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import {
  getLatestScreenshot,
  getStatus,
  setRegion,
  startMonitoring,
  stopMonitoring,
} from "../lib/api";
import { useScreenshotStore } from "@/stores/screenshotStore";
import { useSelectionStore } from "@/stores/selectionStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTextStore } from "@/stores/textStore";
import { StatusResponse } from "@/types";
import { copyToClipboard } from "@/utils/clipboard";
import { useNotification } from "./useNotification";

export function useTextMonitoring() {
  const { settings } = useSettingsStore();
  const { selectedRegion } = useSelectionStore();
  const { showNotification } = useNotification();
  const { setMonitoredRegion } = useScreenshotStore();
  const { updateText, isMonitoring, setIsMonitoring, setOcrReady } =
    useTextStore();

  const queryClient = useQueryClient();

  // Handle status error callback
  const handleStatusError = useCallback(() => {
    showNotification("error", "Connection lost", {
      description: "Connection to server lost. Attempting to reconnect...",
    });
  }, [showNotification]);

  // Status polling
  const { data: status, error: statusError } = useQuery<StatusResponse>({
    queryKey: ["status"],
    queryFn: getStatus,
    refetchInterval: settings.monitoringInterval,
    retry: 3,
    gcTime: 0, // Don't cache
  });

  // Report status errors
  useEffect(() => {
    if (statusError) {
      handleStatusError();
    }
  }, [statusError, handleStatusError]);

  // Monitor screenshot polling when monitoring is active
  const { data: latestScreenshot } = useQuery<string | null>({
    queryKey: ["latestScreenshot"],
    queryFn: getLatestScreenshot,
    refetchInterval: isMonitoring ? 1000 : false,
    enabled: isMonitoring,
    gcTime: 0, // Don't cache
  });

  // Handle screenshot data changes
  useEffect(() => {
    if (latestScreenshot) {
      setMonitoredRegion(latestScreenshot);
    }
  }, [latestScreenshot, setMonitoredRegion]);

  // Start monitoring mutation
  const startMonitoringMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRegion) {
        throw new Error("No region selected");
      }

      // First set the region
      await setRegion(selectedRegion);

      // Then start monitoring
      await startMonitoring();
      return true;
    },
    onSuccess: () => {
      setIsMonitoring(true);
      showNotification("success", "Monitoring started");
      queryClient.invalidateQueries({ queryKey: ["status"] });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      showNotification("error", `Failed to start monitoring: ${errorMessage}`);
    },
  });

  // Stop monitoring mutation
  const stopMonitoringMutation = useMutation({
    mutationFn: stopMonitoring,
    onSuccess: () => {
      setIsMonitoring(false);
      showNotification("info", "Monitoring stopped");
      queryClient.invalidateQueries({ queryKey: ["status"] });
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      showNotification("error", `Failed to stop monitoring: ${errorMessage}`);
    },
  });

  // Update state based on status response
  useEffect(() => {
    if (!status) return;

    setIsMonitoring(status.is_monitoring);
    setOcrReady(!!status.ocr_ready);

    if (status.last_text !== undefined && status.last_update) {
      updateText(status.last_text, status.last_update);

      // Auto-copy if enabled
      if (
        settings.autoCopyText &&
        status.last_text &&
        status.last_text.length > 0
      ) {
        copyToClipboard(status.last_text);
      }
    }
  }, [status, settings.autoCopyText, updateText, setIsMonitoring, setOcrReady]);

  return {
    isMonitoring,
    startMonitoring: () => startMonitoringMutation.mutate(),
    stopMonitoring: () => stopMonitoringMutation.mutate(),
    isStarting: startMonitoringMutation.isPending,
    isStopping: stopMonitoringMutation.isPending,
    lastUpdateTime: status?.last_update,
    ocrReady: status?.ocr_ready,
    connectionStatus: status ? "connected" : "disconnected",
  };
}
