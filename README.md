# Sistema de gestión comercial

Trabajo Práctico N.º 5 — 2.º parcial de **Programación IV: Desarrollo Web**.

Aplicación web para un comercio minorista de un solo local: factura ventas (contado, tarjeta o cuenta corriente), controla las existencias del catálogo y lleva la cuenta corriente de los clientes, con usuarios por rol (administrador y vendedor) y un tablero de inicio con indicadores y gráficos.

> **Estado:** en desarrollo. Hito actual: 1 — Base y productos.

## Integrantes

| Nombre | Usuario de GitHub |
| --- | --- |
| _Completar_ | _Completar_ |
| _Completar_ | _Completar_ |
| _Completar_ | _Completar_ |

## URL pública

_Pendiente: se publica en Vercel con la base de datos en Turso._

## Tecnologías

| Capa | Tecnología |
| --- | --- |
| Lenguaje | TypeScript |
| Framework | Next.js 16 (App Router, Route Handlers para la API REST) |
| Estilos y componentes | Tailwind CSS v4 + shadcn/ui |
| Gráficos | Chart.js con react-chartjs-2 |
| Base de datos | SQLite en desarrollo · libSQL (Turso) en producción |
| Acceso a datos | Drizzle ORM + drizzle-kit (migraciones) |
| Validación | Zod (esquemas compartidos entre cliente y servidor) |
| Autenticación | Sesión propia en cookie `httpOnly` firmada con `jose`; contraseñas con `bcryptjs` |
| Avisos | sonner |
| Hosting | Vercel |

## Requisitos

- [Node.js](https://nodejs.org/) 20.12 o superior (probado con Node 24).
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`).

## Instalación y puesta en marcha

```bash
git clone https://github.com/Inovax-cito/TP5-.git
cd TP5-
pnpm install
cp .env.example .env
pnpm run db:migrate
pnpm run db:seed
pnpm run dev
```

La aplicación queda en <http://localhost:3000>.

> En Windows con PowerShell o CMD, en lugar de `cp` usá `copy .env.example .env`.

## Variables de entorno

Están documentadas en [`.env.example`](.env.example). El archivo `.env` nunca se sube al repositorio.

| Variable | Desarrollo | Producción |
| --- | --- | --- |
| `DATABASE_URL` | `file:local.db` (SQLite local) | URL de Turso: `libsql://<base>-<usuario>.turso.io` |
| `DATABASE_AUTH_TOKEN` | Vacío | Token de la base de Turso (`turso db tokens create <base>`) |
| `SESSION_SECRET` | Cualquier texto largo | Secreto aleatorio, por ejemplo `openssl rand -base64 32` |

## Scripts

| Comando | Qué hace |
| --- | --- |
| `pnpm run dev` | Levanta el servidor de desarrollo |
| `pnpm run build` / `pnpm run start` | Compila y sirve la versión de producción |
| `pnpm run lint` | Revisa el código con ESLint |
| `pnpm run db:generate` | Genera una migración a partir de los cambios en `src/db/schema.ts` |
| `pnpm run db:migrate` | Aplica las migraciones pendientes a la base configurada en `DATABASE_URL` |
| `pnpm run db:seed` | Carga los datos de prueba (usuarios, categorías, productos, clientes y facturas) |

## Usuarios de prueba

Los crea `pnpm run db:seed`.

| Rol | Email | Contraseña |
| --- | --- | --- |
| Administrador | _Pendiente_ | _Pendiente_ |
| Vendedor | _Pendiente_ | _Pendiente_ |

## Estructura del proyecto

```text
src/
├── app/          Páginas (App Router) y API REST en app/api/**/route.ts
├── components/   Componentes de interfaz (shadcn/ui en components/ui)
├── db/           Esquema Drizzle, conexión y datos iniciales
└── lib/          Utilidades compartidas
drizzle/          Migraciones generadas por drizzle-kit
```

La organización sigue una arquitectura en capas: **las reglas de negocio viven solo en los servicios**. Las rutas de la API y las Server Actions solo exigen la sesión, llaman a un servicio y traducen el resultado o el error. El detalle de las convenciones está en [`CLAUDE.md`](CLAUDE.md).

## Decisiones de diseño

- **Importes en centavos enteros.** Todos los importes se guardan y viajan por la API como enteros (`1250000` = $ 12.500,00), nunca como coma flotante.
- **Bajas lógicas.** Productos, clientes, usuarios y categorías se desactivan; nunca se borran.
- **Existencia y saldo consistentes.** La existencia de un producto solo cambia dentro de `moverStock()`, que la actualiza con una condición y graba el movimiento en la misma transacción. El saldo de un cliente se calcula siempre a partir de sus movimientos de cuenta corriente.
- **Restricciones en la base.** Además de las validaciones de los servicios, la base rechaza existencias negativas, documentos o códigos duplicados y claves foráneas inválidas.

## Publicación (Vercel + Turso)

1. Crear la base en Turso y obtener la URL y el token.
2. Con esas variables en el `.env` local, correr `pnpm run db:migrate` y `pnpm run db:seed` contra Turso.
3. Importar el repositorio en Vercel y cargar `DATABASE_URL`, `DATABASE_AUTH_TOKEN` y `SESSION_SECRET` en *Settings → Environment Variables*.
4. Desplegar.
