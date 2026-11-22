"use client";

import { ErrorState } from "@/components/common/states";

/** Sección 8: estado de error con reintento para todas las pantallas del panel. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorState
      message="Ocurrió un problema al cargar esta pantalla. Probá nuevamente."
      onRetry={reset}
    />
  );
}
