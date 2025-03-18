import { useState, useCallback, useEffect } from "react";
import { useSelectionStore } from "@/stores/selectionStore";
import { useScreenshotStore } from "@/stores/screenshotStore";
import { useNotification } from "./useNotification";
import { Region, SelectionState, SelectionPositions } from "@/types";

const MIN_SELECTION_SIZE = 10;
const DEFAULT_WIDTH = 250;
const DEFAULT_HEIGHT = 150;

export function useSelection() {
  // External state from stores
  const { selectedRegion, setSelectedRegion } = useSelectionStore();
  const { screenshotWidth, screenshotHeight } = useScreenshotStore();
  const { showNotification } = useNotification();

  // Local state for selection behavior
  const [state, setState] = useState<SelectionState>({
    isSelecting: false,
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    showInstructions: true,
    showHelper: true,
    showSizeIndicator: false,
  });

  // Position tracking state
  const [positions, setPositions] = useState<SelectionPositions>({
    startPoint: null,
    currentPoint: null,
    helperPosition: null,
    sizeIndicator: null,
    dragStart: null,
    dragOffset: null,
  });

  // Auto-hide instructions after delay
  useEffect(() => {
    if (state.showInstructions) {
      const timer = setTimeout(() => {
        setState((prev) => ({ ...prev, showInstructions: false }));
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [state.showInstructions]);

  // Convert screen coordinates to image coordinates
  const screenToImageCoords = useCallback(
    (
      left: number,
      top: number,
      width: number,
      height: number,
      containerWidth: number,
      containerHeight: number,
    ): Region => {
      // Calculate scaling factor based on how the image was scaled to fit the container
      const scaleX = containerWidth / screenshotWidth;
      const scaleY = containerHeight / screenshotHeight;
      const scale = Math.min(scaleX, scaleY);

      // Calculate image display size
      const imageWidth = screenshotWidth * scale;
      const imageHeight = screenshotHeight * scale;

      // Calculate padding offset (from the 0.5rem padding)
      const padding = 8; // 0.5rem = 8px

      // Calculate offsets from container edges to image edges
      const offsetX = (containerWidth - imageWidth) / 2 + padding;
      const offsetY = (containerHeight - imageHeight) / 2 + padding;

      // Adjust coordinates to be relative to the image, not the container
      const adjustedLeft = Math.max(0, left - offsetX);
      const adjustedTop = Math.max(0, top - offsetY);

      // Convert to original image coordinates
      const x = Math.round(adjustedLeft / scale);
      const y = Math.round(adjustedTop / scale);
      const w = Math.round(width / scale);
      const h = Math.round(height / scale);

      // Ensure coordinates don't exceed image dimensions
      return {
        x: Math.min(x, screenshotWidth),
        y: Math.min(y, screenshotHeight),
        width: Math.min(w, screenshotWidth - x),
        height: Math.min(h, screenshotHeight - y),
      };
    },
    [screenshotWidth, screenshotHeight],
  );

  // =====================
  // Event handlers
  // =====================

  // Track mouse movement for helper and selection
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, containerRect: DOMRect) => {
      // Calculate mouse position relative to container
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;

      // Update positions based on current state
      setPositions((prev) => {
        const updates: Partial<SelectionPositions> = {};

        // Helper cursor position when not in active operation
        if (!state.isSelecting && !state.isDragging && !state.isResizing) {
          if (
            x >= 0 &&
            x <= containerRect.width &&
            y >= 0 &&
            y <= containerRect.height
          ) {
            updates.helperPosition = { x, y };
          }
        }

        // Update current point during selection
        if (state.isSelecting && prev.startPoint) {
          const boundedX = Math.min(Math.max(x, 0), containerRect.width);
          const boundedY = Math.min(Math.max(y, 0), containerRect.height);
          updates.currentPoint = { x: boundedX, y: boundedY };

          // Update size indicator
          if (prev.startPoint) {
            const width = Math.abs(boundedX - prev.startPoint.x);
            const height = Math.abs(boundedY - prev.startPoint.y);
            const left = Math.min(boundedX, prev.startPoint.x);
            const top = Math.min(boundedY, prev.startPoint.y);

            updates.sizeIndicator = { x: left + width, y: top, width, height };
          }
        }

        // Drag operation - fixed for proper scaling and centering
        if (state.isDragging && prev.dragStart && prev.dragOffset) {
          // Calculate correct scale factors
          const containerWidth = containerRect.width;
          const containerHeight = containerRect.height;

          // Calculate scaling factor to fit while preserving aspect ratio
          const scaleX = containerWidth / screenshotWidth;
          const scaleY = containerHeight / screenshotHeight;
          const scale = Math.min(scaleX, scaleY);

          // Calculate image display size
          const imageWidth = screenshotWidth * scale;
          const imageHeight = screenshotHeight * scale;

          // Calculate padding offset (from the 0.5rem padding)
          const padding = 8; // 0.5rem = 8px

          // Calculate offsets for image centering
          const offsetX = (containerWidth - imageWidth) / 2 + padding;
          const offsetY = (containerHeight - imageHeight) / 2 + padding;

          // Calculate new position
          let left = e.clientX - prev.dragOffset.x;
          let top = e.clientY - prev.dragOffset.y;

          // Get current selection width/height in display coordinates
          const width = selectedRegion ? selectedRegion.width * scale : 0;
          const height = selectedRegion ? selectedRegion.height * scale : 0;

          // Keep within bounds of the actual image area
          left = Math.max(
            offsetX,
            Math.min(left, offsetX + imageWidth - width),
          );
          top = Math.max(
            offsetY,
            Math.min(top, offsetY + imageHeight - height),
          );

          // Update size indicator
          updates.sizeIndicator = { x: left + width, y: top, width, height };

          // Create a new region based on the dragged position, accounting for offsets
          if (selectedRegion) {
            const newRegion = screenToImageCoords(
              left,
              top,
              width,
              height,
              containerRect.width,
              containerRect.height,
            );
            setSelectedRegion(newRegion);
          }
        }

        // Resize operation
        if (state.isResizing && state.resizeHandle && selectedRegion) {
          // Calculate correct scale factors for the image
          const containerWidth = containerRect.width;
          const containerHeight = containerRect.height;

          // Calculate scaling factor to fit while preserving aspect ratio
          const scaleX = containerWidth / screenshotWidth;
          const scaleY = containerHeight / screenshotHeight;
          const scale = Math.min(scaleX, scaleY);

          // Calculate image display size
          const imageWidth = screenshotWidth * scale;
          const imageHeight = screenshotHeight * scale;

          // Calculate padding offset (from the 0.5rem padding)
          const padding = 8; // 0.5rem = 8px

          // Calculate offsets for image centering
          const offsetX = (containerWidth - imageWidth) / 2 + padding;
          const offsetY = (containerHeight - imageHeight) / 2 + padding;

          // Get current position in display coordinates
          let left = selectedRegion.x * scale + offsetX;
          let top = selectedRegion.y * scale + offsetY;
          let width = selectedRegion.width * scale;
          let height = selectedRegion.height * scale;

          // Get bounded mouse position
          const mouseX = Math.max(offsetX, Math.min(x, offsetX + imageWidth));
          const mouseY = Math.max(offsetY, Math.min(y, offsetY + imageHeight));

          // Handle resize based on which handle is being dragged
          if (state.resizeHandle.includes("n")) {
            // North (top) resize - only changes top position and height
            const newHeight = height + (top - mouseY);
            if (newHeight >= MIN_SELECTION_SIZE) {
              height = newHeight;
              top = mouseY;
            }
          }
          if (state.resizeHandle.includes("s")) {
            // South (bottom) resize - only changes height
            const newHeight = mouseY - top;
            if (newHeight >= MIN_SELECTION_SIZE) {
              height = newHeight;
            }
          }
          if (state.resizeHandle.includes("w")) {
            // West (left) resize - only changes left position and width
            const newWidth = width + (left - mouseX);
            if (newWidth >= MIN_SELECTION_SIZE) {
              width = newWidth;
              left = mouseX;
            }
          }
          if (state.resizeHandle.includes("e")) {
            // East (right) resize - only changes width
            const newWidth = mouseX - left;
            if (newWidth >= MIN_SELECTION_SIZE) {
              width = newWidth;
            }
          }

          // Constrain to image boundaries
          left = Math.max(offsetX, left);
          top = Math.max(offsetY, top);
          width = Math.min(width, offsetX + imageWidth - left);
          height = Math.min(height, offsetY + imageHeight - top);

          // Update size indicator
          updates.sizeIndicator = { x: left + width, y: top, width, height };

          // Create a new region based on the resized dimensions
          const newRegion = screenToImageCoords(
            left,
            top,
            width,
            height,
            containerRect.width,
            containerRect.height,
          );
          setSelectedRegion(newRegion);
        }

        return { ...prev, ...updates };
      });

      // Update helper visibility
      setState((prev) => ({
        ...prev,
        showHelper:
          !prev.isSelecting &&
          !prev.isDragging &&
          !prev.isResizing &&
          x >= 0 &&
          x <= containerRect.width &&
          y >= 0 &&
          y <= containerRect.height,
      }));
    },
    [
      state.isSelecting,
      state.isDragging,
      state.isResizing,
      state.resizeHandle,
      selectedRegion,
      screenToImageCoords,
      setSelectedRegion,
      screenshotWidth,
      screenshotHeight,
    ],
  );

  // Start selection on mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, containerRect: DOMRect) => {
      if (state.isDragging || state.isResizing) return;

      // Dismiss instructions if shown
      if (state.showInstructions) {
        setState((prev) => ({ ...prev, showInstructions: false }));
      }

      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;

      // Start selection
      setState((prev) => ({
        ...prev,
        isSelecting: true,
        showHelper: false,
        showSizeIndicator: true,
      }));

      setPositions((prev) => ({
        ...prev,
        startPoint: { x, y },
        currentPoint: { x, y },
      }));
    },
    [state.isDragging, state.isResizing, state.showInstructions],
  );

  // End selection/dragging/resizing on mouse up
  const handleMouseUp = useCallback(
    (_e: React.MouseEvent<HTMLDivElement>, containerRect: DOMRect) => {
      // If no active operation, ignore
      if (!state.isSelecting && !state.isDragging && !state.isResizing) return;

      // Finalize selection
      if (state.isSelecting && positions.startPoint && positions.currentPoint) {
        let width = Math.abs(positions.currentPoint.x - positions.startPoint.x);
        let height = Math.abs(
          positions.currentPoint.y - positions.startPoint.y,
        );
        let left = Math.min(positions.currentPoint.x, positions.startPoint.x);
        let top = Math.min(positions.currentPoint.y, positions.startPoint.y);

        // Use default size for small selections
        if (width < MIN_SELECTION_SIZE || height < MIN_SELECTION_SIZE) {
          width = Math.min(containerRect.width / 3, DEFAULT_WIDTH);
          height = Math.min(containerRect.height / 3, DEFAULT_HEIGHT);

          // Center around click point, staying within bounds
          left = Math.max(
            0,
            Math.min(
              positions.currentPoint.x - width / 2,
              containerRect.width - width,
            ),
          );
          top = Math.max(
            0,
            Math.min(
              positions.currentPoint.y - height / 2,
              containerRect.height - height,
            ),
          );

          showNotification("info", "Created default selection box", {
            description: "You can now move or resize this selection area",
          });
        } else {
          // Normal selection completion
          const scaleX = screenshotWidth / containerRect.width;
          const scaleY = screenshotHeight / containerRect.height;
          const realWidth = Math.round(width * scaleX);
          const realHeight = Math.round(height * scaleY);

          showNotification("success", "Region selected", {
            description: `Size: ${realWidth}×${realHeight} pixels`,
          });
        }

        // Create the region
        const newRegion = screenToImageCoords(
          left,
          top,
          width,
          height,
          containerRect.width,
          containerRect.height,
        );

        // Update with final selection
        setSelectedRegion(newRegion);
      }

      // Reset all operation states
      setState((prev) => ({
        ...prev,
        isSelecting: false,
        isDragging: false,
        isResizing: false,
        resizeHandle: null,
        showSizeIndicator: false,
      }));

      setPositions((prev) => ({
        ...prev,
        dragStart: null,
        dragOffset: null,
        sizeIndicator: null,
      }));
    },
    [
      state.isSelecting,
      state.isDragging,
      state.isResizing,
      positions.startPoint,
      positions.currentPoint,
      setSelectedRegion,
      screenToImageCoords,
      showNotification,
      screenshotWidth,
      screenshotHeight,
    ],
  );

  // Start drag operation
  const startDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, containerRect: DOMRect) => {
      if (state.isSelecting || state.isResizing || !selectedRegion) return;

      e.stopPropagation();
      e.preventDefault();

      // Log to debug drag operation start
      console.log("Starting drag operation");

      // Calculate correct scale factors
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Calculate scaling factor to fit while preserving aspect ratio
      const scaleX = containerWidth / screenshotWidth;
      const scaleY = containerHeight / screenshotHeight;
      const scale = Math.min(scaleX, scaleY);

      // Calculate image display size
      const imageWidth = screenshotWidth * scale;
      const imageHeight = screenshotHeight * scale;

      // Calculate padding offset (from the 0.5rem padding)
      const padding = 8; // 0.5rem = 8px

      // Calculate offsets for image centering
      const offsetX = (containerWidth - imageWidth) / 2 + padding;
      const offsetY = (containerHeight - imageHeight) / 2 + padding;

      // Current position in screen coordinates with proper offsets
      const left = selectedRegion.x * scale + offsetX;
      const top = selectedRegion.y * scale + offsetY;

      // Update state to indicate dragging
      setState((prev) => ({
        ...prev,
        isDragging: true,
        isResizing: false, // Ensure resize isn't active
        showSizeIndicator: true,
      }));

      // Set up drag operation data
      setPositions((prev) => ({
        ...prev,
        dragStart: { x: e.clientX, y: e.clientY },
        dragOffset: {
          x: e.clientX - left,
          y: e.clientY - top,
        },
        sizeIndicator: {
          x: left + selectedRegion.width * scale,
          y: top,
          width: selectedRegion.width * scale,
          height: selectedRegion.height * scale,
        },
      }));
    },
    [
      state.isSelecting,
      state.isResizing,
      selectedRegion,
      screenshotWidth,
      screenshotHeight,
    ],
  );

  // Start resize operation
  const startResize = useCallback(
    (
      e: React.MouseEvent<HTMLDivElement>,
      handlePosition: string,
      containerRect: DOMRect,
    ) => {
      if (state.isSelecting || state.isDragging || !selectedRegion) return;

      e.stopPropagation();
      e.preventDefault();

      // Log to debug resize operation
      console.log("Starting resize operation with handle:", handlePosition);

      // Calculate correct scale factors
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Calculate scaling factor to fit while preserving aspect ratio
      const scaleX = containerWidth / screenshotWidth;
      const scaleY = containerHeight / screenshotHeight;
      const scale = Math.min(scaleX, scaleY);

      // Calculate image display size
      const imageWidth = screenshotWidth * scale;
      const imageHeight = screenshotHeight * scale;

      // Calculate padding offset (from the 0.5rem padding)
      const padding = 8; // 0.5rem = 8px

      // Calculate offsets for image centering
      const offsetX = (containerWidth - imageWidth) / 2 + padding;
      const offsetY = (containerHeight - imageHeight) / 2 + padding;

      // Current position in screen coordinates with proper offsets
      const left = selectedRegion.x * scale + offsetX;
      const top = selectedRegion.y * scale + offsetY;
      const width = selectedRegion.width * scale;
      const height = selectedRegion.height * scale;

      // Update state to indicate resizing
      setState((prev) => ({
        ...prev,
        isResizing: true,
        isDragging: false, // Ensure drag isn't active
        resizeHandle: handlePosition,
        showSizeIndicator: true,
      }));

      // Set up resize operation data
      setPositions((prev) => ({
        ...prev,
        dragStart: { x: e.clientX, y: e.clientY },
        sizeIndicator: {
          x: left + width,
          y: top,
          width,
          height,
        },
      }));
    },
    [
      state.isSelecting,
      state.isDragging,
      selectedRegion,
      screenshotWidth,
      screenshotHeight,
    ],
  );

  // Reset selection
  const resetSelection = useCallback(() => {
    setSelectedRegion(null);
    setState((prev) => ({
      ...prev,
      isSelecting: false,
      isDragging: false,
      isResizing: false,
      resizeHandle: null,
      showSizeIndicator: false,
    }));
    setPositions({
      startPoint: null,
      currentPoint: null,
      helperPosition: null,
      sizeIndicator: null,
      dragStart: null,
      dragOffset: null,
    });
  }, [setSelectedRegion]);

  // Calculate selection style for the overlay
  const getSelectionStyle = useCallback(
    (containerRect: DOMRect): React.CSSProperties => {
      // Calculate image scale and position
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Calculate scaling factor to fit while preserving aspect ratio
      const scaleX = containerWidth / screenshotWidth;
      const scaleY = containerHeight / screenshotHeight;
      const scale = Math.min(scaleX, scaleY);

      // Calculate image display size
      const imageWidth = screenshotWidth * scale;
      const imageHeight = screenshotHeight * scale;

      // Calculate padding offset (from the 0.5rem padding)
      const padding = 8; // 0.5rem = 8px

      // Calculate offsets for image centering
      const offsetX = (containerWidth - imageWidth) / 2 + padding;
      const offsetY = (containerHeight - imageHeight) / 2 + padding;

      // For active selection
      if (state.isSelecting && positions.startPoint && positions.currentPoint) {
        // Get coordinates relative to container
        const startX = positions.startPoint.x;
        const startY = positions.startPoint.y;
        const currentX = positions.currentPoint.x;
        const currentY = positions.currentPoint.y;

        // Calculate selection rectangle
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        const left = Math.min(currentX, startX);
        const top = Math.min(currentY, startY);

        return {
          display: "block",
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
          position: "absolute",
        };
      }
      // For existing selection
      else if (selectedRegion) {
        // Convert from original image coordinates to display coordinates
        const displayX = selectedRegion.x * scale + offsetX;
        const displayY = selectedRegion.y * scale + offsetY;
        const displayWidth = selectedRegion.width * scale;
        const displayHeight = selectedRegion.height * scale;

        return {
          display: "block",
          left: `${displayX}px`,
          top: `${displayY}px`,
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          position: "absolute",
        };
      }

      // No selection
      return { display: "none" };
    },
    [
      state.isSelecting,
      positions.startPoint,
      positions.currentPoint,
      selectedRegion,
      screenshotWidth,
      screenshotHeight,
    ],
  );

  // Dismiss instructions
  const dismissInstructions = useCallback(() => {
    setState((prev) => ({ ...prev, showInstructions: false }));
  }, []);

  return {
    // State access
    state,
    positions,
    selectedRegion,
    screenshotWidth,
    screenshotHeight,

    // Event handlers
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    startDrag,
    startResize,
    resetSelection,

    // Helpers
    getSelectionStyle,
    dismissInstructions,
  };
}
