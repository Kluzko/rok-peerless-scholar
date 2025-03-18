import React, { memo } from "react";

type SelectionHelperProps = {
  helperPosition: { x: number; y: number } | null;
};

export const SelectionHelper: React.FC<SelectionHelperProps> = memo(
  ({ helperPosition }) => {
    if (!helperPosition) return null;

    // Simple crosshair style
    const style = {
      position: "absolute" as const,
      left: `${helperPosition.x}px`,
      top: `${helperPosition.y}px`,
      width: "20px",
      height: "20px",
      transform: "translate(-50%, -50%)",
      pointerEvents: "none" as const,
      zIndex: 15,
    };

    // Simple crosshair implementation
    return (
      <div style={style}>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "0",
            bottom: "0",
            width: "1px",
            backgroundColor: "#3b82f6",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "0",
            right: "0",
            height: "1px",
            backgroundColor: "#3b82f6",
          }}
        />
      </div>
    );
  },
);

SelectionHelper.displayName = "SelectionHelper";
