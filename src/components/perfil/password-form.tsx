"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/common/field";
import { Input } from "@/components/ui/input";
import { apiFetch, mapApiErrors } from "@/lib/client/api";
import { cambiarPasswordSchema } from "@/lib/validations/auth";

export function PasswordForm() {
  const [form, setForm] = useState({ actual: "", nueva: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setErrores({});
    setErrorGeneral(null);

    const validacion = cambiarPasswordSchema.safeParse(form);
    if (!validacion.success) {
      const porCampo: Record<string, string> = {};
      for (const issue of validacion.error.issues) {
        const campo = issue.path.join(".") || "general";
        if (!porCampo[campo]) porCampo[campo] = issue.message;
      }
      setErrores(porCampo);
      return;
    }

    setCargando(true);
    try {
      await apiFetch("/api/auth/password", {
        method: "PUT",
        body: JSON.stringify(validacion.data),
      });
      toast.success("Contraseña actualizada.");
      setForm({ actual: "", nueva: "" });
    } catch (error) {
      const mapeado = mapApiErrors(error);
      setErrores(mapeado.errores);
      setErrorGeneral(mapeado.mensaje);
      if (mapeado.mensaje) toast.error(mapeado.mensaje);
    } finally {
      setCargando(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cambiar contraseña</CardTitle>
        <CardDescription>Usá al menos 8 caracteres para la nueva contraseña.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={guardar} className="max-w-md space-y-4">
          {errorGeneral && <Alert className="border-destructive/30 bg-destructive/5 text-destructive">{errorGeneral}</Alert>}
          <Field label="Contraseña actual" required error={errores.actual}>
            <Input type="password" autoComplete="current-password" value={form.actual} onChange={(e) => setForm({ ...form, actual: e.target.value })} />
          </Field>
          <Field label="Nueva contraseña" required error={errores.nueva}>
            <Input type="password" autoComplete="new-password" value={form.nueva} onChange={(e) => setForm({ ...form, nueva: e.target.value })} />
          </Field>
          <Button type="submit" disabled={cargando}>
            {cargando ? "Actualizando…" : "Actualizar contraseña"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
