# Sistema de Gestión Comercial

Aplicación full stack para un comercio minorista: factura ventas, controla existencias y lleva la cuenta corriente de los clientes. Incluye autenticación con roles, tablero con gráficos y una API REST completa.

**Stack:** TypeScript · Next.js 16 (App Router) · React 19 · Tailwind CSS · shadcn/ui · Chart.js + react-chartjs-2 · Drizzle ORM · SQLite local / Turso en producción · Zod · bcryptjs · jose (sesión JWT en cookie firmada httpOnly).

---

## Integrantes y URL pública

| Legajo | Integrante |
| --- | --- |
| `55555` | Nombre Apellido |
| `55556` | Nombre Apellido |
| `55557` | Nombre Apellido |

> Reemplazar los legajos y nombres de ejemplo por los reales. Aviso por WhatsApp: *"El grupo N lo formamos 55555, 55556 y 55557"*.

- **URL pública:** `https://<proyecto>.vercel.app` (pendiente de publicación).
- **Repositorio GitHub:** `https://github.com/<usuario>/<repo>` (pendiente: crear el repo y configurar el remote).

El despliegue real a Vercel/Turso **no se ejecutó**; la sección [Despliegue](#despliegue-vercel--turso) describe los pasos y las variables necesarias. Para ensayar la defensa, ver [DEFENSA.md](./DEFENSA.md).

---

## Puesta en marcha local

Requiere **Node.js 20+** y **pnpm 10** (`corepack enable` o instalar con `npm i -g pnpm@10.20.0`).

```bash
pnpm install
cp .env.example .env
pnpm run db:migrate
pnpm run img:generate
pnpm run db:seed
pnpm run dev
```

Abrir <http://localhost:3000>. La página `/login` es la única pública: todo lo demás redirige a login si no hay sesión válida.

> En shells nuevos de Windows puede hacer falta agregar pnpm al PATH:
> `$env:PATH = "$env:LOCALAPPDATA\npm-global;$env:PATH";`

### Usuarios de prueba

| Rol | Email | Contraseña |
| --- | --- | --- |
| Administrador | `laura@ferreteria.test` | `admin1234` |
| Vendedor | `pablo@ferreteria.test` | `vendedor1234` |

El seed crea además **5 categorías, 30 productos, 10 clientes, 50 facturas repartidas en los últimos 30 días** y varios pagos. Las facturas y los pagos se generan llamando a los **mismos servicios** que usa la aplicación, por lo que stock, saldos y numeración ya cumplen todas las reglas de negocio.

Cada producto tiene una miniatura SVG en `public/productos/<codigo>.svg` (`pnpm run img:generate` las regenera) y el campo `imagen` de la tabla `productos` guarda su ruta o una URL `http(s)`. Se muestran en el catálogo, en la vista previa de cada categoría, en la ficha del producto y al buscar productos para una venta. Desde el formulario de producto se puede reemplazar la imagen por cualquier URL pública; si no carga, se muestra un ícono de respaldo.

### Comandos útiles

| Comando | Uso |
| --- | --- |
| `pnpm run dev` | Servidor de desarrollo |
| `pnpm run build` / `pnpm run start` | Build de producción y servidor |
| `pnpm run typecheck` | Verificación de tipos (sin emitir archivos) |
| `pnpm run img:generate` | Regenerar las 30 miniaturas SVG de los productos |
| `pnpm run db:generate` | Generar una migración nueva con drizzle-kit |
| `pnpm run db:migrate` | Aplicar migraciones a la base configurada en `DATABASE_URL` |
| `pnpm run db:seed` | Cargar datos de prueba (verifica que la base esté vacía) |
| `pnpm run db:verify` | Comprobar invariantes: existencia = Σ movimientos, sin stock negativo y saldo total |
| `pnpm run db:studio` | Explorar la base con Drizzle Studio |

---

## Variables de entorno

Copiar `.env.example` como `.env` y ajustar:

| Variable | Desarrollo local | Producción (Turso + Vercel) |
| --- | --- | --- |
| `DATABASE_URL` | `file:./dev.db` | `libsql://<db>.turso.io` |
| `DATABASE_AUTH_TOKEN` | `""` (vacío) | Token de acceso de Turso |
| `SESSION_SECRET` | Texto aleatorio de 32+ caracteres | Secreto distinto, guardado en Vercel |
| `NOMBRE_COMERCIO` | Nombre del comercio | Igual o el correspondiente |
| `DIRECCION_COMERCIO` | Dirección del comercio | Igual o la correspondiente |
| `TELEFONO_COMERCIO` | Teléfono del comercio | Igual o el correspondiente |
| `CUIT_COMERCIO` | CUIT del comercio | Igual o el correspondiente |

Generar el secreto de sesión con `openssl rand -base64 32`. Ningún secreto se commitea: `.env` está ignorado por Git.

---

## Funcionalidades

### Módulos y rutas

| Módulo | Rutas | Rol |
| --- | --- | --- |
| Inicio | `/` | Ambos |
| Ventas | `/ventas/nueva`, `/ventas`, `/ventas/[id]` | Ambos (anular: solo admin) |
| Productos | `/productos`, `/productos/[id]`, `/productos/movimientos`, `/productos/categorias` | Ambos (editar: solo admin) |
| Clientes | `/clientes`, `/clientes/[id]`, `/clientes/saldos` | Ambos |
| Usuarios | `/usuarios` | Solo administrador |
| Cuenta | `/login`, `/perfil` | Público / ambos |

Todas las pantallas comparten el layout con panel lateral y barra superior; el panel se colapsa en un menú en pantallas chicas. Facturas y recibos tienen vista imprimible.

### Cobertura de requerimientos funcionales

- **Ventas (RF-V1–V9):** pantalla única de comprador / ítems / pago; consumidor final por defecto; alta rápida de cliente sin perder la venta; búsqueda de productos con agregado por Enter; existencia visible y bloqueo al superarla; contado con vuelto, tarjeta (solo últimos 4 dígitos) y cuenta corriente con límite; emisión atómica con precio congelado; comprobante imprimible; filtros y paginado; anulación administrativa con motivo que revierte stock y saldo.
- **Productos (RF-P1–P7):** catálogo paginado con filtros y aviso de stock mínimo; alta y edición sin editar existencia a mano; baja lógica; ingresos y egresos con motivo; historial con existencia resultante, usuario y referencia a factura; categorías.
- **Clientes (RF-C1–C7):** búsqueda por nombre o documento (ignorando puntos y guiones); alta y edición; ficha con saldo y últimas facturas; cuenta corriente con saldo acumulado; pagos con recibo numerado e imprimible; saldos ordenados; baja lógica.
- **Usuarios y acceso (RF-U1–U5):** login con contraseña hasheada; cookie firmada httpOnly y SameSite=Lax; usuario resuelto contra la base en cada pedido; roles admin/vendedor; alta, edición, desactivación y restablecimiento de contraseña; cada usuario cambia la suya en `/perfil`.
- **Inicio (RF-T1–T3):** indicadores del día y del mes, deuda total, productos bajo mínimo; gráficos de 30 días y forma de pago con Chart.js; top 5 de productos más vendidos.

---

## Arquitectura

La regla central es: **cada regla de negocio vive en un único lugar, la capa de servicios**.

```
src/
├── app/
│   ├── (app)/                 # Páginas protegidas (layout con sidebar + topbar)
│   ├── api/                   # 31 Route Handlers (adaptadores finos)
│   ├── login/                 # Única página pública
│   ├── layout.tsx             # Root layout, fuentes y Toaster
│   └── globals.css            # Tailwind + tokens de color + estilos de impresión
├── components/
│   ├── ui/                    # Primitivas shadcn/ui
│   ├── common/                # Encabezado, campos, estados, paginación, confirmación
│   ├── dashboard/             # Gráficos Chart.js
│   ├── productos/             # Catálogo, stock y categorías
│   ├── clientes/              # Altas, pagos y recibos
│   ├── ventas/                # Carrito de venta y anulación
│   ├── usuarios/              # Gestión de accesos
│   └── perfil/                # Cambio de contraseña
├── lib/
│   ├── db/                    # Esquema Drizzle, conexión libSQL y migrador
│   ├── services/              # Reglas de negocio y transacciones
│   ├── validations/           # Esquemas Zod compartidos cliente/servidor
│   ├── auth/                  # Password, token y sesión
│   ├── api/                   # withApi, respuestas y paginación
│   ├── client/                # Adaptador fetch para componentes cliente
│   └── format.ts              # Única fuente de formateo de moneda/fecha/número
├── hooks/use-api-mutation.ts  # Hook común: errores por campo + avisos
├── proxy.ts                   # Barrera 1: redirección/401 sin cookie válida
└── scripts/                   # seed.ts y verify.ts
```

### Puntos clave del diseño

- **Servicios:** reciben el usuario autenticado y datos sin validar; validan con Zod, verifican permisos, aplican reglas, abren transacciones y devuelven la forma pública. Cada función cita el RF o la regla que implementa.
- **Stock:** `moverStock()` es el **único** lugar que cambia `existencia`, con `UPDATE ... WHERE existencia >= ?` y movimiento en la misma transacción. Venta, anulación, ingreso y egreso lo llaman.
- **Saldos:** `saldoExpr` (débitos − créditos) es la única fuente de verdad. Un pago nunca supera la deuda; una venta a cuenta respeta el límite de crédito.
- **Numeración:** secuencias independientes para facturas (`0001-00000001`) y recibos. El número se asigna al confirmar, nunca al empezar la venta.
- **Importes:** enteros en centavos en la base y en la API; se muestran como `$ 12.345,50`. Fechas ISO UTC en la API; filtros por día interpretados en hora de Argentina.
- **Errores:** toda falla sale como `{ "error": { "code", "message", "details?" } }` desde un único `ApiError`.
- **Protección:** tres barreras — `proxy.ts`, `getCurrentUser()` en páginas y `requireAuth()`/`requireAdmin()` en servicios. Ocultar botones nunca reemplaza al permiso del servidor.

---

## API REST

Base: `/api`. JSON, camelCase, paginación con `page` (desde 1) y `pageSize` (20 por defecto, máximo 100). Las respuestas paginadas llevan `{ data, page, pageSize, total }`.

| Método | Ruta | Rol |
| --- | --- | --- |
| POST | `/api/auth/login` | Público |
| POST | `/api/auth/logout` | Ambos |
| GET | `/api/auth/me` | Ambos |
| PUT | `/api/auth/password` | Ambos |
| GET / POST | `/api/usuarios` | Admin |
| PATCH | `/api/usuarios/{id}` | Admin |
| POST | `/api/usuarios/{id}/reset-password` | Admin |
| GET | `/api/categorias` | Ambos |
| POST | `/api/categorias` | Admin |
| PATCH | `/api/categorias/{id}` | Admin |
| GET | `/api/productos` | Ambos |
| GET | `/api/productos/{id}` | Ambos |
| POST | `/api/productos` | Admin |
| PATCH | `/api/productos/{id}` | Admin |
| GET / POST | `/api/productos/{id}/movimientos` | Ambos / Admin |
| GET | `/api/movimientos-stock` | Ambos |
| GET / POST | `/api/clientes` | Ambos |
| GET / PATCH | `/api/clientes/{id}` | Ambos |
| GET | `/api/clientes/{id}/cuenta` | Ambos |
| POST | `/api/clientes/{id}/pagos` | Ambos |
| GET | `/api/pagos/{id}` | Ambos |
| GET / POST | `/api/facturas` | Ambos |
| GET | `/api/facturas/{id}` | Ambos |
| GET | `/api/facturas/proximo-numero` | Ambos |
| POST | `/api/facturas/{id}/anulacion` | Admin |
| GET | `/api/tablero` | Ambos |

Son 31 operaciones en total. Las reglas y los formatos de request/response están documentados en el enunciado (sección 11) y se pueden probar con cualquier cliente HTTP; para `POST /api/facturas` el servidor calcula precios, subtotales y total.

**Ejemplo de emisión:**

```bash
curl -X POST http://localhost:3000/api/facturas \
  -H 'Content-Type: application/json' \
  -b cookies.txt \
  -d '{"clienteId":null,"items":[{"productoId":1,"cantidad":2}],"pago":{"forma":"contado"}}'
```

---

## Despliegue (Vercel + Turso)

La aplicación está preparada para desplegarse; **no se ejecutó el deploy real**. Seguir este orden:

### 1. Base de datos en Turso

```bash
turso auth login
turso db create gestion-comercial
turso db show gestion-comercial --url        # → DATABASE_URL
turso db tokens create gestion-comercial     # → DATABASE_AUTH_TOKEN
```

### 2. Migrar y cargar datos de prueba contra Turso

Se ejecuta **una sola vez**, desde la máquina local, con las variables apuntando a Turso:

```bash
# bash / Git Bash
DATABASE_URL="libsql://<db>.turso.io" DATABASE_AUTH_TOKEN="<token>" pnpm run db:migrate
DATABASE_URL="libsql://<db>.turso.io" DATABASE_AUTH_TOKEN="<token>" pnpm run img:generate
DATABASE_URL="libsql://<db>.turso.io" DATABASE_AUTH_TOKEN="<token>" pnpm run db:seed
DATABASE_URL="libsql://<db>.turso.io" DATABASE_AUTH_TOKEN="<token>" pnpm run db:verify
```

En PowerShell:

```powershell
$env:DATABASE_URL = "libsql://<db>.turso.io"
$env:DATABASE_AUTH_TOKEN = "<token>"
pnpm run db:migrate
pnpm run db:seed
pnpm run db:verify
```

`img:generate` solo regenera los SVG de `public/productos`; están commiteados, así que no hace falta ejecutarlo en Vercel. `db:seed` detecta que ya hay datos y solo completa imágenes faltantes: no duplica facturas.

### 3. Proyecto en Vercel

1. Importar el repositorio en [Vercel](https://vercel.com/) con preset **Next.js** y package manager **pnpm**.
2. Cargar las variables de la [tabla anterior](#variables-de-entorno) en *Environment Variables* (Production y Preview):
   `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `SESSION_SECRET`, `NOMBRE_COMERCIO`, `DIRECCION_COMERCIO`, `TELEFONO_COMERCIO`, `CUIT_COMERCIO`.
3. Generar un `SESSION_SECRET` propio (distinto del de `.env.example`):

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

4. Hacer deploy. Vercel ejecuta `pnpm install` y `pnpm run build`. La app no necesita acceder a la base durante el build.
5. Reemplazar la URL pública en el encabezado de este README y pegarla en el grupo por WhatsApp.

### 4. Verificación en línea

- `/login` con ambos usuarios de prueba.
- `/`, `/productos`, `/productos/categorias` (miniaturas), `/ventas/nueva`.
- Recorrido completo de la [demo de defensa](./DEFENSA.md): venta en efectivo → venta en cuenta corriente → pago → anulación, controlando stock y saldo en cada paso.
- `pnpm run db:verify` contra Turso debe terminar con `OK: las reglas 1, 2 y 7 se cumplen.`

> La base local `dev.db` es solo desarrollo; no se incluye en el repositorio. El filesystem de Vercel es de solo lectura: por eso la base es remota en Turso y no se suben imágenes a disco.

### 5. Dominio propio (opcional)

La URL `https://<proyecto>.vercel.app` ya sirve para la entrega. Si además quieres un dominio propio:

1. **Comprar el dominio** en Vercel (*Domains → Buy a domain*) o en cualquier registrador (GoDaddy, Namecheap, etc.).
2. Usar un nombre con guión, no con guion bajo: `www.ferreteria-elmartillo.com`. El guion bajo (`_`) no es válido en nombres de host y puede romper el certificado TLS.
3. En Vercel: **Settings → Domains → Add Existing**, cargar `www.ferreteria-elmartillo.com` y también `ferreteria-elmartillo.com` (sin www). Vercel muestra los registros DNS exactos para ese proyecto.
4. En el registrador, configurar **uno** de estos dos métodos:
   - **Recomendado si no usás correo en ese dominio:** cambiar los *nameservers* por los que indica Vercel (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`, `ns3.vercel-dns.com`). Antes de hacerlo, copiar los registros DNS existentes (MX, TXT).
   - **Si querés conservar el DNS actual:** crear un registro `A` para `@` (apex) apuntando a `76.76.21.21` y un `CNAME` para `www` con el valor único que Vercel muestra en la pantalla (por ejemplo `xxxx.vercel-dns-017.com`). No copiar el CNAME de otro proyecto.
5. Configurar la redirección de `ferreteria-elmartillo.com` → `www.ferreteria-elmartillo.com` en *Settings → Domains*.
6. Esperar la propagación DNS (minutos, hasta 48 h) y verificar que Vercel muestre el dominio como *Valid Configuration* con certificado SSL activo. Vercel emite el certificado HTTPS automáticamente.
7. Reemplazar la **URL pública** del encabezado de este README por la definitiva.

> Si el dominio ya está en otra cuenta de Vercel, éste pedirá verificarlo con un registro TXT en `_vercel.ferreteria-elmartillo.com`.

---

## Verificación final

Antes de entregar:

```bash
pnpm run typecheck
pnpm run build
pnpm run db:verify
```

`db:verify` imprime los productos revisados, confirma que ninguno tiene stock negativo, muestra el saldo total y termina con `OK: las reglas 1, 2 y 7 se cumplen.`

Recorrido sugerido para la defensa en vivo: venta a consumidor final en efectivo → venta a cliente nuevo en cuenta corriente → pago del cliente → anulación de una factura, verificando stock y saldo después de cada paso desde la ficha del producto y la cuenta corriente.
