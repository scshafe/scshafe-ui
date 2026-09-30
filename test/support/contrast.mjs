// WCAG 2.2 contrast from token values: resolve a token in a theme, composite
// translucent colours over what they sit on (in sRGB, as browsers paint), and
// compute the contrast ratio (WCAG 2.2, "contrast ratio" and "relative
// luminance" definitions).
import { SUI_TOKENS } from "@scshafe/ui/tokens";

const BY_NAME = new Map(SUI_TOKENS.map((token) => [token.name, token]));

/** Resolve a token's value in a theme, following var() references. */
export function resolveToken(name, theme, seen = new Set()) {
  if (seen.has(name)) throw new Error(`token cycle at ${name}`);
  const token = BY_NAME.get(name);
  if (!token) throw new Error(`unregistered token ${name}`);
  const value = token[theme].trim();
  const reference = /^var\((--[\w-]+)\)$/.exec(value);
  return reference ? resolveToken(reference[1], theme, new Set([...seen, name])) : value;
}

/** Parse #rgb, #rrggbb, rgb() and rgba() into { r, g, b, a } (0–255, alpha 0–1). */
export function parseColor(value) {
  const text = value.trim().toLowerCase();
  let match = /^#([0-9a-f]{3})$/.exec(text);
  if (match) {
    const [r, g, b] = [...match[1]].map((digit) => parseInt(digit + digit, 16));
    return { r, g, b, a: 1 };
  }
  match = /^#([0-9a-f]{6})$/.exec(text);
  if (match) {
    const hex = match[1];
    return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16), a: 1 };
  }
  match = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(text);
  if (match) return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]), a: match[4] === undefined ? 1 : Number(match[4]) };
  throw new Error(`not a colour the contrast check understands: ${value}`);
}

/** Paint `top` (possibly translucent) over an opaque `bottom`. */
export function composite(top, bottom) {
  if (bottom.a !== 1) throw new Error("composite needs an opaque backdrop");
  const mix = (channel) => top[channel] * top.a + bottom[channel] * (1 - top.a);
  return { r: mix("r"), g: mix("g"), b: mix("b"), a: 1 };
}

/** The colour at `alpha` of its own opacity (color-mix(in srgb, c p%, transparent)). */
export function withAlpha(color, alpha) {
  return { ...color, a: color.a * alpha };
}

function channel(value) {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance({ r, g, b }) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foreground, background) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

export const color = (name, theme) => parseColor(resolveToken(name, theme));
