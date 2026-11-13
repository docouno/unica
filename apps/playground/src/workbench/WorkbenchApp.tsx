import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import type {
  SceneDefinition,
  SpecimenDefinition,
  TextDirection,
  TextScale,
  ViewportSize,
  WorkbenchConfig,
  WorkbenchTheme,
} from './types.js';
import './workbench.css';

type ViewMode = '6up' | 'focus';
type SurfaceMode = 'auto' | 'base' | 'overlay';

interface UrlState {
  readonly item: string;
  readonly mode: ViewMode;
  readonly theme: string;
  readonly surface: SurfaceMode;
  readonly vp: ViewportSize;
  readonly scale: TextScale;
  readonly dir: TextDirection;
  readonly section: string;
  readonly raw: boolean;
  readonly freeze: boolean;
}

function parseViewport(val: string | null): ViewportSize {
  if (val === '360') {
    return 360;
  }
  if (val === '768') {
    return 768;
  }
  if (val === '1280') {
    return 1280;
  }
  if (val === '1440') {
    return 1440;
  }
  return 'auto';
}

function parseSurface(val: string | null): SurfaceMode {
  if (val === 'base') {
    return 'base';
  }
  if (val === 'overlay') {
    return 'overlay';
  }
  return 'auto';
}

function readUrlState(config: WorkbenchConfig): UrlState {
  const params = new URLSearchParams(window.location.search);
  const firstId = config.specimens[0]?.id ?? config.scenes[0]?.id ?? '';
  const item = params.get('item') ?? firstId;
  const matchedScene = config.scenes.find((s) => s.id === item);
  const mode: ViewMode = params.get('mode') === 'focus' ? 'focus' : '6up';
  const theme = params.get('theme') ?? config.defaultThemeId;
  const surface = parseSurface(params.get('surface'));
  const vpParam = params.get('vp');
  const vp: ViewportSize =
    vpParam !== null ? parseViewport(vpParam) : (matchedScene?.defaultViewport ?? 'auto');
  const scale: TextScale = params.get('scale') === '120' ? 120 : 100;
  const dir: TextDirection = params.get('dir') === 'rtl' ? 'rtl' : 'ltr';
  const section = params.get('section') ?? 'all';
  const raw = params.get('raw') === '1';
  const freeze = params.get('freeze') === '1';
  return { item, mode, theme, surface, vp, scale, dir, section, raw, freeze };
}

function writeUrlState(next: UrlState, config: WorkbenchConfig): void {
  const params = new URLSearchParams();
  if (next.item) {
    params.set('item', next.item);
  }
  if (next.mode !== '6up') {
    params.set('mode', next.mode);
  }
  if (next.theme !== config.defaultThemeId) {
    params.set('theme', next.theme);
  }
  if (next.surface !== 'auto') {
    params.set('surface', next.surface);
  }
  const matchedScene = config.scenes.find((s) => s.id === next.item);
  const defaultVp: ViewportSize = matchedScene?.defaultViewport ?? 'auto';
  if (next.vp !== defaultVp) {
    params.set('vp', String(next.vp));
  }
  if (next.scale !== 100) {
    params.set('scale', String(next.scale));
  }
  if (next.dir !== 'ltr') {
    params.set('dir', next.dir);
  }
  if (next.section !== 'all') {
    params.set('section', next.section);
  }
  if (next.raw) {
    params.set('raw', '1');
  }
  if (next.freeze) {
    params.set('freeze', '1');
  }
  const qs = params.toString();
  const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', nextUrl);
}

interface ViewportFrameProps {
  readonly vp: ViewportSize;
  readonly scaleToFit: boolean;
  readonly children: ReactNode;
}

