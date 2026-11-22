/**
 * Estructura general del panel (sección 4): panel lateral fijo en escritorio, barra
 * superior y contenido sobre un fondo neutro leve para que resalten las tarjetas.
 */
export function AppShell({
  sidebar,
  topbar,
  children,
}: {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border lg:block">
        {sidebar}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {topbar}
        <main className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
