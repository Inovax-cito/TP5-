import { config } from "dotenv";

config();

import { db } from "../lib/db";
import { categorias, secuencias, usuarios, type AuthUser } from "../lib/db/schema";
import { hashPassword } from "../lib/auth/password";
import * as categoriasService from "../lib/services/categorias.service";
import * as productosService from "../lib/services/productos.service";
import * as clientesService from "../lib/services/clientes.service";
import * as facturasService from "../lib/services/facturas.service";
import * as pagosService from "../lib/services/pagos.service";
import { getSaldo } from "../lib/services/saldos";

/** Generador determinístico: los datos de prueba son siempre los mismos. */
let semilla = 20261117;
function rand() {
  semilla = (semilla * 1103515245 + 12345) & 0x7fffffff;
  return semilla / 0x7fffffff;
}
function entero(min: number, max: number) {
  return min + Math.floor(rand() * (max - min + 1));
}
function elegir<T>(lista: T[]): T {
  return lista[Math.floor(rand() * lista.length)];
}

const CATALOGO: Array<[string, string, number]> = [
  ["Herramientas", "Martillo carpintero 500 g", 1250000],
  ["Herramientas", "Destornillador plano 6 pulgadas", 480000],
  ["Herramientas", "Destornillador Phillips 8 pulgadas", 560000],
  ["Herramientas", "Pinza universal 200 mm", 890000],
  ["Herramientas", "Serrucho de mano 24 pulgadas", 2140000],
  ["Herramientas", "Nivel de burbuja 60 cm", 1670000],
  ["Eléctrica", "Cable unipolar 2,5 mm x 100 m", 4890000],
  ["Eléctrica", "Cable bipolar 1,5 mm x 100 m", 6120000],
  ["Eléctrica", "Interruptor simple 10 A", 340000],
  ["Eléctrica", "Enchufe macho 10 A", 290000],
  ["Eléctrica", "Tablero eléctrico 12 ramas", 18900000],
  ["Eléctrica", "Llave termomagnética 25 A", 2450000],
  ["Iluminación", "Lámpara LED 12 W", 320000],
  ["Iluminación", "Lámpara LED 18 W", 450000],
  ["Iluminación", "Reflectores LED 50 W", 2390000],
  ["Iluminación", "Tubo LED 18 W 120 cm", 890000],
  ["Iluminación", "Ampolleta incandescente 60 W", 210000],
  ["Iluminación", "Colgante de pared metálico", 1780000],
  ["Ferretería", "Tornillo tirafondo 5 x 50 (x100)", 1750000],
  ["Ferretería", "Clavo cabeza plana 2 pulgadas (x100)", 980000],
  ["Ferretería", "Cinta aisladora 20 m", 190000],
  ["Ferretería", "Cinta de enmascarar 50 m", 420000],
  ["Ferretería", "Pegamento universal 50 g", 680000],
  ["Ferretería", "Silicona neutra 300 ml", 1150000],
  ["Jardinería", "Manguera de jardín 15 m", 4590000],
  ["Jardinería", "Regadera plástica 10 L", 1290000],
  ["Jardinería", "Pala de jardín", 2180000],
  ["Jardinería", "Tijera de podar", 3450000],
  ["Jardinería", "Fertilizante líquido 1 L", 1560000],
  ["Jardinería", "Sustrato universal 20 kg", 3990000],
];

const CLIENTES = [
  ["Mariana López", "28.456.123", true],
  ["Carlos Ramírez", "31.220.987", true],
  ["Silvia Fernández", "24.118.456", true],
  ["Diego Martínez", "35.678.912", false],
  ["Laura Gómez", "27.890.123", true],
  ["Martín Juárez", "33.456.789", true],
  ["Ana Torres", "29.111.222", false],
  ["Pablo Ruiz", "30.555.444", true],
  ["Cecilia Acosta", "26.777.888", false],
  ["Fábrica Sur S.R.L.", "30-12345678-9", true],
] as const;

