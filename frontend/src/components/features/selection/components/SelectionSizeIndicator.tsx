import { SelectionProps } from "@/types";
import React, { memo } from "react";

interface SelectionSizeIndicatorProps extends SelectionProps {
  sizeIndicator: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  screenshotWidth: number;
  screenshotHeight: number;
}

export const SelectionSizeIndicator: React.FC<SelectionSizeIndicatorProps> =
  memo(
    ({ sizeIndicator, containerRect, screenshotWidth, screenshotHeight }) => {
      if (!sizeIndicator) return null;

      // Calculate scale for proper dimension display
      const scaleX = containerRect.width / screenshotWidth;
      const scaleY = containerRect.height / screenshotHeight;
      const scale = Math.min(scaleX, scaleY);

      // Calculate real dimensions based on the scale
      const realWidth = Math.round(sizeIndicator.width / scale);
      const realHeight = Math.round(sizeIndicator.height / scale);

      // Position it near the selection
      const offsetX = 5;
      const offsetY = 5;

      // Position it at the bottom right of the selection
      let left = sizeIndicator.x + offsetX;
      let top = sizeIndicator.y + offsetY;

      // Make sure it stays in bounds
      if (left + 70 > containerRect.width) {
        left = sizeIndicator.x - offsetX - 70;
      }

      if (top + 25 > containerRect.height) {
        top = sizeIndicator.y - offsetY - 25;
      }

      const style = {
        position: "absolute" as const,
        left: `${left}px`,
        top: `${top}px`,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "white",
        padding: "2px 6px",
        fontSize: "12px",
        zIndex: 25,
        pointerEvents: "none" as const,
        whiteSpace: "nowrap" as const,
      };

      return (
        <div style={style}>
          {realWidth} × {realHeight}
        </div>
      );
    },
  );

SelectionSizeIndicator.displayName = "SelectionSizeIndicator";
