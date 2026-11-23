import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CSSProperties, MouseEvent, ReactElement, ReactNode, RefObject } from 'react';
import { Inspector } from './Inspector.js';
import type { ArtboardScope } from './Inspector.js';
import type { RouteDestination } from './UsageView.js';
import { StoryFrame } from './StoryFrame.js';
import { ThemeEditor } from './ThemeEditor.js';
import { SettingsProvider } from './ViewSettings.js';
import { componentStates } from './schema.js';
import { useSubjectBounds } from './subjectBounds.js';
import {
  EMPTY_BUCKET,
  buildScopedOverrideStylesheet,
  countAllChanges,
  getThemeBucket,
  hasOwn,
  isSafeObjectKey,
  loadThemeOverrides,
  macroDefaultForTheme,
  saveThemeOverrides,
} from './themeEditorState.js';
import type { ThemeOverridesStore } from './themeEditorState.js';
import {
  findComponentTab,
  patchRoute,
  readRoute,
  resolveComponentTabs,
  routeSearch,
  schemes,
  selectRouteThemes,
  selectThemes,
  surfaces,
  viewports,
} from './route.js';
import type { WorkbenchRoute } from './route.js';
import type {
  ComponentStatus,
  SceneDefinition,
  StoryContext,
  ThemeMacroValue,
  ViewportSize,
  WorkbenchConfig,
  WorkbenchStageContext,
  WorkbenchTheme,
} from './types.js';
import './workbench.css';
import './controls.css';

const schemeLabels = { dark: 'Dark', light: 'Light', both: 'Both' };
const surfaceLabels = { auto: 'Auto', base: 'Base', overlay: 'Overlay' };

function groupThemes(themes: readonly WorkbenchTheme[]): readonly (readonly WorkbenchTheme[])[] {
  const families = new Map<string, WorkbenchTheme[]>();
  for (const theme of themes) {
    const family = families.get(theme.family) ?? [];
    family.push(theme);
    families.set(theme.family, family);
  }
  return [...families.values()].flatMap((family) => {
    const dark = family.filter((theme) => theme.colorScheme === 'dark');
    const light = family.filter((theme) => theme.colorScheme === 'light');
    return Array.from({ length: Math.max(dark.length, light.length) }, (_, index) =>
      [dark[index], light[index]].filter((theme) => theme !== undefined),
    );
  });
}

function ViewportFrame({
  vp,
  scaleToFit,
  children,
}: {
  readonly vp: ViewportSize;
  readonly scaleToFit: boolean;
  readonly children: ReactNode;
}): ReactElement {
  const hostRef = useRef<HTMLDivElement>(null);
  const compare = vp !== 'auto' && scaleToFit;
  const fit = compare && globalThis.CSS?.supports('zoom', '1') === true;
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!fit || !host) {
      return;
    }

    const measure = (): void => {
      if (host.clientWidth > 0) {
        setScale(Math.min(1, host.clientWidth / vp));
      }
    };

    measure();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    return () => observer.disconnect();
  }, [fit, vp]);

  return (
    <div
      ref={hostRef}
      className="wb-viewport-host wb-scroll"
      data-scaled={fit || undefined}
      tabIndex={compare && !fit ? 0 : undefined}
    >
      <div
        className={vp === 'auto' ? 'wb-viewport-auto' : 'wb-viewport-inner'}
        style={
          vp === 'auto'
            ? undefined
            : {
                width: vp,
                ...(fit && scale < 1 ? { zoom: scale, '--wb-viewport-scale': scale } : {}),
              }
        }
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
    <div className="wb-overlay-stage" style={{ minHeight }}>
      {underlay}
      {children}
    </div>
  );
}

function renderStage(config: WorkbenchConfig, ctx: WorkbenchStageContext): ReactNode {
  if (config.renderStage) {
    return config.renderStage(ctx);
  }
  return ctx.surface === 'overlay' ? (
    <div data-surface="overlay">{ctx.children}</div>
  ) : (
    ctx.children
  );
}

function sceneArtboard(
  config: WorkbenchConfig,
  route: WorkbenchRoute,
  theme: WorkbenchTheme,
  scene: SceneDefinition | undefined,
  story?: StoryContext,
): ReactNode {
  const surface = route.surface === 'auto' ? (scene?.surface ?? 'base') : route.surface;
  const overlayStage =
    surface === 'overlay' || (route.surface === 'auto' && Boolean(scene?.overlayStage));
  const Scene = scene?.render;
  return renderStage(config, {
    theme,
    surface,
    overlayStage,
    children: Scene ? (
      <Scene ctx={{ theme, surface, ...(story ? { story } : {}) }} />
    ) : (
      (config.renderEmptyState?.({ theme, surface }) ?? (
        <p className="wb-empty-note">No components or scenes registered.</p>
      ))
    ),
  });
}

function useCaptureReadiness(
  hostRef: RefObject<HTMLDivElement | null>,
  route: WorkbenchRoute,
  sceneRevision: number,
): void {
  useLayoutEffect(() => {
    const host = hostRef.current;
    const root = document.documentElement;
    if (route.freeze) {
      root.setAttribute('data-wb-freeze', '1');
    }

    let revision = 0;
    const waitUntilReady = (): void => {
      const current = ++revision;
      root.removeAttribute('data-wb-ready');
      if (host?.querySelector('[data-wb-pending]')) {
        return;
      }
      const ready = document.fonts?.ready ?? Promise.resolve();
      const afterLayout = (): void => {
        if (current !== revision) {
          return;
        }
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            if (current === revision && !host?.querySelector('[data-wb-pending]')) {
              root.setAttribute('data-wb-ready', '1');
            }
          });
        });
      };
      ready.then(afterLayout, afterLayout);
    };

    let pending = Boolean(host?.querySelector('[data-wb-pending]'));
    const observer = new MutationObserver(() => {
      const next = Boolean(host?.querySelector('[data-wb-pending]'));
      if (pending !== next) {
        pending = next;
        waitUntilReady();
      }
    });
    if (host) {
      observer.observe(host, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['data-wb-pending'],
      });
    }
    waitUntilReady();
    window.addEventListener('resize', waitUntilReady);
    return () => {
      revision++;
      observer.disconnect();
      root.removeAttribute('data-wb-ready');
      root.removeAttribute('data-wb-freeze');
      window.removeEventListener('resize', waitUntilReady);
    };
  }, [hostRef, route, sceneRevision]);
}

