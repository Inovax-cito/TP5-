import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordForm } from "@/components/perfil/password-form";
import { PageHeader } from "@/components/common/page-header";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader title="Mi perfil" description="Datos de la cuenta y seguridad." />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Nombre</dt>
              <dd className="font-medium">{user.nombre}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Rol</dt>
              <dd>
                <Badge variant={user.rol === "admin" ? "default" : "secondary"}>
                  {user.rol === "admin" ? "Administrador" : "Vendedor"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Estado</dt>
              <dd className="font-medium">{user.activo ? "Activo" : "Inactivo"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <PasswordForm />
    </div>
  );
}
