import { cn } from "@/lib/utils";

/** Encabezado de página: título, descripción y acciones. En celulares las acciones bajan. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** Rótulo chico opcional sobre el título. */
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 space-y-1.5">
        {eyebrow && <div className="text-micro uppercase text-primaryText">{eyebrow}</div>}
        <h1 className="break-words text-[1.375rem] font-bold leading-tight tracking-tight sm:text-title">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 [&>*]:flex-1 sm:shrink-0 sm:[&>*]:flex-none">{actions}</div>
      )}
    </div>
  );
}
