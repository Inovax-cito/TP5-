# TP5 · 2º parcial — Prompts para Claude en VS Code

Pegá los prompts **en orden**, uno por vez. Antes de pasar al siguiente, probá que lo anterior funcione.
Marcá con `[x]` los que ya hiciste. Cada prompt termina con commit + push para que quede historial en GitHub.

> Entrega: **domingo 22/11/2026, 23:59 hs**.
> Repositorio: https://github.com/Inovax-cito/TP5-.git
> Carpeta: `C:\Users\user\Desktop\TP5`

---

## Hito 0 — Preparación

- [ ] **0. Conectar la carpeta con GitHub**
```
Estoy en C:\Users\user\Desktop\TP5. Inicializá git en esta carpeta (rama main) y conectala como origin a https://github.com/Inovax-cito/TP5-.git. Mové requerimientos.md y pantallas.html a una carpeta docs/. Si la carpeta "TP5 Codigo" está vacía, borrala: el proyecto va a vivir en la raíz. Creá un .gitignore para Next.js que excluya node_modules, .next, .env, .env*.local y los archivos de base SQLite locales (*.db, *.db-journal). Hacé el primer commit "chore: estructura inicial" y push a main. Si el remoto ya tiene contenido, avisame antes de forzar nada.
```

- [ ] **1. Crear el proyecto y el CLAUDE.md**
```
Leé docs/requerimientos.md completo. Creá en la raíz de esta carpeta un proyecto Next.js con TypeScript, App Router, Tailwind y ESLint, usando pnpm (si create-next-app se queja por la carpeta no vacía, crealo en una temporal y mové los archivos). Inicializá shadcn/ui. Instalá: drizzle-orm, @libsql/client, drizzle-kit, zod, bcryptjs, jose, chart.js, react-chartjs-2, sonner. Agregá los scripts db:generate, db:migrate, db:seed y dev para que funcionen exactamente los comandos de la sección 9 (pnpm install, cp .env.example .env, pnpm run db:migrate, pnpm run db:seed, pnpm run dev). Creá .env.example con DATABASE_URL=file:local.db, DATABASE_AUTH_TOKEN vacío y SESSION_SECRET.
Además creá un CLAUDE.md en la raíz que resuma las reglas que siempre hay que respetar: arquitectura en capas de la sección 10 (las reglas de negocio solo en servicios), importes en centavos enteros, bajas lógicas, moverStock() como única función que cambia existencia, formato de errores de la 11.1, comentarios que citen el RF o la regla, estilos solo con Tailwind + shadcn, sin etiquetas HTML sueltas en las páginas. Commit y push.
```

## Hito 1 — Base y productos (RF-U, RF-P)

- [ ] **2. Esquema de base de datos**
```
Según la sección 7 de docs/requerimientos.md, creá el esquema Drizzle con las 9 tablas (usuarios, categorias, productos, movimientos_stock, clientes, facturas, factura_items, pagos, movimientos_cuenta), con id, fecha de creación, importes en centavos enteros, índices únicos (email, nombre de categoría, código de producto, tipo+número de documento, punto de venta+número de factura, número de recibo) y claves foráneas. Configurá la conexión con @libsql/client para que use SQLite local en desarrollo y Turso en producción según DATABASE_URL/DATABASE_AUTH_TOKEN. Configurá drizzle.config.ts, generá la migración y corré db:migrate para probar. Commit y push.
```

- [ ] **3. Infraestructura común (errores, formatos, envoltorios)**
```
Según las secciones 10.3, 10.4, 10.6 y 11.1/11.8, creá la base común:
- ApiError(status, code, message, details) con todos los códigos de la 11.8.
- Un módulo único de formatos: moneda "$ 12.345,50" desde centavos, fechas dd/mm/aaaa, hora de Argentina, documento, numeración 0001-00000001 y recibos R 0001-00000001.
- Un helper de paginación (page, pageSize por defecto 20, máximo 100, respuesta {data, page, pageSize, total}).
- El envoltorio de Route Handlers (exige sesión, lee params y JSON, convierte errores al formato estándar, nunca filtra el detalle de un error 500) y el envoltorio de Server Actions que devuelve {ok, data} o {ok:false, error}.
- Carpeta de esquemas Zod compartidos cliente/servidor, con .strict() en los de edición.
Dejá la sesión como interfaz por ahora si todavía no existe. Commit y push.
```