function ViewportFrame({ vp, scaleToFit, children }: ViewportFrameProps): ReactElement {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [metrics, setMetrics] = useState<{ scale: number; height: number | null }>({
    scale: 1,
    height: null,
  });

  useLayoutEffect(() => {
    if (vp === 'auto' || !scaleToFit) {
      return;
    }
    const host = hostRef.current;
    const inner = innerRef.current;
    if (!host || !inner) {
      return;
    }

    const update = (): void => {
      const slotW = host.clientWidth;
      if (slotW <= 0) {
        return;
      }
      const scale = Math.min(1, slotW / vp);
      const naturalH = inner.offsetHeight;
      setMetrics({ scale, height: Math.ceil(naturalH * scale) });
    };

    const RO = (globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
    if (!RO) {
      return;
    }
    const ro = new RO(update);
    ro.observe(host);
    ro.observe(inner);
    return () => {
      ro.disconnect();
    };
  }, [vp, scaleToFit]);

  if (vp === 'auto') {
    return <div className="wb-viewport-host">{children}</div>;
  }

  if (!scaleToFit) {
    return (
      <div className="wb-viewport-host" style={{ padding: '16px' }}>
        <div
          className="wb-viewport-inner"
          style={{ width: `${String(vp)}px`, marginInline: 'auto' }}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className="wb-viewport-host"
      style={{
        overflow: 'hidden',
        ...(metrics.height !== null ? { height: `${String(metrics.height)}px` } : {}),
      }}
    >
      <div
        ref={innerRef}
        className="wb-viewport-inner"
        style={{
          width: `${String(vp)}px`,
          marginInline: metrics.scale === 1 ? 'auto' : '0',
          transformOrigin: 'top left',
          transform: `scale(${String(metrics.scale)})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export interface OverlayStageProps {
  readonly underlay?: ReactNode;
  readonly minHeight?: number;
  readonly children: ReactNode;
}

export function OverlayStage({
  underlay,
  minHeight = 380,
  children,
}: OverlayStageProps): ReactElement {
  return (
    <div className="wb-overlay-stage" style={{ minHeight: `${String(minHeight)}px` }}>
      {underlay}
      {children}
    </div>
  );
}

interface ArtboardBodyProps {
  readonly config: WorkbenchConfig;
  readonly theme: WorkbenchTheme;
  readonly specimen: SpecimenDefinition | undefined;
  readonly scene: SceneDefinition | undefined;
  readonly surfaceOverride: SurfaceMode;
  readonly scale: TextScale;
  readonly dir: TextDirection;
  readonly activeSectionId: string;
}

function ArtboardBody({
  config,
  theme,
  specimen,
  scene,
  surfaceOverride,
  scale,
  dir,
  activeSectionId,
}: ArtboardBodyProps): ReactElement {
  const wrapStage = (
    surface: 'base' | 'overlay',
    overlayStage: boolean,
    content: ReactNode,
  ): ReactNode => {
    if (config.renderStage) {
      return config.renderStage({ theme, surface, overlayStage, children: content });
    }
    return surface === 'overlay' ? <div data-surface="overlay">{content}</div> : content;
  };

  if (scene) {
    const surface: 'base' | 'overlay' =
      surfaceOverride === 'auto' ? (scene.surface ?? 'base') : surfaceOverride;
    const overlayStage =
      surfaceOverride === 'base' ? false : Boolean(scene.overlayStage) || surface === 'overlay';
    return (
      <div
        className="wb-artboard"
        data-theme={theme.id}
        data-color-scheme={theme.colorScheme}
        data-text-scale={String(scale)}
        dir={dir}
        style={{ colorScheme: theme.colorScheme }}
      >
        {wrapStage(surface, overlayStage, scene.render())}
      </div>
    );
  }

  if (!specimen) {
    const effectiveSurface: 'base' | 'overlay' = surfaceOverride === 'overlay' ? 'overlay' : 'base';
    const emptyContent = config.renderEmptyState ? (
      config.renderEmptyState({ theme, surface: effectiveSurface })
    ) : (
      <div className="wb-empty-note">No specimen or scene registered yet.</div>
    );
    return (
      <div
        className="wb-artboard"
        data-theme={theme.id}
        data-color-scheme={theme.colorScheme}
        data-text-scale={String(scale)}
        dir={dir}
        style={{ colorScheme: theme.colorScheme }}
      >
        {wrapStage(effectiveSurface, effectiveSurface === 'overlay', emptyContent)}
      </div>
    );
  }

  const visibleSections =
    activeSectionId === 'all'
      ? specimen.sections
      : specimen.sections.filter((s) => s.id === activeSectionId);

  return (
    <div
      className="wb-artboard"
      data-theme={theme.id}
      data-color-scheme={theme.colorScheme}
      data-text-scale={String(scale)}
      dir={dir}
      style={{ colorScheme: theme.colorScheme }}
    >
      <div className="wb-sections">
        {visibleSections.map((sec) => {
          const secSurface: 'base' | 'overlay' =
            surfaceOverride === 'auto'
              ? (sec.surface ?? specimen.defaultSurface ?? 'base')
              : surfaceOverride;
          const secOverlayStage =
            surfaceOverride === 'base'
              ? false
              : Boolean(sec.overlayStage) || secSurface === 'overlay';
          return (
            <div key={sec.id} className="wb-section-block">
              <div className="wb-section-head">
                <span className="wb-section-title">{sec.title}</span>
                <span className="wb-section-kind">{sec.kind}</span>
              </div>
              {wrapStage(secSurface, secOverlayStage, sec.render())}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface WorkbenchAppProps {
  readonly config: WorkbenchConfig;
}

export function WorkbenchApp({ config }: WorkbenchAppProps): ReactElement {
  const [state, setState] = useState<UrlState>(() => readUrlState(config));
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const update = (patch: Partial<UrlState>): void => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      writeUrlState(next, config);
      return next;
    });
  };

  useEffect(() => {
    const root = document.documentElement;
    if (state.freeze) {
      root.setAttribute('data-wb-freeze', '1');
    } else {
      root.removeAttribute('data-wb-freeze');
    }
    root.removeAttribute('data-wb-ready');
    let cancelled = false;
    const fontsReady = (document as Partial<Document>).fonts?.ready ?? Promise.resolve();
    fontsReady
      .then(() => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            if (!cancelled) {
              root.setAttribute('data-wb-ready', '1');
            }
          });
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [
    state.freeze,
    state.item,
    state.mode,
    state.theme,
    state.surface,
    state.vp,
    state.scale,
    state.dir,
    state.section,
  ]);

  const activeSpecimen = useMemo(
    () => config.specimens.find((s) => s.id === state.item),
    [config.specimens, state.item],
  );
  const activeScene = useMemo(
    () => config.scenes.find((s) => s.id === state.item),
    [config.scenes, state.item],
  );

  const activeTheme = useMemo(
    () => config.themes.find((t) => t.id === state.theme) ?? config.themes[0],
    [config.themes, state.theme],
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filteredSpecimens = useMemo(
    () =>
      config.specimens.filter(
        (s) =>
          !normalizedQuery ||
          s.title.toLowerCase().includes(normalizedQuery) ||
          s.group.toLowerCase().includes(normalizedQuery),
      ),
    [config.specimens, normalizedQuery],
  );
  const filteredScenes = useMemo(
    () =>
      config.scenes.filter(
        (s) =>
          !normalizedQuery ||
          s.title.toLowerCase().includes(normalizedQuery) ||
          s.group.toLowerCase().includes(normalizedQuery),
      ),
    [config.scenes, normalizedQuery],
  );

  const renderCanvas = (): ReactElement => {
    if (state.mode === 'focus' && activeTheme) {
      return (
        <div className="wb-focus-wrap">
          <div className="wb-cell wb-cell-focus">
            <div className="wb-cell-header">
              <span className="wb-cell-title">
                <span className="wb-dot" data-scheme={activeTheme.colorScheme} />
                {activeTheme.label}
              </span>
              <span className="wb-cell-meta">
                {activeTheme.meta ?? activeTheme.family}
                {!state.raw && (
                  <button
                    type="button"
                    className="wb-zoom-btn"
                    onClick={() => {
                      update({ mode: '6up' });
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path
                        d="M9.5 6H2.5M2.5 6L5.5 3M2.5 6L5.5 9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    6-up Grid
                  </button>
                )}
              </span>
            </div>
            <ViewportFrame vp={state.vp} scaleToFit={false}>
              <ArtboardBody
                config={config}
                theme={activeTheme}
                specimen={activeSpecimen}
                scene={activeScene}
                surfaceOverride={state.surface}
                scale={state.scale}
                dir={state.dir}
                activeSectionId={state.section}
              />
            </ViewportFrame>
          </div>
        </div>
      );
    }

    return (
      <div className="wb-grid-6up">
        {config.themes.map((th) => (
          <div key={th.id} className="wb-cell">
            <div className="wb-cell-header">
              <span className="wb-cell-title">
                <span className="wb-dot" data-scheme={th.colorScheme} />
                {th.label}
              </span>
              <span className="wb-cell-meta">
                {th.meta ?? th.family}
                {!state.raw && (
                  <button
                    type="button"
                    className="wb-zoom-btn"
                    onClick={() => {
                      update({ mode: 'focus', theme: th.id });
                    }}
                  >
                    Focus
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path
                        d="M3.5 8.5L8.5 3.5M8.5 3.5H4.5M8.5 3.5V7.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </span>
            </div>
            <ViewportFrame vp={state.vp} scaleToFit={true}>
              <ArtboardBody
                config={config}
                theme={th}
                specimen={activeSpecimen}
                scene={activeScene}
                surfaceOverride={state.surface}
                scale={state.scale}
                dir={state.dir}
                activeSectionId={state.section}
              />
            </ViewportFrame>
          </div>
        ))}
      </div>
    );
  };

  if (state.raw) {
    return <div className="wb-raw-canvas">{renderCanvas()}</div>;
  }

  const activeTitle = activeSpecimen?.title ?? activeScene?.title ?? 'Preset Calibration';
  const activeSummary =
    activeSpecimen?.summary ??
    activeScene?.summary ??
    'Live semantic token & surface hierarchy across all 6 presets';

  return (
    <div className="wb-shell">
      <aside className="wb-rail">
        <div className="wb-rail-sticky">
          <div className="wb-brand">
            <span className="wb-brand-title">{config.title}</span>
            <span className="wb-brand-sub">{config.subtitle}</span>
          </div>
          <div className="wb-search-wrap">
            <input
              type="search"
              className="wb-search"
              placeholder="Filter components & scenes..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
            />
          </div>
          <div className="wb-nav-section">
            <div className="wb-nav-heading">Specimens ({filteredSpecimens.length})</div>
            <div className="wb-nav-list">
              {filteredSpecimens.length === 0 ? (
                <div className="wb-nav-empty">No specimens yet</div>
              ) : (
                filteredSpecimens.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="wb-nav-item"
                    data-active={s.id === state.item ? 'true' : 'false'}
                    onClick={() => {
                      update({
                        item: s.id,
                        section: 'all',
                        surface: 'auto',
                        vp: 'auto',
                      });
                    }}
                  >
                    <span>{s.title}</span>
                    <span className="wb-nav-tag">{s.group}</span>
                  </button>
                ))
              )}
            </div>
          </div>
          <div className="wb-nav-section">
            <div className="wb-nav-heading">Scenes ({filteredScenes.length})</div>
            <div className="wb-nav-list">
              {filteredScenes.length === 0 ? (
                <div className="wb-nav-empty">No scenes yet</div>
              ) : (
                filteredScenes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="wb-nav-item"
                    data-active={s.id === state.item ? 'true' : 'false'}
                    onClick={() => {
                      update({
                        item: s.id,
                        section: 'all',
                        surface: 'auto',
                        vp: s.defaultViewport ?? 'auto',
                      });
                    }}
                  >
                    <span>{s.title}</span>
                    <span className="wb-nav-tag">{s.group}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className="wb-main">
        <header className="wb-topbar">
          <div className="wb-topbar-left">
            <div className="wb-item-heading">
              <span className="wb-item-title">{activeTitle}</span>
              {activeSummary && <span className="wb-item-summary">{activeSummary}</span>}
            </div>
          </div>

          <div className="wb-topbar-right">
            <div className="wb-seg" role="group" aria-label="View mode">
              <button
                type="button"
                className="wb-seg-btn"
                data-active={state.mode === '6up' ? 'true' : 'false'}
                onClick={() => {
                  update({ mode: '6up' });
                }}
              >
                6-up Matrix
              </button>
              <button
                type="button"
                className="wb-seg-btn"
                data-active={state.mode === 'focus' ? 'true' : 'false'}
                onClick={() => {
                  update({ mode: 'focus' });
                }}
              >
                Live Focus
              </button>
            </div>

            {state.mode === 'focus' && (
              <div className="wb-seg" role="group" aria-label="Preset">
                {config.themes.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    className="wb-seg-btn"
                    data-active={state.theme === th.id ? 'true' : 'false'}
                    onClick={() => {
                      update({ theme: th.id });
                    }}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            )}

            <div className="wb-seg" role="group" aria-label="Surface context">
              {(['auto', 'base', 'overlay'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className="wb-seg-btn"
                  data-active={state.surface === s ? 'true' : 'false'}
                  onClick={() => {
                    update({ surface: s });
                  }}
                >
                  {s === 'auto' ? 'Auto' : s === 'base' ? 'Base' : 'Overlay'}
                </button>
              ))}
            </div>

            <div className="wb-seg" role="group" aria-label="Container viewport">
              {(['auto', 360, 768, 1280, 1440] as const).map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  className="wb-seg-btn"
                  data-active={state.vp === v ? 'true' : 'false'}
                  onClick={() => {
                    update({ vp: v });
                  }}
                >
                  {v === 'auto' ? 'Auto' : `${String(v)}px`}
                </button>
              ))}
            </div>

            <div className="wb-seg" role="group" aria-label="Stress controls">
              <button
                type="button"
                className="wb-seg-btn"
                data-active={state.scale === 120 ? 'true' : 'false'}
                onClick={() => {
                  update({ scale: state.scale === 120 ? 100 : 120 });
                }}
              >
                120% Text
              </button>
              <button
                type="button"
                className="wb-seg-btn"
                data-active={state.dir === 'rtl' ? 'true' : 'false'}
                onClick={() => {
                  update({ dir: state.dir === 'rtl' ? 'ltr' : 'rtl' });
                }}
              >
                RTL
              </button>
            </div>

            <button
              type="button"
              className="wb-action-btn"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href).catch(() => {});
                setCopied(true);
                window.setTimeout(() => {
                  setCopied(false);
                }, 1400);
              }}
            >
              {copied ? 'Copied URL' : 'Copy Link'}
            </button>
          </div>
        </header>

        {activeSpecimen && activeSpecimen.sections.length > 1 && (
          <div className="wb-subbar">
            <div className="wb-pills">
              <button
                type="button"
                className="wb-pill"
                data-active={state.section === 'all' ? 'true' : 'false'}
                onClick={() => {
                  update({ section: 'all' });
                }}
              >
                All sections ({activeSpecimen.sections.length})
              </button>
              {activeSpecimen.sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  className="wb-pill"
                  data-active={state.section === sec.id ? 'true' : 'false'}
                  onClick={() => {
                    update({ section: sec.id });
                  }}
                >
                  {sec.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <main className="wb-canvas">{renderCanvas()}</main>
      </div>
    </div>
  );
}
