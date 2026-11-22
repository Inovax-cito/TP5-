"use client";

import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";

/** Avisos (sección 8) con los colores del tema: cada tipo usa su token y su ícono. */
export function AppToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-right"
      richColors
      closeButton
      icons={{
        success: <CircleCheck className="h-[18px] w-[18px]" />,
        error: <CircleAlert className="h-[18px] w-[18px]" />,
        warning: <TriangleAlert className="h-[18px] w-[18px]" />,
        info: <Info className="h-[18px] w-[18px]" />,
        loading: <LoaderCircle className="h-[18px] w-[18px] animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "!rounded-card !shadow-elevation-3 !font-sans !gap-3 !px-4 !py-3.5",
          title: "!text-label !font-semibold",
          description: "!text-xs",
          closeButton: "!border-border !bg-card !text-muted-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "hsl(var(--popover))",
          "--normal-text": "hsl(var(--popover-foreground))",
          "--normal-border": "hsl(var(--border))",
          "--success-bg": "hsl(var(--card))",
          "--success-text": "hsl(var(--success))",
          "--success-border": "hsl(var(--success) / 0.35)",
          "--error-bg": "hsl(var(--card))",
          "--error-text": "hsl(var(--destructive))",
          "--error-border": "hsl(var(--destructive) / 0.35)",
          "--warning-bg": "hsl(var(--card))",
          "--warning-text": "hsl(var(--warning))",
          "--warning-border": "hsl(var(--warning) / 0.35)",
          "--info-bg": "hsl(var(--card))",
          "--info-text": "hsl(var(--info))",
          "--info-border": "hsl(var(--info) / 0.35)",
        } as React.CSSProperties
      }
    />
  );
}
