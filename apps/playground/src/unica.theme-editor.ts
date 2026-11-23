import type {
  ThemeContrastPair,
  ThemeEditorConfig,
  ThemeMacroControl,
  ThemeMacroValues,
  ThemeTokenDefinition,
  WorkbenchTheme,
} from './workbench/types.js';
import { contrastRatio, hasOwn, parseCssColor } from './workbench/themeEditorState.js';

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function linearSrgbFromOklch(L: number, C: number, H: number): readonly [number, number, number] {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
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

function inSrgbGamut(rgb: readonly [number, number, number]): boolean {
  return rgb[0] >= 0 && rgb[0] <= 1 && rgb[1] >= 0 && rgb[1] <= 1 && rgb[2] >= 0 && rgb[2] <= 1;
}

// Gamut-map by reducing OKLCH chroma at fixed (L, H) so saturated accents keep exact hue.
function oklchToRgb(L: number, C: number, H: number): readonly [number, number, number] {
  const safeL = clamp(L, 0.02, 0.999);
  const safeC = Math.max(0, C);
  let lin = linearSrgbFromOklch(safeL, safeC, H);
  if (!inSrgbGamut(lin) && safeC > 0) {
    let lo = 0;
    let hi = safeC;
    for (let i = 0; i < 12; i += 1) {
      const mid = (lo + hi) * 0.5;
      if (inSrgbGamut(linearSrgbFromOklch(safeL, mid, H))) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    lin = linearSrgbFromOklch(safeL, lo, H);
  }
  const toByte = (channel: number): number => {
    const c = clamp(channel, 0, 1);
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.round(v * 255);
  };
  return [toByte(lin[0]), toByte(lin[1]), toByte(lin[2])];
}

function oklchToHex(L: number, C: number, H: number): string {
  const [r, g, b] = oklchToRgb(L, C, H);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

function oklchToRgbCss(L: number, C: number, H: number): string {
  const [r, g, b] = oklchToRgb(L, C, H);
  return `${r} ${g} ${b}`;
}

function colorToOklch(colorText: string): {
  readonly L: number;
  readonly C: number;
  readonly H: number;
  readonly a: number;
} {
  const parsed = parseCssColor(colorText);
  if (!parsed) {
    return { L: 0.55, C: 0.14, H: 260, a: 1 };
  }
  const toLin = (v: number): number => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = toLin(parsed.r);
  const g = toLin(parsed.g);
  const b = toLin(parsed.b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const aVal = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bVal = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return {
    L: clamp(L, 0, 1),
    C: Math.hypot(aVal, bVal),
    H: ((Math.atan2(bVal, aVal) * 180) / Math.PI + 360) % 360,
    a: parsed.a,
  };
}

function shortestAngleDelta(target: number, base: number): number {
  let d = ((((target - base) % 360) + 540) % 360) - 180;
  if (d === -180 && target > base) {
    d = 180;
  }
  return d;
}

function pickContrastingInk(solidHex: string, hue: number): string {
  const solid = parseCssColor(solidHex);
  const lightInk = oklchToHex(0.988, 0.006, hue);
  const darkInk = oklchToHex(0.165, 0.024, hue);
  if (!solid) {
    return lightInk;
  }
  const lightColor = parseCssColor(lightInk)!;
  const darkColor = parseCssColor(darkInk)!;
  return contrastRatio(darkColor, solid) >= contrastRatio(lightColor, solid) ? darkInk : lightInk;
}

interface PresetNeutralBaseline {
  readonly hue: number;
  readonly chroma: number;
  readonly canvasL: number;
  readonly surfaces: Readonly<Record<string, string>>;
  readonly borders: Readonly<Record<string, string>>;
  readonly inks: Readonly<Record<string, string>>;
  readonly neutralAccents: Readonly<Record<string, string>>;
  readonly controls: Readonly<Record<string, string>>;
  readonly shadowColor: string;
  readonly scrimAlpha: number;
  readonly pixelShadowAlpha?: number;
  readonly pixelTooltipOffset?: string;
}

// Measured baseline tokens from packages/ui/src/styles.css so macro deltas start smoothly at 0 jump.
const NEUTRAL_BASELINES: Readonly<Record<string, PresetNeutralBaseline>> = {
  'soft-dark': {
    hue: 244,
    chroma: 0.015,
    canvasL: 0.268,
    surfaces: {
      '--bg-shell': '#151a1e',
      '--bg-aside': '#1a2025',
      '--bg-canvas': '#20272d',
      '--bg-surface-subtle': '#242c33',
      '--bg-surface': '#273038',
      '--bg-surface-raised': '#303a44',
      '--bg-overlay': '#28323b',
    },
    borders: {
      '--border-subtle': '#2c363f',
      '--border-default': '#37434e',
      '--border-strong': '#455360',
      '--control-border-focus': '#84939e',
      '--_binary-border': '#84939e',
      '--_binary-border-hover': '#a6b3bc',
    },
    inks: {
      '--fg-primary': '#f7efe0',
      '--fg-secondary': '#e4d8c5',
      '--fg-muted': '#b6b8b2',
      '--fg-subtle': '#909da5',
      '--fg-disabled': '#67747d',
      '--fg-on-neutral': '#f7efe0',
      '--neutral-soft-fg': '#e4d8c5',
      '--neutral-signal': '#b6b8b2',
      '--_chip-fg': '#e4d8c5',
      '--focus-ring-color': '#f7efe0',
    },
    neutralAccents: {
      '--neutral-solid': '#43505c',
      '--neutral-solid-hover': '#52616f',
      '--neutral-solid-active': '#36414b',
      '--neutral-soft-bg': '#333f48',
    },
    controls: {
      '--_btn-secondary-bg': '#313c46',
      '--_btn-secondary-bg-hover': '#3b4854',
      '--_switch-track-off': '#2e3942',
      '--_switch-track-off-hover': '#3a4752',
      '--_segmented-rail-bg': '#191f25',
      '--_segmented-thumb-bg': '#34414b',
      '--_chip-bg': '#333f48',
      '--_kbd-cap-bg': '#222b33',
      '--_kbd-cap-border': '#3c4954',
      '--_base-choice-card-bg': '#212930',
      '--_overlay-choice-card-bg': '#232b33',
      '--_base-choice-card-border': '#37434e',
      '--_overlay-choice-card-border': '#2c363f',
      '--_base-control-bg': '#1a2026',
      '--_overlay-control-bg': '#1f272e',
      '--_base-control-border': '#455360',
      '--_overlay-control-border': '#3d4b57',
      '--_base-control-border-hover': '#5c6d7c',
      '--_overlay-control-border-hover': '#455360',
    },
    shadowColor: '#0c1014',
    scrimAlpha: 0.541,
  },
  'soft-light': {
    hue: 83,
    chroma: 0.024,
    canvasL: 0.964,
    surfaces: {
      '--bg-shell': '#eadbc5',
      '--bg-aside': '#f3e7d3',
      '--bg-canvas': '#fbf2e1',
      '--bg-surface-subtle': '#f5ecda',
      '--bg-surface': '#fffcf5',
      '--bg-surface-raised': '#f8efe0',
      '--bg-overlay': '#fffdf8',
    },
    borders: {
      '--border-subtle': '#e6d8c2',
      '--border-default': '#d6c5ac',
      '--border-strong': '#c2af94',
      '--control-border-focus': '#736659',
      '--_binary-border': '#736659',
      '--_binary-border-hover': '#574d43',
    },
    inks: {
      '--fg-primary': '#292421',
      '--fg-secondary': '#3d3733',
      '--fg-muted': '#524a44',
      '--fg-subtle': '#6d635a',
      '--fg-disabled': '#8c8075',
      '--fg-on-neutral': '#fffcf5',
      '--neutral-soft-fg': '#3d3733',
      '--neutral-signal': '#524a44',
      '--_chip-fg': '#3d3733',
      '--focus-ring-color': '#292421',
    },
    neutralAccents: {
      '--neutral-solid': '#3d3733',
      '--neutral-solid-hover': '#524a44',
      '--neutral-solid-active': '#292421',
      '--neutral-soft-bg': '#e6d7be',
    },
    controls: {
      '--_btn-secondary-bg': '#efe3cf',
      '--_btn-secondary-bg-hover': '#e5d5bc',
      '--_switch-track-off': '#a18f76',
      '--_switch-track-off-hover': '#98866a',
      '--_segmented-rail-bg': '#efe3cf',
      '--_segmented-thumb-bg': '#fffefa',
      '--_chip-bg': '#e6d7be',
      '--_kbd-cap-bg': '#f4ead8',
      '--_kbd-cap-border': '#d6c5ac',
      '--_base-choice-card-bg': '#fffdf8',
      '--_overlay-choice-card-bg': '#fbf4e6',
      '--_base-choice-card-border': '#d6c5ac',
      '--_overlay-choice-card-border': '#e6d8c2',
      '--_base-control-bg': '#fffefa',
      '--_overlay-control-bg': '#f7efe0',
      '--_base-control-border': '#c2af94',
      '--_overlay-control-border': '#cbb89d',
      '--_base-control-border-hover': '#9c886e',
      '--_overlay-control-border-hover': '#c2af94',
    },
    shadowColor: '#292421',
    scrimAlpha: 0.161,
  },
  'frost-dark': {
    hue: 269,
    chroma: 0.023,
    canvasL: 0.197,
    surfaces: {
      '--bg-shell': '#07090e',
      '--bg-aside': '#0c0f17',
      '--bg-canvas': '#111520',
      '--bg-surface-subtle': '#151a26',
      '--bg-surface': '#181d2b',
      '--bg-surface-raised': '#202638',
      '--bg-overlay': 'rgb(18 23 38 / 0.5658)',
    },
    borders: {
      '--border-subtle': '#202738',
      '--border-default': '#2c354b',
      '--border-strong': '#394460',
      '--control-border-focus': '#7280a3',
      '--_binary-border': '#7280a3',
      '--_binary-border-hover': '#93a2c7',
      '--neutral-border': '#2c354b',
      '--_btn-secondary-border': '#3d4968',
      '--_chip-border': '#394460',
    },
    inks: {
      '--fg-primary': '#f4f7ff',
      '--fg-secondary': '#ccd4e6',
      '--fg-muted': '#9eaac4',
      '--fg-subtle': '#7d89a5',
      '--fg-disabled': '#525c75',
      '--fg-on-neutral': '#f4f7ff',
      '--neutral-soft-fg': '#ccd4e6',
      '--neutral-signal': '#ccd4e6',
      '--_chip-fg': '#ccd4e6',
      '--focus-ring-color': '#f4f7ff',
    },
    neutralAccents: {
      '--neutral-solid': '#38435e',
      '--neutral-solid-hover': '#465373',
      '--neutral-solid-active': '#2c354c',
      '--neutral-soft-bg': '#1d2436',
    },
    controls: {
      '--_btn-secondary-bg': '#1f273b',
      '--_btn-secondary-bg-hover': '#28324b',
      '--_switch-track-off': '#20273a',
      '--_switch-track-off-hover': '#2b344d',
      '--_segmented-rail-bg': '#0c1019',
      '--_segmented-thumb-bg': '#28334a',
      '--_chip-bg': '#1b2132',
      '--_kbd-cap-bg': '#192030',
      '--_kbd-cap-border': '#313b54',
      '--_base-choice-card-bg': 'rgb(19 24 38 / 0.851)',
      '--_base-choice-card-border': '#2c354b',
      '--_base-control-bg': 'rgb(12 15 24 / 0.922)',
      '--_base-control-border': '#394460',
      '--_base-control-border-hover': '#4f5d80',
      '--_table-overlay-header-bg': '#101522',
    },
    shadowColor: '#04060c',
    scrimAlpha: 0.478,
  },
  'frost-light': {
    hue: 265,
    chroma: 0.006,
    canvasL: 0.979,
    surfaces: {
      '--bg-shell': '#e8ecf5',
      '--bg-aside': '#eff2f9',
      '--bg-canvas': '#f6f8fc',
      '--bg-surface-subtle': '#f0f3fa',
      '--bg-surface': '#ffffff',
      '--bg-surface-raised': '#f3f6fc',
      '--bg-overlay': 'rgb(246 248 255 / 0.63058)',
    },
    borders: {
      '--border-subtle': '#dfe5f0',
      '--border-default': '#cdd5e5',
      '--border-strong': '#b8c3d8',
      '--control-border-focus': '#626f8a',
      '--_binary-border': '#626f8a',
      '--_binary-border-hover': '#48536b',
      '--neutral-border': '#cdd5e5',
      '--_btn-secondary-border': '#c2cde2',
      '--_chip-border': '#b8c3d8',
    },
    inks: {
      '--fg-primary': '#0c101c',
      '--fg-secondary': '#232a3b',
      '--fg-muted': '#444f66',
      '--fg-subtle': '#5f6b85',
      '--fg-disabled': '#8490ab',
      '--fg-on-neutral': '#f6f8fc',
      '--neutral-soft-fg': '#232a3b',
      '--neutral-signal': '#232a3b',
      '--_chip-fg': '#232a3b',
      '--focus-ring-color': '#0c101c',
    },
    neutralAccents: {
      '--neutral-solid': '#141926',
      '--neutral-solid-hover': '#20283d',
      '--neutral-solid-active': '#0c101a',
      '--neutral-soft-bg': '#eef2fa',
    },
    controls: {
      '--_btn-secondary-bg': '#f3f6fc',
      '--_btn-secondary-bg-hover': '#e6ecf7',
      '--_switch-track-off': '#8792ac',
      '--_switch-track-off-hover': '#7b88a3',
      '--_segmented-rail-bg': '#e8edf6',
      '--_segmented-thumb-bg': '#ffffff',
      '--_chip-bg': '#f1f4fb',
      '--_kbd-cap-bg': '#f0f3fa',
      '--_kbd-cap-border': '#cdd5e5',
      '--_base-choice-card-bg': '#ffffff',
      '--_overlay-choice-card-bg': 'rgb(15 23 42 / 0.024)',
      '--_base-choice-card-border': '#cdd5e5',
      '--_base-control-bg': '#ffffff',
      '--_overlay-control-bg': 'rgb(15 23 42 / 0.031)',
      '--_base-control-border': '#b8c3d8',
      '--_base-control-border-hover': '#8a97b3',
      '--_table-overlay-header-bg': '#dfe3eb',
    },
    shadowColor: '#0c1222',
    scrimAlpha: 0.149,
  },
  'pixel-dark': {
    hue: 248,
    chroma: 0.01,
    canvasL: 0.193,
    surfaces: {
      '--bg-shell': '#090b0d',
      '--bg-aside': '#0d1013',
      '--bg-canvas': '#111519',
      '--bg-surface-subtle': '#151a1f',
      '--bg-surface': '#161b20',
      '--bg-surface-raised': '#1d242b',
      '--bg-overlay': '#14191e',
    },
    borders: {
      '--border-subtle': '#222b33',
      '--border-default': '#303c47',
      '--border-strong': '#41505e',
      '--control-border-focus': '#7a8e9f',
      '--_binary-border': '#7a8e9f',
      '--_binary-border-hover': '#9db0c0',
      '--neutral-border': '#41505e',
      '--_btn-secondary-border': '#41505e',
      '--_chip-border': '#41505e',
    },
    inks: {
      '--fg-primary': '#edf3f7',
      '--fg-secondary': '#cad6e0',
      '--fg-muted': '#9fb0be',
      '--fg-subtle': '#788896',
      '--fg-disabled': '#556472',
      '--fg-on-neutral': '#edf3f7',
      '--neutral-soft-fg': '#cad6e0',
      '--neutral-signal': '#cad6e0',
      '--_chip-fg': '#cad6e0',
    },
    neutralAccents: {
      '--neutral-solid': '#29333d',
      '--neutral-solid-hover': '#35414e',
      '--neutral-solid-active': '#1f272f',
      '--neutral-soft-bg': '#181f26',
    },
    controls: {
      '--_btn-secondary-bg': '#181e24',
      '--_btn-secondary-bg-hover': '#202830',
      '--_switch-track-off': '#1d252d',
      '--_switch-track-off-hover': '#28333e',
      '--_segmented-rail-bg': '#0b0f13',
      '--_segmented-thumb-bg': '#2b3944',
      '--_chip-bg': '#161c22',
      '--_kbd-cap-bg': '#0e1318',
      '--_kbd-cap-border': '#41505e',
      '--_base-choice-card-bg': '#11161b',
      '--_overlay-choice-card-bg': '#11161b',
      '--_base-choice-card-border': '#303c47',
      '--_overlay-choice-card-border': '#303c47',
      '--_base-control-bg': '#0b0e11',
      '--_overlay-control-bg': '#0d1115',
      '--_base-control-border': '#41505e',
      '--_overlay-control-border': '#41505e',
      '--_base-control-border-hover': '#596d80',
      '--_overlay-control-border-hover': '#596d80',
    },
    shadowColor: '#020406',
    scrimAlpha: 0.639,
    pixelShadowAlpha: 0.878,
    pixelTooltipOffset: '2px 2px 0px 0',
  },
  'pixel-light': {
    hue: 236,
    chroma: 0.004,
    canvasL: 0.968,
    surfaces: {
      '--bg-shell': '#dde2e6',
      '--bg-aside': '#e7ebee',
      '--bg-canvas': '#f2f5f7',
      '--bg-surface-subtle': '#edf1f4',
      '--bg-surface': '#ffffff',
      '--bg-surface-raised': '#f6f8fa',
      '--bg-overlay': '#ffffff',
    },
    borders: {
      '--border-subtle': '#cfd8df',
      '--border-default': '#b6c2cc',
      '--border-strong': '#98a7b3',
      '--control-border-focus': '#546370',
      '--_binary-border': '#546370',
      '--_binary-border-hover': '#3b4854',
      '--neutral-border': '#98a7b3',
      '--_btn-secondary-border': '#98a7b3',
      '--_chip-border': '#98a7b3',
    },
    inks: {
      '--fg-primary': '#0f1419',
      '--fg-secondary': '#222b33',
      '--fg-muted': '#3e4c58',
      '--fg-subtle': '#596875',
      '--fg-disabled': '#7a8a97',
      '--fg-on-neutral': '#ffffff',
      '--neutral-soft-fg': '#222b33',
      '--neutral-signal': '#222b33',
      '--_chip-fg': '#222b33',
    },
    neutralAccents: {
      '--neutral-solid': '#1e262e',
      '--neutral-solid-hover': '#2c3742',
      '--neutral-solid-active': '#12171c',
      '--neutral-soft-bg': '#edf1f4',
    },
    controls: {
      '--_btn-secondary-bg': '#f4f7f9',
      '--_btn-secondary-bg-hover': '#e8edf1',
      '--_switch-track-off': '#88949d',
      '--_switch-track-off-hover': '#7d8a94',
      '--_segmented-rail-bg': '#e0e8ed',
      '--_segmented-thumb-bg': '#ffffff',
      '--_chip-bg': '#edf1f4',
      '--_kbd-cap-bg': '#eaf0f4',
      '--_kbd-cap-border': '#98a7b3',
      '--_base-choice-card-bg': '#fafcfd',
      '--_overlay-choice-card-bg': '#f7f9fb',
      '--_base-choice-card-border': '#b6c2cc',
      '--_overlay-choice-card-border': '#b6c2cc',
      '--_base-control-bg': '#ffffff',
      '--_overlay-control-bg': '#f7f9fb',
      '--_base-control-border': '#98a7b3',
      '--_overlay-control-border': '#98a7b3',
      '--_base-control-border-hover': '#6d7d8b',
      '--_overlay-control-border-hover': '#6d7d8b',
    },
    shadowColor: '#0f1419',
    scrimAlpha: 0.2,
    pixelShadowAlpha: 0.188,
    pixelTooltipOffset: '4px 4px 0px 0',
  },
};

const NEUTRAL_MACRO_IDS = new Set([
  'neutralHue',
  'neutralChroma',
  'canvasDepth',
  'surfaceContrast',
]);

function formatOklchColor(L: number, C: number, H: number, alpha: number): string {
  if (alpha < 0.999) {
    const roundedAlpha = Number(alpha.toFixed(4));
    return `rgb(${oklchToRgbCss(L, C, H)} / ${roundedAlpha})`;
  }
  return oklchToHex(L, C, H);
}

function shiftNeutralToken(
  baseColor: string,
  baseline: PresetNeutralBaseline,
  params: {
    readonly dH: number;
    readonly dC: number;
    readonly canvasL: number;
    readonly stepScale: number;
    readonly anchorLightness: boolean;
    readonly minL: number;
    readonly maxL: number;
    readonly chromaScaleWeight?: number;
  },
): string {
  const { L: L0, C: C0, H: H0, a } = colorToOklch(baseColor);
  const nextL = params.anchorLightness
    ? clamp(params.canvasL + (L0 - baseline.canvasL) * params.stepScale, params.minL, params.maxL)
    : clamp(L0, params.minL, params.maxL);
  // Preserve each preset's intentional chroma ratios while staying strictly continuous at dC = 0.
  const baseCScale = Math.max(0.35, C0 / Math.max(baseline.chroma, 0.008));
  const weight = params.chromaScaleWeight ?? 1;
  const nextC =
    C0 < 0.0005 && params.dC <= 0
      ? 0
      : clamp(C0 + params.dC * Math.min(2.2, baseCScale) * weight, 0, 0.09);
  const nextH = (C0 < 0.001 ? baseline.hue + params.dH : H0 + params.dH + 360) % 360;
  return formatOklchColor(nextL, nextC, nextH, a);
}

function computeNeutralLadder(
  theme: WorkbenchTheme,
  changedIds: ReadonlySet<string>,
  hue: number,
  chroma: number,
  canvasL: number,
  stepScale: number,
): Record<string, string> {
  const baseline = hasOwn(NEUTRAL_BASELINES, theme.id)
    ? NEUTRAL_BASELINES[theme.id]!
    : NEUTRAL_BASELINES[theme.colorScheme === 'dark' ? 'soft-dark' : 'soft-light']!;
  const isDark = theme.colorScheme === 'dark';

  const hueOrChromaChanged = changedIds.has('neutralHue') || changedIds.has('neutralChroma');
  const depthOrContrastChanged = changedIds.has('canvasDepth') || changedIds.has('surfaceContrast');

  const dH = changedIds.has('neutralHue') ? shortestAngleDelta(hue, baseline.hue) : 0;
  const dC = changedIds.has('neutralChroma') ? chroma - baseline.chroma : 0;
  const effCanvasL = changedIds.has('canvasDepth') ? canvasL : baseline.canvasL;
  const effStep = changedIds.has('surfaceContrast') ? stepScale : 1;

  const tokens: Record<string, string> = {};

  const surfaceMinL = isDark ? 0.04 : 0.72;
  const surfaceMaxL = isDark ? 0.65 : 0.999;
  const borderMinL = isDark ? 0.12 : 0.22;
  const borderMaxL = isDark ? 0.93 : 0.96;

  // Surfaces, borders, neutral buttons, and controls track all 4 neutral macros smoothly.
  for (const [name, base] of Object.entries(baseline.surfaces)) {
    tokens[name] = shiftNeutralToken(base, baseline, {
      dH,
      dC,
      canvasL: effCanvasL,
      stepScale: effStep,
      anchorLightness: true,
      minL: surfaceMinL,
      maxL: surfaceMaxL,
    });
  }

  for (const [name, base] of Object.entries(baseline.borders)) {
    tokens[name] = shiftNeutralToken(base, baseline, {
      dH,
      dC,
      canvasL: effCanvasL,
      stepScale: effStep,
      anchorLightness: true,
      minL: borderMinL,
      maxL: borderMaxL,
    });
  }

  for (const [name, base] of Object.entries(baseline.neutralAccents)) {
    const isSolid = name.startsWith('--neutral-solid');
    tokens[name] = shiftNeutralToken(base, baseline, {
      dH,
      dC,
      canvasL: effCanvasL,
      stepScale: effStep,
      anchorLightness: isDark || !isSolid,
      minL: isDark ? 0.16 : 0.14,
      maxL: isDark ? 0.78 : 0.96,
    });
  }

  for (const [name, base] of Object.entries(baseline.controls)) {
    const isFixedAlphaOverlay = base.startsWith('rgb(') && !isDark;
    if (isFixedAlphaOverlay) {
      if (hueOrChromaChanged) {
        const parsed = colorToOklch(base);
        const shadowBase = colorToOklch(baseline.shadowColor);
        const nextC = clamp(shadowBase.C + dC * 1.1, 0, 0.06);
        const nextH = (shadowBase.H + dH + 360) % 360;
        tokens[name] = formatOklchColor(shadowBase.L, nextC, nextH, parsed.a);
      }
      continue;
    }
    tokens[name] = shiftNeutralToken(base, baseline, {
      dH,
      dC,
      canvasL: effCanvasL,
      stepScale: effStep,
      anchorLightness: isDark || !name.startsWith('--_switch-track-off'),
      minL: isDark ? 0.05 : 0.25,
      maxL: isDark ? 0.85 : 0.999,
    });
  }

  // Only rewrite ink tokens when Hue/Chroma changed (preserving Soft Dark warm inks on depth/contrast edits).
  if (hueOrChromaChanged) {
    for (const [name, base] of Object.entries(baseline.inks)) {
      tokens[name] = shiftNeutralToken(base, baseline, {
        dH,
        dC,
        canvasL: effCanvasL,
        stepScale: 1,
        anchorLightness: false,
        minL: isDark ? 0.35 : 0.12,
        maxL: 0.999,
        chromaScaleWeight: 0.75,
      });
    }

    const shadowBase = colorToOklch(baseline.shadowColor);
    const shadowRgb = oklchToRgbCss(
      shadowBase.L,
      clamp(shadowBase.C + dC * 0.9, 0, 0.04),
      (shadowBase.H + dH + 360) % 360,
    );
    tokens['--scrim-bg'] = `rgb(${shadowRgb} / ${baseline.scrimAlpha})`;
    if (baseline.pixelShadowAlpha !== undefined) {
      const pixelShadow = `rgb(${shadowRgb} / ${baseline.pixelShadowAlpha})`;
      tokens['--_overlay-shadow'] = `6px 6px 0px 0 ${pixelShadow}`;
      tokens['--_overlay-shadow-tooltip'] =
        `${baseline.pixelTooltipOffset ?? '2px 2px 0px 0'} ${pixelShadow}`;
      tokens['--_overlay-shadow-popover'] = `6px 6px 0px 0 ${pixelShadow}`;
      tokens['--_overlay-shadow-hover'] = `6px 6px 0px 0 ${pixelShadow}`;
      tokens['--_overlay-drawer-shadow-color'] = pixelShadow;
      tokens['--_overlay-shadow-modal'] = `6px 6px 0px 0 ${pixelShadow}`;
    }
  }

  // Guard extreme dark canvas/contrast combinations so muted text keeps >= 4.5:1 over surface.
  if (isDark && depthOrContrastChanged) {
    const surfaceColor = parseCssColor(
      tokens['--bg-surface'] ?? baseline.surfaces['--bg-surface']!,
    );
    const mutedHex = tokens['--fg-muted'] ?? baseline.inks['--fg-muted']!;
    const mutedColor = parseCssColor(mutedHex);
    if (surfaceColor && mutedColor && contrastRatio(mutedColor, surfaceColor) < 4.55) {
      const mutedOklch = colorToOklch(mutedHex);
      let lo = mutedOklch.L;
      let hi = 0.96;
      for (let i = 0; i < 10; i += 1) {
        const mid = (lo + hi) * 0.5;
        const candidate = parseCssColor(oklchToHex(mid, mutedOklch.C, mutedOklch.H))!;
        if (contrastRatio(candidate, surfaceColor) >= 4.6) {
          hi = mid;
        } else {
          lo = mid;
        }
      }
      tokens['--fg-muted'] = oklchToHex(hi, mutedOklch.C, mutedOklch.H);
    }
  }

  return tokens;
}

function computeAccentFamily(theme: WorkbenchTheme, accentHex: string): Record<string, string> {
  const { L, C, H } = colorToOklch(accentHex);
  const isDark = theme.colorScheme === 'dark';
  const isFrost = theme.family === 'frost';
  const isPixel = theme.family === 'pixel';

  const solid = accentHex;
  const hover = oklchToHex(isDark ? Math.min(0.92, L + 0.055) : Math.max(0.22, L - 0.055), C, H);
  const active = oklchToHex(isDark ? Math.max(0.28, L - 0.055) : Math.max(0.18, L - 0.1), C, H);
  const onAccent = pickContrastingInk(solid, H);
  const solidRgb = oklchToRgbCss(L, C, H);

  const softBg = isDark
    ? oklchToHex(0.31, Math.min(0.085, C * 0.58), H)
    : oklchToHex(0.91, Math.min(0.055, C * 0.42), H);
  const softFg = isDark
    ? oklchToHex(0.83, Math.min(0.125, C * 0.82), H)
    : oklchToHex(0.37, Math.min(0.13, C * 0.85), H);
  const softFgRgb = oklchToRgbCss(
    isDark ? 0.83 : 0.37,
    isDark ? Math.min(0.125, C * 0.82) : Math.min(0.13, C * 0.85),
    H,
  );
  const borderRgb = oklchToRgbCss(isDark ? 0.58 : 0.52, Math.min(0.12, C * 0.72), H);

  // Calibrate switch-track-on so a near-white thumb keeps >= 3:1 WCAG non-text contrast.
  const switchOnL = isDark ? Math.min(0.56, L) : Math.min(0.54, L);
  const switchOn = oklchToHex(switchOnL, C, H);
  const switchOnHover = oklchToHex(
    isDark ? Math.min(0.62, switchOnL + 0.05) : Math.max(0.25, switchOnL - 0.05),
    C,
    H,
  );
  const switchOnActive = oklchToHex(
    isDark ? Math.max(0.28, switchOnL - 0.05) : Math.max(0.2, switchOnL - 0.09),
    C,
    H,
  );

  const tokens: Record<string, string> = {
    '--accent-solid': solid,
    '--accent-solid-hover': hover,
    '--accent-solid-active': active,
    '--accent-signal': isFrost && isDark ? oklchToHex(Math.max(0.66, L + 0.12), C, H) : solid,
    '--accent-soft-bg': softBg,
    '--accent-soft-fg': softFg,
    '--accent-border': `rgb(${borderRgb} / ${isDark ? 0.72 : 0.5})`,
    '--fg-on-accent': onAccent,
    '--_switch-track-on': switchOn,
    '--_switch-track-on-hover': switchOnHover,
    '--_switch-track-on-active': switchOnActive,
    '--_chip-selected-bg':
      isDark && !isFrost && !isPixel ? softBg : `rgb(${solidRgb} / ${isDark ? 0.18 : 0.12})`,
    '--_chip-selected-fg': isDark
      ? oklchToHex(0.86, Math.min(0.12, C * 0.82), H)
      : oklchToHex(0.32, Math.min(0.13, C * 0.88), H),
    '--table-row-selected-bg': `rgb(${solidRgb} / ${isDark ? 0.14 : 0.1})`,
    '--_base-choice-card-bg-selected':
      !isFrost && !isPixel
        ? oklchToHex(isDark ? 0.275 : 0.945, Math.min(0.05, C * 0.35), H)
        : `rgb(${solidRgb} / ${isDark ? 0.15 : 0.085})`,
    '--_overlay-choice-card-bg-selected':
      !isFrost && !isPixel
        ? oklchToHex(isDark ? 0.275 : 0.945, Math.min(0.05, C * 0.35), H)
        : `rgb(${solidRgb} / ${isDark ? 0.18 : 0.11})`,
    '--_base-choice-card-border-selected': isPixel ? solid : `rgb(${softFgRgb} / 0.55)`,
    '--_overlay-choice-card-border-selected': isPixel ? solid : `rgb(${softFgRgb} / 0.45)`,
  };

  if (isPixel) {
    tokens['--focus-ring-color'] = solid;
    tokens['--_chip-selected-border'] = solid;
  } else if (isFrost) {
    const hi = oklchToHex(Math.min(0.95, L + 0.06), C, H);
    const lo = oklchToHex(Math.max(0.24, L - 0.07), C, H);
    const deeper = oklchToHex(Math.max(0.18, L - 0.13), C, H);
    const edgeRgb = oklchToRgbCss(Math.max(0.18, L - 0.16), C * 0.9, H);
    const glowRgb = oklchToRgbCss(L, C, H);
    const hoverGlowRgb = oklchToRgbCss(Math.min(0.95, L + 0.06), C, H);
    tokens['--_chip-selected-border'] = `rgb(${softFgRgb} / ${isDark ? 0.5 : 0.36})`;
    tokens['--_btn-primary-fill'] = `linear-gradient(135deg, ${hi} 0%, ${solid} 50%, ${lo} 100%)`;
    tokens['--_btn-primary-fill-hover'] = isDark
      ? `linear-gradient(135deg, ${hi} 0%, ${hi} 35%, ${solid} 100%)`
      : `linear-gradient(135deg, ${solid} 0%, ${lo} 55%, ${lo} 100%)`;
    tokens['--_btn-primary-fill-active'] = isDark
      ? `linear-gradient(135deg, ${solid} 0%, ${lo} 55%, ${lo} 100%)`
      : `linear-gradient(135deg, ${lo} 0%, ${deeper} 100%)`;
    tokens['--_btn-primary-shadow'] = isDark
      ? `0 2px 0 rgb(${edgeRgb} / 0.9), 0 0 20px 2px rgb(${glowRgb} / 0.45), 0 0 44px 4px rgb(${glowRgb} / 0.22)`
      : `0 2px 0 rgb(${edgeRgb} / 0.65), 0 0 20px 2px rgb(${glowRgb} / 0.22), 0 0 44px 4px rgb(${glowRgb} / 0.1)`;
    tokens['--_btn-primary-shadow-hover'] = isDark
      ? `0 2px 0 rgb(${edgeRgb} / 0.9), 0 0 26px 3px rgb(${hoverGlowRgb} / 0.65), 0 0 56px 6px rgb(${glowRgb} / 0.35)`
      : `0 2px 0 rgb(${edgeRgb} / 0.65), 0 0 26px 3px rgb(${hoverGlowRgb} / 0.32), 0 0 56px 6px rgb(${glowRgb} / 0.16)`;
    tokens['--_btn-primary-backlight-color'] = isDark ? hi : solid;
  }

  return tokens;
}

const macros: readonly ThemeMacroControl[] = [
  {
    id: 'neutralHue',
    label: 'Neutral Hue',
    kind: 'range',
    min: 0,
    max: 360,
    step: 1,
    unit: '°',
    defaults: {
      'soft-dark': 244,
      'soft-light': 83,
      'frost-dark': 269,
      'frost-light': 265,
      'pixel-dark': 248,
      'pixel-light': 236,
    },
  },
  {
    id: 'neutralChroma',
    label: 'Neutral Chroma',
    kind: 'range',
    min: 0,
    max: 0.055,
    step: 0.001,
    defaults: {
      'soft-dark': 0.015,
      'soft-light': 0.024,
      'frost-dark': 0.023,
      'frost-light': 0.006,
      'pixel-dark': 0.01,
      'pixel-light': 0.004,
    },
  },
  {
    id: 'canvasDepth',
    label: 'Canvas Lightness',
    kind: 'range',
    min: 0.12,
    max: 0.32,
    step: 0.001,
    schemeBounds: {
      dark: { min: 0.12, max: 0.32, step: 0.001 },
      light: { min: 0.89, max: 0.99, step: 0.001 },
    },
    defaults: {
      'soft-dark': 0.268,
      'soft-light': 0.964,
      'frost-dark': 0.197,
      'frost-light': 0.979,
      'pixel-dark': 0.193,
      'pixel-light': 0.968,
    },
  },
  {
    id: 'surfaceContrast',
    label: 'Layer Contrast',
    kind: 'range',
    min: 0.5,
    max: 1.6,
    step: 0.05,
    unit: '×',
    defaults: {
      'soft-dark': 1,
      'soft-light': 1,
      'frost-dark': 1,
      'frost-light': 1,
      'pixel-dark': 1,
      'pixel-light': 1,
    },
  },
  {
    id: 'accentColor',
    label: 'Accent Color',
    kind: 'color',
    defaults: {
      'soft-dark': '#e28365',
      'soft-light': '#b3583b',
      'frost-dark': '#5445e5',
      'frost-light': '#4838d4',
      'pixel-dark': '#22c3dc',
      'pixel-light': '#096c7c',
    },
  },
  {
    id: 'radiusFactor',
    label: 'Corner Geometry',
    kind: 'choice',
    choices: [
      { value: '1', label: 'Rounded (1)' },
      { value: '0', label: 'Sharp (0)' },
    ],
    defaults: {
      'soft-dark': '1',
      'soft-light': '1',
      'frost-dark': '1',
      'frost-light': '1',
      'pixel-dark': '0',
      'pixel-light': '0',
    },
  },
];

function computeMacros(
  theme: WorkbenchTheme,
  values: ThemeMacroValues,
  changedIds: ReadonlySet<string>,
): Readonly<Record<string, string>> {
  const result: Record<string, string> = {};

  let neutralChanged = false;
  for (const id of changedIds) {
    if (NEUTRAL_MACRO_IDS.has(id)) {
      neutralChanged = true;
      break;
    }
  }
  if (neutralChanged) {
    const hue = Number(values.neutralHue ?? 260);
    const chroma = Number(values.neutralChroma ?? 0.01);
    const depth = Number(values.canvasDepth ?? (theme.colorScheme === 'dark' ? 0.2 : 0.96));
    const step = Number(values.surfaceContrast ?? 1);
    Object.assign(result, computeNeutralLadder(theme, changedIds, hue, chroma, depth, step));
  }

  if (changedIds.has('accentColor') && typeof values.accentColor === 'string') {
    Object.assign(result, computeAccentFamily(theme, values.accentColor));
  }

  if (changedIds.has('radiusFactor') && values.radiusFactor !== undefined) {
    result['--radius-factor'] = String(values.radiusFactor);
  }

  return result;
}

const tokens: readonly ThemeTokenDefinition[] = [
  // Surfaces
  { name: '--bg-shell', label: 'App Shell', kind: 'color', group: 'Surfaces' },
  { name: '--bg-aside', label: 'Aside Panel', kind: 'color', group: 'Surfaces' },
  { name: '--bg-canvas', label: 'Main Canvas', kind: 'color', group: 'Surfaces' },
  { name: '--bg-surface-subtle', label: 'Surface Subtle', kind: 'color', group: 'Surfaces' },
  { name: '--bg-surface', label: 'Card Surface', kind: 'color', group: 'Surfaces' },
  { name: '--bg-surface-raised', label: 'Surface Raised', kind: 'color', group: 'Surfaces' },
  { name: '--bg-overlay', label: 'Floating Overlay', kind: 'color', group: 'Surfaces' },
  { name: '--scrim-bg', label: 'Modal Scrim', kind: 'color', group: 'Surfaces' },

  // Borders
  { name: '--border-subtle', label: 'Border Subtle', kind: 'color', group: 'Borders' },
  { name: '--border-default', label: 'Border Default', kind: 'color', group: 'Borders' },
  { name: '--border-strong', label: 'Border Strong', kind: 'color', group: 'Borders' },
  { name: '--control-border-focus', label: 'Field Focus Edge', kind: 'color', group: 'Borders' },
  { name: '--focus-ring-color', label: 'Keyboard Focus Ring', kind: 'color', group: 'Borders' },
  { name: '--_binary-border', label: 'Binary Control Border', kind: 'color', group: 'Borders' },
  { name: '--_binary-border-hover', label: 'Binary Border Hover', kind: 'color', group: 'Borders' },

  // Text
  { name: '--fg-primary', label: 'Primary Ink', kind: 'color', group: 'Text' },
  { name: '--fg-secondary', label: 'Secondary Ink', kind: 'color', group: 'Text' },
  { name: '--fg-muted', label: 'Muted Ink', kind: 'color', group: 'Text' },
  { name: '--fg-subtle', label: 'Subtle Ink', kind: 'color', group: 'Text' },
  { name: '--fg-disabled', label: 'Disabled Ink', kind: 'color', group: 'Text' },
  { name: '--fg-on-accent', label: 'On Accent Solid', kind: 'color', group: 'Text' },
  { name: '--fg-on-neutral', label: 'On Neutral Solid', kind: 'color', group: 'Text' },

  // Accent
  { name: '--accent-solid', label: 'Accent Solid', kind: 'color', group: 'Accent' },
  { name: '--accent-solid-hover', label: 'Accent Hover', kind: 'color', group: 'Accent' },
  { name: '--accent-solid-active', label: 'Accent Active', kind: 'color', group: 'Accent' },
  { name: '--accent-signal', label: 'Accent Signal', kind: 'color', group: 'Accent' },
  { name: '--accent-soft-bg', label: 'Accent Soft Bg', kind: 'color', group: 'Accent' },
  { name: '--accent-soft-fg', label: 'Accent Soft Fg', kind: 'color', group: 'Accent' },
  { name: '--accent-border', label: 'Accent Border', kind: 'color', group: 'Accent' },

  // Neutral
  { name: '--neutral-solid', label: 'Neutral Solid', kind: 'color', group: 'Neutral' },
  { name: '--neutral-solid-hover', label: 'Neutral Hover', kind: 'color', group: 'Neutral' },
  { name: '--neutral-solid-active', label: 'Neutral Active', kind: 'color', group: 'Neutral' },
  { name: '--neutral-soft-bg', label: 'Neutral Soft Bg', kind: 'color', group: 'Neutral' },
  { name: '--neutral-soft-fg', label: 'Neutral Soft Fg', kind: 'color', group: 'Neutral' },
  { name: '--neutral-border', label: 'Neutral Border', kind: 'color', group: 'Neutral' },
  { name: '--neutral-signal', label: 'Neutral Signal', kind: 'color', group: 'Neutral' },

  // Statuses
  { name: '--status-info-solid', label: 'Info Solid', kind: 'color', group: 'Statuses' },
  { name: '--status-info-soft-bg', label: 'Info Soft Bg', kind: 'color', group: 'Statuses' },
  { name: '--status-info-soft-fg', label: 'Info Soft Fg', kind: 'color', group: 'Statuses' },
  { name: '--status-info-border', label: 'Info Border', kind: 'color', group: 'Statuses' },
  { name: '--status-success-solid', label: 'Success Solid', kind: 'color', group: 'Statuses' },
  { name: '--status-success-soft-bg', label: 'Success Soft Bg', kind: 'color', group: 'Statuses' },
  { name: '--status-success-soft-fg', label: 'Success Soft Fg', kind: 'color', group: 'Statuses' },
  { name: '--status-success-border', label: 'Success Border', kind: 'color', group: 'Statuses' },
  { name: '--status-warning-solid', label: 'Warning Solid', kind: 'color', group: 'Statuses' },
  { name: '--status-warning-soft-bg', label: 'Warning Soft Bg', kind: 'color', group: 'Statuses' },
  { name: '--status-warning-soft-fg', label: 'Warning Soft Fg', kind: 'color', group: 'Statuses' },
  { name: '--status-warning-border', label: 'Warning Border', kind: 'color', group: 'Statuses' },
  { name: '--status-danger-solid', label: 'Danger Solid', kind: 'color', group: 'Statuses' },
  { name: '--status-danger-soft-bg', label: 'Danger Soft Bg', kind: 'color', group: 'Statuses' },
  { name: '--status-danger-soft-fg', label: 'Danger Soft Fg', kind: 'color', group: 'Statuses' },
  { name: '--status-danger-border', label: 'Danger Border', kind: 'color', group: 'Statuses' },
  { name: '--fg-on-danger', label: 'On Danger Solid', kind: 'color', group: 'Statuses' },

  // Controls & Recipes
  {
    name: '--_btn-primary-fill',
    label: 'Primary Button Fill',
    kind: 'text',
    group: 'Controls & Recipes',
  },
  {
    name: '--_btn-secondary-bg',
    label: 'Secondary Button Bg',
    kind: 'color',
    group: 'Controls & Recipes',
  },
  {
    name: '--_btn-secondary-bg-hover',
    label: 'Secondary Button Hover',
    kind: 'color',
    group: 'Controls & Recipes',
  },
  {
    name: '--_btn-secondary-border',
    label: 'Secondary Button Border',
    kind: 'color',
    group: 'Controls & Recipes',
  },
  {
    name: '--_overlay-card-bg',
    label: 'Overlay Card Bg',
    kind: 'color',
    group: 'Controls & Recipes',
  },
  {
    name: '--_overlay-card-border',
    label: 'Overlay Card Border',
    kind: 'color',
    group: 'Controls & Recipes',
  },
  {
    name: '--_base-control-bg',
    label: 'Field Base Bg',
    kind: 'color',
    group: 'Controls & Recipes',
  },
  {
    name: '--_overlay-control-bg',
    label: 'Field Overlay Bg',
    kind: 'color',
    group: 'Controls & Recipes',
  },
  {
    name: '--_base-control-border',
    label: 'Field Base Border',
    kind: 'color',
    group: 'Controls & Recipes',
  },
  {
    name: '--_overlay-control-border',
    label: 'Field Overlay Border',
    kind: 'color',
    group: 'Controls & Recipes',
  },
  {
    name: '--_switch-track-off',
    label: 'Switch Off Track',
    kind: 'color',
    group: 'Controls & Recipes',
  },
  {
    name: '--_switch-track-on',
    label: 'Switch On Track',
    kind: 'color',
    group: 'Controls & Recipes',
  },
  { name: '--_switch-thumb-bg', label: 'Switch Thumb', kind: 'color', group: 'Controls & Recipes' },
  {
    name: '--_segmented-rail-bg',
    label: 'Segmented Rail',
    kind: 'color',
    group: 'Controls & Recipes',
  },
  {
    name: '--_segmented-thumb-bg',
    label: 'Segmented Thumb',
    kind: 'color',
    group: 'Controls & Recipes',
  },
  { name: '--_chip-bg', label: 'Chip Bg', kind: 'color', group: 'Controls & Recipes' },
  {
    name: '--_chip-selected-bg',
    label: 'Chip Selected Bg',
    kind: 'color',
    group: 'Controls & Recipes',
  },
  {
    name: '--_chip-selected-fg',
    label: 'Chip Selected Fg',
    kind: 'color',
    group: 'Controls & Recipes',
  },
  { name: '--_kbd-cap-bg', label: 'Keycap Bg', kind: 'color', group: 'Controls & Recipes' },
  { name: '--_kbd-cap-border', label: 'Keycap Border', kind: 'color', group: 'Controls & Recipes' },
  {
    name: '--table-row-selected-bg',
    label: 'Selected Row Wash',
    kind: 'color',
    group: 'Controls & Recipes',
  },
  {
    name: '--_base-choice-card-bg',
    label: 'ChoiceCard Base Bg',
    kind: 'color',
    group: 'Controls & Recipes',
  },
  {
    name: '--_overlay-choice-card-bg',
    label: 'ChoiceCard Overlay Bg',
    kind: 'color',
    group: 'Controls & Recipes',
  },
  {
    name: '--_base-choice-card-bg-selected',
    label: 'ChoiceCard Selected Bg',
    kind: 'color',
    group: 'Controls & Recipes',
  },

  // Spacing & Radii
  {
    name: '--radius-factor',
    label: 'Radius Factor',
    kind: 'choice',
    group: 'Spacing & Radii',
    choices: [
      { value: '1', label: 'Rounded (1)' },
      { value: '0', label: 'Sharp (0)' },
    ],
  },
  {
    name: '--size-s-height',
    label: 'Control Height S',
    kind: 'length',
    group: 'Spacing & Radii',
    min: 24,
    max: 40,
    step: 2,
    unit: 'px',
  },
  {
    name: '--size-m-height',
    label: 'Control Height M',
    kind: 'length',
    group: 'Spacing & Radii',
    min: 32,
    max: 52,
    step: 2,
    unit: 'px',
  },
  {
    name: '--size-l-height',
    label: 'Control Height L',
    kind: 'length',
    group: 'Spacing & Radii',
    min: 40,
    max: 60,
    step: 2,
    unit: 'px',
  },
  {
    name: '--size-m-padding-x',
    label: 'Control Pad X (M)',
    kind: 'length',
    group: 'Spacing & Radii',
    min: 8,
    max: 28,
    step: 2,
    unit: 'px',
  },
  {
    name: '--surface-s-padding',
    label: 'Surface Pad S',
    kind: 'length',
    group: 'Spacing & Radii',
    min: 8,
    max: 24,
    step: 2,
    unit: 'px',
  },
  {
    name: '--surface-m-padding',
    label: 'Surface Pad M',
    kind: 'length',
    group: 'Spacing & Radii',
    min: 10,
    max: 32,
    step: 2,
    unit: 'px',
  },
  {
    name: '--surface-l-padding',
    label: 'Surface Pad L',
    kind: 'length',
    group: 'Spacing & Radii',
    min: 16,
    max: 40,
    step: 2,
    unit: 'px',
  },
  {
    name: '--space-4',
    label: 'Space 4',
    kind: 'length',
    group: 'Spacing & Radii',
    min: 2,
    max: 12,
    step: 1,
    unit: 'px',
  },
  {
    name: '--space-8',
    label: 'Space 8',
    kind: 'length',
    group: 'Spacing & Radii',
    min: 4,
    max: 16,
    step: 2,
    unit: 'px',
  },
  {
    name: '--space-12',
    label: 'Space 12',
    kind: 'length',
    group: 'Spacing & Radii',
    min: 6,
    max: 24,
    step: 2,
    unit: 'px',
  },
  {
    name: '--space-16',
    label: 'Space 16',
    kind: 'length',
    group: 'Spacing & Radii',
    min: 8,
    max: 32,
    step: 2,
    unit: 'px',
  },
  {
    name: '--space-24',
    label: 'Space 24',
    kind: 'length',
    group: 'Spacing & Radii',
    min: 12,
    max: 48,
    step: 2,
    unit: 'px',
  },

  // Typography
  {
    name: '--_base-text-size-body-s',
    label: 'Body S',
    kind: 'length',
    group: 'Typography',
    min: 11,
    max: 18,
    step: 1,
    unit: 'px',
  },
  {
    name: '--_base-text-size-body-m',
    label: 'Body M',
    kind: 'length',
    group: 'Typography',
    min: 12,
    max: 22,
    step: 1,
    unit: 'px',
  },
  {
    name: '--_base-text-size-heading-s',
    label: 'Heading S',
    kind: 'length',
    group: 'Typography',
    min: 13,
    max: 24,
    step: 1,
    unit: 'px',
  },
  {
    name: '--_base-text-size-heading-m',
    label: 'Heading M',
    kind: 'length',
    group: 'Typography',
    min: 15,
    max: 28,
    step: 1,
    unit: 'px',
  },
  {
    name: '--_base-text-size-heading-l',
    label: 'Heading L',
    kind: 'length',
    group: 'Typography',
    min: 18,
    max: 32,
    step: 1,
    unit: 'px',
  },
  {
    name: '--_base-text-size-caption-l',
    label: 'Caption L',
    kind: 'length',
    group: 'Typography',
    min: 10,
    max: 16,
    step: 1,
    unit: 'px',
  },
  {
    name: '--_code-font-scale',
    label: 'Inline Code Scale',
    kind: 'number',
    group: 'Typography',
    min: 0.75,
    max: 1.15,
    step: 0.05,
  },
];

const contrastPairs: readonly ThemeContrastPair[] = [
  {
    id: 'primary-canvas',
    label: 'Primary / Canvas',
    foreground: '--fg-primary',
    background: '--bg-canvas',
    minRatio: 7,
  },
  {
    id: 'primary-overlay',
    label: 'Primary / Overlay',
    foreground: '--fg-primary',
    background: '--bg-overlay',
    backdrop: '--bg-canvas',
    minRatio: 7,
  },
  {
    id: 'secondary-surface',
    label: 'Secondary / Surface',
    foreground: '--fg-secondary',
    background: '--bg-surface',
    minRatio: 4.5,
  },
  {
    id: 'muted-surface',
    label: 'Muted / Surface',
    foreground: '--fg-muted',
    background: '--bg-surface',
    minRatio: 4.5,
  },
  {
    id: 'accent-solid',
    label: 'On Accent / Solid',
    foreground: '--fg-on-accent',
    background: '--accent-solid',
    minRatio: 4.5,
  },
  {
    id: 'accent-soft',
    label: 'Accent Soft Pair',
    foreground: '--accent-soft-fg',
    background: '--accent-soft-bg',
    backdrop: '--bg-surface',
    minRatio: 4.5,
  },
  {
    id: 'neutral-solid',
    label: 'On Neutral / Solid',
    foreground: '--fg-on-neutral',
    background: '--neutral-solid',
    minRatio: 4.5,
  },
  {
    id: 'info-soft',
    label: 'Info Soft Pair',
    foreground: '--status-info-soft-fg',
    background: '--status-info-soft-bg',
    backdrop: '--bg-surface',
    minRatio: 4.5,
  },
  {
    id: 'success-soft',
    label: 'Success Soft Pair',
    foreground: '--status-success-soft-fg',
    background: '--status-success-soft-bg',
    backdrop: '--bg-surface',
    minRatio: 4.5,
  },
  {
    id: 'warning-soft',
    label: 'Warning Soft Pair',
    foreground: '--status-warning-soft-fg',
    background: '--status-warning-soft-bg',
    backdrop: '--bg-surface',
    minRatio: 4.5,
  },
  {
    id: 'danger-soft',
    label: 'Danger Soft Pair',
    foreground: '--status-danger-soft-fg',
    background: '--status-danger-soft-bg',
    backdrop: '--bg-surface',
    minRatio: 4.5,
  },
  {
    id: 'danger-solid',
    label: 'On Danger / Solid',
    foreground: '--fg-on-danger',
    background: '--status-danger-solid',
    minRatio: 4.5,
  },
  {
    id: 'switch-on',
    label: 'Switch Thumb / On',
    foreground: '--_switch-thumb-bg',
    background: '--_switch-track-on',
    minRatio: 3,
  },
];

export const unicaThemeEditor: ThemeEditorConfig = {
  storageKey: 'unica-workbench-theme-overrides-v1',
  macros,
  computeMacros,
  tokens,
  contrastPairs,
};
