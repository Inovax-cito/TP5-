# Guía de defensa

Material para practicar la defensa individual. Cada integrante debe poder **mostrar el código** y **hacer un cambio chico en vivo**.

---

## 1. Demo en vivo (10 minutos)

Usar el usuario administrador `laura@ferreteria.test` / `admin1234`. El vendedor `pablo@ferreteria.test` / `vendedor1234` sirve para mostrar que no puede anular ni cargar productos.

Antes de empezar, anotar en un papel la existencia de un producto (ficha `/productos/1`) y el saldo de un cliente con cuenta corriente (`/clientes/3`).

| Tiempo | Acción en la UI | Qué tiene que pasar |
| --- | --- | --- |
| 0:00–1:00 | Login y recorrida rápida del tablero `/`. | Indicadores, gráficos y top 5 con datos del seed. |
| 1:00–3:00 | **Venta a consumidor final con efectivo**: `/ventas/nueva` → buscar producto → cantidad → pestaña `Efectivo` → monto ≥ total → *Confirmar venta*. | Se muestra el número `0001-000000xx` y el comprobante. En `/productos/1` la existencia bajó exactamente la cantidad; en el historial aparece un movimiento `venta` referenciado a esa factura. |
| 3:00–5:00 | **Cliente nuevo en cuenta corriente**: en `/ventas/nueva` → *Dar de alta* → nombre, DNI, activar *Cuenta corriente*, límite (ej. `$ 500.000`) → agregar productos → forma de pago *Cuenta corriente* → confirmar. | El cliente queda creado y la factura queda como débito en su cuenta. En `/clientes/{id}` el saldo es igual al total de la factura. |
| 5:00–7:00 | **Pago del cliente**: desde la ficha del cliente → botón de pago → importe parcial → medio → confirmar. | Se genera recibo `0001-000000xx`, aparece un crédito y el saldo baja. Probar un importe mayor a la deuda: debe fallar con `PAGO_SUPERA_DEUDA` (422). |
| 7:00–9:00 | **Anulación**: abrir la factura de cuenta corriente desde `/ventas` → *Anular factura* → motivo. | La factura queda en estado *Anulada* (no se borra), el stock vuelve a subir con movimiento tipo `anulacion` y el débito en cuenta corriente se compensa con un crédito. |
| 9:00–10:00 | Verificación final. | `pnpm run db:verify` (o contra Turso) termina con `OK: las reglas 1, 2 y 7 se cumplen.` Repetir la misma demo con el vendedor: la opción de anular no está y la API devuelve 403. |

Si sobra tiempo, mostrar una venta con tarjeta (solo últimos 4 dígitos) y una baja lógica de producto.

---

## 2. Mapa código ↔ requerimiento

