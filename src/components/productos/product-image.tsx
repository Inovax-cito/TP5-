"use client";

import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Miniatura de producto. Acepta rutas locales y URLs externas cargadas desde el
 * formulario, por eso se usa <img> en lugar de next/image (que exige dominios
 * permitidos en next.config.ts). Si la imagen falla, muestra un ícono.
 */
export function ProductImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    setFallo(false);
  }, [src]);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-primary/20 bg-primary/10",
        className,
      )}
      title={alt}
    >
      {src && !fallo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFallo(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <Package className="h-1/2 w-1/2 text-primaryText" aria-hidden="true" />
      )}
    </span>
  );
}
