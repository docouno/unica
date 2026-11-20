import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { MouseEvent, ReactElement, ReactNode, RefObject } from 'react';
import { Inspector } from './Inspector.js';
import {
  patchRoute,
  readRoute,
  routeSearch,
  schemes,
  selectThemes,
  surfaces,
  tabs,
  viewports,
} from './route.js';
import type { WorkbenchRoute } from './route.js';
import type {
  ComponentStatus,
  SceneDefinition,
  ViewportSize,
  WorkbenchConfig,
  WorkbenchStageContext,
  WorkbenchTheme,
} from './types.js';
import './workbench.css';
import './controls.css';

const tabLabels = {
  playground: 'Playground',
  matrix: 'Matrix',
  cases: 'Cases',
  usage: 'Usage',
};

const schemeLabels = { dark: 'Dark', light: 'Light', both: 'Both' };
const surfaceLabels = { auto: 'Auto', base: 'Base', overlay: 'Overlay' };

function ViewportFrame({
  vp,
  scaleToFit,
  children,
}: {
  readonly vp: ViewportSize;
  readonly scaleToFit: boolean;
  readonly children: ReactNode;
}): ReactElement {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [metrics, setMetrics] = useState<{ scale: number; height: number | undefined }>({
    scale: 1,
    height: undefined,
  });

  useLayoutEffect(() => {
    const host = hostRef.current;
    const inner = innerRef.current;
    if (vp === 'auto' || !scaleToFit || !host || !inner || typeof ResizeObserver === 'undefined') {
      return;
    }

    const measure = (): void => {
      if (host.clientWidth === 0) {
        return;
      }
      const scale = Math.min(1, host.clientWidth / vp);
      const height = Math.ceil(inner.offsetHeight * scale);
      setMetrics((previous) =>
        previous.scale === scale && previous.height === height ? previous : { scale, height },
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    observer.observe(inner);
    return () => {
      observer.disconnect();
    };
  }, [vp, scaleToFit]);

  return (
    <div
      ref={hostRef}
      className="wb-viewport-host wb-scroll"
      data-scaled={vp !== 'auto' && scaleToFit ? 'true' : undefined}
      data-fixed={vp !== 'auto' ? 'true' : undefined}
      style={vp !== 'auto' && scaleToFit ? { height: metrics.height } : undefined}
    >
      {vp === 'auto' ? (
        children
      ) : (
        <div
          ref={innerRef}
          className="wb-viewport-inner"
          style={{
            width: vp,
            ...(scaleToFit && metrics.scale < 1
              ? { scale: metrics.scale, marginInline: 0, '--wb-viewport-scale': metrics.scale }
              : {}),
          }}
        >
          {children}
        </div>
      )}
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
      <Scene />
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

type Update = (patch: Partial<WorkbenchRoute>, behavior?: 'push' | 'replace') => void;
type Href = (patch: Partial<WorkbenchRoute>) => string;

function Environment({
  route,
  themes,
  update,
  href,
  hasComponent,
  onResetScene,
}: {
  readonly route: WorkbenchRoute;
  readonly themes: readonly WorkbenchTheme[];
  readonly update: Update;
  readonly href: Href;
  readonly hasComponent: boolean;
  readonly onResetScene: (() => void) | undefined;
}): ReactElement {
  const families = new Map(themes.map((theme) => [theme.family, theme.familyLabel]));
  const familyOptions = [...families, ['all', 'All'] as const];
  const [copyResult, setCopyResult] = useState<{ status: string; url: string }>();
  const url = new URL(href({}), window.location.href).href;
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
    <div className="wb-environment">
      <div className="wb-environment-group">
        <span aria-hidden="true">Family</span>
        <div className="wb-seg" role="group" aria-label="Family">
          {familyOptions.map(([family, label]) =>
            selectThemes(themes, family, route.scheme).length > 0 ? (
              <Destination
                key={family}
                className="wb-seg-btn"
                href={href({ family })}
                active={route.family === family}
                navigate={() => {
                  update({ family }, 'push');
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
            selectThemes(themes, route.family, scheme).length > 0 ? (
              <Destination
                key={scheme}
                className="wb-seg-btn"
                href={href({ scheme })}
                active={route.scheme === scheme}
                navigate={() => {
                  update({ scheme }, 'push');
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
          aria-pressed={route.scale === 120}
          onClick={() => {
            update({ scale: route.scale === 120 ? 100 : 120 });
          }}
        >
          120% Text
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
      {onResetScene && (
        <button className="wb-action-btn" type="button" onClick={onResetScene}>
          Reset scene
        </button>
      )}
      <button className="wb-action-btn" type="button" onClick={copyLink}>
        {copyResult?.url === url ? copyResult.status : 'Copy Link'}
      </button>
    </div>
  );
}

export interface WorkbenchAppProps {
  readonly config: WorkbenchConfig;
}

export function WorkbenchApp({ config }: WorkbenchAppProps): ReactElement {
  const [route, setRoute] = useState(() => readRoute(window.location.search, config));
  const [sceneRevision, setSceneRevision] = useState(0);
  const [query, setQuery] = useState('');
  const [openGroups, setOpenGroups] = useState(() => catalogPath(config, route.item));
  const [searchGroups, setSearchGroups] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<'All' | ComponentStatus>('All');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [searchRequest, setSearchRequest] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const mobileCatalogRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const catalogId = useId();
  const revealCatalogPath = useCallback(
    (item: string): void => {
      const path = catalogPath(config, item);
      setOpenGroups((previous) => ({ ...previous, ...path }));
      setSearchGroups((previous) => ({ ...previous, ...path }));
    },
    [config],
  );

  useCaptureReadiness(rootRef, route, sceneRevision);
  useEffect(() => {
    const restore = (): void => {
      const next = readRoute(window.location.search, config);
      if (next.item !== route.item) {
        revealCatalogPath(next.item);
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
        target?.closest('dialog[open], [role="dialog"], [role="alertdialog"]') ||
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

  const createHref: Href = (patch) =>
    `${window.location.pathname}${routeSearch(patchRoute(route, patch, config), config)}${window.location.hash}`;
  const update: Update = (patch, behavior = 'replace') => {
    const current = readRoute(window.location.search, config);
    const next = patchRoute(current, patch, config);
    const search = routeSearch(next, config);
    if (search === routeSearch(current, config)) {
      return;
    }
    const href = `${window.location.pathname}${search}${window.location.hash}`;
    if (behavior === 'push') {
      window.history.pushState(null, '', href);
    } else {
      window.history.replaceState(null, '', href);
    }
    if (next.item !== current.item) {
      revealCatalogPath(next.item);
    }
    setRoute(next);
  };

  function navigateItem(item: string): void {
    update({ item }, 'push');
    setCatalogOpen(false);
    if (mobileCatalogRef.current?.getClientRects().length && catalogOpen) {
      headingRef.current?.focus();
    }
  }

  const component = config.components.find((entry) => entry.id === route.item);
  const scene = component ? undefined : config.scenes.find((entry) => entry.id === route.item);
  const notFound =
    !component && !scene && Boolean(route.item || config.components.length || config.scenes.length);
  const selectedThemes = selectThemes(config.themes, route.family, route.scheme);
  const sceneIndex = useSceneIndex(config);
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

  const renderArtboards = (render: (theme: WorkbenchTheme) => ReactNode): ReactElement => (
    <div className="wb-artboards" data-single={selectedThemes.length === 1 ? 'true' : undefined}>
      {selectedThemes.map((theme) => (
        <section
          className="wb-cell"
          key={theme.id}
          aria-label={theme.label}
          tabIndex={route.raw ? undefined : -1}
        >
          {route.raw || selectedThemes.length === 1 ? (
            <div className="wb-cell-header">
              <span className="wb-cell-title">{theme.label}</span>
              {theme.meta && <span className="wb-cell-meta">{theme.meta}</span>}
            </div>
          ) : (
            <button
              className="wb-cell-header wb-isolate"
              type="button"
              aria-label={`Isolate ${theme.label}`}
              onClick={(event) => {
                event.currentTarget.parentElement?.focus();
                update({ family: theme.family, scheme: theme.colorScheme }, 'push');
              }}
            >
              <span className="wb-cell-title">{theme.label}</span>
              <span className="wb-cell-meta">Isolate</span>
            </button>
          )}
          <ViewportFrame vp={route.vp} scaleToFit={selectedThemes.length > 1}>
            <div
              className="wb-artboard"
              data-theme={theme.id}
              data-color-scheme={theme.colorScheme}
              data-text-scale={route.scale}
              data-wb-scene={component ? undefined : ''}
              dir={route.dir}
              style={{ colorScheme: theme.colorScheme }}
            >
              {render(theme)}
            </div>
          </ViewportFrame>
        </section>
      ))}
      {!selectedThemes.length && <p className="wb-empty-note">No themes registered.</p>}
    </div>
  );

  const body = component ? (
    <Inspector
      key={component.id}
      component={component}
      route={route}
      themes={selectedThemes}
      scenes={sceneIndex.get(component.id) ?? []}
      update={update}
      itemHref={(item) => createHref({ item })}
      navigateItem={navigateItem}
      renderArtboards={renderArtboards}
      renderStage={config.renderStage}
    />
  ) : notFound ? (
    <p className="wb-empty-note">
      Item “{route.item}” was not found. Choose a component or scene from the catalog.
    </p>
  ) : (
    renderArtboards((theme) => (
      <Fragment key={`${route.item}:${sceneRevision}`}>
        {sceneArtboard(config, route, theme, scene)}
      </Fragment>
    ))
  );

  const identity = {
    'data-wb-item': route.item,
    'data-wb-tab': component ? route.tab : undefined,
    'data-wb-slice':
      route.tab === 'matrix' ? (route.slice ?? component?.matrixViews?.[0]?.id) : undefined,
    'data-wb-mode': route.tab === 'matrix' ? route.mode : undefined,
    'data-wb-block': route.block,
    'data-wb-not-found': notFound ? '1' : undefined,
  };

  if (route.raw) {
    return (
      <div ref={rootRef} className="wb-raw-canvas" {...identity}>
        {body}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="wb-shell" {...identity}>
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
          <div className="wb-item-info">
            <div className="wb-item-heading">
              <h1 ref={headingRef} className="wb-item-title" tabIndex={-1}>
                {component?.title ??
                  scene?.title ??
                  (notFound ? 'Item not found' : 'Preset calibration')}
              </h1>
              {component && <span className="wb-nav-tag">{component.status}</span>}
            </div>
            {(component?.summary ?? scene?.summary) && (
              <p className="wb-item-summary">{component?.summary ?? scene?.summary}</p>
            )}
          </div>
          <Environment
            route={route}
            themes={config.themes}
            update={update}
            href={createHref}
            hasComponent={Boolean(component)}
            onResetScene={
              scene
                ? () => {
                    setSceneRevision((previous) => previous + 1);
                  }
                : undefined
            }
          />
        </header>
        {component && (
          <nav className="wb-tabs" aria-label="Inspector tabs">
            {tabs.map((tab) => (
              <Destination
                key={tab}
                className="wb-tab"
                href={createHref({ tab })}
                active={route.tab === tab}
                navigate={() => {
                  update({ tab }, 'push');
                }}
              >
                {tabLabels[tab]}
              </Destination>
            ))}
          </nav>
        )}
        <main className="wb-canvas">{body}</main>
      </div>
    </div>
  );
}
