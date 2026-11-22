import { cn } from "@/lib/utils";

/** Tecla de atajo (patrón Kbd de shadcn/ui). */
export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-b-2 border-border bg-card px-1.5 font-mono text-[10px] font-semibold text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
