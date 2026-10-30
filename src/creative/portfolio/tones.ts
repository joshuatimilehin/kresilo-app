/** Any four colours read as roles, so a layout recolours with its project. */
export type Tone = { dark: string; light: string; a: string; b: string };

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
};

/** Any four colours as roles: the darkest, the lightest, and two accents in their given order. */
export function tones(palette: readonly string[]): Tone {
  const p = [...palette, ...palette, ...palette, ...palette].slice(0, 4);
  const byLum = [...p].sort((x, y) => lum(x) - lum(y));
  const dark = byLum[0];
  const light = byLum[3];
  const rest = p.filter((c) => c !== dark && c !== light);
  return { dark, light, a: rest[0] ?? p[1], b: rest[1] ?? rest[0] ?? p[2] };
}
