import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Insignias: fondo tenue del tono, texto del tono y, opcionalmente, un punto de color.
 * Radio propio de insignia (--radius-badge).
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-badge border px-2 py-0.5 text-[11px] font-semibold leading-4 transition-colors focus:outline-none focus:ring-2 focus:ring-ring [&_svg]:h-3 [&_svg]:w-3",
  {
    variants: {
      variant: {
        default: "border-primary/25 bg-primary/10 text-primaryText",
        secondary: "border-border bg-muted text-muted-foreground",
        destructive: "border-destructive/20 bg-destructive/[0.08] text-destructive",
        success: "border-success/20 bg-success/[0.08] text-success",
        warning: "border-warning/25 bg-warning/[0.09] text-warning",
        info: "border-info/20 bg-info/[0.08] text-info",
        outline: "border-border bg-card text-foreground",
        solid: "border-transparent bg-primary text-primary-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

const dotVariants = {
  default: "bg-primary",
  secondary: "bg-neutral-400",
  destructive: "bg-destructive",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  outline: "bg-neutral-400",
  solid: "bg-primary-foreground",
} as const;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Muestra el punto de color del tono a la izquierda. */
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div data-badge="" className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span data-dot="" aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotVariants[variant ?? "default"])} />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