- [ ] **4. Autenticación y sesión**
```
Implementá RF-U1, RF-U2, RF-U3 y RF-U5 según las secciones 10.5 y 11.3: contraseñas con bcrypt, sesión en cookie firmada (jose) httpOnly y SameSite=Lax, el usuario se resuelve contra la base en cada pedido (si está inactivo pierde acceso). Servicio de autenticación y las rutas POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me, PUT /api/auth/password, con los códigos CREDENCIALES_INVALIDAS (mismo mensaje en los 3 casos) y CONTRASENA_ACTUAL_INCORRECTA. Proxy de Next.js (proxy.ts o middleware según la versión) que redirige a /login si falta la cookie. Página /login con shadcn fuera del layout principal, y página /perfil para cambiar la contraseña. Un seed mínimo con un admin y un vendedor para poder entrar. Commit y push.
```

- [ ] **5. Layout y componentes reutilizables**
```
Según las secciones 4, 8 y 10.6, armá el layout del sistema (route group) con panel lateral fijo de 5 módulos (Inicio, Ventas, Productos, Clientes, Usuarios), módulo activo resaltado, colapsado en un menú (Sheet) en pantallas chicas desde 360 px, y barra superior con el usuario conectado y botón Salir. Usuarios solo visible para admin. Creá una identidad visual propia y consistente (no copies docs/pantallas.html, solo usalo como referencia de contenido). Creá las primitivas de maquetación (Stack, Inline, Grid, Text, Title) y los componentes repetidos: encabezado de página, estados de carga/vacío/error, diálogo de confirmación para acciones irreversibles, campo con etiqueta y error, campo de importe en pesos, insignias de estado, paginador, avisos con sonner y un hook común de formularios (errores de Zod primero, luego del servidor, estado de envío y aviso). Commit y push.
```

- [ ] **6. Usuarios**
```
Implementá RF-U4 y RF-U5 (sección 11.3): servicio de usuarios (verifica rol admin, responde 403 SIN_PERMISO al vendedor), rutas GET/POST /api/usuarios, PATCH /api/usuarios/[id] con OPERACION_SOBRE_SI_MISMO y EMAIL_DUPLICADO, y POST /api/usuarios/[id]/reset-password que devuelve la contraseña temporal una sola vez. Pantalla /usuarios con listado, búsqueda en la URL, alta y edición en modal, desactivar con confirmación y restablecer contraseña. Commit y push.
```

- [ ] **7. Categorías**
```
Implementá RF-P7 (sección 11.4): servicio de categorías, GET/POST /api/categorias y PATCH /api/categorias/[id] con NOMBRE_DUPLICADO y CATEGORIA_EN_USO. Pantalla /productos/categorias con alta, edición y baja lógica (solo admin edita). Commit y push.
```

- [ ] **8. Stock: moverStock()**
```
Implementá el servicio de stock según la sección 10.2 y la regla 2: una única función moverStock() que actualiza la existencia con UPDATE ... WHERE id = ? AND existencia >= ? (para egresos/ventas), aborta con STOCK_INSUFICIENTE si no modificó filas, y graba el movimiento con cantidad con signo, existencia resultante, motivo, usuario y factura opcional, dentro de la transacción que reciba. Ninguna otra parte del código puede tocar la columna existencia. Rutas GET y POST /api/productos/[id]/movimientos (POST solo admin, motivos válidos de la 11.4) y GET /api/movimientos-stock con filtros productoId, tipo, desde, hasta y paginación. Commit y push.
```

