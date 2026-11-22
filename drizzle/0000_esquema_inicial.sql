CREATE TABLE `categorias` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`activa` integer DEFAULT true NOT NULL,
	`creado_en` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categorias_nombre_unique` ON `categorias` (`nombre`);--> statement-breakpoint
CREATE TABLE `clientes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tipo_doc` text NOT NULL,
	`nro_doc` text NOT NULL,
	`nombre` text NOT NULL,
	`domicilio` text,
	`telefono` text,
	`email` text,
	`cuenta_corriente` integer DEFAULT false NOT NULL,
	`limite_credito` integer,
	`activo` integer DEFAULT true NOT NULL,
	`creado_en` integer NOT NULL,
	CONSTRAINT "clientes_limite_no_negativo" CHECK("clientes"."limite_credito" IS NULL OR "clientes"."limite_credito" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clientes_documento_uq` ON `clientes` (`tipo_doc`,`nro_doc`);--> statement-breakpoint
CREATE INDEX `clientes_nombre_idx` ON `clientes` (`nombre`);--> statement-breakpoint
CREATE TABLE `factura_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`factura_id` integer NOT NULL,
	`producto_id` integer NOT NULL,
	`codigo` text NOT NULL,
	`descripcion` text NOT NULL,
	`cantidad` integer NOT NULL,
	`precio_unitario` integer NOT NULL,
	`subtotal` integer NOT NULL,
	`creado_en` integer NOT NULL,
	FOREIGN KEY (`factura_id`) REFERENCES `facturas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "factura_items_cantidad_positiva" CHECK("factura_items"."cantidad" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `factura_items_producto_uq` ON `factura_items` (`factura_id`,`producto_id`);--> statement-breakpoint
CREATE INDEX `factura_items_producto_idx` ON `factura_items` (`producto_id`);--> statement-breakpoint
CREATE TABLE `facturas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`punto_venta` integer DEFAULT 1 NOT NULL,
	`numero` integer NOT NULL,
	`fecha` integer NOT NULL,
	`cliente_id` integer,
	`usuario_id` integer NOT NULL,
	`total` integer NOT NULL,
	`forma_pago` text NOT NULL,
	`tarjeta_tipo` text,
	`tarjeta_marca` text,
	`tarjeta_ultimos4` text,
	`monto_recibido` integer,
	`estado` text DEFAULT 'emitida' NOT NULL,
	`motivo_anulacion` text,
	`anulada_en` integer,
	`anulada_por_id` integer,
	`creado_en` integer NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`anulada_por_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "facturas_total_no_negativo" CHECK("facturas"."total" >= 0),
	CONSTRAINT "facturas_ultimos4" CHECK("facturas"."tarjeta_ultimos4" IS NULL OR (length("facturas"."tarjeta_ultimos4") = 4 AND "facturas"."tarjeta_ultimos4" NOT GLOB '*[^0-9]*')),
	CONSTRAINT "facturas_cc_requiere_cliente" CHECK("facturas"."forma_pago" <> 'cuenta_corriente' OR "facturas"."cliente_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `facturas_numero_uq` ON `facturas` (`punto_venta`,`numero`);--> statement-breakpoint
CREATE INDEX `facturas_fecha_idx` ON `facturas` (`fecha`);--> statement-breakpoint
CREATE INDEX `facturas_cliente_idx` ON `facturas` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `facturas_usuario_idx` ON `facturas` (`usuario_id`);--> statement-breakpoint
CREATE TABLE `movimientos_cuenta` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`cliente_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`importe` integer NOT NULL,
	`fecha` integer NOT NULL,
	`descripcion` text NOT NULL,
	`factura_id` integer,
	`pago_id` integer,
	`creado_en` integer NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`factura_id`) REFERENCES `facturas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pago_id`) REFERENCES `pagos`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "movimientos_cuenta_importe_positivo" CHECK("movimientos_cuenta"."importe" > 0),
	CONSTRAINT "movimientos_cuenta_un_origen" CHECK(("movimientos_cuenta"."factura_id" IS NULL) <> ("movimientos_cuenta"."pago_id" IS NULL))
);
--> statement-breakpoint
CREATE INDEX `movimientos_cuenta_cliente_fecha_idx` ON `movimientos_cuenta` (`cliente_id`,`fecha`);--> statement-breakpoint
CREATE INDEX `movimientos_cuenta_factura_idx` ON `movimientos_cuenta` (`factura_id`);--> statement-breakpoint
CREATE INDEX `movimientos_cuenta_pago_idx` ON `movimientos_cuenta` (`pago_id`);--> statement-breakpoint
CREATE TABLE `movimientos_stock` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`producto_id` integer NOT NULL,
	`usuario_id` integer NOT NULL,
	`factura_id` integer,
	`tipo` text NOT NULL,
	`cantidad` integer NOT NULL,
	`existencia_resultante` integer NOT NULL,
	`motivo` text NOT NULL,
	`observacion` text,
	`fecha` integer NOT NULL,
	`creado_en` integer NOT NULL,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`factura_id`) REFERENCES `facturas`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "movimientos_stock_cantidad_no_cero" CHECK("movimientos_stock"."cantidad" <> 0),
	CONSTRAINT "movimientos_stock_resultante_no_negativa" CHECK("movimientos_stock"."existencia_resultante" >= 0)
);
--> statement-breakpoint
CREATE INDEX `movimientos_stock_producto_fecha_idx` ON `movimientos_stock` (`producto_id`,`fecha`);--> statement-breakpoint
CREATE INDEX `movimientos_stock_factura_idx` ON `movimientos_stock` (`factura_id`);--> statement-breakpoint
CREATE INDEX `movimientos_stock_fecha_idx` ON `movimientos_stock` (`fecha`);--> statement-breakpoint
CREATE TABLE `pagos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`punto_venta` integer DEFAULT 1 NOT NULL,
	`numero` integer NOT NULL,
	`fecha` integer NOT NULL,
	`cliente_id` integer NOT NULL,
	`usuario_id` integer NOT NULL,
	`importe` integer NOT NULL,
	`medio` text NOT NULL,
	`observacion` text,
	`creado_en` integer NOT NULL,
	FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "pagos_importe_positivo" CHECK("pagos"."importe" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pagos_recibo_uq` ON `pagos` (`punto_venta`,`numero`);--> statement-breakpoint
CREATE INDEX `pagos_cliente_idx` ON `pagos` (`cliente_id`);--> statement-breakpoint
CREATE TABLE `productos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`codigo` text NOT NULL,
	`descripcion` text NOT NULL,
	`categoria_id` integer NOT NULL,
	`precio` integer NOT NULL,
	`existencia` integer DEFAULT 0 NOT NULL,
	`stock_minimo` integer DEFAULT 0 NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`creado_en` integer NOT NULL,
	FOREIGN KEY (`categoria_id`) REFERENCES `categorias`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "productos_existencia_no_negativa" CHECK("productos"."existencia" >= 0),
	CONSTRAINT "productos_precio_no_negativo" CHECK("productos"."precio" >= 0),
	CONSTRAINT "productos_stock_minimo_no_negativo" CHECK("productos"."stock_minimo" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `productos_codigo_unique` ON `productos` (`codigo`);--> statement-breakpoint
CREATE INDEX `productos_categoria_idx` ON `productos` (`categoria_id`);--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`nombre` text NOT NULL,
	`password_hash` text NOT NULL,
	`rol` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	`creado_en` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unique` ON `usuarios` (`email`);