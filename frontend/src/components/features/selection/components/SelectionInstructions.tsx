import React from "react";

type SelectionInstructionsProps = {
  onDismiss: () => void;
};

export const SelectionInstructions: React.FC<SelectionInstructionsProps> = ({
  onDismiss,
}) => {
  return (
    <div
      className="instructions-overlay"
      onClick={onDismiss}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 30,
      }}
    >
      <div
        className="instructions-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "white",
          maxWidth: "90%",
          width: "400px",
          padding: "24px",
          borderRadius: "16px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          textAlign: "center",
        }}
      >
        <h3 className="text-xl mb-3 font-bold">Select a Region to Monitor</h3>
        <div className="flex items-center justify-center my-4">
          <span className="text-2xl mr-2">🖱️</span>
          <span className="mx-2">→</span>
          <span className="text-2xl ml-2">📏</span>
        </div>
        <p className="mb-4 text-gray-700">
          Click and drag to select the area you want to monitor.
          <br />
          You can resize or move your selection after creating it.
        </p>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full transition font-semibold shadow-md"
          onClick={onDismiss}
        >
          Got it!
        </button>
      </div>
    </div>
  );
};
