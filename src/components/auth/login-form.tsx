"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/field";
import { BrandMark } from "@/components/layout/brand-mark";

/**
 * Modo demo (pedido de la cátedra): entra con los usuarios del seed sin escribirlos.
 * Usa el mismo POST /api/auth/login, así que la sesión y las reglas son las de siempre.
 * Son las credenciales públicas del README; si se cambian en la base, el botón deja de funcionar.
 */
const DEMO = {
  admin: { email: "laura@ferreteria.test", password: "admin1234" },
  vendedor: { email: "pablo@ferreteria.test", password: "vendedor1234" },
} as const;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    await ingresar(email, password);
  }

  async function entrarDemo(rol: keyof typeof DEMO) {
    setEmail(DEMO[rol].email);
    setPassword(DEMO[rol].password);
    await ingresar(DEMO[rol].email, DEMO[rol].password);
  }

  async function ingresar(email: string, password: string) {
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "No se pudo iniciar sesión.");
        return;
      }
      toast.success(`Bienvenido, ${json.nombre}`);
      router.push(params.get("next") || "/");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca: solo en escritorio */}
      <aside className="bg-brand-pattern relative hidden overflow-hidden text-sidebar-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-3">
          <BrandMark size="lg" />
          <div>
            <p className="text-lg font-bold leading-tight tracking-tight">Ferretería El Martillo</p>
            <p className="text-sm text-sidebar-muted">Gestión comercial</p>
          </div>
        </div>

        <div className="max-w-md space-y-5">
          <span className="inline-flex items-center gap-2 rounded-badge bg-white/[0.08] px-3 py-1 text-xs font-medium text-sidebar-foreground ring-1 ring-inset ring-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Facturación · Stock · Cuenta corriente
          </span>
          <p className="text-display text-white xl:text-[2.75rem] xl:leading-[3rem]">
            Todo el mostrador, <span className="text-primary">en un solo lugar.</span>
          </p>
          <p className="text-base leading-relaxed text-sidebar-muted">
            Vendé, controlá existencias y seguí las cuentas de tus clientes con reglas que se cumplen siempre.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-sidebar-muted">
          <span className="bg-brand-stripes h-2 w-16 rounded-full opacity-90" aria-hidden="true" />
          <span>Comprobantes internos · Datos en tiempo real</span>
        </div>
      </aside>

      {/* Formulario */}
      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 lg:hidden">
              <BrandMark size="lg" />
              <div>
                <p className="font-bold leading-tight tracking-tight">Ferretería El Martillo</p>
                <p className="text-sm text-muted-foreground">Gestión comercial</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <h1 className="text-title">Ingresá a tu cuenta</h1>
              <p className="text-sm text-muted-foreground">Ingresá al sistema de facturación, stock y cuenta corriente.</p>
            </div>
          </div>

          <form onSubmit={enviar} className="space-y-5">
            <Field label="Email" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="usuario@comercio.test"
                className="h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Contraseña" htmlFor="password" required error={error ?? undefined}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="h-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            <Button className="h-11 w-full" type="submit" disabled={cargando}>
              {cargando ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <p className="text-micro uppercase text-muted-foreground">O entrá en modo demo</p>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="h-11" disabled={cargando} onClick={() => entrarDemo("admin")}>
                <ShieldCheck className="h-4 w-4 text-primaryText" />
                Administrador
              </Button>
              <Button type="button" variant="outline" className="h-11" disabled={cargando} onClick={() => entrarDemo("vendedor")}>
                <ShoppingCart className="h-4 w-4 text-primaryText" />
                Vendedor
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
