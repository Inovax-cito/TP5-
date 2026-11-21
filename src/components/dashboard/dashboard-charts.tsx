"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

const etiquetasForma: Record<string, string> = {
  contado: "Contado",
  tarjeta: "Tarjeta",
  cuenta_corriente: "Cuenta corriente",
};

const colores = ["#FF6A00", "#111111", "#FFB84D", "#9CA3AF", "#D1D5DB"];

type Props = {
  ventasDiarias: Array<{ fecha: string; importe: number }>;
  porFormaDePago: Array<{ forma: string; importe: number }>;
};

export function DashboardCharts({ ventasDiarias, porFormaDePago }: Props) {
  const opcionesLinea: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: "index" },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${formatMoney(Number(ctx.parsed.y))}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${Number(value) / 100}k`,
          maxTicksLimit: 5,
        },
        grid: { color: "rgba(148,163,184,0.15)" },
      },
      x: {
        ticks: { maxTicksLimit: 8, font: { size: 10 } },
        grid: { display: false },
      },
    },
  };

  const datosLinea = {
    labels: ventasDiarias.map((v) => v.fecha.slice(8, 10) + "/" + v.fecha.slice(5, 7)),
    datasets: [
      {
        label: "Ventas",
        data: ventasDiarias.map((v) => v.importe),
        borderColor: "#FF6A00",
        backgroundColor: "rgba(255,106,0,0.12)",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const datosDona = {
    labels: porFormaDePago.map((f) => etiquetasForma[f.forma] ?? f.forma),
    datasets: [
      {
        data: porFormaDePago.map((f) => f.importe),
        backgroundColor: porFormaDePago.map((_, i) => colores[i % colores.length]),
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const opcionesDona: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 10, padding: 14 } },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${formatMoney(Number(ctx.parsed))}`,
        },
      },
    },
  };

  const totalFormas = porFormaDePago.reduce((acc, f) => acc + f.importe, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Ventas de los últimos 30 días</CardTitle>
          <CardDescription>Importe facturado por día, en hora de Argentina.</CardDescription>
        </CardHeader>
        <CardContent className="h-64 sm:h-72">
          <Line data={datosLinea} options={opcionesLinea} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formas de pago del mes</CardTitle>
          <CardDescription>Distribución de lo Facturado.</CardDescription>
        </CardHeader>
        <CardContent className="relative h-52 sm:h-56">
          <Doughnut data={datosDona} options={opcionesDona} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
            <span className="text-xs text-muted-foreground">Total del mes</span>
            <span className="tabular text-lg font-bold">{formatMoney(totalFormas)}</span>
          </div>
        </CardContent>
      </Card>

      {porFormaDePago.length > 0 && (
        <Card className="lg:col-span-3">
          <CardContent className="flex flex-wrap gap-4 pt-6">
            {porFormaDePago.map((f, i) => (
              <div key={f.forma} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colores[i % colores.length] }} />
                <span className="text-muted-foreground">{etiquetasForma[f.forma] ?? f.forma}</span>
                <strong className="tabular">{formatMoney(f.importe)}</strong>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
