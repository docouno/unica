import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import type { ReactElement, RefObject } from 'react';
import {
  EMPTY_BUCKET,
  colorToHex,
  computeThemeTokens,
  countAllChanges,
  countThemeChanges,
  escapeCssString,
  formatExportCss,
  getThemeBucket,
  hasOwn,
  isSafeCssValue,
  isSafeObjectKey,
  macroBoundsForTheme,
  macroDefaultForTheme,
  parseCssColor,
  resolveContrastPair,
  resolvedMacroValues,
} from './themeEditorState.js';
import type { ParsedColor, ThemeOverrideBucket, ThemeOverridesStore } from './themeEditorState.js';
import type {
  ThemeEditorConfig,
  ThemeMacroValue,
  ThemeTokenDefinition,
  WorkbenchTheme,
} from './types.js';
import './theme-editor.css';

export interface ThemeEditorProps {
  readonly config: ThemeEditorConfig;
  readonly themes: readonly WorkbenchTheme[];
  readonly visibleThemes: readonly WorkbenchTheme[];
  readonly shellRef: RefObject<HTMLDivElement | null>;
  readonly store: ThemeOverridesStore;
  readonly active?: boolean;
  readonly measureKey?: string;
  readonly onChangeMacro: (themeId: string, macroId: string, value: ThemeMacroValue) => void;
  readonly onResetMacro: (themeId: string, macroId: string) => void;
  readonly onChangeToken: (themeId: string, tokenName: string, value: string) => void;
  readonly onResetToken: (themeId: string, tokenName: string) => void;
  readonly onResetTheme: (themeId: string) => void;
  readonly onResetAll: () => void;
  readonly onFocusTheme?: (theme: WorkbenchTheme) => void;
}

interface ComputedSnapshot {
  readonly rawValues: Readonly<Record<string, string>>;
  readonly resolvedColors: Readonly<Record<string, ParsedColor>>;
}

const LENGTH_VALUE_RE =
  /^(?:0|-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:px|rem|em|%|vw|vh|vmin|vmax|ch|ex|cqi|cqb|lh|rlh))$/i;
const NUMBER_VALUE_RE = /^-?(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)$/;
const VAR_FUNC_RE = /^var\(\s*--[a-zA-Z0-9_-]+(?:\s*,\s*[^)]+)?\s*\)$/;

let colorCanvasCtx: CanvasRenderingContext2D | null | undefined;

function rasterizeCssColor(computed: string): ParsedColor | null {
  try {
    if (colorCanvasCtx === undefined) {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      colorCanvasCtx = canvas.getContext('2d', { willReadFrequently: true });
    }
    if (!colorCanvasCtx) {
      return null;
    }
    colorCanvasCtx.clearRect(0, 0, 1, 1);
    colorCanvasCtx.fillStyle = 'rgba(0, 0, 0, 0)';
    colorCanvasCtx.fillStyle = computed;
    colorCanvasCtx.fillRect(0, 0, 1, 1);
    const data = colorCanvasCtx.getImageData(0, 0, 1, 1).data;
    return { r: data[0]!, g: data[1]!, b: data[2]!, a: data[3]! / 255 };
  } catch {
    return null;
  }
}

function supportsCss(property: string, value: string): boolean {
  try {
    return typeof CSS !== 'undefined' && typeof CSS.supports === 'function'
      ? CSS.supports(property, value)
      : false;
  } catch {
    return false;
  }
}

function isValidColorValue(value: string): boolean {
  const trimmed = value.trim();
  if (!isSafeCssValue(trimmed)) {
    return false;
  }
  if (parseCssColor(trimmed) !== null || VAR_FUNC_RE.test(trimmed)) {
    return true;
  }
  return supportsCss('color', trimmed);
}

function isValidTokenDraft(token: ThemeTokenDefinition, value: string): boolean {
  const trimmed = value.trim();
  if (!isSafeCssValue(trimmed)) {
    return false;
  }
  if (token.kind === 'color') {
    return isValidColorValue(trimmed);
  }
  if (token.kind === 'length') {
    return (
      LENGTH_VALUE_RE.test(trimmed) || VAR_FUNC_RE.test(trimmed) || supportsCss('width', trimmed)
    );
  }
  if (token.kind === 'number') {
    return NUMBER_VALUE_RE.test(trimmed) && Number.isFinite(Number.parseFloat(trimmed));
  }
  if (token.kind === 'choice') {
    return token.choices ? token.choices.some((choice) => choice.value === trimmed) : true;
  }
  return true;
}

