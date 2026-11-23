import type {
  ThemeEditorConfig,
  ThemeMacroControl,
  ThemeMacroValue,
  ThemeMacroValues,
  WorkbenchTheme,
} from './types.js';

export interface ThemeOverrideBucket {
  readonly macros: Readonly<Record<string, ThemeMacroValue>>;
  readonly raw: Readonly<Record<string, string>>;
}

export type ThemeOverridesStore = Readonly<Record<string, ThemeOverrideBucket>>;

export const EMPTY_BUCKET: ThemeOverrideBucket = { macros: {}, raw: {} };

export interface ParsedColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

export interface ContrastResolution {
  readonly ratio: number;
  readonly foreground: ParsedColor;
  readonly background: ParsedColor;
}

const VALID_CUSTOM_PROP = /^--[a-zA-Z0-9_-]+$/;
const FORBIDDEN_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const UNSAFE_CSS_CHARS = /[;{}\\\r\n\f\0]|\/\*|<\/style|url\s*\(/i;

export function hasOwn(record: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

export function isSafeObjectKey(key: string): boolean {
  return key.length > 0 && !FORBIDDEN_OBJECT_KEYS.has(key);
}

export function isValidCustomProperty(name: string): boolean {
  return VALID_CUSTOM_PROP.test(name);
}

export function isSafeCssValue(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0 || UNSAFE_CSS_CHARS.test(trimmed)) {
    return false;
  }

  let parenDepth = 0;
  let bracketDepth = 0;
  let quote: "'" | '"' | null = null;
  let escaped = false;

  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i]!;
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (quote !== null) {
      if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
    } else if (ch === '(') {
      parenDepth += 1;
    } else if (ch === ')') {
      parenDepth -= 1;
      if (parenDepth < 0) {
        return false;
      }
    } else if (ch === '[') {
      bracketDepth += 1;
    } else if (ch === ']') {
      bracketDepth -= 1;
      if (bracketDepth < 0) {
        return false;
      }
    }
  }

  return !escaped && quote === null && parenDepth === 0 && bracketDepth === 0;
}

export function escapeCssString(value: string, quote: "'" | '"' = "'"): string {
  let out = '';
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i]!;
    if (ch === '\\') {
      out += '\\\\';
    } else if (ch === quote) {
      out += `\\${quote}`;
    } else if (ch === '\n') {
      out += '\\a ';
    } else if (ch === '\r') {
      out += '\\d ';
    } else if (ch === '\f') {
      out += '\\c ';
    } else if (ch === '\0') {
      out += '\\fffd ';
    } else if (ch === '<') {
      out += '\\3c ';
    } else {
      out += ch;
    }
  }
  return out;
}

export function macroBoundsForTheme(
  macro: Extract<ThemeMacroControl, { readonly kind: 'range' }>,
  theme: WorkbenchTheme,
): { readonly min: number; readonly max: number; readonly step: number } {
  const override = macro.schemeBounds?.[theme.colorScheme];
  return {
    min: override?.min ?? macro.min,
    max: override?.max ?? macro.max,
    step: override?.step ?? macro.step,
  };
}

export function macroDefaultForTheme(
  macro: ThemeMacroControl,
  theme: WorkbenchTheme,
): ThemeMacroValue | undefined {
  return hasOwn(macro.defaults, theme.id) ? macro.defaults[theme.id] : undefined;
}

export function getThemeBucket(
  store: ThemeOverridesStore,
  themeId: string,
): ThemeOverrideBucket | undefined {
  return isSafeObjectKey(themeId) && hasOwn(store, themeId) ? store[themeId] : undefined;
}

function isValidMacroValueForControl(
  macro: ThemeMacroControl,
  val: unknown,
): val is ThemeMacroValue {
  if (macro.kind === 'range') {
    return typeof val === 'number' && Number.isFinite(val);
  }
  if (macro.kind === 'color') {
    return typeof val === 'string' && isSafeCssValue(val) && parseCssColor(val) !== null;
  }
  return typeof val === 'string' && macro.choices.some((choice) => choice.value === val);
}

export function resolvedMacroValues(
  config: ThemeEditorConfig,
  theme: WorkbenchTheme,
  bucket: ThemeOverrideBucket | undefined,
): { readonly values: ThemeMacroValues; readonly changedIds: ReadonlySet<string> } {
  const values: Record<string, ThemeMacroValue> = {};
  const changed = new Set<string>();
  const stored = bucket?.macros ?? {};
  for (const macro of config.macros ?? []) {
    const base = macroDefaultForTheme(macro, theme);
    if (isSafeObjectKey(macro.id) && hasOwn(stored, macro.id)) {
      const override = stored[macro.id];
      if (isValidMacroValueForControl(macro, override)) {
        values[macro.id] = override;
        if (override !== base) {
          changed.add(macro.id);
        }
        continue;
      }
    }
    if (base !== undefined) {
      values[macro.id] = base;
    }
  }
  return { values, changedIds: changed };
}