function trackFieldFocus(shell: HTMLElement): () => void {
  const doc = shell.ownerDocument;
  const pointer = (): void => {
    shell.dataset.wbFieldFocus = 'pointer';
  };
  const clearPointerFocus = (): void => {
    delete shell.dataset.wbFieldFocus;
  };
  const keyboard = (event: KeyboardEvent): void => {
    if (
      event.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      ['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)
    ) {
      return;
    }
    const editing =
      event.target instanceof Element &&
      event.target.matches('input, textarea, [contenteditable="true"]');
    // Typing and moving the caret keep the pointer focus treatment.
    if (!editing || event.key === 'Tab' || event.key === 'Escape') {
      clearPointerFocus();
    }
  };
  doc.addEventListener('pointerdown', pointer, true);
  doc.addEventListener('keydown', keyboard, true);
  doc.defaultView?.addEventListener('blur', clearPointerFocus);
  return () => {
    doc.removeEventListener('pointerdown', pointer, true);
    doc.removeEventListener('keydown', keyboard, true);
    doc.defaultView?.removeEventListener('blur', clearPointerFocus);
    clearPointerFocus();
  };
}

function shouldFollowInPlace(event: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  );
}

function Destination({
  href,
  active,
  navigate,
  className,
  children,
}: {
  readonly href: string;
  readonly active?: boolean;
  readonly navigate: () => void;
  readonly className: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <a
      className={className}
      href={href}
      aria-current={active ? 'page' : undefined}
      data-active={active ? 'true' : undefined}
      onClick={(event) => {
        if (shouldFollowInPlace(event)) {
          event.preventDefault();
          navigate();
        }
      }}
    >
      {children}
    </a>
  );
}

function filterMatch(
  item: { readonly id: string; readonly title: string },
  category: string,
  query: string,
): boolean {
  return [item.id, item.title, category].some((value) => value.toLowerCase().includes(query));
}

function catalogPath(config: WorkbenchConfig, item: string): Record<string, boolean> {
  const component = config.components.find((entry) => entry.id === item);
  if (component) {
    return { [`component:${component.category}`]: true };
  }
  const scene = config.scenes.find((entry) => entry.id === item);
  return scene ? { scenes: true, [`scene:${scene.group}`]: true } : {};
}

function CatalogGroup({
  title,
  open,
  nested = false,
  onToggle,
  children,
}: {
  readonly title: string;
  readonly open: boolean;
  readonly nested?: boolean;
  readonly onToggle: () => void;
  readonly children: ReactNode;
}): ReactElement {
  const id = useId();
  const Heading = nested ? 'h3' : 'h2';
  return (
    <section className="wb-nav-section">
      <Heading className="wb-nav-heading">
        <button
          type="button"
          className="wb-nav-toggle"
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
        >
          {title}
        </button>
      </Heading>
      <div id={id} className="wb-nav-list" hidden={!open}>
        {children}
      </div>
    </section>
  );
}

function useSceneIndex(config: WorkbenchConfig): ReadonlyMap<string, readonly SceneDefinition[]> {
  return useMemo(() => {
    const index = new Map<string, SceneDefinition[]>();
    for (const scene of config.scenes) {
      for (const id of new Set(scene.uses)) {
        const existing = index.get(id);
        if (existing) {
          existing.push(scene);
        } else {
          index.set(id, [scene]);
        }
      }
    }
    return index;
  }, [config.scenes]);
}

interface SoloReturnSnapshot {
  readonly item: string;
  readonly tab: WorkbenchRoute['tab'];
  readonly family: WorkbenchRoute['family'];
  readonly scheme: WorkbenchRoute['scheme'];
  readonly slice: WorkbenchRoute['slice'];
  readonly block: WorkbenchRoute['block'];
}

function readSoloReturnFromHistory(): SoloReturnSnapshot | null {
  const state = window.history.state as { readonly wbSoloReturn?: unknown } | null;
  const candidate = state?.wbSoloReturn;
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }
  const snap = candidate as Partial<SoloReturnSnapshot>;
  if (
    typeof snap.item !== 'string' ||
    typeof snap.tab !== 'string' ||
    typeof snap.family !== 'string' ||
    (snap.scheme !== 'dark' && snap.scheme !== 'light' && snap.scheme !== 'both')
  ) {
    return null;
  }
  return {
    item: snap.item,
    tab: snap.tab,
    family: snap.family,
    scheme: snap.scheme,
    slice: typeof snap.slice === 'string' ? snap.slice : undefined,
    block: typeof snap.block === 'string' ? snap.block : undefined,
  };
}

function hasOpenLightDismissPopover(): boolean {
  try {
    return Array.from(
      document.querySelectorAll('[popover=""]:popover-open, [popover="auto"]:popover-open'),
    ).some((node) => !node.classList.contains('wb-bounds-layer'));
  } catch {
    return false;
  }
}

type Update = (
  patch: Partial<WorkbenchRoute>,
  behavior?: 'push' | 'replace',
  historyState?: unknown,
) => void;
type Href = (patch: Partial<WorkbenchRoute>) => string;

