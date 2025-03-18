export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextHistoryItem {
  id: number;
  text: string;
  timestamp: string;
}

export interface Settings {
  monitoringInterval: number;
  autoCopyText: boolean;
  maxHistoryItems: number;
  saveHistory: boolean;
  theme: "light" | "dark";
}

export interface StatusResponse {
  is_monitoring: boolean;
  region?: Region;
  last_text?: string;
  last_update?: string;
  ocr_ready?: boolean;
  has_screenshot?: boolean;
}

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

export type SelectionState = {
  isSelecting: boolean;
  isDragging: boolean;
  isResizing: boolean;
  resizeHandle: string | null;
  showInstructions: boolean;
  showHelper: boolean;
  showSizeIndicator: boolean;
};

export type SelectionPositions = {
  startPoint: { x: number; y: number } | null;
  currentPoint: { x: number; y: number } | null;
  helperPosition: { x: number; y: number } | null;
  sizeIndicator: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  dragStart: { x: number; y: number } | null;
  dragOffset: { x: number; y: number } | null;
};

export interface SelectionProps {
  containerRect: DOMRect;
}
