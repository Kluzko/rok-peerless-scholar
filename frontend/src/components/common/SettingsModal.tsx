import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSettingsStore } from "@/stores/settingsStore";
import { useNotification } from "@/hooks/useNotification";

// Import Shadcn components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

// Settings form schema with zod
const SettingsSchema = z.object({
  monitoringInterval: z.number().min(200).max(5000),
  autoCopyText: z.boolean(),
  maxHistoryItems: z.number().min(5).max(200),
  saveHistory: z.boolean(),
  theme: z.enum(["light", "dark"]),
});

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettingsStore();
  const { showNotification } = useNotification();

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      monitoringInterval: settings.monitoringInterval,
      autoCopyText: settings.autoCopyText,
      maxHistoryItems: settings.maxHistoryItems,
      saveHistory: settings.saveHistory,
      theme: settings.theme,
    },
  });

  function onSubmit(data: z.infer<typeof SettingsSchema>) {
    updateSettings(data);
    showNotification("success", "Settings saved successfully");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure the Screen Text Reader application.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Monitoring Interval */}
              <FormField
                control={form.control}
                name="monitoringInterval"
                render={({ field: { value, onChange } }) => (
                  <FormItem>
                    <FormLabel>Check Interval (ms)</FormLabel>
                    <div className="flex items-center space-x-2">
                      <Slider
                        min={200}
                        max={5000}
                        step={100}
                        value={[value]}
                        onValueChange={(vals) => onChange(vals[0])}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min={200}
                        max={5000}
                        className="w-20"
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
                      />
                    </div>
                    <FormDescription>
                      How frequently to check for text changes
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autoCopyText"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Auto-copy new text
                      </FormLabel>
                      <FormDescription>
                        Automatically copy detected text to clipboard
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxHistoryItems"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum history items</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={5}
                        max={200}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of text history items to keep
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="saveHistory"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Save history between sessions
                      </FormLabel>
                      <FormDescription>
                        Keep history when you close the application
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
