// Paleta del canal — se AUTOCONFIGURA desde brand.json (lo escribe el onboarding).
import brand from "./brand.json";

const c = brand.colores || {};

export const COLORS = {
  cream: c.fondo || "#F4ECD6", // fondo papel
  creamDark: "#EADFC2", // sombras del papel
  ink: c.tinta || "#20180F", // tinta
  orange: c.acento || "#FF5A1F", // acento (color de marca)
} as const;

export const BRAND = brand;
