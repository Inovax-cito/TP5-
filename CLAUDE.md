# CLAUDE.md — Sistema de gestión comercial (TP5, 2º parcial Programación IV)

La especificación completa está en `docs/requerimientos.md` (solo local, no se versiona). Ante cualquier duda, manda ese documento. Leé también `AGENTS.md`: esta versión de Next.js (16) tiene cambios respecto de versiones anteriores; consultá `node_modules/next/dist/docs/` antes de usar una API.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Drizzle ORM + drizzle-kit · libSQL (SQLite local `file:local.db`, Turso en producción) · Zod · bcryptjs · jose (cookie firmada) · Chart.js + react-chartjs-2 · sonner. Gestor de paquetes: **pnpm**.

Puesta en marcha (sección 9), siempre debe funcionar sin pasos extra:

```bash
pnpm install
cp .env.example .env
pnpm run db:migrate
pnpm run db:seed
pnpm run dev
```

Cambios de esquema: editar `src/db/schema.ts` → `pnpm run db:generate` → `pnpm run db:migrate`. Nunca editar a mano una migración ya aplicada.

## Reglas que siempre hay que respetar

### 1. Arquitectura en capas (sección 10)

**Cada regla de negocio vive en un único lugar: la capa de servicios.**

| Capa | Hace | No hace |
| --- | --- | --- |
| Acceso a datos (`src/db`) | Esquema, migraciones, conexión | Reglas de negocio |
| Servicios | Valida con Zod, verifica el rol, aplica reglas, abre transacciones, devuelve la forma pública de la API | Conocer HTTP, cookies o componentes |
| Adaptadores (Route Handlers `app/api/**/route.ts` y Server Actions) | Exigen sesión, leen params/cuerpo, llaman **un** servicio, traducen resultado/error | Repetir validaciones o reglas |
| Interfaz | Muestra datos, adelanta validaciones, avisa resultados | Reemplazar controles del servidor |

- Firma de cada función de servicio: recibe el **usuario autenticado** y los **datos sin validar**. Orden fijo: validar esquema → verificar permiso → aplicar reglas → devolver.
- Toda operación que toca más de una tabla va en **una transacción** (todo o nada).
- Rutas y Server Actions llaman a los **mismos** servicios. Si una lógica aparece en dos adaptadores, se mueve al servicio.
- El usuario se resuelve contra la base **en cada pedido**; el permiso lo decide el servicio (responde `403` aunque se llame la API directo). Ocultar un botón no es control de acceso.
- El seed crea facturas y pagos **usando los servicios** (10.7).

### 2. Importes en centavos enteros

- Todo importe se guarda, calcula y viaja por la API como **entero en centavos** (`1250000` = $ 12.500,00). Nunca `float`, nunca decimales en la API.
- Los precios, subtotales y total de una factura los calcula el servidor; el cliente solo manda productos y cantidades.
- Se muestran como `$ 12.345,50`, fechas `dd/mm/aaaa`, hora de Argentina. Todos los formatos salen de **un único módulo de formatos**; los componentes no formatean por su cuenta.

### 3. Bajas lógicas

- Productos, clientes, usuarios y categorías **nunca se borran**: se desactivan (`activo`/`activa = false`) vía `PATCH`. No hay `DELETE` para registros con historial.
- Las facturas nunca se borran ni se modifican: solo se anulan (regla 5).

### 4. `moverStock()` es la única función que cambia la existencia

- Ventas, anulaciones, ingresos y egresos llaman a `moverStock()`; ninguna otra función hace `UPDATE` de `existencia`.
- Actualiza con condición (`UPDATE productos SET existencia = existencia + ? WHERE id = ? AND existencia + ? >= 0`), aborta si no modificó filas (`409 STOCK_INSUFICIENTE`) y graba el movimiento con la existencia resultante en la **misma transacción** (reglas 1 y 2).
- `existencia` no se acepta en `POST`/`PATCH` de productos. Del mismo modo, el saldo del cliente se deriva de `movimientos_cuenta` (débitos − créditos), nunca se acepta como dato.

### 5. Formato de errores (sección 11.1 y 11.8)

Los servicios lanzan una única clase: `ApiError(status, code, message, details?)`. El envoltorio de rutas la convierte siempre a:

```json
{ "error": { "code": "VALIDACION", "message": "Hay campos con errores.", "details": [{ "campo": "codigo", "mensaje": "Es obligatorio." }] } }
```

- Usar solo los códigos de la tabla 11.8. `409` = choca con el estado de los datos; `422` = bien formado pero rompe una regla.
- Un error inesperado se loguea en el servidor y responde `500 ERROR_INTERNO` **sin detalle**.
- Server Actions devuelven `{ ok: true, data }` o `{ ok: false, error }` en vez de lanzar.
- JSON en camelCase; fechas ISO 8601 UTC; listados paginados `{ data, page, pageSize, total }` (`pageSize` por defecto 20, máximo 100).
- Esquemas Zod compartidos cliente/servidor; los de edición son `.strict()` (rechazan campos no previstos, p. ej. `existencia` o el número completo de tarjeta).

### 6. Comentarios que citen el requerimiento o la regla

Cada función de servicio (y toda lógica no trivial) lleva un comentario que cita lo que implementa: `// RF-V6 · reglas 1, 2 y 4: confirma la factura en una transacción`. Códigos: RF-V*, RF-P*, RF-C*, RF-U*, RF-T* (sección 5) y reglas 1–12 (sección 6).

### 7. Estilos solo con Tailwind + shadcn/ui

- Todo el estilo con clases de Tailwind; nada de CSS propio salvo los tokens de tema en `globals.css`. Nada de `style={{…}}`, CSS modules ni otras librerías de UI.
- Componentes de `@/components/ui` (shadcn; agregar con `pnpm dlx shadcn@latest add <componente>`). Avisos con `sonner`.
- Diseño propio y consistente: las pantallas de referencia definen contenido y flujos, **no** el aspecto visual.
- Usable desde 360 px; panel lateral colapsable en pantallas chicas.

### 8. Sin etiquetas HTML sueltas en las páginas

- Los archivos `page.tsx`/`layout.tsx` se arman solo con componentes de shadcn/ui, **primitivas de maquetación propias** (apilar, alinear, grilla, texto, título) y componentes del dominio. Nada de `<div>`, `<p>`, `<h1>`, `<span>`, `<table>` sueltos en las páginas; el HTML vive dentro de esos componentes.
- Lo repetido se resuelve una vez: encabezado de página, estados de carga/vacío/error, confirmación de acciones irreversibles, campo con etiqueta y error, campo de importe, insignias de estado, paginador.
- Páginas de lectura = Server Components que llaman servicios; búsqueda/filtros/paginado en la URL. Interactivos = Client Components chicos.

## Seguridad

Contraseñas con bcrypt; sesión en cookie `httpOnly` + `SameSite=Lax` firmada con `SESSION_SECRET`; secretos solo en variables de entorno, nunca en el repo (`.env` está en `.gitignore`; solo se versiona `.env.example`). De la tarjeta solo se guardan tipo, marca y últimos 4 dígitos (regla 9).
