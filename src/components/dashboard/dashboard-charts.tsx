"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
  type ScriptableContext,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDayMonth, formatMoney, formatMoneyCompact, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Filler);

const etiquetasForma: Record<string, string> = {
  contado: "Contado",
  tarjeta: "Tarjeta",
  cuenta_corriente: "Cuenta corriente",
};

type Tokens = {
  series: string[];
  primary: string;
  grid: string;
  texto: string;
  fondoTooltip: string;
  textoTooltip: string;
  card: string;
  fuente: string;
  mono: string;
};

/** Lee los tokens de color de globals.css (y los relee si cambia el tema). */
function useTokens(): Tokens | null {
  const [tokens, setTokens] = useState<Tokens | null>(null);
  useEffect(() => {
    const leer = () => {
      const css = getComputedStyle(document.documentElement);
      const hsl = (nombre: string, alfa = 1) => `hsl(${css.getPropertyValue(`--${nombre}`).trim()} / ${alfa})`;
      setTokens({
        series: [1, 2, 3, 4, 5].map((n) => hsl(`chart-${n}`)),
        primary: hsl("chart-1"),
        grid: hsl("chart-grid"),
        texto: hsl("muted-foreground"),
        fondoTooltip: hsl("foreground"),
        textoTooltip: hsl("background"),
        card: hsl("card"),
        fuente: css.getPropertyValue("--font-sans").trim() || "system-ui",
        mono: css.getPropertyValue("--font-mono").trim() || "monospace",
      });
    };
    leer();
    const observador = new MutationObserver(leer);
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    return () => observador.disconnect();
  }, []);
  return tokens;
}

type Props = {
  ventasDiarias: Array<{ fecha: string; importe: number }>;
  porFormaDePago: Array<{ forma: string; importe: number }>;
};

