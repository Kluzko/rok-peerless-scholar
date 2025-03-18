import React, { memo } from "react";
import { SelectionProps } from "@/types";
import { useSelectionStore } from "@/stores/selectionStore";
import { useScreenshotStore } from "@/stores/screenshotStore";

interface SelectionHandleProps {
  position: string;
  style: React.CSSProperties;
  onStartResize: (
    e: React.MouseEvent<HTMLDivElement>,
    position: string,
  ) => void;
}

const SelectionHandle: React.FC<SelectionHandleProps> = memo(
  ({ position, style, onStartResize }) => {
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      e.preventDefault(); // Prevent unexpected behavior
      onStartResize(e, position);
    };

    const getCursorStyle = (pos: string): string => {
      switch (pos) {
        case "n":
          return "ns-resize";
        case "s":
          return "ns-resize";
        case "e":
          return "ew-resize";
        case "w":
          return "ew-resize";
        case "ne":
          return "nesw-resize";
        case "sw":
          return "nesw-resize";
        case "nw":
          return "nwse-resize";
        case "se":
          return "nwse-resize";
        default:
          return "pointer";
      }
    };

    return (
      <div
        style={{
          ...style,
          cursor: getCursorStyle(position),
        }}
        onMouseDown={handleMouseDown}
        role="button"
        aria-label={`Resize ${position} handle`}
        tabIndex={0}
      />
    );
  },
);

SelectionHandle.displayName = "SelectionHandle";

// Main handles component that renders all 8 handles
export const SelectionHandles: React.FC<
  SelectionProps & {
    onStartResize: (
      e: React.MouseEvent<HTMLDivElement>,
      position: string,
    ) => void;
  }
> = memo(({ containerRect, onStartResize }) => {
  const { selectedRegion } = useSelectionStore();
  const { screenshotWidth, screenshotHeight } = useScreenshotStore();

  if (!selectedRegion) return null;

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

  // Convert selection to screen coordinates with proper offsets
  const left = selectedRegion.x * scale + offsetX;
  const top = selectedRegion.y * scale + offsetY;
  const width = selectedRegion.width * scale;
  const height = selectedRegion.height * scale;

  // Handle size in pixels - smaller handles for precision
  const handleSize = 8;
  const halfHandle = handleSize / 2;

  // Calculate positions for all handles with proper offsets
  const handlePositions = {
    // Middle sides
    n: { left: left + width / 2 - halfHandle, top: top - halfHandle },
    s: { left: left + width / 2 - halfHandle, top: top + height - halfHandle },
    e: { left: left + width - halfHandle, top: top + height / 2 - halfHandle },
    w: { left: left - halfHandle, top: top + height / 2 - halfHandle },

    // Corners
    ne: { left: left + width - halfHandle, top: top - halfHandle },
    se: { left: left + width - halfHandle, top: top + height - halfHandle },
    sw: { left: left - halfHandle, top: top + height - halfHandle },
    nw: { left: left - halfHandle, top: top - halfHandle },
  };

  const positions = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];

  return (
    <>
      {positions.map((position) => {
        const pos = handlePositions[position as keyof typeof handlePositions];
        const style = {
          position: "absolute" as const,
          left: `${pos.left}px`,
          top: `${pos.top}px`,
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          background: "#ffffff",
          border: "1px solid #3b82f6",
          zIndex: 120,
          pointerEvents: "auto" as const,
        };

        return (
          <SelectionHandle
            key={position}
            position={position}
            style={style}
            onStartResize={onStartResize}
          />
        );
      })}
    </>
  );
});

SelectionHandles.displayName = "SelectionHandles";