function probeColorToken(
  ownerDocument: Document,
  hostParent: HTMLElement,
  tokenNames: readonly string[],
  resolvedColors: Record<string, ParsedColor>,
): void {
  if (tokenNames.length === 0) {
    return;
  }
  const probeHost = ownerDocument.createElement('span');
  probeHost.setAttribute('aria-hidden', 'true');
  probeHost.style.position = 'absolute';
  probeHost.style.visibility = 'hidden';
  probeHost.style.pointerEvents = 'none';
  const probe = ownerDocument.createElement('span');
  probeHost.appendChild(probe);
  hostParent.appendChild(probeHost);
  try {
    for (const name of tokenNames) {
      probeHost.style.color = 'rgb(1 2 3)';
      probe.style.color = `var(${name}, rgb(1 2 3))`;
      const first = window.getComputedStyle(probe).color;

      probeHost.style.color = 'rgb(4 5 6)';
      probe.style.color = `var(${name}, rgb(4 5 6))`;
      const second = window.getComputedStyle(probe).color;

      if (first && first === second) {
        const parsed = parseCssColor(first) ?? rasterizeCssColor(first);
        if (parsed) {
          resolvedColors[name] = parsed;
        }
      }
    }
  } finally {
    probeHost.remove();
  }
}

function measureArtboardTokens(
  shell: HTMLElement | null,
  themeId: string,
  themeTokenNames: readonly string[],
  overlayTokenNames: readonly string[],
  colorTokenNames: ReadonlySet<string>,
): ComputedSnapshot {
  const empty: ComputedSnapshot = { rawValues: {}, resolvedColors: {} };
  if (!shell) {
    return empty;
  }
  let artboard: HTMLElement | null = null;
  try {
    artboard = shell.querySelector<HTMLElement>(
      `.wb-artboard[data-theme="${escapeCssString(themeId, '"')}"]`,
    );
  } catch {
    return empty;
  }
  if (!artboard) {
    return empty;
  }

  const rawValues: Record<string, string> = {};
  const resolvedColors: Record<string, ParsedColor> = {};

  const readSurface = (target: HTMLElement, names: readonly string[]): void => {
    const style = window.getComputedStyle(target);
    const unresolvedColors: string[] = [];
    for (const name of names) {
      const val = style.getPropertyValue(name).trim();
      if (val) {
        rawValues[name] = val;
      }
      if (colorTokenNames.has(name) && val) {
        const parsed = parseCssColor(val);
        if (parsed) {
          resolvedColors[name] = parsed;
        } else {
          unresolvedColors.push(name);
        }
      }
    }
    probeColorToken(artboard.ownerDocument, target, unresolvedColors, resolvedColors);
  };

  readSurface(artboard, themeTokenNames);

  if (overlayTokenNames.length > 0) {
    const existingOverlay = artboard.querySelector<HTMLElement>('[data-surface="overlay"]');
    if (existingOverlay) {
      readSurface(existingOverlay, overlayTokenNames);
    } else {
      const tempOverlay = artboard.ownerDocument.createElement('span');
      tempOverlay.setAttribute('data-surface', 'overlay');
      tempOverlay.setAttribute('aria-hidden', 'true');
      tempOverlay.style.position = 'absolute';
      tempOverlay.style.visibility = 'hidden';
      tempOverlay.style.pointerEvents = 'none';
      artboard.appendChild(tempOverlay);
      try {
        readSurface(tempOverlay, overlayTokenNames);
      } finally {
        tempOverlay.remove();
      }
    }
  }

  return { rawValues, resolvedColors };
}