export function DashboardCharts({ ventasDiarias, porFormaDePago }: Props) {
  const t = useTokens();
  // Segmento de la dona señalado (mouse, toque o leyenda): se muestra en el centro.
  const [activo, setActivo] = useState<number | null>(null);
  const dona = useRef<ChartJS<"doughnut">>(null);

  function resaltar(indice: number | null) {
    setActivo(indice);
    const chart = dona.current;
    if (!chart) return;
    chart.setActiveElements(indice === null ? [] : [{ datasetIndex: 0, index: indice }]);
    chart.update();
  }
  const totalFormas = porFormaDePago.reduce((acc, f) => acc + f.importe, 0);
  const total30 = ventasDiarias.reduce((acc, v) => acc + v.importe, 0);

  const tooltip = t && {
    backgroundColor: t.fondoTooltip,
    titleColor: t.textoTooltip,
    bodyColor: t.textoTooltip,
    padding: 12,
    cornerRadius: 8,
    displayColors: false,
    titleFont: { family: t.fuente, size: 12, weight: 600 as const },
    bodyFont: { family: t.mono, size: 13, weight: 600 as const },
  };

  const opcionesLinea: ChartOptions<"line"> | null = t && {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: "index" },
    plugins: {
      legend: { display: false },
      tooltip: { ...tooltip!, callbacks: { label: (ctx) => formatMoney(Number(ctx.parsed.y)) } },
    },
    scales: {
      y: {
        beginAtZero: true,
        border: { display: false },
        ticks: {
          callback: (value) => formatMoneyCompact(Number(value)),
          maxTicksLimit: 5,
          color: t.texto,
          font: { family: t.mono, size: 11 },
          padding: 8,
        },
        grid: { color: t.grid },
      },
      x: {
        border: { display: false },
        ticks: { maxTicksLimit: 8, color: t.texto, font: { family: t.fuente, size: 11 }, maxRotation: 0 },
        grid: { display: false },
      },
    },
  };

  const datosLinea = t && {
    labels: ventasDiarias.map((v) => formatDayMonth(v.fecha)),
    datasets: [
      {
        label: "Ventas",
        data: ventasDiarias.map((v) => v.importe),
        borderColor: t.primary,
        // Relleno con gradiente vertical del color de marca a transparente.
        backgroundColor: (ctx: ScriptableContext<"line">) => {
          const { chart } = ctx;
          const area = chart.chartArea;
          if (!area) return "transparent";
          const g = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
          g.addColorStop(0, t.primary.replace("/ 1)", "/ 0.32)"));
          g.addColorStop(1, t.primary.replace("/ 1)", "/ 0)"));
          return g;
        },
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: t.card,
        pointHoverBorderColor: t.primary,
        pointHoverBorderWidth: 2.5,
        tension: 0.38,
        fill: true,
      },
    ],
  };

  const datosDona = t && {
    labels: porFormaDePago.map((f) => etiquetasForma[f.forma] ?? f.forma),
    datasets: [
      {
        data: porFormaDePago.map((f) => f.importe),
        backgroundColor: porFormaDePago.map((_, i) => t.series[i % t.series.length]),
        borderColor: t.card,
        borderWidth: 3,
        borderRadius: 6,
        hoverOffset: 6,
      },
    ],
  };

  const opcionesDona: ChartOptions<"doughnut"> | null = t && {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    layout: { padding: 8 },
    // Sin cuadro flotante: en un lienzo tan chico se cortaba. El detalle va en el centro.
    onHover: (_evento, elementos) => setActivo(elementos[0]?.index ?? null),
    // En celulares el toque llega como click.
    onClick: (_evento, elementos) => setActivo(elementos[0]?.index ?? null),
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
  };

  const seleccion = activo !== null ? porFormaDePago[activo] : null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="min-w-0 lg:col-span-2">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle>Ventas de los últimos 30 días</CardTitle>
            <CardDescription>Importe facturado por día, en hora de Argentina.</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-micro uppercase text-muted-foreground">Acumulado</p>
            <p className="tabular text-lg font-semibold">{formatMoney(total30)}</p>
          </div>
        </CardHeader>
        <CardContent className="relative h-64 min-w-0 overflow-hidden sm:h-72">
          {opcionesLinea && datosLinea ? <Line data={datosLinea} options={opcionesLinea} /> : null}
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Formas de pago del mes</CardTitle>
          <CardDescription>Distribución de lo facturado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="relative mx-auto h-48 w-48" onMouseLeave={() => resaltar(null)}>
            {opcionesDona && datosDona ? <Doughnut ref={dona} data={datosDona} options={opcionesDona} /> : null}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-9 text-center" aria-live="polite">
              <span className="text-micro uppercase text-muted-foreground">
                {seleccion ? (etiquetasForma[seleccion.forma] ?? seleccion.forma) : "Total del mes"}
              </span>
              <span className="tabular text-[13px] font-semibold leading-6">
                {formatMoney(seleccion ? seleccion.importe : totalFormas)}
              </span>
              {seleccion && totalFormas > 0 && (
                <span className="tabular text-[11px] text-muted-foreground">{formatPercent(seleccion.importe / totalFormas)}</span>
              )}
            </div>
          </div>
          {porFormaDePago.length > 0 && (
            <ul className="space-y-1" onMouseLeave={() => resaltar(null)}>
              {porFormaDePago.map((f, i) => (
                <li
                  key={f.forma}
                  onMouseEnter={() => resaltar(i)}
                  className={cn(
                    "-mx-2 flex items-center gap-3 rounded-control px-2 py-1.5 text-sm transition-colors",
                    activo === i ? "bg-muted" : activo !== null && "opacity-55",
                  )}
                >
                  <span
                    className={["h-2.5 w-2.5 shrink-0 rounded-full", ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"][i % 5]].join(" ")}
                  />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{etiquetasForma[f.forma] ?? f.forma}</span>
                  <span className="tabular text-xs text-muted-foreground">
                    {totalFormas > 0 ? formatPercent(f.importe / totalFormas) : "-"}
                  </span>
                  <span className="tabular text-right font-medium">{formatMoney(f.importe)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