export function computeThemeTokens(
  config: ThemeEditorConfig,
  theme: WorkbenchTheme,
  bucket: ThemeOverrideBucket | undefined,
): {
  readonly derived: Readonly<Record<string, string>>;
  readonly effective: Readonly<Record<string, string>>;
} {
  const { values, changedIds } = resolvedMacroValues(config, theme, bucket);
  const derived: Record<string, string> = {};
  if (changedIds.size > 0 && config.computeMacros) {
    const computed = config.computeMacros(theme, values, changedIds);
    for (const [key, val] of Object.entries(computed)) {
      if (isValidCustomProperty(key) && isSafeCssValue(val)) {
        derived[key] = val.trim();
      }
    }
  }
  const effective: Record<string, string> = { ...derived };
  for (const [key, val] of Object.entries(bucket?.raw ?? {})) {
    if (isValidCustomProperty(key) && isSafeCssValue(val)) {
      effective[key] = val.trim();
    }
  }
  return { derived, effective };
}

export function countThemeChanges(
  config: ThemeEditorConfig,
  theme: WorkbenchTheme,
  bucket: ThemeOverrideBucket | undefined,
): number {
  if (!bucket) {
    return 0;
  }
  const { effective } = computeThemeTokens(config, theme, bucket);
  return Object.keys(effective).length;
}

export function countAllChanges(
  config: ThemeEditorConfig,
  themes: readonly WorkbenchTheme[],
  store: ThemeOverridesStore,
): number {
  let total = 0;
  for (const theme of themes) {
    total += countThemeChanges(config, theme, getThemeBucket(store, theme.id));
  }
  return total;
}

function partitionScopedDeclarations(
  effective: Readonly<Record<string, string>>,
  overlayTokenNames: ReadonlySet<string>,
  sort: boolean,
): { readonly themeEntries: readonly string[]; readonly overlayEntries: readonly string[] } {
  const entries = sort
    ? Object.entries(effective).sort(([a], [b]) => a.localeCompare(b))
    : Object.entries(effective);
  const themeEntries: string[] = [];
  const overlayEntries: string[] = [];
  for (const [name, value] of entries) {
    const decl = `  ${name}: ${value};`;
    if (overlayTokenNames.has(name)) {
      overlayEntries.push(decl);
    } else {
      themeEntries.push(decl);
    }
  }
  return { themeEntries, overlayEntries };
}

export function buildScopedOverrideStylesheet(
  config: ThemeEditorConfig,
  themes: readonly WorkbenchTheme[],
  store: ThemeOverridesStore,
): string {
  const overlayTokenNames = new Set(
    config.tokens.filter((token) => token.scope === 'overlay').map((token) => token.name),
  );
  const rules: string[] = [];
  for (const theme of themes) {
    const bucket = getThemeBucket(store, theme.id);
    if (!bucket) {
      continue;
    }
    const { effective } = computeThemeTokens(config, theme, bucket);
    const { themeEntries, overlayEntries } = partitionScopedDeclarations(
      effective,
      overlayTokenNames,
      false,
    );
    const selectorId = escapeCssString(theme.id, "'");
    if (themeEntries.length > 0) {
      rules.push(
        `.wb-shell .wb-artboard[data-theme='${selectorId}'] {\n${themeEntries.join('\n')}\n}`,
      );
    }
    if (overlayEntries.length > 0) {
      rules.push(
        `.wb-shell .wb-artboard[data-theme='${selectorId}'] [data-surface='overlay'] {\n${overlayEntries.join('\n')}\n}`,
      );
    }
  }
  return rules.join('\n\n');
}

export function formatExportCss(
  config: ThemeEditorConfig,
  themes: readonly WorkbenchTheme[],
  store: ThemeOverridesStore,
  targetThemeId?: string,
): string {
  const overlayTokenNames = new Set(
    config.tokens.filter((token) => token.scope === 'overlay').map((token) => token.name),
  );
  const selected = targetThemeId ? themes.filter((theme) => theme.id === targetThemeId) : themes;
  const blocks: string[] = [];
  for (const theme of selected) {
    const { effective } = computeThemeTokens(config, theme, getThemeBucket(store, theme.id));
    const { themeEntries, overlayEntries } = partitionScopedDeclarations(
      effective,
      overlayTokenNames,
      true,
    );
    const selectorId = escapeCssString(theme.id, "'");
    if (themeEntries.length > 0) {
      blocks.push(`[data-theme='${selectorId}'] {\n${themeEntries.join('\n')}\n}`);
    }
    if (overlayEntries.length > 0) {
      blocks.push(
        `[data-theme='${selectorId}'] [data-surface='overlay'] {\n${overlayEntries.join('\n')}\n}`,
      );
    }
  }
  return blocks.join('\n\n');
}

