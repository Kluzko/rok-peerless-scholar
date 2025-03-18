import { toast, ExternalToast } from "sonner";
import { NotificationType } from "@/types";

interface NotificationOptions extends Omit<ExternalToast, "description"> {
  description?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export function useNotification() {
  /**
   * Show a notification toast
   * @param type - The type of notification
   * @param message - The main message to display
   * @param options - Additional toast options
   * @returns The toast ID
   */
  const showNotification = (
    type: NotificationType,
    message: React.ReactNode,
    options?: NotificationOptions,
  ) => {
    const {
      description,
      action,
      duration = 4000,
      ...restOptions
    } = options || {};

    // Prepare action configuration if provided
    const actionConfig = action
      ? {
          action: {
            label: action.label,
            onClick: action.onClick,
          },
        }
      : {};

    // Call the appropriate toast function based on type
    switch (type) {
      case "error":
        return toast.error(message, {
          description,
          duration,
          ...actionConfig,
          ...restOptions,
        });

      case "warning":
        return toast.warning(message, {
          description,
          duration,
          ...actionConfig,
          ...restOptions,
        });

      case "success":
        return toast.success(message, {
          description,
          duration,
          ...actionConfig,
          ...restOptions,
        });

      case "info":
      default:
        return toast.info(message, {
          description,
          duration,
          ...actionConfig,
          ...restOptions,
        });
    }
  };

  /**
   * Show a loading toast that can be updated later
   * @param message - The loading message
   * @param options - Additional toast options
   * @returns The toast ID for later reference
   */
  const showLoading = (
    message: React.ReactNode,
    options?: NotificationOptions,
  ) => {
    return toast.loading(message, {
      description: options?.description,
      duration: options?.duration || Infinity, // Loading toasts typically stay until dismissed
      ...options,
    });
  };

  /**
   * Update an existing toast
   * @param id - The ID of the toast to update
   * @param type - The new notification type
   * @param message - The new message
   * @param options - Additional toast options
   */
  const updateNotification = (
    id: string | number,
    type: NotificationType,
    message: React.ReactNode,
    options?: NotificationOptions,
  ) => {
    // Dismiss the existing toast first
    toast.dismiss(id);

    // Create a new toast with the same ID
    return showNotification(type, message, {
      ...options,
      id,
    });
  };

  /**
   * Dismiss a specific toast or all toasts
   * @param id - Optional ID of the toast to dismiss (dismisses all if not provided)
   */
  const dismissNotification = (id?: string | number) => {
    toast.dismiss(id);
  };

  /**
   * Create a toast for a promise with loading/success/error states
   * @param promise - The promise to track
   * @param messages - Object containing loading/success/error messages
   * @param options - Additional toast options
   */
  const promiseNotification = <T>(
    promise: Promise<T>,
    messages: {
      loading: React.ReactNode;
      success: React.ReactNode | ((data: T) => React.ReactNode);
      error: React.ReactNode | ((error: unknown) => React.ReactNode);
    },
    options?: Omit<NotificationOptions, "duration">,
  ) => {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
      ...options,
    });
  };

  return {
    showNotification,
    showLoading,
    updateNotification,
    dismissNotification,
    promiseNotification,
  };
}
