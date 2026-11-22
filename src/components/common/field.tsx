import { CircleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Campo con etiqueta, ayuda y error junto al campo (sección 8). */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)} data-invalid={error ? "true" : undefined}>
      <Label htmlFor={htmlFor} className="text-foreground/90">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className={cn(error && "[&_input]:border-destructive [&_button]:border-destructive [&_textarea]:border-destructive")}>
        {children}
      </div>
      {error ? (
        <FieldError>{error}</FieldError>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Mensaje de error con ícono, reutilizable fuera de Field. */
export function FieldError({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p role="alert" className={cn("flex items-start gap-1.5 text-xs font-medium text-destructive", className)}>
      <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}
