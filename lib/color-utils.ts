/**
 * Convert hex color (#rrggbb) to HSL string for CSS variables.
 * Returns format "H S% L%" (space-separated, no hsl() wrapper) to match globals.css.
 * If input doesn't look like hex, returns it unchanged (e.g. already HSL from API).
 */
export function hexToHsl(hexOrHsl: string): string {
  const trimmed = hexOrHsl.trim();
  if (!trimmed.startsWith("#")) return trimmed;

  const hex = trimmed.slice(1);
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return trimmed;

  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  const H = Math.round(h * 360);
  const S = Math.round(s * 100);
  const L = Math.round(l * 100);

  return `${H} ${S}% ${L}%`;
}

/**
 * Derive a slightly darker HSL for hover (reduce lightness by ~8%).
 * Input: "H S% L%" format. Output: same format.
 */
export function darkenHsl(hsl: string, amount = 8): string {
  const match = hsl.trim().match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
  if (!match) return hsl;
  const [, h, s, l] = match;
  const newL = Math.max(0, parseInt(l, 10) - amount);
  return `${h} ${s}% ${newL}%`;
}
