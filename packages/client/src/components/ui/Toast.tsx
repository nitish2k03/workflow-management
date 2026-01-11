"use client";
import React from "react";
import { useUIStore } from "@/store/ui.store";
import { cn } from "@/utils/cn";

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useUIStore();

  const typeStyles = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "px-4 py-3 rounded shadow-lg text-white flex items-center gap-3 min-w-[250px]",
            typeStyles[toast.type]
          )}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-white/80 hover:text-white"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