// ---------- Color parsing (sRGB + CSS Color 4) & WCAG 2.1 contrast ----------

const NUM = '(?:[+-]?(?:[0-9]+(?:\\.[0-9]+)?|\\.[0-9]+))';
const RGB_RE = new RegExp(
  `^rgba?\\(\\s*(${NUM}%?)(?:\\s*,\\s*|\\s+)(${NUM}%?)(?:\\s*,\\s*|\\s+)(${NUM}%?)(?:\\s*(?:,|\\/)\\s*(${NUM}%?))?\\s*\\)$`,
);
const SRGB_RE = new RegExp(
  `^color\\(\\s*srgb\\s+(${NUM}%?)\\s+(${NUM}%?)\\s+(${NUM}%?)(?:\\s*\\/\\s*(${NUM}%?))?\\s*\\)$`,
);
const OKLCH_RE = new RegExp(
  `^oklch\\(\\s*(${NUM}%?)\\s+(${NUM}%?)\\s+(${NUM}(?:deg|rad|grad|turn)?)(?:\\s*\\/\\s*(${NUM}%?))?\\s*\\)$`,
);
const OKLAB_RE = new RegExp(
  `^oklab\\(\\s*(${NUM}%?)\\s+(${NUM}%?)\\s+(${NUM}%?)(?:\\s*\\/\\s*(${NUM}%?))?\\s*\\)$`,
);
const HSL_RE = new RegExp(
  `^hsla?\\(\\s*(${NUM}(?:deg|rad|grad|turn)?)(?:\\s*,\\s*|\\s+)(${NUM}%)(?:\\s*,\\s*|\\s+)(${NUM}%)(?:\\s*(?:,|\\/)\\s*(${NUM}%?))?\\s*\\)$`,
);

function parseAlpha(token: string | undefined): number | null {
  if (token === undefined) {
    return 1;
  }
  const num = Number.parseFloat(token);
  if (!Number.isFinite(num)) {
    return null;
  }
  return Math.max(0, Math.min(1, token.endsWith('%') ? num / 100 : num));
}

function parseAngleDeg(token: string): number | null {
  const num = Number.parseFloat(token);
  if (!Number.isFinite(num)) {
    return null;
  }
  if (token.endsWith('grad')) {
    return num * 0.9;
  }
  if (token.endsWith('rad')) {
    return (num * 180) / Math.PI;
  }
  if (token.endsWith('turn')) {
    return num * 360;
  }
  return num;
}