function parseSliderNumber(value: string, expectedUnit?: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (expectedUnit) {
    if (trimmed === '0') {
      return 0;
    }
    if (!trimmed.toLowerCase().endsWith(expectedUnit.toLowerCase())) {
      return null;
    }
    const prefix = trimmed.slice(0, trimmed.length - expectedUnit.length);
    if (!NUMBER_VALUE_RE.test(prefix)) {
      return null;
    }
    const parsed = Number.parseFloat(prefix);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (!NUMBER_VALUE_RE.test(trimmed)) {
    return null;
  }
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMacroDisplay(step: number, unit: string | undefined, value: number): string {
  const decimals = step < 0.01 ? 3 : step < 0.1 ? 2 : step < 1 ? 1 : 0;
  const formatted = value.toFixed(decimals);
  return unit ? `${formatted}${unit}` : formatted;
}

function omitKey<T>(record: Readonly<Record<string, T>>, key: string): Record<string, T> {
  const next: Record<string, T> = {};
  for (const [entryKey, entryValue] of Object.entries(record)) {
    if (entryKey !== key && isSafeObjectKey(entryKey)) {
      next[entryKey] = entryValue;
    }
  }
  return next;
}

function omitPrefix<T>(record: Readonly<Record<string, T>>, prefix: string): Record<string, T> {
  const next: Record<string, T> = {};
  for (const [entryKey, entryValue] of Object.entries(record)) {
    if (!entryKey.startsWith(prefix) && isSafeObjectKey(entryKey)) {
      next[entryKey] = entryValue;
    }
  }
  return next;
}

export function ThemeEditor({
  config,
  themes,
  visibleThemes,
  shellRef,
  store,
  active = true,
  measureKey = '',
  onChangeMacro,
  onResetMacro,
  onChangeToken,
  onResetToken,
  onResetTheme,
  onResetAll,
  onFocusTheme,
}: ThemeEditorProps): ReactElement {
  const selectId = useId();
  const searchId = useId();

  const visibleKey = visibleThemes.map((theme) => theme.id).join(',');
  const [selection, setSelection] = useState<{
    readonly id: string;
    readonly visibleKey: string;
  }>(() => ({
    id: visibleThemes[0]?.id ?? themes[0]?.id ?? '',
    visibleKey,
  }));

  if (selection.visibleKey !== visibleKey) {
    const currentStillVisible = visibleThemes.some((theme) => theme.id === selection.id);
    const nextId =
      visibleThemes.length === 1
        ? visibleThemes[0]!.id
        : currentStillVisible
          ? selection.id
          : (visibleThemes[0]?.id ?? selection.id);
    setSelection({ id: nextId, visibleKey });
  }

  const [query, setQuery] = useState('');
  const [drafts, setDrafts] = useState<Readonly<Record<string, string>>>({});
  const [exportScope, setExportScope] = useState<'current' | 'all'>('current');
  const [showCss, setShowCss] = useState(false);
  const [contrastExpanded, setContrastExpanded] = useState(false);
  const [copyResult, setCopyResult] = useState<{
    readonly status: string;
    readonly css: string;
  } | null>(null);
  const [snapshot, setSnapshot] = useState<ComputedSnapshot>({ rawValues: {}, resolvedColors: {} });

  const { themeTokenNames, overlayTokenNames, colorTokenNames, groups } = useMemo(() => {
    const themeNames = new Set<string>();
    const overlayNames = new Set<string>();
    const colors = new Set<string>();
    const grouped = new Map<string, ThemeTokenDefinition[]>();
    for (const token of config.tokens) {
      if (token.scope === 'overlay') {
        overlayNames.add(token.name);
      } else {
        themeNames.add(token.name);
      }
      if (token.kind === 'color') {
        colors.add(token.name);
      }
      const list = grouped.get(token.group) ?? [];
      list.push(token);
      grouped.set(token.group, list);
    }
    for (const pair of config.contrastPairs ?? []) {
      if (!overlayNames.has(pair.foreground)) {
        themeNames.add(pair.foreground);
      }
      if (!overlayNames.has(pair.background)) {
        themeNames.add(pair.background);
      }
      colors.add(pair.foreground);
      colors.add(pair.background);
      if (pair.backdrop) {
        if (!overlayNames.has(pair.backdrop)) {
          themeNames.add(pair.backdrop);
        }
        colors.add(pair.backdrop);
      }
    }
    return {
      themeTokenNames: [...themeNames],
      overlayTokenNames: [...overlayNames],
      colorTokenNames: colors,
      groups: [...grouped.entries()],
    };
  }, [config.contrastPairs, config.tokens]);

  const [openGroups, setOpenGroups] = useState<Readonly<Record<string, boolean>>>(() =>
    groups[0] ? { [groups[0][0]]: true } : {},
  );

  const activeTheme = useMemo(
    () => themes.find((theme) => theme.id === selection.id) ?? visibleThemes[0] ?? themes[0],
    [selection.id, themes, visibleThemes],
  );

  const activeBucket: ThemeOverrideBucket = activeTheme
    ? (getThemeBucket(store, activeTheme.id) ?? EMPTY_BUCKET)
    : EMPTY_BUCKET;

  const isThemeVisible = useMemo(
    () => (activeTheme ? visibleThemes.some((theme) => theme.id === activeTheme.id) : false),
    [activeTheme, visibleThemes],
  );

  useEffect(() => {
    if (!activeTheme || !active) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      setSnapshot(
        measureArtboardTokens(
          shellRef.current,
          activeTheme.id,
          themeTokenNames,
          overlayTokenNames,
          colorTokenNames,
        ),
      );
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [
    active,
    activeTheme,
    colorTokenNames,
    isThemeVisible,
    measureKey,
    overlayTokenNames,
    shellRef,
    store,
    themeTokenNames,
  ]);

  const { derived, effective } = useMemo(
    () =>
      activeTheme
        ? computeThemeTokens(config, activeTheme, activeBucket)
        : { derived: {}, effective: {} },
    [activeBucket, activeTheme, config],
  );

  const macroState = useMemo(
    () =>
      activeTheme
        ? resolvedMacroValues(config, activeTheme, activeBucket)
        : { values: {}, changedIds: new Set<string>() },
    [activeBucket, activeTheme, config],
  );

  const activeChangeCount = activeTheme ? countThemeChanges(config, activeTheme, activeBucket) : 0;
  const totalChangeCount = useMemo(
    () => countAllChanges(config, themes, store),
    [config, store, themes],
  );

  const effectiveExportScope: 'current' | 'all' =
    totalChangeCount > 0 && activeChangeCount === 0
      ? 'all'
      : totalChangeCount > activeChangeCount
        ? exportScope
        : 'current';

  const exportOpen = showCss && totalChangeCount > 0;

  const exportCss = useMemo(
    () =>
      formatExportCss(
        config,
        themes,
        store,
        effectiveExportScope === 'current' ? activeTheme?.id : undefined,
      ),
    [activeTheme?.id, config, effectiveExportScope, store, themes],
  );

  const handleCopyCss = useCallback((): void => {
    if (!exportCss) {
      return;
    }
    if (!navigator.clipboard) {
      setShowCss(true);
      setCopyResult({ status: 'Copy unavailable', css: exportCss });
      return;
    }
    navigator.clipboard.writeText(exportCss).then(
      () => setCopyResult({ status: 'CSS copied', css: exportCss }),
      () => {
        setShowCss(true);
        setCopyResult({ status: 'Copy unavailable', css: exportCss });
      },
    );
  }, [exportCss]);

  const contrastResults = useMemo(() => {
    if (!config.contrastPairs?.length || !activeTheme) {
      return [];
    }
    const resolveColor = (name: string): ParsedColor | null => {
      if (hasOwn(effective, name)) {
        const override = effective[name];
        if (override) {
          const direct = parseCssColor(override);
          if (direct) {
            return direct;
          }
        }
      }
      return hasOwn(snapshot.resolvedColors, name) ? (snapshot.resolvedColors[name] ?? null) : null;
    };

    return config.contrastPairs.map((pair) => {
      const fg = resolveColor(pair.foreground);
      const bg = resolveColor(pair.background);
      const backdrop = pair.backdrop ? (resolveColor(pair.backdrop) ?? undefined) : undefined;
      if (!fg || !bg) {
        return { pair, ratio: null, pass: null, fgHex: null, bgHex: null };
      }
      const resolved = resolveContrastPair(fg, bg, backdrop);
      return {
        pair,
        ratio: resolved.ratio,
        pass: resolved.ratio >= pair.minRatio,
        fgHex: colorToHex(resolved.foreground),
        bgHex: colorToHex(resolved.background),
      };
    });
  }, [activeTheme, config.contrastPairs, effective, snapshot.resolvedColors]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) {
      return groups;
    }
    return groups
      .map(([groupName, tokens]) => {
        const matchesGroup = groupName.toLowerCase().includes(normalizedQuery);
        const matchingTokens = matchesGroup
          ? tokens
          : tokens.filter(
              (token) =>
                token.label.toLowerCase().includes(normalizedQuery) ||
                token.name.toLowerCase().includes(normalizedQuery) ||
                (token.description?.toLowerCase().includes(normalizedQuery) ?? false),
            );
        return [groupName, matchingTokens] as const;
      })
      .filter(([, tokens]) => tokens.length > 0);
  }, [groups, normalizedQuery]);

  if (!activeTheme) {
    return (
      <div className="wb-theme-editor">
        <p className="wb-inspector-note">No themes registered.</p>
      </div>
    );
  }

  const measuredCount = contrastResults.filter((item) => item.ratio !== null).length;
  const passCount = contrastResults.filter((item) => item.pass === true).length;
  const failingResults = contrastResults.filter((item) => item.pass === false);
  const hasContrastFailure = failingResults.length > 0;
  const showContrastRows = contrastExpanded || hasContrastFailure;
  const visibleContrastRows = contrastExpanded ? contrastResults : failingResults;

  const defaultCopyLabel =
    effectiveExportScope === 'all' && totalChangeCount > activeChangeCount
      ? 'Copy all CSS'
      : 'Copy CSS';
  const copyLabel = copyResult?.css === exportCss ? copyResult.status : defaultCopyLabel;

  return (
    <div className="wb-theme-editor" role="region" aria-label="Theme editor">
      <div className="wb-theme-header">
        <div className="wb-theme-selector-row">
          <select
            id={selectId}
            className="wb-field"
            aria-label="Theme preset"
            value={activeTheme.id}
            onChange={(event) => setSelection({ id: event.target.value, visibleKey })}
          >
            {themes.map((theme) => {
              const count = countThemeChanges(config, theme, getThemeBucket(store, theme.id));
              return (
                <option key={theme.id} value={theme.id}>
                  {theme.label}
                  {count > 0 ? ` (${String(count)})` : ''}
                </option>
              );
            })}
          </select>
          {onFocusTheme && (
            <button
              type="button"
              className="wb-action-btn"
              onClick={() => onFocusTheme(activeTheme)}
              title={`Isolate ${activeTheme.label} in the preview`}
            >
              Focus
            </button>
          )}
        </div>

        {!isThemeVisible && (
          <p className="wb-inspector-note">
            This preset is hidden by the current Family/Scheme filter. Click Focus to preview it.
          </p>
        )}

        <div className="wb-theme-actions">
          <button
            type="button"
            className="wb-action-btn"
            disabled={!exportCss}
            onClick={handleCopyCss}
          >
            {copyLabel}
          </button>
          <button
            type="button"
            className="wb-action-btn"
            aria-expanded={exportOpen}
            disabled={totalChangeCount === 0}
            onClick={() => setShowCss((open) => !open)}
          >
            {exportOpen ? 'Hide CSS' : 'View CSS'}
          </button>
          <button
            type="button"
            className="wb-action-btn"
            disabled={activeChangeCount === 0}
            onClick={() => {
              setDrafts((prev) => omitPrefix(prev, `${activeTheme.id}:`));
              if (totalChangeCount <= activeChangeCount) {
                setShowCss(false);
              }
              onResetTheme(activeTheme.id);
            }}
          >
            Reset theme
          </button>
          {totalChangeCount > activeChangeCount && (
            <button
              type="button"
              className="wb-action-btn"
              onClick={() => {
                setDrafts({});
                setShowCss(false);
                setExportScope('current');
                onResetAll();
              }}
            >
              Reset all
            </button>
          )}
        </div>

        {exportOpen && (
          <div className="wb-theme-export-box">
            {totalChangeCount > activeChangeCount && activeChangeCount > 0 && (
              <div className="wb-seg" role="group" aria-label="Export scope">
                <button
                  type="button"
                  className="wb-seg-btn"
                  aria-pressed={effectiveExportScope === 'current'}
                  onClick={() => setExportScope('current')}
                >
                  Current ({activeChangeCount})
                </button>
                <button
                  type="button"
                  className="wb-seg-btn"
                  aria-pressed={effectiveExportScope === 'all'}
                  onClick={() => setExportScope('all')}
                >
                  All ({totalChangeCount})
                </button>
              </div>
            )}
            <pre className="wb-theme-export-code">
              <code>{exportCss || '/* No overrides on this preset yet. */'}</code>
            </pre>
          </div>
        )}
      </div>

      {config.macros && config.macros.length > 0 && (
        <section className="wb-theme-section" aria-label="Palette macros">
          <div className="wb-theme-section-header">
            <h2 className="wb-theme-section-title">Macro controls</h2>
            {macroState.changedIds.size > 0 && (
              <span className="wb-theme-group-count">{macroState.changedIds.size} active</span>
            )}
          </div>
          <div className="wb-theme-macro-list">
            {config.macros.map((macro) => {
              const current =
                (hasOwn(macroState.values, macro.id) ? macroState.values[macro.id] : undefined) ??
                macroDefaultForTheme(macro, activeTheme);
              if (current === undefined) {
                return null;
              }
              const isChanged = macroState.changedIds.has(macro.id);
              const controlId = `${selectId}-macro-${macro.id}`;
              const macroDraftKey = `${activeTheme.id}:macro:${macro.id}`;

              if (macro.kind === 'range') {
                const numeric = typeof current === 'number' ? current : Number(current);
                const bounds = macroBoundsForTheme(macro, activeTheme);
                return (
                  <div key={macro.id} className="wb-theme-macro">
                    <div className="wb-theme-macro-row">
                      <label htmlFor={controlId} className="wb-theme-macro-label">
                        {isChanged && <span className="wb-theme-dot" aria-hidden="true" />}
                        {macro.label}
                      </label>
                      <div className="wb-theme-macro-meta">
                        <span className="wb-theme-macro-value">
                          {formatMacroDisplay(bounds.step, macro.unit, numeric)}
                        </span>
                        {isChanged && (
                          <button
                            type="button"
                            className="wb-theme-reset-link"
                            aria-label={`Reset ${macro.label}`}
                            onClick={() => onResetMacro(activeTheme.id, macro.id)}
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      id={controlId}
                      type="range"
                      className="wb-theme-range"
                      min={bounds.min}
                      max={bounds.max}
                      step={bounds.step}
                      value={numeric}
                      onChange={(event) =>
                        onChangeMacro(activeTheme.id, macro.id, Number(event.target.value))
                      }
                    />
                  </div>
                );
              }

              if (macro.kind === 'color') {
                const colorText = String(current);
                const parsed = parseCssColor(colorText);
                const swatchHex = parsed ? colorToHex(parsed) : '#000000';
                const draft = hasOwn(drafts, macroDraftKey) ? drafts[macroDraftKey] : undefined;
                const invalidDraft =
                  draft !== undefined &&
                  (draft.trim().length === 0 ||
                    !isSafeCssValue(draft) ||
                    parseCssColor(draft) === null);
                return (
                  <div key={macro.id} className="wb-theme-macro">
                    <div className="wb-theme-macro-row">
                      <label htmlFor={controlId} className="wb-theme-macro-label">
                        {isChanged && <span className="wb-theme-dot" aria-hidden="true" />}
                        {macro.label}
                      </label>
                      {isChanged && (
                        <button
                          type="button"
                          className="wb-theme-reset-link"
                          aria-label={`Reset ${macro.label}`}
                          onClick={() => {
                            setDrafts((prev) => omitKey(prev, macroDraftKey));
                            onResetMacro(activeTheme.id, macro.id);
                          }}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <div className="wb-theme-color-control">
                      <input
                        type="color"
                        className="wb-theme-swatch"
                        aria-label={`${macro.label} picker`}
                        value={swatchHex}
                        onChange={(event) => {
                          setDrafts((prev) => omitKey(prev, macroDraftKey));
                          onChangeMacro(activeTheme.id, macro.id, event.target.value);
                        }}
                      />
                      <input
                        id={controlId}
                        type="text"
                        className="wb-field wb-theme-input"
                        aria-invalid={invalidDraft || undefined}
                        value={draft ?? colorText}
                        onChange={(event) => {
                          const next = event.target.value;
                          setDrafts((prev) => ({ ...prev, [macroDraftKey]: next }));
                          const parsedNext = isSafeCssValue(next) ? parseCssColor(next) : null;
                          if (parsedNext) {
                            onChangeMacro(activeTheme.id, macro.id, colorToHex(parsedNext));
                          }
                        }}
                        onBlur={() => setDrafts((prev) => omitKey(prev, macroDraftKey))}
                      />
                    </div>
                  </div>
                );
              }

              const choiceVal = String(current);
              return (
                <div key={macro.id} className="wb-theme-macro">
                  <div className="wb-theme-macro-row">
                    <span className="wb-theme-macro-label">
                      {isChanged && <span className="wb-theme-dot" aria-hidden="true" />}
                      {macro.label}
                    </span>
                    {isChanged && (
                      <button
                        type="button"
                        className="wb-theme-reset-link"
                        aria-label={`Reset ${macro.label}`}
                        onClick={() => onResetMacro(activeTheme.id, macro.id)}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="wb-seg" role="group" aria-label={macro.label}>
                    {macro.choices.map((choice) => (
                      <button
                        key={choice.value}
                        type="button"
                        className="wb-seg-btn"
                        aria-pressed={choiceVal === choice.value}
                        onClick={() => onChangeMacro(activeTheme.id, macro.id, choice.value)}
                      >
                        {choice.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {contrastResults.length > 0 && (
        <section className="wb-theme-section" aria-label="Contrast check">
          <div className="wb-theme-group">
            <button
              type="button"
              className="wb-theme-group-summary"
              aria-expanded={contrastExpanded}
              onClick={() => setContrastExpanded((open) => !open)}
            >
              <span className="wb-theme-group-title">Contrast (WCAG 2.1)</span>
              <span
                className="wb-theme-group-count"
                data-pass={hasContrastFailure ? 'false' : undefined}
              >
                {measuredCount > 0 ? `${passCount}/${measuredCount} pass` : 'Hidden'}
              </span>
            </button>
            {showContrastRows && (
              <div className="wb-theme-token-list">
                {measuredCount === 0 ? (
                  <p className="wb-inspector-note">Show this theme to measure live contrast.</p>
                ) : (
                  <div className="wb-theme-contrast-list">
                    {visibleContrastRows.map(({ pair, ratio, pass, fgHex, bgHex }) => (
                      <div key={pair.id} className="wb-theme-contrast-row">
                        <span
                          className="wb-theme-contrast-chip"
                          aria-hidden="true"
                          style={
                            fgHex && bgHex ? { color: fgHex, backgroundColor: bgHex } : undefined
                          }
                        >
                          Aa
                        </span>
                        <span className="wb-theme-contrast-label" title={pair.label}>
                          {pair.label}
                        </span>
                        {ratio !== null && pass !== null ? (
                          <span
                            className="wb-theme-contrast-ratio"
                            data-pass={pass ? 'true' : 'false'}
                            title={`Minimum target ${pair.minRatio}:1 (${pass ? 'Pass' : 'Fail'})`}
                          >
                            <span aria-hidden="true">{pass ? '✓' : '✕'}</span>
                            <span>{ratio.toFixed(2)}:1</span>
                            <span className="wb-theme-sr-only">{pass ? 'Pass' : 'Fail'}</span>
                          </span>
                        ) : (
                          <span className="wb-theme-group-count">—</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="wb-theme-section" aria-label="Token overrides">
        <div className="wb-theme-section-header">
          <h2 className="wb-theme-section-title">Tokens</h2>
          <span className="wb-theme-group-count">{config.tokens.length}</span>
        </div>
        <input
          id={searchId}
          type="search"
          className="wb-field wb-theme-search"
          aria-label="Filter tokens"
          placeholder="Filter tokens…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className="wb-theme-groups">
          {filteredGroups.map(([groupName, tokens]) => {
            const changedInGroup = tokens.filter(
              (token) => hasOwn(activeBucket.raw, token.name) || hasOwn(derived, token.name),
            ).length;
            const isOpen = Boolean(normalizedQuery) || Boolean(openGroups[groupName]);
            return (
              <div key={groupName} className="wb-theme-group">
                <button
                  type="button"
                  className="wb-theme-group-summary"
                  aria-expanded={isOpen}
                  onClick={() => {
                    if (!normalizedQuery) {
                      setOpenGroups((prev) => ({ ...prev, [groupName]: !isOpen }));
                    }
                  }}
                >
                  <span className="wb-theme-group-title">{groupName}</span>
                  <span className="wb-theme-group-count">
                    {changedInGroup > 0 ? `${changedInGroup}/` : ''}
                    {tokens.length}
                  </span>
                </button>
                {isOpen && (
                  <div className="wb-theme-token-list">
                    {tokens.map((token) => {
                      const isRawOverride = hasOwn(activeBucket.raw, token.name);
                      const isMacroDerived = !isRawOverride && hasOwn(derived, token.name);
                      const currentValue =
                        (hasOwn(effective, token.name) ? effective[token.name] : undefined) ??
                        (hasOwn(snapshot.rawValues, token.name)
                          ? snapshot.rawValues[token.name]
                          : undefined) ??
                        '';
                      const tokenDraftKey = `${activeTheme.id}:${token.name}`;
                      const draft = hasOwn(drafts, tokenDraftKey)
                        ? drafts[tokenDraftKey]
                        : undefined;
                      const displayedValue = draft ?? currentValue;
                      const invalidDraft = draft !== undefined && !isValidTokenDraft(token, draft);
                      const inputId = `${selectId}-tok-${token.name}`;

                      return (
                        <div key={token.name} className="wb-theme-token">
                          <div className="wb-theme-token-top">
                            <label htmlFor={inputId} className="wb-theme-token-name">
                              {(isRawOverride || isMacroDerived) && (
                                <span
                                  className="wb-theme-dot"
                                  aria-hidden="true"
                                  title={isRawOverride ? 'Manual override' : 'Set by macro'}
                                />
                              )}
                              <span>{token.label}</span>
                            </label>
                            {isRawOverride && (
                              <button
                                type="button"
                                className="wb-theme-reset-link"
                                aria-label={`Reset ${token.label}`}
                                onClick={() => {
                                  setDrafts((prev) => omitKey(prev, tokenDraftKey));
                                  onResetToken(activeTheme.id, token.name);
                                }}
                              >
                                Reset
                              </button>
                            )}
                          </div>
                          <span className="wb-theme-token-var">{token.name}</span>

                          {token.kind === 'color' && (
                            <div className="wb-theme-color-control">
                              <input
                                type="color"
                                className="wb-theme-swatch"
                                aria-label={`${token.label} color`}
                                value={(() => {
                                  const direct = parseCssColor(currentValue);
                                  const resolved =
                                    direct ??
                                    (hasOwn(snapshot.resolvedColors, token.name)
                                      ? snapshot.resolvedColors[token.name]
                                      : undefined);
                                  return resolved ? colorToHex(resolved) : '#000000';
                                })()}
                                onChange={(event) => {
                                  setDrafts((prev) => omitKey(prev, tokenDraftKey));
                                  onChangeToken(activeTheme.id, token.name, event.target.value);
                                }}
                              />
                              <input
                                id={inputId}
                                type="text"
                                className="wb-field wb-theme-input"
                                aria-invalid={invalidDraft || undefined}
                                value={displayedValue}
                                onChange={(event) => {
                                  const next = event.target.value;
                                  setDrafts((prev) => ({ ...prev, [tokenDraftKey]: next }));
                                  if (isValidTokenDraft(token, next)) {
                                    onChangeToken(activeTheme.id, token.name, next.trim());
                                  }
                                }}
                                onBlur={() => setDrafts((prev) => omitKey(prev, tokenDraftKey))}
                              />
                            </div>
                          )}

                          {(token.kind === 'length' || token.kind === 'number') &&
                            (token.min !== undefined && token.max !== undefined ? (
                              <div className="wb-theme-length-control">
                                {(() => {
                                  const sliderNum = parseSliderNumber(
                                    currentValue,
                                    token.kind === 'length' ? token.unit : undefined,
                                  );
                                  return (
                                    <input
                                      type="range"
                                      className="wb-theme-range"
                                      aria-label={`${token.label} slider`}
                                      min={token.min}
                                      max={token.max}
                                      step={token.step ?? 1}
                                      value={sliderNum ?? token.min}
                                      onChange={(event) => {
                                        const unit = token.unit ?? '';
                                        const next = `${event.target.value}${unit}`;
                                        setDrafts((prev) => omitKey(prev, tokenDraftKey));
                                        onChangeToken(activeTheme.id, token.name, next);
                                      }}
                                    />
                                  );
                                })()}
                                <input
                                  id={inputId}
                                  type="text"
                                  className="wb-field wb-theme-input"
                                  aria-invalid={invalidDraft || undefined}
                                  value={displayedValue}
                                  onChange={(event) => {
                                    const next = event.target.value;
                                    setDrafts((prev) => ({ ...prev, [tokenDraftKey]: next }));
                                    if (isValidTokenDraft(token, next)) {
                                      onChangeToken(activeTheme.id, token.name, next.trim());
                                    }
                                  }}
                                  onBlur={() => setDrafts((prev) => omitKey(prev, tokenDraftKey))}
                                />
                              </div>
                            ) : (
                              <input
                                id={inputId}
                                type="text"
                                className="wb-field wb-theme-input"
                                aria-invalid={invalidDraft || undefined}
                                value={displayedValue}
                                onChange={(event) => {
                                  const next = event.target.value;
                                  setDrafts((prev) => ({ ...prev, [tokenDraftKey]: next }));
                                  if (isValidTokenDraft(token, next)) {
                                    onChangeToken(activeTheme.id, token.name, next.trim());
                                  }
                                }}
                                onBlur={() => setDrafts((prev) => omitKey(prev, tokenDraftKey))}
                              />
                            ))}

                          {token.kind === 'choice' && token.choices && (
                            <select
                              id={inputId}
                              className="wb-field"
                              value={
                                token.choices.some((choice) => choice.value === displayedValue)
                                  ? displayedValue
                                  : ''
                              }
                              onChange={(event) => {
                                if (event.target.value) {
                                  onChangeToken(activeTheme.id, token.name, event.target.value);
                                }
                              }}
                            >
                              {!token.choices.some((choice) => choice.value === displayedValue) && (
                                <option value="" disabled>
                                  —
                                </option>
                              )}
                              {token.choices.map((choice) => (
                                <option key={choice.value} value={choice.value}>
                                  {choice.label ?? choice.value}
                                </option>
                              ))}
                            </select>
                          )}

                          {token.kind === 'text' && (
                            <input
                              id={inputId}
                              type="text"
                              className="wb-field wb-theme-input"
                              aria-invalid={invalidDraft || undefined}
                              value={displayedValue}
                              onChange={(event) => {
                                const next = event.target.value;
                                setDrafts((prev) => ({ ...prev, [tokenDraftKey]: next }));
                                if (isValidTokenDraft(token, next)) {
                                  onChangeToken(activeTheme.id, token.name, next.trim());
                                }
                              }}
                              onBlur={() => setDrafts((prev) => omitKey(prev, tokenDraftKey))}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {filteredGroups.length === 0 && (
            <p className="wb-inspector-note">No tokens match “{query}”.</p>
          )}
        </div>
      </section>
    </div>
  );
}
