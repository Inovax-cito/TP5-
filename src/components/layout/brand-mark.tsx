import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

/** Logo del comercio: martillo/llave sobre el naranja de marca. */
export function BrandMark({ size = "md", className }: { size?: "md" | "lg"; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-primary to-primaryText text-primary-foreground shadow-elevation-1 ring-1 ring-inset ring-white/20",
        size === "md" ? "h-9 w-9 rounded-control" : "h-12 w-12 rounded-xl",
        className,
      )}
    >
      <span className="absolute inset-x-0 top-0 h-1/2 bg-white/15" />
      <Wrench className={cn("relative", size === "md" ? "h-[18px] w-[18px]" : "h-6 w-6")} strokeWidth={2.4} />
    </span>
  );
}