- [ ] **9. Productos: catálogo, alta, edición y baja**
```
Implementá RF-P1, RF-P2 y RF-P3 (sección 11.4): servicio de productos y rutas GET/POST /api/productos, GET/PATCH /api/productos/[id]. existencia no se acepta en POST ni PATCH (422); stockInicial opcional crea un ingreso "Stock inicial" usando moverStock(); CODIGO_DUPLICADO; bajoMinimo calculado; activo=todos solo para admin. Pantalla /productos con listado paginado, búsqueda por código o descripción, filtro por categoría y por bajo mínimo (todo en la URL), marca visible de bajo mínimo, alta/edición en modal y baja lógica con confirmación (solo admin). Commit y push.
```

- [ ] **10. Ficha de producto y movimientos**
```
Implementá RF-P4, RF-P5 y RF-P6: página /productos/[id] con los datos del producto y una pestaña "Existencias" con el historial de movimientos (fecha, tipo, cantidad, existencia resultante, usuario y referencia a factura cuando haya). Botones de Ingreso y Egreso de stock en modal (solo admin) con cantidad, motivo y observación, que llaman a moverStock() vía el servicio. Commit y push.
```

- [ ] **11. Primer despliegue (Turso + Vercel)**
```
Guiame paso a paso para publicar lo que tenemos: crear la base en Turso (CLI o web), obtener la URL y el token, correr las migraciones y el seed contra Turso, importar el repo https://github.com/Inovax-cito/TP5- en Vercel, cargar DATABASE_URL, DATABASE_AUTH_TOKEN y SESSION_SECRET como variables de entorno y desplegar. Verificá que el build no dependa de archivos locales. Decime qué comandos tengo que correr yo y cuáles podés correr vos.
```

## Hito 2 — Clientes (RF-C)

- [ ] **12. Servicio y API de clientes**
```
Implementá RF-C1, RF-C2, RF-C3 y RF-C7 (sección 11.5): servicio de clientes con saldo derivado siempre de movimientos_cuenta (débitos − créditos) y disponible según el límite. Rutas GET /api/clientes (q por nombre o documento ignorando puntos y guiones, conDeuda=true con totalAdeudado, orden=saldo|nombre, paginación), POST /api/clientes (DOCUMENTO_DUPLICADO), GET /api/clientes/[id] con ultimasFacturas (6), PATCH /api/clientes/[id] con SALDO_PENDIENTE. Endpoint GET /api/clientes/[id]/cuenta con saldo acumulado por renglón, desde/hasta y saldoAnterior. Commit y push.
```

- [ ] **13. Pantallas de clientes**
```
Pantalla /clientes con listado, búsqueda en la URL y saldo de cada cliente; alta y edición en modal (tipo DNI/CUIT, documento, nombre, domicilio, teléfono, email, habilitado cuenta corriente, límite de crédito opcional) con validación Zod compartida; baja lógica con confirmación. Página /clientes/[id] con los datos, saldo actual, últimas facturas y pestaña "Cuenta corriente" con movimientos cronológicos y saldo acumulado (RF-C3, RF-C4). Commit y push.
```

- [ ] **14. Pagos, recibos y saldos**
```
Implementá RF-C5 y RF-C6 (sección 11.5): servicio de pagos que en una transacción graba el pago con número de recibo correlativo propio (R 0001-00000001) y el crédito en la cuenta, con PAGO_SUPERA_DEUDA y CUENTA_CORRIENTE_NO_HABILITADA. Rutas POST /api/clientes/[id]/pagos y GET /api/pagos/[id]. Modal "Registrar pago" en la ficha del cliente (importe, medio efectivo/transferencia/tarjeta_debito, observación), vista imprimible del recibo, y página /clientes/saldos con clientes con deuda ordenados de mayor a menor y el total adeudado. Commit y push.
```

## Hito 3 — Ventas (RF-V)

