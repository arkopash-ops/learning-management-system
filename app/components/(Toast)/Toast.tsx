"use client";

import { useEffect } from "react";

export type ToastType = "error" | "success" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const typeStyles = {
  error: "bg-red-500 text-white",
  success: "bg-green-500 text-white",
  info: "bg-black text-white",
};

export default function Toast({
  message,
  type = "info",
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={`fixed top-5 right-5 z-50 min-w-62.5 max-w-sm rounded-lg px-4 py-3 shadow-lg transition-all ${typeStyles[type]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">{message}</p>

        <button onClick={onClose} className="text-white/80 hover:text-white">
          ✕
        </button>
      </div>
    </div>
  );
}