| Pregunta típica | Dónde mostrarlo |
| --- | --- |
| ¿Dónde se cambia la existencia? | `src/lib/services/stock.service.ts` → `moverStock()`. Es el **único** punto que hace `UPDATE productos SET existencia = existencia + ?`. |
| ¿Cómo se evita stock negativo y ventas simultáneas? | En `moverStock()`, el `UPDATE` lleva `WHERE existencia >= -cantidad` y corrige + graba el movimiento dentro de la misma transacción. Si otra venta se queda sin unidades, no actualiza ninguna fila y lanza `STOCK_INSUFICIENTE`. |
| ¿Dónde se confirma una factura de forma atómica? | `src/lib/services/facturas.service.ts` → `emitir()`, todo dentro de `db.transaction`: valida, calcula, reserva número, inserta factura + ítems, llama a `moverStock()` y genera el débito en cuenta corriente. Si algo falla, se revierte todo. |
| ¿Dónde se congelan los precios? | `facturas.service.ts` → `itemsCalculados`: copia `producto.precio` a `precioUnitario` y `subtotal` en `factura_items`. Cambiar el precio del catálogo después no altera la factura. |
| ¿Cómo se numera `0001-00000001`? | `src/lib/services/saldos.ts` → `nextSecuencia()`, con `UPDATE ... RETURNING` dentro de la transacción. Al anular se revierte, por eso no quedan huecos. |
| ¿Cómo se calcula el saldo? | `src/lib/services/saldos.ts` → `getSaldo()` / `saldoExpr()`: `suma(débitos) − suma(créditos)`. No se guarda un saldo denormalizado. |
| ¿Qué pasa si un pago supera la deuda? | `src/lib/services/pagos.service.ts` → `registrar()` consulta `getSaldo(clienteId, tx)` y lanza `PAGO_SUPERA_DEUDA` (422) antes de insertar. |
| ¿Qué hace la anulación? | `facturas.service.ts` → `anular()`: requiere admin, pide motivo, marca la factura como `anulada`, reingresa stock con `moverStock()` y registra un crédito si era cuenta corriente. |
| ¿Dónde se controlan los permisos? | `src/lib/auth/permissions.ts` → `requireAuth()` / `requireAdmin()`. Los **servicios** los llaman; ocultar botones en la UI no es la barrera de seguridad. |
| ¿Cómo se resuelve la sesión? | `src/lib/auth/session.ts` firma el JWT HS256 con `jose` en la cookie httpOnly `gc_sesion`; `current-user.ts` vuelve a leer el usuario de la BD en **cada** pedido. Un usuario dado de baja pierde el acceso aunque tenga cookie. |
| ¿Cómo entran las peticiones a la API? | `src/lib/api/with-api.ts` es el adaptador de las 31 rutas: exige sesión, parsea JSON y parámetros, llama a un servicio y traduce errores. |
| ¿Cómo son los errores? | `src/lib/errors.ts` define `ApiError` y la fábrica `err`. `with-api` los convierte a `{ error: { code, message, details? } }`. |
| ¿Dónde se validan los datos? | `src/lib/validations/*.ts` (Zod), compartidos entre formularios y servicios. `parseOrThrow()` lanza 422 con el detalle por campo. |
| ¿Dónde está el modelo de datos? | `src/lib/db/schema.ts` y las migraciones en `drizzle/`. Las reglas de negocio viven en `src/lib/services/`, no en los components. |
| ¿Por qué no se edita la existencia a mano? | `crearProductoSchema` y `actualizarProductoSchema` usan `.strict()` y no aceptan `existencia`; el alta usa `stockInicial` y lo convierte en movimiento `ingreso`. |
| ¿Cómo se generan los datos de prueba? | `src/scripts/seed.ts` llama a los **mismos servicios** que la app (no inserts directos) y `src/scripts/verify.ts` comprueba los invariantes. |

---

## 3. Cambios chicos para practicar

Hacerlos en la máquina propia, correr `pnpm run typecheck` y mostrar el resultado en la app.

1. **Cambiar el color principal.** `src/app/globals.css` → `--primary` y `--ring`. Recargar y mostrar botones/sidebar.
2. **Cambiar el stock mínimo por defecto al crear productos.** `src/lib/validations/productos.ts` → `stockMinimo: enteroNoNegativo("Stock mínimo").default(0)` por el valor nuevo. Crear un producto desde el modal y verificar el alta.
3. **Agregar una validación de teléfono.** `src/lib/validations/clientes.ts` → agregar un `.refine(...)` sobre `telefono` que solo valide el formato cuando el campo venga lleno (es opcional y puede ser `null`). Cargar un cliente con teléfono inválido desde `/clientes`: debe marcar el error al lado del campo.
4. **Agregar un campo nuevo (ej. `color` en categorías).** `schema.ts` + `pnpm run db:generate` + `pnpm run db:migrate` + `validations/categorias.ts` + `categorias.service.ts` + el modal de categorías. Mostrar la migración nueva y el campo funcionando.
5. **Cambiar el texto de marca.** `src/components/layout/sidebar-nav.tsx` y `src/app/layout.tsx` (metadata).

---

## 4. Checklist antes de defender

- [ ] `pnpm install`, `pnpm run db:migrate`, `pnpm run img:generate`, `pnpm run db:seed`, `pnpm run dev` funcionan desde cero con `dev.db` borrado.
- [ ] `pnpm run typecheck` y `pnpm run build` pasan.
- [ ] `pnpm run db:verify` termina con `OK: las reglas 1, 2 y 7 se cumplen.`
- [ ] La URL pública abre, con datos cargados en Turso.
- [ ] README con integrantes, legajos, repo y URL pública ya reemplazados.
- [ ] Cada integrante sabe explicar `moverStock`, `emitir`, `getSaldo`, `withApi` y `requireAdmin` sin mirar apuntes.
