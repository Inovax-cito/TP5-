import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordForm } from "@/components/perfil/password-form";
import { PageHeader } from "@/components/common/page-header";
import { Grid, Stack, Text } from "@/components/layout/primitives";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <Stack gap="6">
      <PageHeader title="Mi perfil" description="Datos de la cuenta y seguridad." />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
        </CardHeader>
        <CardContent>
          <Grid as="dl" gap="4" cols={{ sm: 2 }}>
            <Stack>
              <Text as="dt" size="xs" tone="muted">Nombre</Text>
              <Text as="dd" weight="medium">{user.nombre}</Text>
            </Stack>
            <Stack>
              <Text as="dt" size="xs" tone="muted">Email</Text>
              <Text as="dd" weight="medium">{user.email}</Text>
            </Stack>
            <Stack>
              <Text as="dt" size="xs" tone="muted">Rol</Text>
              <Text as="dd">
                <Badge variant={user.rol === "admin" ? "default" : "secondary"}>
                  {user.rol === "admin" ? "Administrador" : "Vendedor"}
                </Badge>
              </Text>
            </Stack>
            <Stack>
              <Text as="dt" size="xs" tone="muted">Estado</Text>
              <Text as="dd" weight="medium">{user.activo ? "Activo" : "Inactivo"}</Text>
            </Stack>
          </Grid>
        </CardContent>
      </Card>

      <PasswordForm />
    </Stack>
  );
}
