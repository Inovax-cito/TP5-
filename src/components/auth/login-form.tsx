"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/common/field";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
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
    <div className="flex min-h-screen items-center justify-center bg-[#111111] p-4">
      <Card className="w-full max-w-md overflow-hidden border-0 shadow-2xl">
        <div className="h-2 bg-primary" />
        <CardHeader className="space-y-3 pb-2 pt-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-[#111111]">
            <Wrench className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-black">Ferretería El Martillo</CardTitle>
          <CardDescription>Ingresá al sistema de facturación, stock y cuenta corriente.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={enviar} className="space-y-4">
            <Field label="Email" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="usuario@comercio.test"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            <Button className="w-full" type="submit" disabled={cargando}>
              {cargando ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
