import React from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Copy, ZoomIn, Trash, Save } from "lucide-react";

interface SelectionContextMenuProps {
  children: React.ReactNode;
  onViewSelection?: () => void;
  onCopyCoordinates?: () => void;
  onSaveSelection?: () => void;
  onResetSelection?: () => void;
  disabled?: boolean;
}

export function SelectionContextMenu({
  children,
  onViewSelection,
  onCopyCoordinates,
  onSaveSelection,
  onResetSelection,
  disabled = false,
}: SelectionContextMenuProps) {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {onViewSelection && (
          <ContextMenuItem onClick={onViewSelection}>
            <ZoomIn className="mr-2 h-4 w-4" />
            <span>View Selection</span>
            <ContextMenuShortcut>⌘V</ContextMenuShortcut>
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {onCopyCoordinates && (
          <ContextMenuItem onClick={onCopyCoordinates}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy Coordinates</span>
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
        )}

        {onSaveSelection && (
          <ContextMenuItem onClick={onSaveSelection}>
            <Save className="mr-2 h-4 w-4" />
            <span>Save Selection</span>
            <ContextMenuShortcut>⌘S</ContextMenuShortcut>
          </ContextMenuItem>
        )}

        {onResetSelection && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={onResetSelection}
              className="text-red-600"
            >
              <Trash className="mr-2 h-4 w-4" />
              <span>Clear Selection</span>
              <ContextMenuShortcut>⌫</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