function Environment({
  route,
  themes,
  update,
  href,
  hasComponent,
}: {
  readonly route: WorkbenchRoute;
  readonly themes: readonly WorkbenchTheme[];
  readonly update: Update;
  readonly href: Href;
  readonly hasComponent: boolean;
}): ReactElement {
  const families = new Map(themes.map((theme) => [theme.family, theme.familyLabel]));
  const familyOptions = [...families, ['all', 'All'] as const];
  const activeScheme = route.solo ? 'both' : route.scheme;
  const activeFamily = route.solo ? 'all' : route.family;
  return (
    <div className="wb-environment" role="group" aria-label="Preview settings">
      <div className="wb-environment-group">
        <span aria-hidden="true">Family</span>
        <div className="wb-seg" role="group" aria-label="Family">
          {familyOptions.map(([family, label]) =>
            selectThemes(themes, family, activeScheme).length > 0 ? (
              <Destination
                key={family}
                className="wb-seg-btn"
                href={href({ family, solo: undefined })}
                active={!route.solo && route.family === family}
                navigate={() => {
                  update({ family, solo: undefined }, 'push');
                }}
              >
                {label}
              </Destination>
            ) : (
              <button key={family} className="wb-seg-btn" type="button" disabled>
                {label}
              </button>
            ),
          )}
        </div>
      </div>
      <div className="wb-environment-group">
        <span aria-hidden="true">Scheme</span>
        <div className="wb-seg" role="group" aria-label="Scheme">
          {schemes.map((scheme) =>
            selectThemes(themes, activeFamily, scheme).length > 0 ? (
              <Destination
                key={scheme}
                className="wb-seg-btn"
                href={href({ scheme, solo: undefined })}
                active={!route.solo && route.scheme === scheme}
                navigate={() => {
                  update({ scheme, solo: undefined }, 'push');
                }}
              >
                {schemeLabels[scheme]}
              </Destination>
            ) : (
              <button key={scheme} className="wb-seg-btn" type="button" disabled>
                {schemeLabels[scheme]}
              </button>
            ),
          )}
        </div>
      </div>
      <label className="wb-environment-group">
        Surface
        <select
          className="wb-field"
          value={route.surface}
          onChange={(event) => {
            const surface = surfaces.find((entry) => entry === event.target.value);
            if (surface) {
              update({ surface });
            }
          }}
        >
          {surfaces.map((surface) => (
            <option key={surface} value={surface}>
              {surfaceLabels[surface]}
            </option>
          ))}
        </select>
      </label>
      <label className="wb-environment-group">
        Width
        <select
          className="wb-field"
          value={route.vp}
          onChange={(event) => {
            const match = viewports.find((vp) => String(vp) === event.target.value);
            if (match !== undefined) {
              update({ vp: match });
            }
          }}
        >
          {viewports.map((vp) => (
            <option key={vp} value={vp}>
              {vp === 'auto' ? 'Auto' : `${String(vp)} px`}
            </option>
          ))}
        </select>
      </label>
      <div className="wb-seg" role="group" aria-label="Stress controls">
        <button
          className="wb-seg-btn"
          type="button"
          aria-label="120% Text"
          title="Preview text at 120%"
          aria-pressed={route.scale === 120}
          onClick={() => {
            update({ scale: route.scale === 120 ? 100 : 120 });
          }}
        >
          120%
        </button>
        <button
          className="wb-seg-btn"
          type="button"
          aria-pressed={route.dir === 'rtl'}
          onClick={() => {
            update({ dir: route.dir === 'rtl' ? 'ltr' : 'rtl' });
          }}
        >
          RTL
        </button>
        {hasComponent && (
          <button
            className="wb-seg-btn"
            type="button"
            aria-pressed={route.bounds}
            onClick={() => {
              update({ bounds: !route.bounds });
            }}
          >
            Bounds
          </button>
        )}
      </div>
    </div>
  );
}

function CopyLink({ url }: { readonly url: string }): ReactElement {
  const [copyResult, setCopyResult] = useState<{ status: string; url: string }>();
  function copyLink(): void {
    const unavailable = (): void => {
      setCopyResult({ status: 'Copy unavailable', url });
    };
    if (!navigator.clipboard) {
      unavailable();
      return;
    }
    navigator.clipboard.writeText(url).then(() => {
      setCopyResult({ status: 'Link copied', url });
    }, unavailable);
  }
  return (
    <button className="wb-action-btn" type="button" onClick={copyLink}>
      {copyResult?.url === url ? copyResult.status : 'Copy Link'}
    </button>
  );
}

export interface WorkbenchAppProps {
  readonly config: WorkbenchConfig;
}

function Artboard({
  theme,
  route,
  scene,
  renderArtboard,
  children,
}: {
  readonly theme: WorkbenchTheme;
  readonly route: WorkbenchRoute;
  readonly scene: boolean;
  readonly renderArtboard: WorkbenchConfig['renderArtboard'];
  readonly children: ReactNode;
}): ReactElement {
  const artboardRef = useRef<HTMLDivElement>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const attachArtboard = useCallback(
    (node: HTMLDivElement | null): void => {
      artboardRef.current = node;
      if (renderArtboard) {
        setHost(node);
      }
    },
    [renderArtboard],
  );
  useSubjectBounds(artboardRef, !scene && route.bounds, 'portaled');
  return (
    <div
      ref={attachArtboard}
      className="wb-artboard"
      data-theme={theme.id}
      data-color-scheme={theme.colorScheme}
      data-text-scale={route.scale}
      data-wb-scene={scene ? '' : undefined}
      dir={route.dir}
      style={{ colorScheme: theme.colorScheme }}
    >
      {renderArtboard ? renderArtboard({ theme, host, children }) : children}
    </div>
  );
}

function destinationPatch(
  destination: RouteDestination,
  config: WorkbenchConfig,
): Partial<WorkbenchRoute> {
  const componentTabs = resolveComponentTabs(config);
  const defaultTabId = componentTabs[0]!.id;
  const statesTabId = componentTabs.find((entry) => entry.kind === 'states')?.id;
  const tab =
    destination.tab ??
    (destination.slice || (destination.mode && destination.mode !== 'overview')
      ? (statesTabId ?? defaultTabId)
      : defaultTabId);
  return {
    item: destination.item,
    tab,
    slice: destination.slice,
    block: destination.block,
    ...(destination.mode !== undefined
      ? { mode: destination.mode }
      : tab !== 'matrix'
        ? { mode: 'overview' as const }
        : {}),
  };
}

