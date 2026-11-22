/** RF-V7: datos del comercio para el comprobante, siempre desde variables de entorno. */
export function getDatosComercio() {
  return {
    nombre: process.env.NOMBRE_COMERCIO?.trim() || "Gestión Comercial",
    direccion: process.env.DIRECCION_COMERCIO?.trim() ?? "",
    telefono: process.env.TELEFONO_COMERCIO?.trim() ?? "",
    cuit: process.env.CUIT_COMERCIO?.trim() ?? "",
  };
}
