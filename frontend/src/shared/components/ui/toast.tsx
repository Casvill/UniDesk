"use client";

import React from "react";
import {
  UNSTABLE_ToastRegion as ToastRegion,
  UNSTABLE_Toast as Toast,
  UNSTABLE_ToastQueue as ToastQueue,
  UNSTABLE_ToastContent as ToastContent,
  Button,
  Text,
} from "react-aria-components";
import type { ToastProps } from "react-aria-components";
import { XIcon } from "lucide-react";
import { cn } from "./utils";
import { flushSync } from "react-dom";
import type { CSSProperties } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastData {
  title?: string;
  description: string;
  type: ToastType;
}

function getTimeout(type: ToastType): number {
  switch (type) {
    case "error":
      return 10000;
    case "warning":
      return 8000;
    default:
      return 5000;
  }
}

function getAriaRole(type: ToastType): "alert" | "status" {
  return type === "error" ? "alert" : "status";
}

function getToastStyles(type: ToastType): string {
  switch (type) {
    case "success":
      return "bg-green-600 text-white";
    case "error":
      return "bg-red-600 text-white";
    case "warning":
      return "bg-yellow-500 text-white";
    case "info":
      return "bg-primary-600 text-white";
  }
}

function getAriaLabel(type: ToastType, title?: string, description?: string): string {
  const text = title || description || "";
  const prefix = type === "error" ? "Alerta" : "Notificación";
  return `${prefix}: ${text}`;
}

const queue = new ToastQueue<ToastData>({
  maxVisibleToasts: 5,
  wrapUpdate(fn) {
    if ("startViewTransition" in document) {
      document.startViewTransition(() => {
        flushSync(fn);
      });
    } else {
      fn();
    }
  },
});

export const showToast = {
  success(description: string, title?: string) {
    return queue.add(
      { title, description, type: "success" },
      { timeout: getTimeout("success") },
    );
  },

  error(description: string, title?: string) {
    return queue.add(
      { title, description, type: "error" },
      { timeout: getTimeout("error") },
    );
  },

  info(description: string, title?: string) {
    return queue.add(
      { title, description, type: "info" },
      { timeout: getTimeout("info") },
    );
  },

  warning(description: string, title?: string) {
    return queue.add(
      { title, description, type: "warning" },
      { timeout: getTimeout("warning") },
    );
  },

  close(key: string) {
    queue.close(key);
  },
};

export function AppToastRegion() {
  return (
    <ToastRegion
      queue={queue}
      aria-label="Notificaciones del sistema"
      className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 outline-none"
    >
      {({ toast }) => <ToastItem toast={toast} />}
    </ToastRegion>
  );
}

function ToastItem({ toast }: ToastProps<ToastData>) {
  const { type, title, description } = toast.content;

  return (
    <Toast
      toast={toast}
      style={{ viewTransitionName: toast.key } as CSSProperties}
      className={cn(
        "flex w-[360px] items-center gap-4 rounded-lg px-4 py-3 shadow-lg outline-none",
        "focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2",
        getToastStyles(type),
      )}
    >
      <span className="sr-only" aria-live={getAriaRole(type) === "alert" ? "assertive" : "polite"}>
        {getAriaLabel(type, title, description)}
      </span>
      <ToastContent className="flex min-w-0 flex-1 flex-col">
        {title && (
          <Text slot="title" className="text-sm font-semibold">
            {title}
          </Text>
        )}
        <Text
          slot="description"
          className={cn("text-sm", title && "text-white/90")}
        >
          {description}
        </Text>
      </ToastContent>
      <Button
        slot="close"
        aria-label="Cerrar notificación"
        className="[-webkit-tap-highlight-color:transparent] flex h-8 w-8 flex-none cursor-pointer appearance-none items-center justify-center rounded-sm border-none bg-transparent p-0 text-white/80 outline-none hover:bg-white/10 hover:text-white pressed:bg-white/15 focus-visible:ring-2 focus-visible:ring-white"
      >
        <XIcon className="h-4 w-4" />
      </Button>
    </Toast>
  );
}
