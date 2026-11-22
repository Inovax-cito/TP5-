// Prueba de punta a punta de la API del TP5 (guion de la defensa + reglas de negocio).
const BASE = process.argv[2] || "http://localhost:3100";
let ok = 0, fail = 0;
const fallas = [];

function check(nombre, cond, extra) {
  if (cond) { ok++; console.log("  ✅ " + nombre); }
  else { fail++; fallas.push(nombre); console.log("  ❌ " + nombre + (extra !== undefined ? "  → " + JSON.stringify(extra).slice(0, 300) : "")); }
}

async function req(cookie, method, path, body) {
  const r = await fetch(BASE + path, {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    redirect: "manual",
  });
  let json = null;
  const txt = await r.text();
  try { json = txt ? JSON.parse(txt) : null; } catch { json = txt.slice(0, 200); }
  return { status: r.status, json, headers: r.headers };
}

async function login(email, password) {
  const r = await fetch(BASE + "/api/auth/login", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const set = r.headers.get("set-cookie") || "";
  return { status: r.status, cookie: set.split(";")[0], set, json: await r.json().catch(() => null) };
}

const code = (r) => r.json?.error?.code;

async function producto(c, id) { return (await req(c, "GET", `/api/productos/${id}`)).json; }
async function cliente(c, id) { return (await req(c, "GET", `/api/clientes/${id}`)).json; }

(async () => {
  console.log("\n== 1. Sesión y seguridad");
  check("Sin sesión GET /api/productos → 401", (await req(null, "GET", "/api/productos")).status === 401);
  const pagina = await fetch(BASE + "/productos", { redirect: "manual" });
  check("Sin sesión /productos redirige a /login", [302, 307, 308].includes(pagina.status) && (pagina.headers.get("location") || "").includes("/login"), pagina.status);
  const malo = await login("laura@ferreteria.test", "incorrecta");
  check("Login con contraseña mala → 401 CREDENCIALES_INVALIDAS", malo.status === 401 && malo.json?.error?.code === "CREDENCIALES_INVALIDAS", malo.json);
  const inexistente = await login("nadie@x.test", "algo12345");
  check("Email inexistente: mismo mensaje que contraseña mala", inexistente.json?.error?.message === malo.json?.error?.message);
  const adm = await login("laura@ferreteria.test", "admin1234");
  const ven = await login("pablo@ferreteria.test", "vendedor1234");
  check("Login admin 200", adm.status === 200 && adm.json?.rol === "admin", adm.json);
  check("Login vendedor 200", ven.status === 200 && ven.json?.rol === "vendedor", ven.json);
  check("Cookie httpOnly + SameSite=Lax", /httponly/i.test(adm.set) && /samesite=lax/i.test(adm.set), adm.set);
  check("Respuesta de login sin hash de contraseña", !JSON.stringify(adm.json).toLowerCase().includes("hash"));
  const A = adm.cookie, V = ven.cookie;
  check("GET /api/auth/me", (await req(V, "GET", "/api/auth/me")).json?.email === "pablo@ferreteria.test");
  check("Cookie falsificada → 401", (await req("session=abc.def.ghi", "GET", "/api/auth/me")).status === 401);
  check("JSON inválido → 400 JSON_INVALIDO", code(await req(A, "POST", "/api/categorias", "{mal json")) === "JSON_INVALIDO");

  console.log("\n== 2. Permisos por rol (vendedor llamando rutas de admin)");
  const cats = (await req(A, "GET", "/api/categorias")).json;
  const catId = (Array.isArray(cats) ? cats : cats.data)[0].id;
  for (const [m, p, b] of [
    ["GET", "/api/usuarios"],
    ["POST", "/api/productos", { codigo: "X-1", descripcion: "x", categoriaId: catId, precio: 100, stockMinimo: 1 }],
    ["POST", "/api/categorias", { nombre: "Hack" }],
    ["POST", "/api/productos/1/movimientos", { tipo: "ingreso", cantidad: 5, motivo: "Reposición" }],
    ["POST", "/api/facturas/1/anulacion", { motivo: "hack" }],
    ["POST", "/api/usuarios/1/reset-password"],
  ]) {
    const r = await req(V, m, p, b);
    check(`Vendedor ${m} ${p} → 403 SIN_PERMISO`, r.status === 403 && code(r) === "SIN_PERMISO", r);
  }

  console.log("\n== 3. Productos y stock");
  const sufijo = Date.now().toString().slice(-6);
  const np = await req(A, "POST", "/api/productos", { codigo: "TEST-" + sufijo, descripcion: "Producto de prueba", categoriaId: catId, precio: 150050, stockMinimo: 2, stockInicial: 10 });
  check("Alta producto con stockInicial → 201", np.status === 201 && np.json?.existencia === 10, np.json);
  const P = np.json.id;
  const dup = await req(A, "POST", "/api/productos", { codigo: "TEST-" + sufijo, descripcion: "dup", categoriaId: catId, precio: 1, stockMinimo: 1 });
  check("Código duplicado → 409 CODIGO_DUPLICADO", dup.status === 409 && code(dup) === "CODIGO_DUPLICADO", dup.json);
  const pe = await req(A, "PATCH", `/api/productos/${P}`, { existencia: 999 });
  check("PATCH con existencia → 422", pe.status === 422, pe.json);
  const egNeg = await req(A, "POST", `/api/productos/${P}/movimientos`, { tipo: "egreso", cantidad: 50, motivo: "Rotura" });
  check("Egreso que deja negativo → 409 STOCK_INSUFICIENTE", egNeg.status === 409 && code(egNeg) === "STOCK_INSUFICIENTE", egNeg.json);
  const egMot = await req(A, "POST", `/api/productos/${P}/movimientos`, { tipo: "egreso", cantidad: 1, motivo: "Inventado" });
  check("Egreso con motivo inválido → 422", egMot.status === 422, egMot.json);
  const eg = await req(A, "POST", `/api/productos/${P}/movimientos`, { tipo: "egreso", cantidad: 2, motivo: "Rotura" });
  check("Egreso válido → 201, cantidad -2, existencia 8", eg.status === 201 && eg.json?.cantidad === -2 && eg.json?.existenciaResultante === 8, eg.json);
  const pg = await req(A, "GET", "/api/productos?pageSize=1000");
  check("pageSize > 100 se rechaza o se limita", pg.status === 422 || (pg.json?.pageSize <= 100), { status: pg.status, ps: pg.json?.pageSize });

  console.log("\n== 4. Venta a consumidor final en efectivo");
  const prox = (await req(V, "GET", "/api/facturas/proximo-numero")).json?.numeroFormateado;
  check("Próximo número con formato 0001-00000000", /^\d{4}-\d{8}$/.test(prox || ""), prox);
  const f1 = await req(V, "POST", "/api/facturas", { clienteId: null, items: [{ productoId: P, cantidad: 3 }], pago: { forma: "contado", montoRecibido: 500000 } });
  check("Factura contado → 201", f1.status === 201, f1.json);
  check("Total calculado por el servidor (3 × 150050)", f1.json?.total === 450150, f1.json?.total);
  check("Vuelto = 49850", f1.json?.pago?.vuelto === 49850, f1.json?.pago);
  check("Número asignado = el informado como próximo", f1.json?.numeroFormateado === prox, [prox, f1.json?.numeroFormateado]);
  check("Stock descontado (8 → 5)", (await producto(V, P)).existencia === 5);
  const f1b = await req(V, "POST", "/api/facturas", { clienteId: null, items: [{ productoId: P, cantidad: 1 }], pago: { forma: "contado" } });
  check("Numeración correlativa sin huecos", f1b.json?.numero === f1.json?.numero + 1, [f1.json?.numero, f1b.json?.numero]);
  const mi = await req(V, "POST", "/api/facturas", { clienteId: null, items: [{ productoId: P, cantidad: 1 }], pago: { forma: "contado", montoRecibido: 10 } });
  check("Monto insuficiente → 422 MONTO_INSUFICIENTE", code(mi) === "MONTO_INSUFICIENTE", mi.json);
  const fcc = await req(V, "POST", "/api/facturas", { clienteId: null, items: [{ productoId: P, cantidad: 1 }], pago: { forma: "cuenta_corriente" } });
  check("Consumidor final en cuenta corriente → 422", code(fcc) === "CUENTA_CORRIENTE_NO_HABILITADA", fcc.json);
  const sst = await req(V, "POST", "/api/facturas", { clienteId: null, items: [{ productoId: P, cantidad: 999 }], pago: { forma: "contado" } });
  check("Sin stock → 409 STOCK_INSUFICIENTE con details", sst.status === 409 && Array.isArray(sst.json?.error?.details) && sst.json.error.details[0]?.disponible !== undefined, sst.json);
  const rep = await req(V, "POST", "/api/facturas", { clienteId: null, items: [{ productoId: P, cantidad: 1 }, { productoId: P, cantidad: 1 }], pago: { forma: "contado" } });
  check("Productos repetidos en items → 422", rep.status === 422, rep.json);
  const precioTrucho = await req(V, "POST", "/api/facturas", { clienteId: null, items: [{ productoId: P, cantidad: 1, precioUnitario: 1 }], pago: { forma: "contado" } });
  check("Precio mandado por el cliente se rechaza o se ignora", precioTrucho.status === 422 || precioTrucho.json?.items?.[0]?.precioUnitario === 150050, precioTrucho.json);
  const tjFull = await req(V, "POST", "/api/facturas", { clienteId: null, items: [{ productoId: P, cantidad: 1 }], pago: { forma: "tarjeta", tarjeta: { tipo: "debito", marca: "Visa", ultimos4: "1234", numero: "4111111111111234" } } });
  check("Tarjeta con número completo → 422", tjFull.status === 422, tjFull.json);
  const tj = await req(V, "POST", "/api/facturas", { clienteId: null, items: [{ productoId: P, cantidad: 1 }], pago: { forma: "tarjeta", tarjeta: { tipo: "credito", marca: "Visa", ultimos4: "4242" } } });
  check("Venta con tarjeta válida → 201", tj.status === 201 && tj.json?.pago?.tarjeta?.ultimos4 === "4242", tj.json);
  // stock ahora: 5 -1 (f1b) -1 (tj, si se creó)  y precioTrucho pudo descontar 1

  console.log("\n== 5. Cliente nuevo en cuenta corriente, pago y límite");
  const doc = String(30000000 + Number(sufijo));
  const nc = await req(V, "POST", "/api/clientes", { tipoDoc: "DNI", nroDoc: doc, nombre: "Cliente Prueba", cuentaCorriente: true, limiteCredito: 400000 });
  check("Alta de cliente (vendedor) → 201", nc.status === 201, nc.json);
  const C = nc.json.id;
  const dupc = await req(V, "POST", "/api/clientes", { tipoDoc: "DNI", nroDoc: doc, nombre: "Otro" });
  check("Documento duplicado → 409 DOCUMENTO_DUPLICADO", code(dupc) === "DOCUMENTO_DUPLICADO", dupc.json);
  const stockAntes = (await producto(V, P)).existencia;
  const fc = await req(V, "POST", "/api/facturas", { clienteId: C, items: [{ productoId: P, cantidad: 2 }], pago: { forma: "cuenta_corriente" } });
  check("Venta en cuenta corriente → 201 con saldoCliente", fc.status === 201 && fc.json?.saldoCliente === 300100, fc.json);
  check("Saldo del cliente = 300100", (await cliente(V, C)).saldo === 300100);
  const lim = await req(V, "POST", "/api/facturas", { clienteId: C, items: [{ productoId: P, cantidad: Math.min(stockAntes - 2, 6) }], pago: { forma: "cuenta_corriente" } });
  check("Supera límite de crédito → 422 LIMITE_CREDITO_EXCEDIDO", code(lim) === "LIMITE_CREDITO_EXCEDIDO", lim.json);
  const pmas = await req(V, "POST", `/api/clientes/${C}/pagos`, { importe: 999999, medio: "efectivo" });
  check("Pago mayor que la deuda → 422 PAGO_SUPERA_DEUDA", code(pmas) === "PAGO_SUPERA_DEUDA", pmas.json);
  const pago = await req(V, "POST", `/api/clientes/${C}/pagos`, { importe: 100100, medio: "transferencia", observacion: "parcial" });
  check("Pago parcial → 201 con recibo R 0001-xxxxxxxx", pago.status === 201 && /^R \d{4}-\d{8}$/.test(pago.json?.numeroRecibo || ""), pago.json);
  check("Saldo nuevo = 200000", pago.json?.saldoCliente === 200000, pago.json?.saldoCliente);
  const cta = (await req(V, "GET", `/api/clientes/${C}/cuenta`)).json;
  check("Cuenta corriente con saldo acumulado por renglón", cta?.movimientos?.length === 2 && cta.movimientos[1].saldo === 200000 && cta.saldo === 200000, cta);
  const baja = await req(V, "PATCH", `/api/clientes/${C}`, { activo: false });
  check("Desactivar cliente con saldo → 422 SALDO_PENDIENTE", code(baja) === "SALDO_PENDIENTE", baja.json);
  const busq = (await req(V, "GET", `/api/clientes?q=${doc.slice(0, 2)}.${doc.slice(2, 5)}.${doc.slice(5)}`)).json;
  check("Búsqueda por documento con puntos", busq?.data?.some((x) => x.id === C), busq?.data?.length);

  console.log("\n== 6. Anulación");
  const stockPreAnul = (await producto(A, P)).existencia;
  const an = await req(A, "POST", `/api/facturas/${fc.json.id}/anulacion`, { motivo: "Error de carga" });
  check("Anular (admin) → 200 estado anulada", an.status === 200 && an.json?.estado === "anulada", an.json);
  check("Stock reingresado (+2)", (await producto(A, P)).existencia === stockPreAnul + 2);
  check("Crédito en cuenta: saldo 200000 − 300100 → no negativo / coherente", (await cliente(A, C)).saldo >= 0, (await cliente(A, C)).saldo);
  const an2 = await req(A, "POST", `/api/facturas/${fc.json.id}/anulacion`, { motivo: "otra vez" });
  check("Anular de nuevo → 409 FACTURA_ANULADA", code(an2) === "FACTURA_ANULADA", an2.json);
  const anSin = await req(A, "POST", `/api/facturas/${f1.json.id}/anulacion`, {});
  check("Anular sin motivo → 422", anSin.status === 422, anSin.json);
  const det = (await req(V, "GET", `/api/facturas/${fc.json.id}`)).json;
  check("La factura anulada sigue visible con datos de anulación", det?.estado === "anulada" && det?.anulacion?.motivo === "Error de carga", det?.anulacion);

  console.log("\n== 7. Concurrencia: dos ventas simultáneas de la última unidad");
  const u = await req(A, "POST", "/api/productos", { codigo: "ULT-" + sufijo, descripcion: "Última unidad", categoriaId: catId, precio: 1000, stockMinimo: 0, stockInicial: 1 });
  const U = u.json.id;
  const venta = () => req(V, "POST", "/api/facturas", { clienteId: null, items: [{ productoId: U, cantidad: 1 }], pago: { forma: "contado" } });
  const res = await Promise.all([venta(), venta(), venta(), venta(), venta()]);
  const estados = res.map((r) => r.status);
  check("5 ventas simultáneas → exactamente 1 confirmada", estados.filter((s) => s === 201).length === 1, estados);
  check("Las demás → 409 STOCK_INSUFICIENTE", res.filter((r) => r.status !== 201).every((r) => code(r) === "STOCK_INSUFICIENTE"), res.map(code));
  check("Existencia final = 0", (await producto(A, U)).existencia === 0);

  console.log("\n== 8. Usuarios y tablero");
  const yo = (await req(A, "GET", "/api/auth/me")).json;
  const self = await req(A, "PATCH", `/api/usuarios/${yo.id}`, { activo: false });
  check("Admin no puede desactivarse → 422 OPERACION_SOBRE_SI_MISMO", code(self) === "OPERACION_SOBRE_SI_MISMO", self.json);
  const nu = await req(A, "POST", "/api/usuarios", { nombre: "Temp", email: `temp${sufijo}@x.test`, rol: "vendedor", password: "temporal123" });
  check("Alta de usuario → 201 sin hash", nu.status === 201 && !JSON.stringify(nu.json).toLowerCase().includes("hash"), nu.json);
  const lt = await login(`temp${sufijo}@x.test`, "temporal123");
  check("El usuario nuevo puede entrar", lt.status === 200);
  await req(A, "PATCH", `/api/usuarios/${nu.json.id}`, { activo: false });
  check("Usuario desactivado: su cookie deja de servir", (await req(lt.cookie, "GET", "/api/auth/me")).status === 401);
  check("Usuario desactivado no puede loguearse", (await login(`temp${sufijo}@x.test`, "temporal123")).status === 401);
  const tb = (await req(V, "GET", "/api/tablero")).json;
  check("Tablero: ventasDiarias con 30 elementos", tb?.ventasDiarias?.length === 30, tb?.ventasDiarias?.length);
  check("Tablero: 5 más vendidos y formas de pago", tb?.masVendidos?.length === 5 && Array.isArray(tb?.porFormaDePago), tb?.masVendidos?.length);
  const lf = (await req(V, "GET", "/api/facturas?estado=emitida&pageSize=5")).json;
  check("Listado de facturas paginado con totalEmitido", lf?.data?.length === 5 && typeof lf?.totalEmitido === "number" && lf?.total > 50, { total: lf?.total, te: lf?.totalEmitido });

  console.log("\n== 9. Páginas renderizan con sesión (sin error 500)");
  const paginas = ["/", "/ventas", "/ventas/nueva", `/ventas/${f1.json.id}`, "/productos", `/productos/${P}`, "/productos/categorias", "/productos/movimientos", "/clientes", `/clientes/${C}`, "/clientes/saldos", `/pagos/${pago.json.id}`, "/usuarios", "/perfil"];
  for (const p of paginas) {
    const r = await fetch(BASE + p, { headers: { cookie: A }, redirect: "manual" });
    check(`GET ${p} → ${r.status}`, r.status === 200);
  }
  const rv = await fetch(BASE + "/usuarios", { headers: { cookie: V }, redirect: "manual" });
  check("Vendedor en /usuarios no ve la página (redirige o 403/404)", rv.status !== 200 || !(await rv.text()).includes("temp" + sufijo), rv.status);

  console.log(`\nRESULTADO: ${ok} OK, ${fail} fallas`);
  if (fallas.length) { console.log("Fallas:\n - " + fallas.join("\n - ")); process.exitCode = 1; }
})().catch((e) => { console.error("ERROR DEL SCRIPT:", e); process.exit(1); });
