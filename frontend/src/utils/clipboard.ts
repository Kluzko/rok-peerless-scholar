import { toast } from "sonner";

export async function copyToClipboard(text: string): Promise<void> {
  try {
    return await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Could not copy text: ", err);
    toast.error("Failed to copy to clipboard");
  }
}