function ExpandIcon(): ReactElement {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M10 2.5h3.5V6M13.5 2.5 9.25 6.75M6 13.5H2.5V10M2.5 13.5l4.25-4.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CollapseIcon(): ReactElement {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M13.5 6H10V2.5M10 6l3.5-3.5M2.5 10H6v3.5M6 10l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const WorkbenchView = memo(function WorkbenchView({
  config,
  route,
  sceneRevision,
  component,
  scene,
  notFound,
  createHref,
  update,
  expandArtboard,
  collapseArtboard,
  navigateFromUsage,
}: {
  readonly config: WorkbenchConfig;
  readonly route: WorkbenchRoute;
  readonly sceneRevision: number;
  readonly component: WorkbenchConfig['components'][number] | undefined;
  readonly scene: SceneDefinition | undefined;
  readonly notFound: boolean;
  readonly createHref: Href;
  readonly update: Update;
  readonly expandArtboard: (theme: WorkbenchTheme, scope?: ArtboardScope) => void;
  readonly collapseArtboard: () => void;
  readonly navigateFromUsage: (destination: RouteDestination) => void;
}): ReactElement {
  const selectedThemes = useMemo(
    () => selectRouteThemes(config.themes, route),
    [config.themes, route],
  );
  const themeGroups = useMemo(() => groupThemes(config.themes), [config.themes]);
  const selectedThemeIds = new Set(selectedThemes.map((theme) => theme.id));
  const sceneIndex = useSceneIndex(config);
  const renderArtboards = (
    render: (theme: WorkbenchTheme) => ReactNode,
    scope?: ArtboardScope,
  ): ReactElement => {
    const canFocusSection = Boolean(
      scope?.canFocus !== false && (scope?.block || scope?.slice) && !route.block && !route.slice,
    );
    const expanded = Boolean(route.solo);
    const showExpandControl =
      !route.raw && (expanded || selectedThemes.length > 1 || canFocusSection);
    return (
      <div
        className="wb-artboards"
        data-single={selectedThemes.length === 1 ? 'true' : undefined}
        data-wb-fixed={route.vp !== 'auto' || undefined}
      >
        {themeGroups.map((group) => {
          const visible = group.filter((theme) => selectedThemeIds.has(theme.id));
          return visible.length ? (
            <div
              key={group[0]!.id}
              className="wb-theme-slot"
              data-wb-pair={visible.length > 1 || undefined}
            >
              {visible.map((theme) => (
                <section
                  className="wb-cell"
                  key={theme.id}
                  aria-label={theme.label}
                  data-color-scheme={theme.colorScheme}
                  tabIndex={route.raw ? undefined : -1}
                >
                  <div className="wb-cell-header">
                    <span className="wb-cell-title">{theme.label}</span>
                    {showExpandControl ? (
                      <button
                        className="wb-cell-expand"
                        type="button"
                        data-expanded={expanded || undefined}
                        aria-label={expanded ? `Collapse ${theme.label}` : `Expand ${theme.label}`}
                        title={expanded ? `Collapse ${theme.label} (Esc)` : `Expand ${theme.label}`}
                        onClick={(event) => {
                          event.currentTarget.closest<HTMLElement>('.wb-cell')?.focus();
                          if (expanded) {
                            collapseArtboard();
                          } else {
                            expandArtboard(theme, scope);
                          }
                        }}
                      >
                        {expanded ? <CollapseIcon /> : <ExpandIcon />}
                      </button>
                    ) : (
                      theme.meta && <span className="wb-cell-meta">{theme.meta}</span>
                    )}
                  </div>
                  <ViewportFrame vp={route.vp} scaleToFit={selectedThemes.length > 1}>
                    <Artboard
                      theme={theme}
                      route={route}
                      scene={!component}
                      renderArtboard={config.renderArtboard}
                    >
                      {render(theme)}
                    </Artboard>
                  </ViewportFrame>
                </section>
              ))}
            </div>
          ) : null;
        })}
        {!selectedThemes.length && <p className="wb-empty-note">No themes registered.</p>}
      </div>
    );
  };

  const activeTab = component ? findComponentTab(config, route.tab) : undefined;
  const sceneHasFrame = Boolean(
    scene && (Object.keys(scene.controls ?? {}).length > 0 || scene.actions?.length || scene.reset),
  );

  return component ? (
    <Inspector
      key={component.id}
      component={component}
      route={route}
      activeTab={activeTab}
      themes={selectedThemes}
      scenes={sceneIndex.get(component.id) ?? []}
      docsConfig={config.docs}
      update={update}
      itemHref={(destination) => createHref(destinationPatch(destination, config))}
      navigateItem={navigateFromUsage}
      renderArtboards={renderArtboards}
      renderStage={config.renderStage}
    />
  ) : notFound ? (
    <p className="wb-empty-note">
      Item “{route.item}” was not found. Choose a component or scene from the catalog.
    </p>
  ) : sceneHasFrame && scene ? (
    <StoryFrame
      key={scene.id}
      title={scene.title}
      headingLevel="h2"
      caption={scene.summary}
      controls={scene.controls}
      actions={scene.actions}
      reset={scene.reset}
      externalRevision={sceneRevision}
      raw={route.raw}
      hideHeader={route.raw}
      hideTitle
    >
      {(story) => renderArtboards((theme) => sceneArtboard(config, route, theme, scene, story))}
    </StoryFrame>
  ) : (
    renderArtboards((theme) => (
      <Fragment key={`${route.item}:${sceneRevision}`}>
        {sceneArtboard(config, route, theme, scene)}
      </Fragment>
    ))
  );
});

function omitKey<T>(record: Readonly<Record<string, T>>, key: string): Record<string, T> {
  const next: Record<string, T> = {};
  for (const [entryKey, entryValue] of Object.entries(record)) {
    if (entryKey !== key && isSafeObjectKey(entryKey)) {
      next[entryKey] = entryValue;
    }
  }
  return next;
}

export function WorkbenchApp({ config }: WorkbenchAppProps): ReactElement {
  const [route, setRoute] = useState(() => readRoute(window.location.search, config));
  const [sceneRevision, setSceneRevision] = useState(0);
  const [query, setQuery] = useState('');
  const [openGroups, setOpenGroups] = useState(() => catalogPath(config, route.item));
  const [searchGroups, setSearchGroups] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<'All' | ComponentStatus>('All');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [inspectorVisited, setInspectorVisited] = useState(false);
  const [compact, setCompact] = useState(false);
  const [settingsTarget, setSettingsTarget] = useState<HTMLDivElement | null>(null);
  const [searchRequest, setSearchRequest] = useState(0);
  const [inspectorMode, setInspectorMode] = useState<'inspector' | 'theme'>('inspector');
  const [themeOverrides, setThemeOverrides] = useState<ThemeOverridesStore>(() =>
    config.themeEditor && !route.raw ? loadThemeOverrides(config.themeEditor) : {},
  );
  const hydratedThemeStorageRef = useRef(!route.raw);
  const persistThemeOverridesRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const mobileCatalogRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const catalogId = useId();
  const inspectorId = useId();
  const inspectorDialogRef = useRef<HTMLDialogElement>(null);
  const inspectorLaunchRef = useRef<HTMLButtonElement>(null);
  const restoreInspectorFocus = useRef(false);
  const revealCatalogPath = useCallback(
    (item: string): void => {
      const path = catalogPath(config, item);
      setOpenGroups((previous) => ({ ...previous, ...path }));
      setSearchGroups((previous) => ({ ...previous, ...path }));
    },
    [config],
  );

  useLayoutEffect(() => {
    if (route.raw) {
      return;
    }
    const media = window.matchMedia?.('(max-width: 1079px)');
    if (!media) {
      return;
    }
    const measure = (): void => {
      if (media.matches === rootRef.current?.hasAttribute('data-wb-compact')) {
        return;
      }
      const active = document.activeElement;
      restoreInspectorFocus.current =
        active === inspectorLaunchRef.current ||
        document.getElementById(inspectorId)?.contains(active) === true;
      setCompact(media.matches);
    };
    measure();
    media.addEventListener('change', measure);
    return () => media.removeEventListener('change', measure);
  }, [inspectorId, route.raw]);

  useLayoutEffect(() => {
    if (!restoreInspectorFocus.current) {
      return;
    }
    const sidebar = document.getElementById(inspectorId);
    if (!compact && (!settingsTarget || !sidebar?.contains(settingsTarget))) {
      return;
    }
    const visibleInteractive = (selector: string): HTMLElement | null => {
      if (!sidebar) {
        return null;
      }
      for (const candidate of sidebar.querySelectorAll<HTMLElement>(selector)) {
        if (!candidate.closest('[hidden]')) {
          return candidate;
        }
      }
      return null;
    };
    const target = compact
      ? inspectorLaunchRef.current
      : (visibleInteractive('[role="tab"][aria-selected="true"]') ?? visibleInteractive('button'));
    target?.focus({ preventScroll: true });
    restoreInspectorFocus.current = false;
  }, [compact, settingsTarget, inspectorId]);

  useCaptureReadiness(rootRef, route, sceneRevision);
  useEffect(() => {
    const restore = (): void => {
      const next = readRoute(window.location.search, config);
      if (next.item !== route.item) {
        revealCatalogPath(next.item);
      }
      if (!next.raw && !hydratedThemeStorageRef.current && config.themeEditor) {
        hydratedThemeStorageRef.current = true;
        setThemeOverrides(loadThemeOverrides(config.themeEditor));
      }
      setRoute(next);
    };
    window.addEventListener('popstate', restore);
    return () => {
      window.removeEventListener('popstate', restore);
    };
  }, [config, revealCatalogPath, route.item]);

  useEffect(() => {
    const shell = rootRef.current;
    if (route.raw || !shell) {
      return;
    }
    const stopTrackingFocus = trackFieldFocus(shell);
    const openSearch = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || event.isComposing || event.altKey || event.repeat) {
        return;
      }
      const target = event.target instanceof HTMLElement ? event.target : null;
      const slash = event.key === '/' && !event.metaKey && !event.ctrlKey;
      const command = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey);
      if (
        (!slash && !command) ||
        Array.from(document.querySelectorAll('dialog[open]')).some((dialog) =>
          dialog.matches(':modal'),
        ) ||
        target?.closest(
          'dialog[open]:not([role="presentation"], [role="none"]), [role="dialog"], [role="alertdialog"]',
        ) ||
        (slash && (target?.isContentEditable || target?.closest('input, textarea, select')))
      ) {
        return;
      }
      event.preventDefault();
      delete shell.dataset.wbFieldFocus;
      setCatalogOpen(true);
      setSearchRequest((previous) => previous + 1);
    };
    window.addEventListener('keydown', openSearch);
    return () => {
      window.removeEventListener('keydown', openSearch);
      stopTrackingFocus();
    };
  }, [route.raw]);

  useLayoutEffect(() => {
    if (searchRequest > 0) {
      searchRef.current?.focus();
    }
  }, [searchRequest]);

  const createHref = useCallback<Href>(
    (patch) =>
      `${window.location.pathname}${routeSearch(patchRoute(route, patch, config), config)}${window.location.hash}`,
    [route, config],
  );
  const update = useCallback<Update>(
    (patch, behavior = 'replace', historyState) => {
      const current = readRoute(window.location.search, config);
      const next = patchRoute(current, patch, config);
      const search = routeSearch(next, config);
      if (search === routeSearch(current, config)) {
        return;
      }
      const href = `${window.location.pathname}${search}${window.location.hash}`;
      if (behavior === 'push') {
        window.history.pushState(historyState ?? null, '', href);
      } else {
        window.history.replaceState(
          historyState !== undefined ? historyState : window.history.state,
          '',
          href,
        );
      }
      if (next.item !== current.item) {
        revealCatalogPath(next.item);
      }
      setRoute(next);
    },
    [config, revealCatalogPath],
  );

  const focusHeading = useRef(false);
  useLayoutEffect(() => {
    if (focusHeading.current) {
      headingRef.current?.focus();
      headingRef.current?.scrollIntoView?.({ block: 'nearest' });
      focusHeading.current = false;
    }
  }, [route.item]);

  const visitItem = useCallback(
    (item: string, focusDestination = true, patch?: Partial<WorkbenchRoute>): void => {
      focusHeading.current = focusDestination && item !== route.item;
      update({ item, ...patch }, 'push');
      setCatalogOpen(false);
      if (focusDestination && item === route.item) {
        headingRef.current?.focus();
      }
    },
    [route.item, update],
  );
  const navigateFromUsage = useCallback(
    (destination: RouteDestination): void => {
      visitItem(destination.item, true, destinationPatch(destination, config));
    },
    [config, visitItem],
  );
  const navigateItem = (item: string): void => {
    visitItem(item, Boolean(mobileCatalogRef.current?.getClientRects().length && catalogOpen));
  };

  const component = config.components.find((entry) => entry.id === route.item);
  const scene = component ? undefined : config.scenes.find((entry) => entry.id === route.item);
  const notFound =
    !component && !scene && Boolean(route.item || config.components.length || config.scenes.length);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredComponents = config.components.filter(
    (item) =>
      (status === 'All' || item.status === status) &&
      filterMatch(item, item.category, normalizedQuery),
  );
  const filteredScenes = config.scenes.filter((item) =>
    filterMatch(item, item.group, normalizedQuery),
  );
  const sceneGroups = new Map<string, SceneDefinition[]>();
  for (const entry of filteredScenes) {
    const group = sceneGroups.get(entry.group) ?? [];
    group.push(entry);
    sceneGroups.set(entry.group, group);
  }

  function catalogDisclosure(key: string): { open: boolean; onToggle: () => void } {
    const open = normalizedQuery ? (searchGroups[key] ?? true) : (openGroups[key] ?? false);
    const setGroups = normalizedQuery ? setSearchGroups : setOpenGroups;
    return {
      open,
      onToggle: () => {
        setGroups((previous) => ({ ...previous, [key]: !open }));
      },
    };
  }

  const componentTabs = resolveComponentTabs(config);
  const activeTab = component ? findComponentTab(config, route.tab) : undefined;

  const expandArtboard = useCallback(
    (theme: WorkbenchTheme, scope?: ArtboardScope): void => {
      const current = readRoute(window.location.search, config);
      const snapshot: SoloReturnSnapshot | null = current.solo
        ? readSoloReturnFromHistory()
        : {
            item: current.item,
            tab: current.tab,
            family: current.family,
            scheme: current.scheme,
            slice: current.slice,
            block: current.block,
          };
      update(
        {
          solo: theme.id,
          ...(scope?.block
            ? { block: scope.block, slice: undefined }
            : scope?.slice
              ? { slice: scope.slice, block: undefined }
              : {}),
        },
        'push',
        snapshot ? { wbSoloReturn: snapshot } : null,
      );
    },
    [config, update],
  );

  const collapseArtboard = useCallback((): void => {
    const current = readRoute(window.location.search, config);
    const saved = readSoloReturnFromHistory();
    const keepCombinatorSlice = current.mode !== 'overview';
    if (saved && saved.item === current.item && saved.tab === current.tab) {
      update(
        {
          solo: undefined,
          family: saved.family,
          scheme: saved.scheme,
          ...(keepCombinatorSlice ? {} : { slice: saved.slice, block: saved.block }),
        },
        'push',
      );
      return;
    }
    update(
      {
        solo: undefined,
        family: 'all',
        scheme: 'both',
        ...(keepCombinatorSlice ? {} : { slice: undefined, block: undefined }),
      },
      'push',
    );
  }, [config, update]);

  useEffect(() => {
    if (route.raw || !route.solo) {
      return;
    }
    const handleEscape = (event: KeyboardEvent): void => {
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        event.isComposing ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return;
      }
      const target = event.target instanceof HTMLElement ? event.target : null;
      const editableTarget =
        Boolean(target?.isContentEditable) ||
        Boolean(
          target?.closest(
            'textarea, select, input:not([type="checkbox"], [type="radio"], [type="button"], [type="submit"], [type="reset"])',
          ),
        );
      const hasOpenDialog =
        Array.from(document.querySelectorAll('dialog[open]')).some(
          (dialog) => !dialog.matches('[role="presentation"], [role="none"]'),
        ) || Boolean(target?.closest('[role="dialog"], [role="alertdialog"]'));
      if (editableTarget || hasOpenDialog || hasOpenLightDismissPopover()) {
        return;
      }
      event.preventDefault();
      collapseArtboard();
    };
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [collapseArtboard, route.raw, route.solo]);

  const body = (
    <WorkbenchView
      config={config}
      route={route}
      sceneRevision={sceneRevision}
      component={component}
      scene={scene}
      notFound={notFound}
      createHref={createHref}
      update={update}
      expandArtboard={expandArtboard}
      collapseArtboard={collapseArtboard}
      navigateFromUsage={navigateFromUsage}
    />
  );

  const identity = {
    'data-wb-item': route.item,
    'data-wb-capture-route': route.freeze ? JSON.stringify(route) : undefined,
    'data-wb-fixed-view': route.vp !== 'auto' || undefined,
    'data-wb-tab': component ? route.tab : undefined,
    'data-wb-tab-kind': component ? activeTab?.kind : undefined,
    'data-wb-slice':
      component && activeTab?.kind === 'states'
        ? (route.slice ?? (route.mode === 'slice' ? componentStates(component)[0]?.id : undefined))
        : undefined,
    'data-wb-mode':
      activeTab?.kind === 'states' && route.mode !== 'overview' ? route.mode : undefined,
    'data-wb-block': route.block,
    'data-wb-not-found': notFound ? '1' : undefined,
  };

  const itemTitle =
    component?.title ?? scene?.title ?? (notFound ? 'Item not found' : 'Preset calibration');
  const viewportStyle =
    route.vp === 'auto' ? undefined : ({ '--wb-preview-width': `${route.vp}px` } as CSSProperties);

  const themeEditor = config.themeEditor;
  useEffect(() => {
    if (!themeEditor || route.raw || !persistThemeOverridesRef.current) {
      return;
    }
    saveThemeOverrides(themeEditor, themeOverrides);
  }, [route.raw, themeEditor, themeOverrides]);

  const handleChangeMacro = useCallback(
    (themeId: string, macroId: string, value: ThemeMacroValue): void => {
      if (!themeEditor || !isSafeObjectKey(themeId) || !isSafeObjectKey(macroId)) {
        return;
      }
      persistThemeOverridesRef.current = true;
      const theme = config.themes.find((entry) => entry.id === themeId);
      const macro = themeEditor.macros?.find((entry) => entry.id === macroId);
      const isDefault = theme && macro ? macroDefaultForTheme(macro, theme) === value : false;
      setThemeOverrides((previous) => {
        const bucket = getThemeBucket(previous, themeId) ?? EMPTY_BUCKET;
        const nextMacros = isDefault
          ? omitKey(bucket.macros, macroId)
          : { ...bucket.macros, [macroId]: value };
        if (Object.keys(nextMacros).length === 0 && Object.keys(bucket.raw).length === 0) {
          return omitKey(previous, themeId);
        }
        return { ...previous, [themeId]: { macros: nextMacros, raw: bucket.raw } };
      });
    },
    [config.themes, themeEditor],
  );

  const handleResetMacro = useCallback((themeId: string, macroId: string): void => {
    if (!isSafeObjectKey(themeId) || !isSafeObjectKey(macroId)) {
      return;
    }
    persistThemeOverridesRef.current = true;
    setThemeOverrides((previous) => {
      const bucket = getThemeBucket(previous, themeId);
      if (!bucket || !hasOwn(bucket.macros, macroId)) {
        return previous;
      }
      const nextMacros = omitKey(bucket.macros, macroId);
      if (Object.keys(nextMacros).length === 0 && Object.keys(bucket.raw).length === 0) {
        return omitKey(previous, themeId);
      }
      return { ...previous, [themeId]: { macros: nextMacros, raw: bucket.raw } };
    });
  }, []);

  const handleChangeToken = useCallback(
    (themeId: string, tokenName: string, value: string): void => {
      if (!isSafeObjectKey(themeId) || !isSafeObjectKey(tokenName)) {
        return;
      }
      persistThemeOverridesRef.current = true;
      setThemeOverrides((previous) => {
        const bucket = getThemeBucket(previous, themeId) ?? EMPTY_BUCKET;
        return {
          ...previous,
          [themeId]: { macros: bucket.macros, raw: { ...bucket.raw, [tokenName]: value } },
        };
      });
    },
    [],
  );

  const handleResetToken = useCallback((themeId: string, tokenName: string): void => {
    if (!isSafeObjectKey(themeId) || !isSafeObjectKey(tokenName)) {
      return;
    }
    persistThemeOverridesRef.current = true;
    setThemeOverrides((previous) => {
      const bucket = getThemeBucket(previous, themeId);
      if (!bucket || !hasOwn(bucket.raw, tokenName)) {
        return previous;
      }
      const nextRaw = omitKey(bucket.raw, tokenName);
      if (Object.keys(bucket.macros).length === 0 && Object.keys(nextRaw).length === 0) {
        return omitKey(previous, themeId);
      }
      return { ...previous, [themeId]: { macros: bucket.macros, raw: nextRaw } };
    });
  }, []);

  const handleResetTheme = useCallback((themeId: string): void => {
    if (!isSafeObjectKey(themeId)) {
      return;
    }
    persistThemeOverridesRef.current = true;
    setThemeOverrides((previous) => {
      if (!hasOwn(previous, themeId)) {
        return previous;
      }
      return omitKey(previous, themeId);
    });
  }, []);

  const handleResetAll = useCallback((): void => {
    persistThemeOverridesRef.current = true;
    setThemeOverrides({});
  }, []);

  const visibleThemes = useMemo(
    () => selectRouteThemes(config.themes, route),
    [config.themes, route],
  );
  const isUsageTab = Boolean(component && activeTab?.kind === 'usage');
  const canvasScheme: 'light' | 'dark' =
    !isUsageTab &&
    visibleThemes.length > 0 &&
    visibleThemes.every((theme) => theme.colorScheme === 'light')
      ? 'light'
      : 'dark';

  const overrideCss = useMemo(
    () =>
      themeEditor && !route.raw
        ? buildScopedOverrideStylesheet(themeEditor, config.themes, themeOverrides)
        : '',
    [config.themes, route.raw, themeEditor, themeOverrides],
  );

  const totalThemeChanges = useMemo(
    () => (themeEditor ? countAllChanges(themeEditor, config.themes, themeOverrides) : 0),
    [config.themes, themeEditor, themeOverrides],
  );

  if (route.raw) {
    return (
      <div
        ref={rootRef}
        className="wb-raw-canvas wb-scroll"
        data-canvas-scheme={canvasScheme}
        style={viewportStyle}
        {...identity}
      >
        {body}
      </div>
    );
  }

  const showThemeEditor = Boolean(themeEditor) && (!component || inspectorMode === 'theme');

  const settings = (
    <>
      <div className="wb-inspector-toolbar">
        {themeEditor && component ? (
          <div className="wb-seg" role="group" aria-label="Inspector panel">
            <button
              type="button"
              className="wb-seg-btn"
              aria-pressed={inspectorMode === 'inspector'}
              onClick={() => setInspectorMode('inspector')}
            >
              Inspector
            </button>
            <button
              type="button"
              className="wb-seg-btn"
              aria-pressed={inspectorMode === 'theme'}
              onClick={() => setInspectorMode('theme')}
            >
              Theme
              {totalThemeChanges > 0 && (
                <>
                  <span className="wb-theme-badge" aria-hidden="true">
                    {totalThemeChanges}
                  </span>
                  <span className="wb-theme-sr-only">
                    {' '}
                    {totalThemeChanges === 1
                      ? '1 override'
                      : `${String(totalThemeChanges)} overrides`}
                  </span>
                </>
              )}
            </button>
          </div>
        ) : themeEditor ? (
          <span>
            Theme
            {totalThemeChanges > 0 && (
              <>
                <span className="wb-theme-badge" aria-hidden="true">
                  {totalThemeChanges}
                </span>
                <span className="wb-theme-sr-only">
                  {' '}
                  {totalThemeChanges === 1
                    ? '1 override'
                    : `${String(totalThemeChanges)} overrides`}
                </span>
              </>
            )}
          </span>
        ) : (
          <span>Inspector</span>
        )}
        <div className="wb-inspector-actions">
          {scene && (
            <button
              type="button"
              className="wb-action-btn"
              onClick={() => setSceneRevision((previous) => previous + 1)}
            >
              Reset scene
            </button>
          )}
          <CopyLink url={new URL(createHref({}), window.location.href).href} />
          {compact && (
            <button
              type="button"
              className="wb-action-btn"
              aria-label="Close inspector"
              onClick={() => inspectorDialogRef.current?.close()}
            >
              Close
            </button>
          )}
        </div>
      </div>
      <div
        ref={setSettingsTarget}
        className="wb-view-settings wb-scroll"
        hidden={showThemeEditor}
      />
      {themeEditor && (!compact || inspectorVisited) && (
        <div className="wb-view-settings wb-scroll" hidden={!showThemeEditor}>
          <ThemeEditor
            config={themeEditor}
            themes={config.themes}
            visibleThemes={visibleThemes}
            shellRef={rootRef}
            store={themeOverrides}
            active={showThemeEditor}
            measureKey={`${route.item}|${route.tab}|${route.scale}|${notFound ? '1' : '0'}`}
            onChangeMacro={handleChangeMacro}
            onResetMacro={handleResetMacro}
            onChangeToken={handleChangeToken}
            onResetToken={handleResetToken}
            onResetTheme={handleResetTheme}
            onResetAll={handleResetAll}
            onFocusTheme={(theme) => {
              if (route.solo === theme.id) {
                return;
              }
              update({ family: theme.family, scheme: theme.colorScheme, solo: undefined }, 'push');
            }}
          />
        </div>
      )}
    </>
  );

  return (
    <div
      ref={rootRef}
      className="wb-shell"
      data-wb-compact={compact || undefined}
      style={viewportStyle}
      {...identity}
    >
      {overrideCss && <style data-wb-theme-overrides="">{overrideCss}</style>}
      <aside className="wb-rail" aria-label="Workbench catalog">
        <div className="wb-rail-sticky">
          <div className="wb-brand">
            <span className="wb-brand-title">{config.title}</span>
            {config.subtitle && <span className="wb-brand-sub">{config.subtitle}</span>}
            <button
              ref={mobileCatalogRef}
              type="button"
              className="wb-action-btn wb-mobile-nav"
              aria-expanded={catalogOpen}
              aria-controls={catalogId}
              onClick={() => {
                setCatalogOpen(!catalogOpen);
              }}
            >
              Catalog
            </button>
          </div>
          <div
            id={catalogId}
            className="wb-rail-content wb-scroll"
            data-open={catalogOpen ? 'true' : undefined}
          >
            <div className="wb-search-wrap">
              <input
                ref={searchRef}
                type="search"
                className="wb-field wb-search"
                aria-label="Search components and scenes"
                aria-keyshortcuts="/ Meta+K Control+K"
                placeholder="Search catalog"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchGroups({});
                }}
              />
            </div>
            <div className="wb-filter-row">
              <div className="wb-seg" role="group" aria-label="Component status">
                {(['All', 'UI', 'Proto'] as const).map((filter) => (
                  <button
                    key={filter}
                    className="wb-seg-btn"
                    type="button"
                    aria-pressed={status === filter}
                    onClick={() => {
                      setStatus(filter);
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            <nav className="wb-catalog-nav" aria-label="Components and scenes">
              {config.categories.map((category) => {
                const entries = filteredComponents.filter((entry) => entry.category === category);
                if (!entries.length) {
                  return null;
                }
                return (
                  <CatalogGroup
                    key={category}
                    title={category}
                    {...catalogDisclosure(`component:${category}`)}
                  >
                    {entries.map((entry) => (
                      <Destination
                        key={entry.id}
                        className="wb-nav-item"
                        active={entry.id === route.item}
                        href={createHref({ item: entry.id })}
                        navigate={() => {
                          navigateItem(entry.id);
                        }}
                      >
                        <span>{entry.title}</span>{' '}
                        <span className="wb-nav-tag">{entry.status}</span>
                      </Destination>
                    ))}
                  </CatalogGroup>
                );
              })}
              {!filteredComponents.length && (
                <p className="wb-nav-empty">No matching components.</p>
              )}
              <CatalogGroup title="Scenes" {...catalogDisclosure('scenes')}>
                {[...sceneGroups].map(([group, entries]) => (
                  <CatalogGroup
                    key={group}
                    title={group}
                    nested
                    {...catalogDisclosure(`scene:${group}`)}
                  >
                    {entries.map((entry) => (
                      <Destination
                        key={entry.id}
                        className="wb-nav-item"
                        active={entry.id === route.item}
                        href={createHref({ item: entry.id })}
                        navigate={() => {
                          navigateItem(entry.id);
                        }}
                      >
                        <span>{entry.title}</span>
                      </Destination>
                    ))}
                  </CatalogGroup>
                ))}
                {!sceneGroups.size && <p className="wb-nav-empty">No matching scenes.</p>}
              </CatalogGroup>
            </nav>
          </div>
        </div>
      </aside>

      <div className="wb-main">
        <header className="wb-topbar">
          <div className="wb-item-heading">
            <h1 ref={headingRef} className="wb-item-title" tabIndex={-1} title={itemTitle}>
              {itemTitle}
            </h1>
            {component && <span className="wb-nav-tag">{component.status}</span>}
          </div>
          <Environment
            route={route}
            themes={config.themes}
            update={update}
            href={createHref}
            hasComponent={Boolean(component)}
          />
          {compact && (
            <button
              ref={inspectorLaunchRef}
              type="button"
              className="wb-action-btn wb-inspector-launch"
              aria-haspopup="dialog"
              aria-controls={inspectorId}
              onClick={() => {
                setInspectorVisited(true);
                inspectorDialogRef.current?.showModal();
              }}
            >
              Inspector
            </button>
          )}
        </header>
        {component && (
          <nav className="wb-tabs" aria-label="Inspector tabs">
            {componentTabs.map((tabDef) => (
              <Destination
                key={tabDef.id}
                className="wb-tab"
                href={createHref({ tab: tabDef.id })}
                active={route.tab === tabDef.id}
                navigate={() => {
                  update({ tab: tabDef.id }, 'push');
                }}
              >
                {tabDef.label}
              </Destination>
            ))}
          </nav>
        )}
        <main
          className="wb-canvas wb-scroll"
          data-canvas-scheme={canvasScheme}
          tabIndex={
            route.vp !== 'auto' && (!component || activeTab?.kind !== 'playground') ? 0 : undefined
          }
        >
          <SettingsProvider target={compact && !inspectorVisited ? null : settingsTarget}>
            {body}
          </SettingsProvider>
        </main>
      </div>
      {compact ? (
        <dialog
          ref={inspectorDialogRef}
          id={inspectorId}
          className="wb-settings"
          aria-label="Workbench inspector"
        >
          {settings}
        </dialog>
      ) : (
        <aside id={inspectorId} className="wb-settings" aria-label="Workbench inspector">
          {settings}
        </aside>
      )}
    </div>
  );
}
