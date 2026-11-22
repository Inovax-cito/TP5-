import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { CATALOGO } from "../lib/catalogo";

/** Miniaturas SVG locales: functionan offline y se pueden reemplazar por URLs reales. */
const COLORES: Record<string, { fondo: string; acento: string }> = {
  Herramientas: { fondo: "#FFF3E8", acento: "#C2410C" },
  Eléctrica: { fondo: "#FFFAEB", acento: "#A16207" },
  Iluminación: { fondo: "#FFFBE8", acento: "#B45309" },
  Ferretería: { fondo: "#F3F4F6", acento: "#111111" },
  Jardinería: { fondo: "#F0FDF4", acento: "#15803D" },
};

function escapar(texto: string) {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function iniciales(descripcion: string) {
  return descripcion
    .split(/\s+/)
    .filter((palabra) => /[\p{L}]/u.test(palabra))
    .slice(0, 2)
    .map((palabra) => palabra[0]!.toUpperCase())
    .join("");
}

async function main() {
  const destino = path.join(process.cwd(), "public", "productos");
  await mkdir(destino, { recursive: true });

  const contadores: Record<string, number> = {};
  for (const [categoria, descripcion] of CATALOGO) {
    const prefijo = categoria.slice(0, 2).toUpperCase();
    contadores[prefijo] = (contadores[prefijo] ?? 0) + 1;
    const codigo = `${prefijo}-${String(contadores[prefijo]).padStart(3, "0")}`;
    const color = COLORES[categoria] ?? { fondo: "#FFF3E8", acento: "#C2410C" };

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-label="${escapar(descripcion)}">
  <rect width="128" height="128" rx="20" fill="${color.fondo}"/>
  <rect width="128" height="8" rx="4" fill="#FF6A00"/>
  <rect x="12" y="20" width="104" height="88" rx="14" fill="#FFFFFF" opacity="0.85"/>
  <text x="64" y="70" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700" fill="#111111">${escapar(iniciales(descripcion))}</text>
  <text x="64" y="96" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="10" font-weight="700" fill="${color.acento}">${escapar(categoria.toUpperCase())}</text>
</svg>
`;

    await writeFile(path.join(destino, `${codigo}.svg`), svg, "utf8");
  }
  console.log(`${CATALOGO.length} miniaturas generadas en public/productos.`);
}

main().catch((error) => {
  console.error("Error al generar miniaturas:", error);
  process.exit(1);
});
