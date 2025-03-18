import { useState } from "react";
import { Copy, RotateCw } from "lucide-react";
import { useTextStore } from "@/stores/textStore";
import { copyToClipboard } from "@/utils/clipboard";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

export function DetectedText() {
  const { currentText, isMonitoring, ocrReady } = useTextStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayText =
    currentText ||
    (isMonitoring
      ? "Waiting for text to appear in the selected region..."
      : "");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detected Text</CardTitle>
      </CardHeader>

      <CardContent>
        {isMonitoring && ocrReady && (
          <div className="flex items-center justify-center p-2 text-sm text-blue-600 mb-2 bg-blue-50 rounded">
            <RotateCw className="animate-spin mr-2 h-4 w-4" />
            <span>OCR engine is analyzing the selected region...</span>
          </div>
        )}

        <div className="bg-muted p-4 rounded-md min-h-[100px] border">
          <pre
            className={`whitespace-pre-wrap font-mono ${!currentText && isMonitoring ? "italic text-muted-foreground" : ""}`}
          >
            {displayText}
          </pre>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={handleCopy}
          disabled={!currentText}
        >
          {copied ? (
            <>
              <span className="mr-1">✓</span> Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" /> Copy to clipboard
            </>
          )}
        </Button>

        <span className="text-sm text-muted-foreground">
          {currentText?.length || 0} characters
        </span>
      </CardFooter>
    </Card>
  );
}