- [ ] **15. Servicio de facturación (el más importante)**
```
Implementá el servicio emitirFactura según RF-V6 y la sección 11.6, siguiendo los 9 pasos en orden dentro de UNA transacción: validar, verificar cliente y cuenta corriente, verificar existencia, tomar precios del catálogo y calcular total en el servidor, validar monto recibido o límite de crédito, asignar número correlativo sin huecos al confirmar, grabar factura y renglones (descripción y precio copiados), descontar stock con moverStock() (movimiento tipo venta por renglón) y grabar el débito si es cuenta corriente. Errores STOCK_INSUFICIENTE (con details por producto), PRODUCTO_INACTIVO, CUENTA_CORRIENTE_NO_HABILITADA, LIMITE_CREDITO_EXCEDIDO, MONTO_INSUFICIENTE. Tarjeta: solo tipo, marca y últimos 4; un campo con el número completo da 422. Rutas POST /api/facturas, GET /api/facturas/proximo-numero, GET /api/facturas/[id]. Commit y push.
```

- [ ] **16. Nueva venta: comprador e ítems**
```
Pantalla /ventas/nueva (RF-V1 a RF-V4), en una sola pantalla. Comprador: por defecto Consumidor final; buscar cliente por nombre o documento; alta rápida en modal usando POST /api/clientes sin perder la venta en curso. Ítems: buscar producto por código o descripción, cantidad, renglones con descripción, cantidad, precio unitario y subtotal, modificar o quitar, sumar cantidad si el producto ya está, mostrar la existencia disponible y no permitir superarla. Total recalculado en cada cambio. Operable con teclado: buscar, Enter para agregar, atajo para pasar al pago. Commit y push.
```

- [ ] **17. Nueva venta: forma de pago y confirmación**
```
Completá /ventas/nueva con la forma de pago (RF-V5): Contado con monto recibido y vuelto; Tarjeta con débito/crédito, marca y últimos 4 dígitos (nunca el número completo); Cuenta corriente solo si el cliente está registrado y habilitado, mostrando saldo y disponible. Al confirmar llamá a POST /api/facturas, mostrá cada error del servidor de forma clara (por ejemplo, qué producto quedó sin stock) y al éxito redirigí al comprobante. Commit y push.
```

- [ ] **18. Comprobante imprimible**
```
Página /ventas/[id] (RF-V7): vista imprimible con datos del comercio, número, fecha y hora, vendedor, datos del comprador, detalle, total y forma de pago (vuelto o datos de tarjeta). Estilos de impresión con Tailwind (print:) y botón Imprimir. Si la factura está anulada, mostrar el estado, fecha, usuario y motivo. Commit y push.
```

- [ ] **19. Listado de facturas**
```
Implementá RF-V8: ruta GET /api/facturas con q (número o cliente), desde, hasta (en hora de Argentina), clienteId, vendedorId, forma, estado, paginación y totalEmitido. Pantalla /ventas con esos filtros en la URL, búsqueda por número, insignia de estado y enlace al detalle. Commit y push.
```

- [ ] **20. Anulación de facturas**
```
Implementá RF-V9 y regla 5: servicio y ruta POST /api/facturas/[id]/anulacion (solo admin, 403 al vendedor) que en una transacción marca la factura como anulada con motivo obligatorio, reingresa el stock con moverStock() (tipo anulación) y, si fue a cuenta corriente, graba un crédito. FACTURA_ANULADA si ya estaba anulada. Botón "Anular" en el detalle, solo para admin, con modal de motivo y confirmación. Commit y push.
```

- [ ] **21. Pruebas de consistencia**
```
Creá un script (pnpm run verificar) que compruebe la lista de control de la sección 10.8: (3) una operación compuesta que falla a mitad no deja datos parciales, (4) dos ventas simultáneas de la última unidad terminan con una sola factura, (5) la existencia de cada producto coincide con la suma de sus movimientos y el saldo de cada cliente con débitos − créditos, y (2) un vendedor recibe 403 en rutas de admin. Corrélo y corregí lo que falle. Commit y push.
```

