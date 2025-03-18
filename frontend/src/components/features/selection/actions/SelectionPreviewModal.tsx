import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SelectionPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenshotUrl: string;
  selection: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

export function SelectionPreviewModal({
  open,
  onOpenChange,
  screenshotUrl,
  selection,
}: SelectionPreviewModalProps) {
  if (!selection) return null;

  // Calculate scaling to show the selection at an appropriate size
  const MIN_PREVIEW_WIDTH = 400;
  const MIN_PREVIEW_HEIGHT = 300;

  const scaleX = Math.max(2, MIN_PREVIEW_WIDTH / selection.width);
  const scaleY = Math.max(2, MIN_PREVIEW_HEIGHT / selection.height);
  const scale = Math.min(scaleX, scaleY);

  const previewWidth = selection.width * scale;
  const previewHeight = selection.height * scale;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Selection Preview</DialogTitle>
          <DialogDescription>
            Selected region ({selection.width} × {selection.height})
          </DialogDescription>
        </DialogHeader>

        <div className="relative border overflow-hidden">
          <div
            className="relative flex items-center justify-center bg-gray-50 p-4"
            style={{ minHeight: "400px" }}
          >
            <div
              className="relative"
              style={{
                width: `${previewWidth}px`,
                height: `${previewHeight}px`,
                overflow: "hidden",
              }}
            >
              <img
                src={screenshotUrl}
                alt="Selection preview"
                style={{
                  position: "absolute",
                  width: `${scale * 100}%`,
                  height: `${scale * 100}%`,
                  objectFit: "none",
                  objectPosition: `-${selection.x * scale}px -${selection.y * scale}px`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Position: {selection.x}, {selection.y}
          </div>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
