import type { Config } from "tailwindcss";

/** Colores definidos como tokens HSL en globals.css; acá solo se exponen a Tailwind. */
const token = (nombre: string) => `hsl(var(--${nombre}))`;

const neutros = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((n) => [n, token(`neutral-${n}`)]),
);

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        neutral: neutros,
        border: token("border"),
        input: token("input"),
        ring: token("ring"),
        background: token("background"),
        foreground: token("foreground"),
        primary: {
          DEFAULT: token("primary"),
          foreground: token("primary-foreground"),
        },
        primaryText: token("primary-text"),
        secondary: {
          DEFAULT: token("secondary"),
          foreground: token("secondary-foreground"),
        },
        destructive: {
          DEFAULT: token("destructive"),
          foreground: token("destructive-foreground"),
        },
        muted: {
          DEFAULT: token("muted"),
          foreground: token("muted-foreground"),
        },
        accent: {
          DEFAULT: token("accent"),
          foreground: token("accent-foreground"),
        },
        popover: {
          DEFAULT: token("popover"),
          foreground: token("popover-foreground"),
        },
        card: {
          DEFAULT: token("card"),
          foreground: token("card-foreground"),
        },
        success: {
          DEFAULT: token("success"),
          foreground: token("success-foreground"),
        },
        warning: {
          DEFAULT: token("warning"),
          foreground: token("warning-foreground"),
        },
        info: {
          DEFAULT: token("info"),
          foreground: token("info-foreground"),
        },
        sidebar: {
          DEFAULT: token("sidebar"),
          foreground: token("sidebar-foreground"),
          muted: token("sidebar-muted"),
          accent: token("sidebar-accent"),
          "accent-foreground": token("sidebar-accent-foreground"),
          hover: token("sidebar-hover"),
          border: token("sidebar-border"),
        },
        chart: {
          1: token("chart-1"),
          2: token("chart-2"),
          3: token("chart-3"),
          4: token("chart-4"),
          5: token("chart-5"),
        },
      },
      /**
       * Tres radios: tarjetas, controles e insignias. Las clases heredadas de shadcn
       * (sm/md/lg/xl) se mapean a esa escala para que no queden valores sueltos.
       */
      borderRadius: {
        card: "var(--radius-card)",
        control: "var(--radius-control)",
        badge: "var(--radius-badge)",
        "2xl": "var(--radius-card)",
        xl: "var(--radius-card)",
        lg: "var(--radius-control)",
        md: "var(--radius-control)",
        sm: "calc(var(--radius-control) - 3px)",
      },
      /** Tres niveles de elevación con sombras suaves en capas. */
      boxShadow: {
        "elevation-1": "var(--shadow-1)",
        "elevation-2": "var(--shadow-2)",
        "elevation-3": "var(--shadow-3)",
        sm: "var(--shadow-1)",
        DEFAULT: "var(--shadow-1)",
        md: "var(--shadow-2)",
        lg: "var(--shadow-3)",
        xl: "var(--shadow-3)",
        "2xl": "var(--shadow-3)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
      },
      /** Escala tipográfica: display, título de página, título de sección, cuerpo, etiqueta y micro. */
      fontSize: {
        display: ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.035em", fontWeight: "700" }],
        title: ["1.625rem", { lineHeight: "2rem", letterSpacing: "-0.025em", fontWeight: "700" }],
        section: ["1.0625rem", { lineHeight: "1.5rem", letterSpacing: "-0.012em", fontWeight: "600" }],
        body: ["0.875rem", { lineHeight: "1.375rem" }],
        label: ["0.8125rem", { lineHeight: "1.125rem", letterSpacing: "-0.003em", fontWeight: "500" }],
        micro: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.06em", fontWeight: "600" }],
      },
      transitionDuration: { DEFAULT: "180ms" },
      transitionTimingFunction: { DEFAULT: "cubic-bezier(0.25, 1, 0.5, 1)" },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-out": { from: { opacity: "1" }, to: { opacity: "0" } },
        // Se usan las propiedades individuales scale/translate para no pisar el transform de posición.
        "dialog-in": { from: { opacity: "0", scale: "0.96", translate: "0 6px" }, to: { opacity: "1", scale: "1", translate: "0 0" } },
        "dialog-out": { from: { opacity: "1", scale: "1" }, to: { opacity: "0", scale: "0.97" } },
        "sheet-in": { from: { translate: "-100% 0" }, to: { translate: "0 0" } },
        "sheet-out": { from: { translate: "0 0" }, to: { translate: "-100% 0" } },
        "pop-in": { from: { opacity: "0", scale: "0.97", translate: "0 -4px" }, to: { opacity: "1", scale: "1", translate: "0 0" } },
      },
      animation: {
        "fade-in": "fade-in 180ms ease-out",
        "fade-out": "fade-out 150ms ease-in",
        "dialog-in": "dialog-in 200ms cubic-bezier(0.25, 1, 0.5, 1)",
        "dialog-out": "dialog-out 150ms ease-in",
        "sheet-in": "sheet-in 240ms cubic-bezier(0.25, 1, 0.5, 1)",
        "sheet-out": "sheet-out 180ms ease-in",
        "pop-in": "pop-in 160ms cubic-bezier(0.25, 1, 0.5, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