## Hito 4 — Cierre

- [ ] **22. Tablero de inicio**
```
Implementá RF-T1 a RF-T3 según la sección 11.7: servicio y ruta GET /api/tablero (solo facturas emitidas, día y mes en hora de Argentina, ventasDiarias siempre con 30 elementos y 0 en días sin ventas, porFormaDePago y masVendidos del mes). Página / con tarjetas de indicadores (ventas del día y del mes, total adeudado, productos bajo mínimo), gráfico de líneas o barras de los últimos 30 días y gráfico por forma de pago con Chart.js + react-chartjs-2, tabla de los 5 más vendidos y enlace a productos para reponer. Commit y push.
```

- [ ] **23. Datos de prueba completos**
```
Reescribí el seed según las secciones 8 y 10.7, usando LOS MISMOS SERVICIOS de la aplicación (no inserts directos): 2 usuarios (admin y vendedor), 5 categorías, 30 productos con stock inicial como ingreso, 10 clientes (algunos con cuenta corriente y límite), 50 facturas repartidas en los últimos 30 días con las tres formas de pago, algunos pagos y al menos una anulación. Si los servicios necesitan recibir una fecha para cargar datos históricos, agregalo de forma controlada. Que db:seed sea repetible (limpia y recarga). Corrélo y después corré pnpm run verificar. Commit y push.
```

- [ ] **24. Revisión de interfaz**
```
Revisá toda la app contra la sección 8 y 10.6: consistencia de colores, tipografía y espaciado; uso desde 360 px; cada listado con estado de carga, vacío y error; cada operación con aviso; errores junto al campo; confirmación en anular/dar de baja/desactivar; formatos $ 12.345,50, dd/mm/aaaa y hora de Argentina usando solo el módulo de formatos; ninguna página con etiquetas HTML sueltas. Hacé una lista de lo que encuentres y corregilo. Commit y push.
```

- [ ] **25. Auditoría de arquitectura**
```
Auditá el código contra la sección 10 y la lista 10.8: ninguna ruta ni Server Action con reglas de negocio (solo llaman al servicio), cada función de servicio con el orden validar → permiso → reglas → resultado y con comentario que cite su RF o regla, existencia modificada solo en moverStock(), mismos esquemas Zod en formulario y servidor, ningún secreto en el repo. Pasame un informe y corregí los desvíos. Commit y push.
```

- [ ] **26. README final**
```
Escribí el README.md según la sección 12: descripción del sistema, integrantes (dejá marcadores para que complete los nombres), URL pública de Vercel, pasos de instalación (los 5 comandos de la sección 9), variables de entorno explicadas (y que .env.example esté al día), usuarios de prueba por rol con sus contraseñas, tecnologías usadas y cualquier decisión que cambie algo "sugerido". Probá clonar el repo en una carpeta temporal y levantarlo solo con esos 5 comandos. Commit y push.
```

- [ ] **27. Despliegue final y prueba de la demo**
```
Prepará el despliegue final: corré las migraciones y el seed contra Turso, verificá que Vercel tenga las variables correctas y redesplegá. Después dame un checklist para probar en la URL pública el guion de la defensa: venta a consumidor final en efectivo, venta a un cliente nuevo en cuenta corriente, pago de ese cliente y anulación de una factura, verificando stock y saldo después de cada paso.
```

- [ ] **28. Preparación para la defensa**
```
Explicame el proyecto como si me fueran a tomar la defensa: recorrido por las capas y carpetas, dónde vive cada regla de negocio de la sección 6, cómo funciona la transacción de la factura y moverStock(), y cómo responder cada punto de la lista 10.8. Después proponeme 3 cambios chicos como los que puede pedir el profesor (por ejemplo, un campo nuevo o una regla de validación) y guiame para hacer uno yo mismo.
```
