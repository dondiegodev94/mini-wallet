import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina condicionalmente clases de Tailwind y resuelve conflictos de especificidad.
 * Es la base para nuestro Design System basado en variantes (CVA).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
