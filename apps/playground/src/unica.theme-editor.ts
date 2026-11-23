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
    hue: 68,
    chroma: 0.002,
    canvasL: 0.223,
    surfaces: {
      '--bg-shell': '#100f0e',
      '--bg-aside': '#161514',
      '--bg-canvas': '#1c1b1a',
      '--bg-surface-subtle': '#211f1e',
      '--bg-surface': '#272524',
      '--bg-surface-raised': '#302e2c',
      '--bg-overlay': '#2b2928',
    },
    borders: {
      '--border-subtle': '#2e2c2b',
      '--border-default': '#3c3a38',
      '--border-strong': '#4e4b49',
      '--control-border-focus': '#7f7b77',
      '--_binary-border': '#7f7b77',
      '--_binary-border-hover': '#9d9995',
    },
    inks: {
      '--fg-primary': '#f1eeec',
      '--fg-secondary': '#d0ccc9',
      '--fg-muted': '#a4a19e',
      '--fg-subtle': '#94918d',
      '--fg-disabled': '#615e5c',
      '--fg-on-neutral': '#f6f4f0',
      '--neutral-soft-fg': '#d7d3d1',
      '--neutral-signal': '#a4a19e',
      '--_chip-fg': '#d7d3d1',
      '--focus-ring-color': '#f1eeec',
    },
    neutralAccents: {
      '--neutral-solid': '#454240',
      '--neutral-solid-hover': '#53514e',
      '--neutral-solid-active': '#373534',
      '--neutral-soft-bg': '#32302f',
    },
    controls: {
      '--_btn-secondary-bg': '#302e2d',
      '--_btn-secondary-bg-hover': '#3b3937',
      '--_switch-track-off': '#33312f',
      '--_switch-track-off-hover': '#3f3d3b',
      '--_segmented-rail-bg': '#121111',
      '--_segmented-thumb-bg': '#343230',
      '--_chip-bg': '#32302f',
      '--_kbd-cap-bg': '#1f1e1d',
      '--_kbd-cap-border': '#413f3d',
      '--_base-choice-card-bg': '#201e1d',
      '--_overlay-choice-card-bg': '#232220',
      '--_base-choice-card-border': '#3c3a38',
      '--_overlay-choice-card-border': '#2e2c2b',
      '--_base-control-bg': '#141312',
      '--_overlay-control-bg': '#1e1d1c',
      '--_base-control-border': '#474442',
      '--_overlay-control-border': '#403e3c',
      '--_base-control-border-hover': '#5f5c59',
      '--_overlay-control-border-hover': '#53514e',
    },
    shadowColor: '#0a0a09',
    scrimAlpha: 0.56,
  },
  'soft-light': {
    hue: 85,
    chroma: 0.009,
    canvasL: 0.968,
    surfaces: {
      '--bg-shell': '#e8e3da',
      '--bg-aside': '#f0ece4',
      '--bg-canvas': '#f7f4ee',
      '--bg-surface-subtle': '#f2eee7',
      '--bg-surface': '#fdfcfa',
      '--bg-surface-raised': '#f4f0e9',
      '--bg-overlay': '#fffefb',
    },
    borders: {
      '--border-subtle': '#e5dfd5',
      '--border-default': '#d5cdc1',
      '--border-strong': '#bfb6a8',
      '--control-border-focus': '#736a5e',
      '--_binary-border': '#736a5e',
      '--_binary-border-hover': '#544d43',
    },
    inks: {
      '--fg-primary': '#221f1c',
      '--fg-secondary': '#3d3832',
      '--fg-muted': '#5b544c',
      '--fg-subtle': '#70685f',
      '--fg-disabled': '#91887d',
      '--fg-on-neutral': '#fdfbf8',
      '--neutral-soft-fg': '#3d3832',
      '--neutral-signal': '#5b544c',
      '--_chip-fg': '#3d3832',
      '--focus-ring-color': '#221f1c',
    },
    neutralAccents: {
      '--neutral-solid': '#3b3630',
      '--neutral-solid-hover': '#4d473f',
      '--neutral-solid-active': '#292521',
      '--neutral-soft-bg': '#e7e1d7',
    },
    controls: {
      '--_btn-secondary-bg': '#ede8df',
      '--_btn-secondary-bg-hover': '#e3ddd2',
      '--_switch-track-off': '#999083',
      '--_switch-track-off-hover': '#8f8679',
      '--_segmented-rail-bg': '#ece7de',
      '--_segmented-thumb-bg': '#fffefb',
      '--_chip-bg': '#e7e1d7',
      '--_kbd-cap-bg': '#f2ede5',
      '--_kbd-cap-border': '#d5cdc1',
      '--_base-choice-card-bg': '#fffefb',
      '--_overlay-choice-card-bg': '#f6f2eb',
      '--_base-choice-card-border': '#d5cdc1',
      '--_overlay-choice-card-border': '#e5dfd5',
      '--_base-control-bg': '#fffefb',
      '--_overlay-control-bg': '#f4f0e8',
      '--_base-control-border': '#c2b9ab',
      '--_overlay-control-border': '#ccc3b6',
      '--_base-control-border-hover': '#9c9284',
      '--_overlay-control-border-hover': '#b8aea0',
    },
    shadowColor: '#241f1a',
    scrimAlpha: 0.16,
  },
  'frost-dark': {
    hue: 276,
    chroma: 0.01,
    canvasL: 0.174,
    surfaces: {
      '--bg-shell': '#060609',
      '--bg-aside': '#0a0b0f',
      '--bg-canvas': '#0f1015',
      '--bg-surface-subtle': '#14141b',
      '--bg-surface': '#181920',
      '--bg-surface-raised': '#21212a',
      '--bg-overlay': 'rgb(27 28 37 / 0.6)',
    },
    borders: {
      '--border-subtle': '#21212a',
      '--border-default': '#2e2f39',
      '--border-strong': '#3e3f4c',
      '--control-border-focus': '#767789',
      '--_binary-border': '#767789',
      '--_binary-border-hover': '#9596ab',
      '--neutral-border': '#2e2f39',
      '--_btn-secondary-border': '#41424f',
      '--_chip-border': '#3e3f4c',
    },
    inks: {
      '--fg-primary': '#f3f4f9',
      '--fg-secondary': '#cecfda',
      '--fg-muted': '#a2a4af',
      '--fg-subtle': '#848591',
      '--fg-disabled': '#585964',
      '--fg-on-neutral': '#f4f7ff',
      '--neutral-soft-fg': '#cecfda',
      '--neutral-signal': '#cecfda',
      '--_chip-fg': '#cecfda',
      '--focus-ring-color': '#f3f4f9',
    },
    neutralAccents: {
      '--neutral-solid': '#393a45',
      '--neutral-solid-hover': '#484956',
      '--neutral-solid-active': '#2d2d37',
      '--neutral-soft-bg': '#1e1f27',
    },
    controls: {
      '--_btn-secondary-bg': '#202029',
      '--_btn-secondary-bg-hover': '#2b2c36',
      '--_switch-track-off': '#21212a',
      '--_switch-track-off-hover': '#2d2e38',
      '--_segmented-rail-bg': '#090a0e',
      '--_segmented-thumb-bg': '#292a34',
      '--_chip-bg': '#1b1c23',
      '--_kbd-cap-bg': '#191921',
      '--_kbd-cap-border': '#353642',
      '--_base-choice-card-bg': 'rgb(20 21 28 / 0.88)',
      '--_base-choice-card-border': '#2e2f39',
      '--_base-control-bg': 'rgb(10 10 15 / 0.92)',
      '--_base-control-border': '#3e3f4c',
      '--_base-control-border-hover': '#545565',
      '--_table-overlay-header-bg': '#121218',
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
    hue: 305,
    chroma: 0.015,
    canvasL: 0.198,
    surfaces: {
      '--bg-shell': '#0b090e',
      '--bg-aside': '#110f14',
      '--bg-canvas': '#17141b',
      '--bg-surface-subtle': '#1b1820',
      '--bg-surface': '#211e27',
      '--bg-surface-raised': '#2a2631',
      '--bg-overlay': '#25212b',
    },
    borders: {
      '--border-subtle': '#2b2731',
      '--border-default': '#3d3845',
      '--border-strong': '#524c5c',
      '--control-border-focus': '#898196',
      '--_binary-border': '#817a8d',
      '--_binary-border-hover': '#a099ad',
      '--neutral-border': '#524c5c',
      '--_btn-secondary-border': '#524c5c',
      '--_chip-border': '#524c5c',
    },
    inks: {
      '--fg-primary': '#f3efea',
      '--fg-secondary': '#cfccd6',
      '--fg-muted': '#a5a1ac',
      '--fg-subtle': '#908c99',
      '--fg-disabled': '#5f5c65',
      '--fg-on-neutral': '#f6f2f5',
      '--neutral-soft-fg': '#cfccd6',
      '--neutral-signal': '#cfccd6',
      '--_chip-fg': '#cfccd6',
    },
    neutralAccents: {
      '--neutral-solid': '#3e3945',
      '--neutral-solid-hover': '#4d4856',
      '--neutral-solid-active': '#312d37',
      '--neutral-soft-bg': '#1f1c24',
    },
    controls: {
      '--_btn-secondary-bg': '#211e27',
      '--_btn-secondary-bg-hover': '#2a2631',
      '--_switch-track-off': '#27242e',
      '--_switch-track-off-hover': '#35313d',
      '--_segmented-rail-bg': '#0e0c11',
      '--_segmented-thumb-bg': '#322e39',
      '--_chip-bg': '#1b1820',
      '--_kbd-cap-bg': '#110f14',
      '--_kbd-cap-border': '#524c5c',
      '--_base-choice-card-bg': '#1a171f',
      '--_overlay-choice-card-bg': '#1d1a22',
      '--_base-choice-card-border': '#3d3845',
      '--_overlay-choice-card-border': '#3d3845',
      '--_base-control-bg': '#0f0d13',
      '--_overlay-control-bg': '#16131a',
      '--_base-control-border': '#524c5c',
      '--_overlay-control-border': '#524c5c',
      '--_base-control-border-hover': '#6b6478',
      '--_overlay-control-border-hover': '#6b6478',
    },
    shadowColor: '#0a0610',
    scrimAlpha: 0.6,
    pixelShadowAlpha: 0.86,
    pixelTooltipOffset: '3px 3px 0px 0',
  },
  'pixel-light': {
    hue: 312,
    chroma: 0.007,
    canvasL: 0.968,
    surfaces: {
      '--bg-shell': '#e6e1ea',
      '--bg-aside': '#efeaf2',
      '--bg-canvas': '#f6f3f8',
      '--bg-surface-subtle': '#f0ecf4',
      '--bg-surface': '#fffefd',
      '--bg-surface-raised': '#f4f0f7',
      '--bg-overlay': '#ffffff',
    },
    borders: {
      '--border-subtle': '#ded8e4',
      '--border-default': '#c1b8cc',
      '--border-strong': '#9b90ab',
      '--control-border-focus': '#5d526e',
      '--_binary-border': '#625673',
      '--_binary-border-hover': '#463d54',
      '--neutral-border': '#9b90ab',
      '--_btn-secondary-border': '#9b90ab',
      '--_chip-border': '#9b90ab',
    },
    inks: {
      '--fg-primary': '#221c2a',
      '--fg-secondary': '#3d344a',
      '--fg-muted': '#5c526b',
      '--fg-subtle': '#716682',
      '--fg-disabled': '#948aa3',
      '--fg-on-neutral': '#fcfbff',
      '--neutral-soft-fg': '#3d344a',
      '--neutral-signal': '#3d344a',
      '--_chip-fg': '#3d344a',
    },
    neutralAccents: {
      '--neutral-solid': '#352e42',
      '--neutral-solid-hover': '#473e57',
      '--neutral-solid-active': '#262030',
      '--neutral-soft-bg': '#efeaf2',
    },
    controls: {
      '--_btn-secondary-bg': '#f6f3f8',
      '--_btn-secondary-bg-hover': '#ebe5f0',
      '--_switch-track-off': '#9187a1',
      '--_switch-track-off-hover': '#827891',
      '--_segmented-rail-bg': '#e8e2ee',
      '--_segmented-thumb-bg': '#ffffff',
      '--_chip-bg': '#efeaf2',
      '--_kbd-cap-bg': '#efeaf2',
      '--_kbd-cap-border': '#9b90ab',
      '--_base-choice-card-bg': '#ffffff',
      '--_overlay-choice-card-bg': '#f6f2f9',
      '--_base-choice-card-border': '#c1b8cc',
      '--_overlay-choice-card-border': '#c1b8cc',
      '--_base-control-bg': '#ffffff',
      '--_overlay-control-bg': '#f5f1f8',
      '--_base-control-border': '#9b90ab',
      '--_overlay-control-border': '#9b90ab',
      '--_base-control-border-hover': '#756a87',
      '--_overlay-control-border-hover': '#756a87',
    },
    shadowColor: '#2e2036',
    scrimAlpha: 0.2,
    pixelShadowAlpha: 0.2,
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
      'soft-dark': 68,
      'soft-light': 85,
      'frost-dark': 276,
      'frost-light': 265,
      'pixel-dark': 305,
      'pixel-light': 312,
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
      'soft-dark': 0.002,
      'soft-light': 0.009,
      'frost-dark': 0.01,
      'frost-light': 0.006,
      'pixel-dark': 0.015,
      'pixel-light': 0.007,
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
      'soft-dark': 0.223,
      'soft-light': 0.968,
      'frost-dark': 0.174,
      'frost-light': 0.979,
      'pixel-dark': 0.198,
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
      'soft-dark': '#de9055',
      'soft-light': '#a8531d',
      'frost-dark': '#5445e5',
      'frost-light': '#4838d4',
      'pixel-dark': '#e887a3',
      'pixel-light': '#b33f64',
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
