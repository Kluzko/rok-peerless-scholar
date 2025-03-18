import React, { memo } from "react";
import { SelectionProps } from "@/types";

interface SelectionOverlayProps extends SelectionProps {
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  overlayRef: React.RefObject<HTMLDivElement | null>;
  overlayStyle: React.CSSProperties;
  isSelecting: boolean;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = memo(
  ({ overlayRef, overlayStyle, onMouseDown, isSelecting }) => {
    // Basic overlay with exact positioning and minimal styling
    const baseStyle = {
      ...overlayStyle,
      border: "2px solid rgba(59, 130, 246, 0.8)",
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      cursor: "move",
    };

    return (
      <div
        ref={overlayRef}
        className={isSelecting ? "selection-pulse" : ""}
        style={baseStyle}
        onMouseDown={onMouseDown}
      />
    );
  },
);

SelectionOverlay.displayName = "SelectionOverlay";