function linearSrgbFromOklab(L: number, a: number, b: number): readonly [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function linearToByte(channel: number): number {
  const c = Math.max(0, Math.min(1, channel));
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(v * 255);
}

function oklabToParsedColor(L: number, a: number, b: number, alpha: number): ParsedColor {
  const clampedL = Math.max(0, Math.min(1, L));
  let [r, g, bLin] = linearSrgbFromOklab(clampedL, a, b);
  if (r < 0 || r > 1 || g < 0 || g > 1 || bLin < 0 || bLin > 1) {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 12; i += 1) {
      const mid = (lo + hi) * 0.5;
      const [mr, mg, mb] = linearSrgbFromOklab(clampedL, a * mid, b * mid);
      if (mr >= 0 && mr <= 1 && mg >= 0 && mg <= 1 && mb >= 0 && mb <= 1) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    [r, g, bLin] = linearSrgbFromOklab(clampedL, a * lo, b * lo);
  }
  return { r: linearToByte(r), g: linearToByte(g), b: linearToByte(bLin), a: alpha };
}

export function parseCssColor(input: string): ParsedColor | null {
  const value = input.trim().toLowerCase();
  if (!value) {
    return null;
  }
  if (value === 'transparent') {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(value);
  if (hexMatch) {
    const raw = hexMatch[1]!;
    if (raw.length === 3 || raw.length === 4) {
      const r = Number.parseInt(raw[0]! + raw[0]!, 16);
      const g = Number.parseInt(raw[1]! + raw[1]!, 16);
      const b = Number.parseInt(raw[2]! + raw[2]!, 16);
      const a = raw.length === 4 ? Number.parseInt(raw[3]! + raw[3]!, 16) / 255 : 1;
      return { r, g, b, a };
    }
    const r = Number.parseInt(raw.slice(0, 2), 16);
    const g = Number.parseInt(raw.slice(2, 4), 16);
    const b = Number.parseInt(raw.slice(4, 6), 16);
    const a = raw.length === 8 ? Number.parseInt(raw.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  const rgbMatch = RGB_RE.exec(value);
  if (rgbMatch) {
    const parseChannel = (token: string): number | null => {
      const num = Number.parseFloat(token);
      if (!Number.isFinite(num)) {
        return null;
      }
      return token.endsWith('%')
        ? Math.round(Math.max(0, Math.min(100, num)) * 2.55)
        : Math.round(Math.max(0, Math.min(255, num)));
    };
    const r = parseChannel(rgbMatch[1]!);
    const g = parseChannel(rgbMatch[2]!);
    const b = parseChannel(rgbMatch[3]!);
    const a = parseAlpha(rgbMatch[4]);
    if (r === null || g === null || b === null || a === null) {
      return null;
    }
    return { r, g, b, a };
  }

  const srgbMatch = SRGB_RE.exec(value);
  if (srgbMatch) {
    const parseUnit = (token: string): number | null => {
      const num = Number.parseFloat(token);
      if (!Number.isFinite(num)) {
        return null;
      }
      const normalized = token.endsWith('%') ? num / 100 : num;
      return Math.round(Math.max(0, Math.min(1, normalized)) * 255);
    };
    const r = parseUnit(srgbMatch[1]!);
    const g = parseUnit(srgbMatch[2]!);
    const b = parseUnit(srgbMatch[3]!);
    const a = parseAlpha(srgbMatch[4]);
    if (r === null || g === null || b === null || a === null) {
      return null;
    }
    return { r, g, b, a };
  }

  const oklchMatch = OKLCH_RE.exec(value);
  if (oklchMatch) {
    const lRaw = Number.parseFloat(oklchMatch[1]!);
    const cRaw = Number.parseFloat(oklchMatch[2]!);
    const hDeg = parseAngleDeg(oklchMatch[3]!);
    const alpha = parseAlpha(oklchMatch[4]);
    if (!Number.isFinite(lRaw) || !Number.isFinite(cRaw) || hDeg === null || alpha === null) {
      return null;
    }
    const L = oklchMatch[1]!.endsWith('%') ? lRaw / 100 : lRaw;
    const C = Math.max(0, oklchMatch[2]!.endsWith('%') ? (cRaw / 100) * 0.4 : cRaw);
    const rad = (hDeg * Math.PI) / 180;
    return oklabToParsedColor(L, C * Math.cos(rad), C * Math.sin(rad), alpha);
  }

  const oklabMatch = OKLAB_RE.exec(value);
  if (oklabMatch) {
    const lRaw = Number.parseFloat(oklabMatch[1]!);
    const aRaw = Number.parseFloat(oklabMatch[2]!);
    const bRaw = Number.parseFloat(oklabMatch[3]!);
    const alpha = parseAlpha(oklabMatch[4]);
    if (
      !Number.isFinite(lRaw) ||
      !Number.isFinite(aRaw) ||
      !Number.isFinite(bRaw) ||
      alpha === null
    ) {
      return null;
    }
    const L = oklabMatch[1]!.endsWith('%') ? lRaw / 100 : lRaw;
    const a = oklabMatch[2]!.endsWith('%') ? (aRaw / 100) * 0.4 : aRaw;
    const b = oklabMatch[3]!.endsWith('%') ? (bRaw / 100) * 0.4 : bRaw;
    return oklabToParsedColor(L, a, b, alpha);
  }

  const hslMatch = HSL_RE.exec(value);
  if (hslMatch) {
    const hDeg = parseAngleDeg(hslMatch[1]!);
    const sRaw = Number.parseFloat(hslMatch[2]!);
    const lRaw = Number.parseFloat(hslMatch[3]!);
    const alpha = parseAlpha(hslMatch[4]);
    if (hDeg === null || !Number.isFinite(sRaw) || !Number.isFinite(lRaw) || alpha === null) {
      return null;
    }
    const h = ((hDeg % 360) + 360) % 360;
    const s = Math.max(0, Math.min(1, sRaw / 100));
    const l = Math.max(0, Math.min(1, lRaw / 100));
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    const [r1, g1, b1]: readonly [number, number, number] =
      h < 60
        ? [c, x, 0]
        : h < 120
          ? [x, c, 0]
          : h < 180
            ? [0, c, x]
            : h < 240
              ? [0, x, c]
              : h < 300
                ? [x, 0, c]
                : [c, 0, x];
    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255),
      a: alpha,
    };
  }

  return null;
}

export function colorToHex(color: ParsedColor): string {
  const clamp = (n: number): string =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${clamp(color.r)}${clamp(color.g)}${clamp(color.b)}`;
}

export function compositeOver(fg: ParsedColor, bg: ParsedColor): ParsedColor {
  const alpha = Math.max(0, Math.min(1, fg.a));
  return {
    r: fg.r * alpha + bg.r * (1 - alpha),
    g: fg.g * alpha + bg.g * (1 - alpha),
    b: fg.b * alpha + bg.b * (1 - alpha),
    a: 1,
  };
}

function channelToLinear(channel: number): number {
  const s = Math.max(0, Math.min(255, channel)) / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: ParsedColor): number {
  return (
    0.2126 * channelToLinear(color.r) +
    0.7152 * channelToLinear(color.g) +
    0.0722 * channelToLinear(color.b)
  );
}

export function resolveContrastPair(
  foreground: ParsedColor,
  background: ParsedColor,
  backdrop?: ParsedColor,
): ContrastResolution {
  const resolvedBg =
    background.a < 1 && backdrop ? compositeOver(background, backdrop) : { ...background, a: 1 };
  const resolvedFg =
    foreground.a < 1 ? compositeOver(foreground, resolvedBg) : { ...foreground, a: 1 };
  const l1 = relativeLuminance(resolvedFg);
  const l2 = relativeLuminance(resolvedBg);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return {
    ratio: (hi + 0.05) / (lo + 0.05),
    foreground: resolvedFg,
    background: resolvedBg,
  };
}

export function contrastRatio(
  foreground: ParsedColor,
  background: ParsedColor,
  backdrop?: ParsedColor,
): number {
  return resolveContrastPair(foreground, background, backdrop).ratio;
}

// ---------- Safe localStorage persistence ----------

const DEFAULT_STORAGE_KEY = 'wb-theme-overrides-v1';

function resolveStorageKey(config: ThemeEditorConfig): string {
  return config.storageKey || DEFAULT_STORAGE_KEY;
}

export function loadThemeOverrides(config: ThemeEditorConfig): ThemeOverridesStore {
  try {
    const raw = window.localStorage.getItem(resolveStorageKey(config));
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const macroById = new Map((config.macros ?? []).map((macro) => [macro.id, macro]));
    const result: Record<string, ThemeOverrideBucket> = {};
    for (const [themeId, entry] of Object.entries(parsed as Record<string, unknown>)) {
      if (
        !isSafeObjectKey(themeId) ||
        !entry ||
        typeof entry !== 'object' ||
        Array.isArray(entry)
      ) {
        continue;
      }
      const bucket = entry as Record<string, unknown>;
      const macros: Record<string, ThemeMacroValue> = {};
      if (bucket.macros && typeof bucket.macros === 'object' && !Array.isArray(bucket.macros)) {
        for (const [id, val] of Object.entries(bucket.macros as Record<string, unknown>)) {
          if (!isSafeObjectKey(id)) {
            continue;
          }
          const macro = macroById.get(id);
          if (macro && isValidMacroValueForControl(macro, val)) {
            macros[id] = typeof val === 'string' ? val.trim() : val;
          }
        }
      }
      const rawTokens: Record<string, string> = {};
      if (bucket.raw && typeof bucket.raw === 'object' && !Array.isArray(bucket.raw)) {
        for (const [name, val] of Object.entries(bucket.raw as Record<string, unknown>)) {
          if (typeof val === 'string' && isValidCustomProperty(name) && isSafeCssValue(val)) {
            rawTokens[name] = val.trim();
          }
        }
      }
      if (Object.keys(macros).length > 0 || Object.keys(rawTokens).length > 0) {
        result[themeId] = { macros, raw: rawTokens };
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function saveThemeOverrides(config: ThemeEditorConfig, store: ThemeOverridesStore): void {
  try {
    const key = resolveStorageKey(config);
    const cleaned: Record<string, ThemeOverrideBucket> = {};
    for (const [themeId, bucket] of Object.entries(store)) {
      if (!isSafeObjectKey(themeId)) {
        continue;
      }
      if (Object.keys(bucket.macros).length > 0 || Object.keys(bucket.raw).length > 0) {
        cleaned[themeId] = bucket;
      }
    }
    if (Object.keys(cleaned).length === 0) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(cleaned));
    }
  } catch {
    // Ignore private-mode or quota errors cleanly.
  }
}
