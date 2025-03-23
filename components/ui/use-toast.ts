// Simplified toast hook
import { useState } from "react";

type ToastProps = {
  title?: string;
  description?: string;
  status?: "success" | "error" | "info";
};

type ToastFunction = (props: ToastProps) => void;

export function useToast(): { toast: ToastFunction } {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast: ToastFunction = (props) => {
    // For now, just log to console since we're not implementing full toast UI
    console.log("Toast:", props);
    setToasts((prev) => [...prev, props]);
    
    // In a real implementation, we'd display the toast in the UI
  };

  return { toast };
} 