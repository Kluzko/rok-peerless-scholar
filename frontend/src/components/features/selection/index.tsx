import React, { useRef, useState, useCallback, useLayoutEffect } from "react";
import { useScreenshotStore } from "@/stores/screenshotStore";
import {
  SelectionOverlay,
  SelectionHandles,
  SelectionSizeIndicator,
  SelectionHelper,
  SelectionInstructions,
} from "./components";

import { SelectionPreviewModal } from "./actions";

import { useSelection } from "@/hooks/useSelection";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScreenshotContentProps {
  screenshotUrl: string;
  screenshotWidth: number;
  screenshotHeight: number;
}

const ScreenshotContent: React.FC<ScreenshotContentProps> = ({
  screenshotUrl,
  screenshotWidth,
  screenshotHeight,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageStyle, setImageStyle] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);

  const {
    state,
    positions,
    selectedRegion,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    startDrag,
    startResize,
    getSelectionStyle,
    dismissInstructions,
  } = useSelection();

  // This helps prevent unexpected visual changes and state updates during render
  useLayoutEffect(() => {
    if (imageLoaded && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      // Calculate scaling factor to fit while preserving aspect ratio
      const scaleX = containerWidth / screenshotWidth;
      const scaleY = containerHeight / screenshotHeight;
      const scale = Math.min(scaleX, scaleY);

      // Set the image dimensions exactly
      setImageStyle({
        width: `${screenshotWidth * scale}px`,
        height: `${screenshotHeight * scale}px`,
        padding: "0.5rem",
        objectFit: "fill",
      });
    }
  }, [imageLoaded, screenshotWidth, screenshotHeight]);

  // Event handler callbacks defined outside of render
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleContainerMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        handleMouseDown(e, rect);
      }
    },
    [handleMouseDown],
  );

  const handleContainerMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        handleMouseMove(e, rect);
      }
    },
    [handleMouseMove],
  );

  const handleContainerMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        handleMouseUp(e, rect);
      }
    },
    [handleMouseUp],
  );

  const handleOverlayMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;

      if (e.currentTarget === overlayRef.current && containerRef.current) {
        e.stopPropagation();
        const rect = containerRef.current.getBoundingClientRect();
        startDrag(e, rect);
      }
    },
    [startDrag],
  );

  const handleStartResize = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, position: string) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        startResize(e, position, rect);
      }
    },
    [startResize],
  );

  const safeGetContainerRect = useCallback((): DOMRect => {
    return (
      containerRef.current?.getBoundingClientRect() || new DOMRect(0, 0, 1, 1)
    );
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-[500px] overflow-auto cursor-crosshair bg-gray-100 flex items-center justify-center"
      onMouseDown={handleContainerMouseDown}
      onMouseMove={handleContainerMouseMove}
      onMouseUp={handleContainerMouseUp}
      onMouseLeave={handleContainerMouseUp}
    >
      <img
        style={imageStyle}
        src={screenshotUrl}
        alt="Screenshot"
        draggable={false}
        onLoad={handleImageLoad}
      />

      <SelectionOverlay
        overlayRef={overlayRef}
        overlayStyle={getSelectionStyle(safeGetContainerRect())}
        onMouseDown={handleOverlayMouseDown}
        isSelecting={state.isSelecting}
        containerRect={safeGetContainerRect()}
      />

      {selectedRegion && (
        <SelectionHandles
          containerRect={safeGetContainerRect()}
          onStartResize={handleStartResize}
        />
      )}

      {state.showSizeIndicator && (
        <SelectionSizeIndicator
          containerRect={safeGetContainerRect()}
          sizeIndicator={positions.sizeIndicator}
          screenshotWidth={screenshotWidth}
          screenshotHeight={screenshotHeight}
        />
      )}

      {state.showHelper && (
        <SelectionHelper helperPosition={positions.helperPosition} />
      )}
      {state.showInstructions && (
        <SelectionInstructions onDismiss={dismissInstructions} />
      )}

      <SelectionPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        screenshotUrl={screenshotUrl}
        selection={selectedRegion}
      />
    </div>
  );
};

// Main component with minimal state handling
export function ScreenshotSection() {
  const { screenshotUrl, screenshotWidth, screenshotHeight } =
    useScreenshotStore();

  // Render empty component if no screenshot
  if (!screenshotUrl) return null;

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle>Select Region</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScreenshotContent
          screenshotUrl={screenshotUrl}
          screenshotWidth={screenshotWidth}
          screenshotHeight={screenshotHeight}
        />
      </CardContent>
    </Card>
  );
}
