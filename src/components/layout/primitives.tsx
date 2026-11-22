import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Sección 10.6: primitivas de maquetación propias (apilar, alinear, grilla, texto, título).
 * Las páginas se arman con estas primitivas, componentes de shadcn/ui y componentes del
 * dominio; el HTML vive acá adentro.
 *
 * Ninguna variante agrega estilo por defecto: sin props, cada primitiva renderiza la
 * etiqueta sola. Así el aspecto depende solo de lo que se pide explícitamente.
 * `className` queda para ajustes puntuales (márgenes, bordes, fondos).
 */

type ElementProps = React.HTMLAttributes<HTMLElement>;

/* ------------------------------------------------------------------ Stack */

const stackVariants = cva("", {
  variants: {
    // space-y (no flex + gap) para respetar los márgenes propios de cada hijo.
    gap: {
      "1": "space-y-1",
      "1.5": "space-y-1.5",
      "2": "space-y-2",
      "3": "space-y-3",
      "4": "space-y-4",
      "6": "space-y-6",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
  },
});

/** Apila los hijos en vertical. */
export function Stack({
  as: Tag = "div",
  gap,
  align,
  className,
  ...props
}: ElementProps & VariantProps<typeof stackVariants> & { as?: "div" | "section" | "dl" }) {
  return <Tag className={cn(stackVariants({ gap, align }), className) || undefined} {...props} />;
}

/* ----------------------------------------------------------------- Inline */

const inlineVariants = cva("", {
  variants: {
    inline: { true: "inline-flex", false: "flex" },
    wrap: { true: "flex-wrap" },
    gap: {
      "1": "gap-1",
      "2": "gap-2",
      "3": "gap-3",
      "4": "gap-4",
      "6": "gap-6",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      baseline: "items-baseline",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      between: "justify-between",
      end: "justify-end",
    },
  },
  defaultVariants: { inline: false },
});

/** Alinea los hijos en una fila (flex). `inline` lo vuelve inline-flex. */
export function Inline({
  as: Tag = "div",
  inline,
  wrap,
  gap,
  align,
  justify,
  className,
  ...props
}: ElementProps & VariantProps<typeof inlineVariants> & { as?: "div" | "span" }) {
  return <Tag className={cn(inlineVariants({ inline, wrap, gap, align, justify }), className)} {...props} />;
}

/* ------------------------------------------------------------------- Grid */

const gridVariants = cva("grid", {
  variants: {
    gap: {
      "2": "gap-2",
      "3": "gap-3",
      "4": "gap-4",
      "6": "gap-6",
    },
  },
});

// Clases escritas completas para que Tailwind las detecte al compilar.
const columnas = {
  base: { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" },
  sm: { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" },
  md: { 1: "md:grid-cols-1", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" },
  lg: { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" },
  xl: { 1: "xl:grid-cols-1", 2: "xl:grid-cols-2", 3: "xl:grid-cols-3", 4: "xl:grid-cols-4" },
} as const;

type Columnas = 1 | 2 | 3 | 4;
type ColsPorPantalla = Partial<Record<keyof typeof columnas, Columnas>>;

/** Grilla responsiva: `cols={{ sm: 2, xl: 4 }}`. */
export function Grid({
  as: Tag = "div",
  gap,
  cols,
  className,
  ...props
}: ElementProps & VariantProps<typeof gridVariants> & { as?: "div" | "dl"; cols?: ColsPorPantalla }) {
  const clasesColumnas = Object.entries(cols ?? {}).map(
    ([pantalla, n]) => columnas[pantalla as keyof typeof columnas][n as Columnas],
  );
  return <Tag className={cn(gridVariants({ gap }), clasesColumnas, className)} {...props} />;
}

/* ------------------------------------------------------------------- Text */

const textVariants = cva("", {
  variants: {
    size: {
      micro: "text-micro",
      label: "text-label",
      body: "text-body",
      section: "text-section",
      title: "text-title",
      display: "text-display",
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    tone: {
      muted: "text-muted-foreground",
      primary: "text-primaryText",
      success: "text-success",
      warning: "text-warning",
      destructive: "text-destructive",
      info: "text-info",
    },
    // Rótulos en mayúsculas ("FACTURA", "COMPRADOR").
    caps: {
      wide: "uppercase tracking-wide",
      widest: "uppercase tracking-widest",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    // Cifras alineadas (importes, cantidades, numeración).
    tabular: { true: "tabular" },
  },
});

/** Texto: párrafo por defecto; `as` permite span, dt, dd, strong o div. */
export function Text({
  as: Tag = "p",
  size,
  weight,
  tone,
  caps,
  align,
  tabular,
  className,
  ...props
}: ElementProps &
  VariantProps<typeof textVariants> & { as?: "p" | "span" | "div" | "dt" | "dd" | "strong" }) {
  return (
    <Tag className={cn(textVariants({ size, weight, tone, caps, align, tabular }), className) || undefined} {...props} />
  );
}

/* ------------------------------------------------------------------ Title */

const titleVariants = cva("", {
  variants: {
    size: {
      display: "text-display",
      title: "text-title",
      section: "text-section",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
    },
    weight: {
      semibold: "font-semibold",
      bold: "font-bold",
    },
    tabular: { true: "tabular" },
  },
  defaultVariants: { size: "3xl", weight: "bold" },
});

/** Título de página o de comprobante. */
export function Title({
  as: Tag = "h1",
  size,
  weight,
  tabular,
  className,
  ...props
}: ElementProps & VariantProps<typeof titleVariants> & { as?: "h1" | "h2" | "h3" }) {
  return <Tag className={cn(titleVariants({ size, weight, tabular }), className)} {...props} />;
}
