import { redirect } from "next/navigation";
import { PageHeader } from "@/components/common/page-header";
import { NuevaVentaForm } from "@/components/ventas/nueva-venta-form";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatMoney } from "@/lib/format";
import * as clientesService from "@/lib/services/clientes.service";
import * as facturasService from "@/lib/services/facturas.service";
import * as productosService from "@/lib/services/productos.service";
import { Stack } from "@/components/layout/primitives";

export default async function NuevaVentaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [productos, clientes, numero] = await Promise.all([
    productosService.listar(user, new URLSearchParams("pageSize=100")),
    clientesService.listar(user, new URLSearchParams("pageSize=100")),
    facturasService.proximoNumero(user),
  ]);

  return (
    <Stack gap="6">
      <PageHeader
        title="Nueva venta"
        description="Armá la factura, elegí el comprador y registrá el pago. El stock se descuenta al confirmar."
      />
      <NuevaVentaForm
        productos={productos.data.map((p) => ({
          id: p.id,
          codigo: p.codigo,
          descripcion: p.descripcion,
          precio: p.precio,
          existencia: p.existencia,
          categoria: p.categoria,
        }))}
        clientesIniciales={clientes.data.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          tipoDoc: c.tipoDoc,
          nroDoc: c.nroDoc,
          cuentaCorriente: c.cuentaCorriente,
          limiteCredito: c.limiteCredito,
          saldo: c.saldo,
          disponible: c.disponible,
        }))}
        proximoNumero={`Próxima: ${numero.numeroFormateado}`}
      />
    </Stack>
  );
}
