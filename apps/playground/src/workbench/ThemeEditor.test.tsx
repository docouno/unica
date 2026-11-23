import { StrictMode } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { WorkbenchApp } from './WorkbenchApp.js';
import {
  buildScopedOverrideStylesheet,
  colorToHex,
  contrastRatio,
  formatExportCss,
  isSafeCssValue,
  loadThemeOverrides,
  parseCssColor,
  resolveContrastPair,
} from './themeEditorState.js';
import { defineComponent, defineScene } from './types.js';
import type { ThemeEditorConfig, WorkbenchConfig } from './types.js';

const STORAGE_KEY = 'wb-theme-editor-unit-test';

const demoComponent = defineComponent({
  id: 'card-demo',
  title: 'Card Demo',
  category: 'Surfaces',
  status: 'Proto',
  props: {
    label: {
      kind: 'string',
      group: 'Content',
      default: 'Preview',
      description: 'Card label.',
    },
  },
  render: ({ values, ctx }) => (
    <div {...ctx.subject} data-testid="demo-subject">
      {values.label}
    </div>
  ),
});

const demoScene = defineScene({
  id: 'demo-scene',
  title: 'Demo Scene',
  group: 'Examples',
  render: () => <section>Scene content</section>,
});

const themeEditor: ThemeEditorConfig = {
  storageKey: STORAGE_KEY,
  macros: [
    {
      id: 'tone',
      label: 'Surface Tone',
      kind: 'range',
      min: 0,
      max: 100,
      step: 5,
      unit: '%',
      defaults: { night: 20, day: 95, dusk: 30 },
    },
    {
      id: 'accent',
      label: 'Accent Swatch',
      kind: 'color',
      defaults: { night: '#5588ff', day: '#2255cc', dusk: '#aa66ee' },
    },
    {
      id: 'corners',
      label: 'Corners',
      kind: 'choice',
      choices: [
        { value: '1', label: 'Round' },
        { value: '0', label: 'Sharp' },
      ],
      defaults: { night: '1', day: '1', dusk: '0' },
    },
  ],
  computeMacros: (_theme, values, changedIds) => {
    const out: Record<string, string> = {};
    if (changedIds.has('tone')) {
      const n = Number(values.tone ?? 20);
      out['--wb-demo-surface'] = n < 50 ? '#181c24' : '#f4f6fa';
      out['--wb-demo-fg'] = n < 50 ? '#f4f6fa' : '#12151c';
    }
    if (changedIds.has('accent') && typeof values.accent === 'string') {
      out['--wb-demo-accent'] = values.accent;
    }
    if (changedIds.has('corners') && values.corners !== undefined) {
      out['--wb-demo-radius'] = String(values.corners);
    }
    return out;
  },
  tokens: [
    { name: '--wb-demo-surface', label: 'Surface', kind: 'color', group: 'Colors' },
    { name: '--wb-demo-fg', label: 'Foreground', kind: 'color', group: 'Colors' },
    { name: '--wb-demo-accent', label: 'Accent', kind: 'color', group: 'Colors' },
    {
      name: '--wb-demo-overlay-card',
      label: 'Overlay Card',
      kind: 'color',
      group: 'Colors',
      scope: 'overlay',
    },
    {
      name: '--wb-demo-radius',
      label: 'Radius Factor',
      kind: 'choice',
      group: 'Geometry',
      choices: [
        { value: '1', label: 'Round' },
        { value: '0', label: 'Sharp' },
      ],
    },
    {
      name: '--wb-demo-gap',
      label: 'Gap',
      kind: 'length',
      group: 'Geometry',
      min: 4,
      max: 24,
      step: 2,
      unit: 'px',
    },
  ],
  contrastPairs: [
    {
      id: 'fg-surface',
      label: 'Foreground / Surface',
      foreground: '--wb-demo-fg',
      background: '--wb-demo-surface',
      minRatio: 4.5,
    },
  ],
};

