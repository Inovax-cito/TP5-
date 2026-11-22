import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppToaster } from "@/components/common/app-toaster";
import "./globals.css";

/** Tipografías: Geist para la interfaz y Geist Mono para importes, números y códigos. */
const geistSans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Ferretería El Martillo · Gestión Comercial",
  description: "Facturación, stock y cuenta corriente de Ferretería El Martillo",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
