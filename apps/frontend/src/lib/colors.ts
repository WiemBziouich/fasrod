// Table nom de couleur (stocké en base dans `variantes.couleur`) -> hex pour les pastilles.
// Les clés sont normalisées (minuscules, sans accents) via normalizeColorName().

const COLOR_HEX: Record<string, string> = {
  noir: "#111111",
  blanc: "#f5f5f2",
  gris: "#8c8c8a",
  "gris charbon": "#3b3b3a",
  "gris clair": "#c4c4c0",
  rose: "#e8a0b4",
  beige: "#d6c3a3",
  vert: "#4b5d3a",
  "vert olive": "#556b2f",
  marron: "#6b4a34",
  bleu: "#3a6ea5",
  "bleu ciel": "#8fc1e3",
  "bleu marine": "#1c2a48",
  rouge: "#b3262e",
  jaune: "#e0b83a",
  orange: "#d9782b",
  violet: "#6d4c9f",
  bordeaux: "#5c1a24",
  kaki: "#7a7449",
};

const FALLBACK_HEX = "#5a5a57";

export function normalizeColorName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function getColorHex(name: string): string {
  return COLOR_HEX[normalizeColorName(name)] ?? FALLBACK_HEX;
}