async function main() {
  const [existente] = await db.select({ id: usuarios.id }).from(usuarios).limit(1);
  if (existente) {
    console.log("Los datos de prueba ya están cargados. Borrá dev.db para volver a generarlos.");
    return;
  }

  console.log("Cargando datos iniciales...");

  await db.insert(secuencias).values([
    { tipo: "factura", ultimo: 0, puntoVenta: 1 },
    { tipo: "recibo", ultimo: 0, puntoVenta: 1 },
  ]);

  const adminHash = await hashPassword("admin1234");
  const vendedorHash = await hashPassword("vendedor1234");
  const [adminRow] = await db
    .insert(usuarios)
    .values({
      nombre: "Laura Méndez",
      email: "laura@ferreteria.test",
      passwordHash: adminHash,
      rol: "admin",
      activo: true,
    })
    .returning();
  const [vendedorRow] = await db
    .insert(usuarios)
    .values({
      nombre: "Pablo Ruiz",
      email: "pablo@ferreteria.test",
      passwordHash: vendedorHash,
      rol: "vendedor",
      activo: true,
    })
    .returning();

  const admin: AuthUser = {
    id: adminRow.id,
    nombre: adminRow.nombre,
    email: adminRow.email,
    rol: "admin",
    activo: true,
  };
  const vendedor: AuthUser = {
    id: vendedorRow.id,
    nombre: vendedorRow.nombre,
    email: vendedorRow.email,
    rol: "vendedor",
    activo: true,
  };

  const nombresCategorias = ["Herramientas", "Eléctrica", "Iluminación", "Ferretería", "Jardinería"];
  for (const nombre of nombresCategorias) {
    await categoriasService.crear(admin, { nombre });
  }
  const categoriasRows = await db.select().from(categorias);
  const categoriaPorNombre = new Map(categoriasRows.map((c) => [c.nombre, c.id]));

  const productosCreados = [];
  let contadorCodigos: Record<string, number> = {};
  for (const [categoria, descripcion, precio] of CATALOGO) {
    const prefijo = categoria.slice(0, 2).toUpperCase();
    contadorCodigos[prefijo] = (contadorCodigos[prefijo] ?? 0) + 1;
    const codigo = `${prefijo}-${String(contadorCodigos[prefijo]).padStart(3, "0")}`;
    // Algunos productos quedan bajo el mínimo a propósito: el tablero debe
    // mostrar información útil desde el primer arranque (RF-T1).
    const bajoMinimo = productosCreados.length < 4;
    const producto = await productosService.crear(admin, {
      codigo,
      descripcion,
      categoriaId: categoriaPorNombre.get(categoria)!,
      precio,
      stockMinimo: bajoMinimo ? 100 : entero(8, 20),
      stockInicial: bajoMinimo ? 80 : entero(80, 200),
    });
    productosCreados.push(producto);
  }
  console.log(`  ${productosCreados.length} productos creados.`);

  const clientesCreados = [];
  for (let indice = 0; indice < CLIENTES.length; indice++) {
    const [nombre, nroDoc, tieneCc] = CLIENTES[indice];
    const cliente = await clientesService.crear(admin, {
      tipoDoc: nroDoc.includes("-") ? "CUIT" : "DNI",
      nroDoc,
      nombre,
      domicilio: "Av. Principal 1234",
      telefono: "381 455-2210",
      email: `cliente${indice + 1}@correo.test`,
      cuentaCorriente: tieneCc,
      limiteCredito: tieneCc ? 100000000 : null,
    });
    clientesCreados.push(cliente);
  }
  console.log(`  ${clientesCreados.length} clientes creados.`);

  const conCc = clientesCreados.filter((c) => c.cuentaCorriente);
  const ahora = Date.now();
  let facturasCreadas = 0;

  for (let i = 0; i < 50; i++) {
    const cantidadItems = entero(1, 3);
    const elegidos = new Set<number>();
    while (elegidos.size < cantidadItems) {
      elegidos.add(elegir(productosCreados).id);
    }
    const items = [...elegidos].map((productoId) => ({ productoId, cantidad: entero(1, 4) }));

    const usarCc = rand() < 0.35 && conCc.length > 0;
    const cliente = usarCc
      ? elegir(conCc)
      : rand() < 0.55
        ? null
        : elegir(clientesCreados);

    const forma = usarCc ? "cuenta_corriente" : rand() < 0.6 ? "contado" : "tarjeta";
    const pago =
      forma === "contado"
        ? { forma: "contado" as const }
        : forma === "tarjeta"
          ? {
              forma: "tarjeta" as const,
              tarjeta: {
                tipo: elegir(["debito", "credito"] as const),
                marca: elegir(["Visa", "Mastercard", "American Express"]),
                ultimos4: String(entero(1000, 9999)),
              },
            }
          : { forma: "cuenta_corriente" as const };

    // Las primeras facturas son de hoy: el indicador "Ventas del día" no arranca en 0.
    const diasAtras = i < 3 ? 0 : entero(0, 29);
    const horasAtras = i < 3 ? entero(0, 3) : entero(0, 10);
    const fecha = new Date(ahora - diasAtras * 86400000 - horasAtras * 3600000);

    await facturasService.emitir(
      i % 3 === 0 ? admin : vendedor,
      { clienteId: cliente?.id ?? null, items, pago },
      { fecha },
    );
    facturasCreadas++;
  }
  console.log(`  ${facturasCreadas} facturas creadas.`);

  let pagosCreados = 0;
  for (const cliente of clientesCreados) {
    const saldo = await getSaldo(cliente.id);
    if (saldo > 0) {
      await pagosService.registrar(
        vendedor,
        cliente.id,
        {
          importe: Math.max(10000, Math.floor(saldo * 0.4)),
          medio: elegir(["efectivo", "transferencia", "tarjeta_debito"] as const),
          observacion: "Pago registrado en datos iniciales",
        },
        { fecha: new Date() },
      );
      pagosCreados++;
    }
  }
  console.log(`  ${pagosCreados} pagos creados.`);

  console.log("\nDatos iniciales listos:");
  console.log("  Admin:    laura@ferreteria.test / admin1234");
  console.log("  Vendedor: pablo@ferreteria.test / vendedor1234");
}

main().catch((error) => {
  console.error("Error al cargar datos iniciales:", error);
  process.exit(1);
});
