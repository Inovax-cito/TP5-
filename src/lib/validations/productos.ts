import { z } from "zod";
import { enteroNoNegativo, enteroPositivo, importe, imagenOpcional, texto, textoOpcional } from "./common";

/** RF-P2: la existencia NO se acepta; se carga con un movimiento (RF-P4). */
export const crearProductoSchema = z
  .object({
    codigo: texto("Código"),
    descripcion: texto("Descripción"),
    imagen: imagenOpcional(),
    categoriaId: enteroPositivo("Categoría"),
    precio: importe("Precio"),
    stockMinimo: enteroNoNegativo("Stock mínimo").default(0),
    stockInicial: enteroNoNegativo("Stock inicial").optional(),
  })
  .strict();

export const actualizarProductoSchema = z
  .object({
    codigo: texto("Código").optional(),
    descripcion: texto("Descripción").optional(),
    imagen: imagenOpcional(),
    categoriaId: enteroPositivo("Categoría").optional(),
    precio: importe("Precio").optional(),
    stockMinimo: enteroNoNegativo("Stock mínimo").optional(),
    activo: z.boolean({ error: "Activo debe ser verdadero o falso." }).optional(),
  })
  .strict();

const MOTIVOS_INGRESO = ["Reposición", "Stock inicial", "Devolución de cliente"] as const;
const MOTIVOS_EGRESO = ["Rotura", "Vencimiento", "Ajuste de inventario", "Uso interno"] as const;

/** RF-P4 / RF-P5 */
export const movimientoStockSchema = z
  .object({
    tipo: z.enum(["ingreso", "egreso"], { error: "Seleccioná ingreso o egreso." }),
    cantidad: enteroPositivo("Cantidad"),
    motivo: texto("Motivo"),
    observacion: textoOpcional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const permitidos: readonly string[] = value.tipo === "ingreso" ? MOTIVOS_INGRESO : MOTIVOS_EGRESO;
    if (!permitidos.includes(value.motivo)) {
      ctx.addIssue({
        code: "custom",
        path: ["motivo"],
        message: `Para ${value.tipo}, el motivo debe ser: ${permitidos.join(", ")}.`,
      });
    }
  });
