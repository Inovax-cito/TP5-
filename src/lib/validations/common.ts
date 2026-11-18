import { z } from "zod";

export const texto = (label: string) =>
  z
    .string({ error: `${label} es obligatorio.` })
    .trim()
    .min(1, `${label} es obligatorio.`);

export const textoOpcional = () =>
  z.string().trim().optional().nullable().transform((v) => v || null);

export const emailOpcional = () =>
  z
    .union([z.email("El email no es válido."), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => v || null);

export const enteroPositivo = (label: string) =>
  z
    .number({ error: `${label} debe ser un número.` })
    .int(`${label} debe ser un número entero.`)
    .positive(`${label} debe ser mayor que cero.`);

export const enteroNoNegativo = (label: string) =>
  z
    .number({ error: `${label} debe ser un número.` })
    .int(`${label} debe ser un número entero.`)
    .nonnegative(`${label} no puede ser negativo.`);

export const importe = (label: string) => enteroNoNegativo(label);

export const idPositivo = () => enteroPositivo("El identificador");

export const docSchema = texto("Documento").regex(
  /^[\d.\-\s]+$/,
  "El documento debe contener solo números, puntos y guiones.",
);