const testConfig: WorkbenchConfig = {
  title: 'Theme Editor Test Workbench',
  categories: ['Surfaces'],
  themes: [
    { id: 'night', label: 'Demo · Dark', family: 'demo', familyLabel: 'Demo', colorScheme: 'dark' },
    { id: 'day', label: 'Demo · Light', family: 'demo', familyLabel: 'Demo', colorScheme: 'light' },
    {
      id: 'dusk',
      label: 'Alt · Dark',
      family: 'alt',
      familyLabel: 'Alt',
      colorScheme: 'dark',
    },
  ],
  components: [demoComponent],
  scenes: [demoScene],
  themeEditor,
};

function openApp(search = '/'): ReturnType<typeof render> {
  window.history.replaceState(null, '', search);
  return render(
    <StrictMode>
      <WorkbenchApp config={testConfig} />
    </StrictMode>,
  );
}

afterEach(() => {
  cleanup();
  window.localStorage.removeItem(STORAGE_KEY);
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

it('parses sRGB and CSS Color 4 formats accurately and computes WCAG 2.1 contrast with compositing', () => {
  const white = parseCssColor('#ffffff')!;
  const black = parseCssColor('#000000')!;
  expect(contrastRatio(white, black)).toBeCloseTo(21, 2);

  // CSS Color 4 support: color(srgb ...), oklch(...), oklab(...), hsl(...), including grad angles.
  expect(colorToHex(parseCssColor('color(srgb 1 0.5 0)')!)).toBe('#ff8000');
  expect(parseCssColor('oklch(0.7 0.12 240)')).not.toBeNull();
  expect(parseCssColor('oklab(0.6 -0.05 0.08)')).not.toBeNull();
  expect(colorToHex(parseCssColor('hsl(120 100% 50%)')!)).toBe('#00ff00');
  expect(colorToHex(parseCssColor('hsl(200grad 100% 50%)')!)).toBe('#00ffff');

  // Reject malformed dotted numbers that would produce NaN channels.
  expect(parseCssColor('rgb(. . .)')).toBeNull();
  expect(parseCssColor('rgb(1..2 3 4)')).toBeNull();

  // Composited alpha pair returns composited background hex alongside ratio.
  const darkBackdrop = parseCssColor('#101010')!;
  const semiWhite = parseCssColor('rgb(255 255 255 / 0.5)')!;
  const resolved = resolveContrastPair(black, semiWhite, darkBackdrop);
  expect(resolved.ratio).toBeGreaterThan(4.5);
  expect(resolved.ratio).toBeLessThan(7);
  expect(colorToHex(resolved.background)).toBe('#888888');
});

it('derives tokens from macros, preserves raw override priority across macro updates, exports CSS diff, and persists', () => {
  const removeSpy = vi.spyOn(Storage.prototype, 'removeItem');
  const { container } = openApp('/?item=card-demo&family=demo&scheme=dark');

  // Clean read-only mount must not call localStorage.removeItem.
  expect(removeSpy).not.toHaveBeenCalled();

  const sidebar = within(screen.getByRole('complementary', { name: 'Workbench inspector' }));

  // Components default to Inspector mode and offer a Theme toggle.
  expect(sidebar.getByRole('region', { name: 'JSX' })).toBeTruthy();
  fireEvent.click(sidebar.getByRole('button', { name: /^Theme/ }));

  const editor = within(sidebar.getByRole('region', { name: 'Theme editor' }));

  // Dragging a macro emits derived tokens in the scoped style tag.
  const toneSlider = editor.getByRole('slider', { name: 'Surface Tone' });
  fireEvent.change(toneSlider, { target: { value: '60' } });

  const styleEl = container.querySelector<HTMLStyleElement>('style[data-wb-theme-overrides]');
  expect(styleEl?.textContent).toContain('--wb-demo-surface: #f4f6fa;');
  expect(styleEl?.textContent).toContain('--wb-demo-fg: #12151c;');
  expect(styleEl?.textContent).toContain(".wb-shell .wb-artboard[data-theme='night']");

  // Typing an invalid partial color sets aria-invalid without committing broken CSS.
  const surfaceInput = editor.getByLabelText<HTMLInputElement>('Surface');
  fireEvent.change(surfaceInput, { target: { value: '#11' } });
  expect(surfaceInput.getAttribute('aria-invalid')).toBe('true');
  expect(
    container.querySelector<HTMLStyleElement>('style[data-wb-theme-overrides]')?.textContent,
  ).toContain('--wb-demo-surface: #f4f6fa;');

  // Valid manual raw token edit overrides macro-derived value and survives further macro updates.
  fireEvent.change(surfaceInput, { target: { value: '#111111' } });
  expect(surfaceInput.getAttribute('aria-invalid')).toBeNull();
  fireEvent.change(toneSlider, { target: { value: '80' } });
  expect(
    container.querySelector<HTMLStyleElement>('style[data-wb-theme-overrides]')?.textContent,
  ).toContain('--wb-demo-surface: #111111;');

  // Contrast check surfaces failing pairs immediately when foreground (#12151c) sits on #111111 (< 4.5:1).
  const contrastPanel = within(editor.getByRole('region', { name: 'Contrast check' }));
  const failingBadge = contrastPanel.getByText(/:1$/).closest('[data-pass]')!;
  expect(failingBadge.getAttribute('data-pass')).toBe('false');
  expect(failingBadge.textContent).toContain('Fail');

  // Updating foreground restores passing contrast; expanding panel reveals passing row.
  fireEvent.change(editor.getByLabelText('Foreground'), { target: { value: '#ffffff' } });
  fireEvent.click(contrastPanel.getByRole('button', { name: /Contrast \(WCAG 2\.1\)/ }));
  const passingBadge = contrastPanel.getByText(/:1$/).closest('[data-pass]')!;
  expect(passingBadge.getAttribute('data-pass')).toBe('true');
  expect(passingBadge.textContent).toContain('Pass');

  // Toggling Inspector -> Theme preserves ViewSettings portal and Theme Editor search state.
  fireEvent.change(editor.getByRole('searchbox', { name: 'Filter tokens' }), {
    target: { value: 'gap' },
  });
  fireEvent.click(sidebar.getByRole('button', { name: 'Inspector' }));
  expect(sidebar.getByRole('region', { name: 'JSX' })).toBeTruthy();
  fireEvent.click(sidebar.getByRole('button', { name: /^Theme/ }));
  expect(editor.getByRole<HTMLInputElement>('searchbox', { name: 'Filter tokens' }).value).toBe(
    'gap',
  );
  fireEvent.change(editor.getByRole('searchbox', { name: 'Filter tokens' }), {
    target: { value: '' },
  });

  // View CSS renders only active overrides formatted for stylesheets.
  fireEvent.click(editor.getByRole('button', { name: 'View CSS' }));
  const codeBlock = editor.getByText(/\[data-theme='night'\]/);
  expect(codeBlock.textContent).toContain('--wb-demo-surface: #111111;');
  expect(codeBlock.textContent).toContain('--wb-demo-fg: #ffffff;');

  // Copy CSS writes the exact diff to clipboard.
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  fireEvent.click(editor.getByRole('button', { name: 'Copy CSS' }));
  expect(writeText).toHaveBeenCalledWith(
    formatExportCss(
      testConfig.themeEditor!,
      testConfig.themes,
      {
        night: {
          macros: { tone: 80 },
          raw: { '--wb-demo-surface': '#111111', '--wb-demo-fg': '#ffffff' },
        },
      },
      'night',
    ),
  );

  // Persisted overrides survive a full remount.
  cleanup();
  const remounted = openApp('/?item=demo-scene&family=demo&scheme=dark');
  expect(screen.getByRole('region', { name: 'Theme editor' })).toBeTruthy();
  expect(
    remounted.container.querySelector<HTMLStyleElement>('style[data-wb-theme-overrides]')
      ?.textContent,
  ).toContain('--wb-demo-surface: #111111;');

  // Open View CSS, then Reset theme: export box must close cleanly and style tag disappears.
  fireEvent.click(screen.getByRole('button', { name: 'View CSS' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reset theme' }));
  expect(remounted.container.querySelector('style[data-wb-theme-overrides]')).toBeNull();
  expect(screen.getByRole('button', { name: 'View CSS' }).getAttribute('aria-expanded')).toBe(
    'false',
  );
});

it('tracks Family/Scheme filters smoothly and keeps isolated preset selected on return to All', () => {
  openApp('/?item=demo-scene&family=all&scheme=both');
  const select = screen.getByLabelText<HTMLSelectElement>('Theme preset');
  expect(select.value).toBe('night');

  // Switching Family to Alt moves selection off hidden 'night' to visible 'dusk'.
  fireEvent.click(screen.getByRole('link', { name: 'Alt' }));
  expect(select.value).toBe('dusk');

  // Returning to All preserves 'dusk' instead of snapping back to 'night'.
  fireEvent.click(screen.getByRole('link', { name: 'All' }));
  expect(select.value).toBe('dusk');
});

it('keeps raw=1 captures completely isolated without reading or mutating persisted overrides', () => {
  const savedPayload = JSON.stringify({
    night: { macros: {}, raw: { '--wb-demo-surface': '#ff00ff' } },
  });
  window.localStorage.setItem(STORAGE_KEY, savedPayload);
  const setSpy = vi.spyOn(Storage.prototype, 'setItem');
  const removeSpy = vi.spyOn(Storage.prototype, 'removeItem');

  const { container } = openApp('/?item=card-demo&family=demo&scheme=dark&raw=1');
  expect(container.querySelector('style[data-wb-theme-overrides]')).toBeNull();
  expect(screen.queryByRole('region', { name: 'Theme editor' })).toBeNull();
  expect(setSpy).not.toHaveBeenCalled();
  expect(removeSpy).not.toHaveBeenCalled();
  expect(window.localStorage.getItem(STORAGE_KEY)).toBe(savedPayload);
});

it('sanitizes prototype pollution, invalid hydrated macro types, parser breakouts, and overlay scopes', () => {
  // Malicious localStorage payload with __proto__ and wrong macro types.
  window.localStorage.setItem(
    STORAGE_KEY,
    '{"__proto__":{"macros":{"tone":50},"raw":{"--wb-demo-surface":"#000000"}},"night":{"macros":{"tone":"bad","unknown":1,"corners":"999","accent":"#3366ff"},"raw":{"--wb-demo-fg":"#eeeeee"}}}',
  );
  const loaded = loadThemeOverrides(themeEditor);
  expect(Object.getPrototypeOf(loaded)).toBe(Object.prototype);
  expect(loaded.night?.macros).toEqual({ accent: '#3366ff' });
  expect(loaded.night?.raw).toEqual({ '--wb-demo-fg': '#eeeeee' });

  // CSS parser breakout payloads must be rejected by isSafeCssValue.
  for (const unsafe of [
    'red; } body { display: none',
    'rgb(255 0 0',
    'rgb(255 0 0))',
    "'unterminated",
    '10px\\',
    'url(a"b) (" )',
    '\\75 rl(a"b) (" )',
    '1px </style><script>alert(1)</script>',
    '10px\fcolor: red',
  ]) {
    expect(isSafeCssValue(unsafe), `Expected unsafe CSS rejected: ${unsafe}`).toBe(false);
  }
  expect(isSafeCssValue('rgb(255 0 0 / 0.5)')).toBe(true);
  expect(isSafeCssValue('linear-gradient(135deg, #111 0%, #222 100%)')).toBe(true);

  // Selector escaping neutralizes newlines and </style> in theme IDs and preserves overlay scope parity.
  const hostileThemes = [
    {
      id: 'night\n</style>] {} body { display: none',
      label: 'Hostile',
      family: 'demo',
      familyLabel: 'Demo',
      colorScheme: 'dark' as const,
    },
  ];
  const store = {
    [hostileThemes[0]!.id]: {
      macros: {},
      raw: {
        '--wb-demo-surface': '#222222',
        '--wb-demo-overlay-card': '#333333',
      },
    },
  };
  const scopedCss = buildScopedOverrideStylesheet(themeEditor, hostileThemes, store);
  expect(scopedCss).toContain('\\a ');
  expect(scopedCss).toContain('\\3c /style>');
  expect(scopedCss).not.toContain('</style>');
  expect(scopedCss).toContain("[data-surface='overlay']");
  expect(scopedCss).toContain('--wb-demo-overlay-card: #333333;');

  const exportedCss = formatExportCss(themeEditor, hostileThemes, store);
  expect(exportedCss).not.toContain('</style>');
  expect(exportedCss).toContain("[data-surface='overlay']");
  expect(exportedCss).toContain('--wb-demo-overlay-card: #333333;');
});
