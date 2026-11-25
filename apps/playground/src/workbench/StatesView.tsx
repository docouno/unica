import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Matrix, RuleNotes, SliceGrid } from './Matrix.js';
import { StoryFrame } from './StoryFrame.js';
import { ViewSettings } from './ViewSettings.js';
import {
  buildSlice,
  componentStates,
  defaultValues,
  evaluate,
  finiteDomain,
  showValue,
} from './schema.js';
import type { WorkbenchRoute } from './route.js';
import type {
  CaseBlock,
  ComponentDefinition,
  MatrixMode,
  MatrixView,
  PreviewContext,
  PropDefinition,
  PropValue,
  StoryContext,
  Surface,
  SurfaceMode,
  Values,
  WorkbenchTheme,
} from './types.js';
import './states.css';
import './toc.css';

const EAGER_SECTION_COUNT = 3;

const caseKinds: Record<CaseBlock['kind'], string> = {
  behavior: 'Behavior',
  content: 'Content & overflow',
  surface: 'Surface',
};

interface StageSettings {
  readonly surface?: Surface;
  readonly overlayStage?: boolean;
}

export interface StatesViewProps {
  readonly component: ComponentDefinition;
  readonly route: WorkbenchRoute;
  readonly themes: readonly WorkbenchTheme[];
  readonly update: (patch: Partial<WorkbenchRoute>, method?: 'push' | 'replace') => void;
  readonly renderArtboards: (
    render: (theme: WorkbenchTheme) => ReactNode,
    scope?: {
      readonly block?: string | undefined;
      readonly slice?: string | undefined;
      readonly canFocus?: boolean | undefined;
    },
  ) => ReactElement;
  readonly renderPreview: (
    theme: WorkbenchTheme,
    identity: string,
    settings: StageSettings | undefined,
    render: (ctx: PreviewContext) => ReactNode,
    surfaceMode?: SurfaceMode,
    action?: PreviewContext['action'],
    story?: StoryContext,
  ) => ReactElement;
  readonly renderMatrixSubject: (
    theme: WorkbenchTheme,
    values: Values,
    identity: string,
    settings?: StageSettings,
    story?: StoryContext,
  ) => ReactNode;
}

type StateSection =
  | {
      readonly kind: 'slice';
      readonly key: string;
      readonly anchorId: string;
      readonly view: MatrixView;
    }
  | {
      readonly kind: 'case';
      readonly key: string;
      readonly anchorId: string;
      readonly item: CaseBlock;
    };

function caseMeta(item: CaseBlock): string {
  const parts = [caseKinds[item.kind]];
  if (item.mode === 'live') {
    parts.push('Live');
  } else if (item.mode === 'pinned') {
    parts.push('Pinned');
  }
  return parts.join(' · ');
}

function FilterField({
  name,
  prop,
  override,
  value,
  onChange,
}: {
  readonly name: string;
  readonly prop: PropDefinition;
  readonly override: PropValue | undefined;
  readonly value: PropValue;
  readonly onChange: (value: PropValue | undefined) => void;
}): ReactElement {
  const examples = finiteDomain(prop);
  const label = prop.label ?? name;
  const choice = examples.findIndex((entry) => entry === override);

  return (
    <label className="wb-matrix-field" title={prop.description}>
      {label}
      <select
        className="wb-field"
        value={choice < 0 ? '' : String(choice)}
        onChange={(event) => {
          const input = event.currentTarget.value;
          onChange(input === '' ? undefined : examples[Number(input)]);
        }}
      >
        <option value="">Default ({showValue(prop, value)})</option>
        {examples.map((entry, index) => (
          <option key={String(entry)} value={String(index)}>
            {showValue(prop, entry)}
          </option>
        ))}
      </select>
    </label>
  );
}

const OverviewSample = memo(function OverviewSample({
  component,
  theme,
  assignment,
  identity,
  view,
  story,
  renderSubject,
}: {
  readonly component: ComponentDefinition;
  readonly theme: WorkbenchTheme;
  readonly assignment: Values;
  readonly identity: string;
  readonly view: MatrixView;
  readonly story: StoryContext;
  readonly renderSubject: StatesViewProps['renderMatrixSubject'];
}): ReactElement {
  const decision = evaluate(component.constraints, assignment);

  return (
    <>
      {decision.valid && renderSubject(theme, assignment, identity, view, story)}
      <RuleNotes rules={decision.matches} />
    </>
  );
});

function LazyStateSection({
  sectionKey,
  anchorId,
  title,
  meta,
  caption,
  dataBlock,
  dataSlice,
  eager,
  lazyCss,
  onMount,
  children,
}: {
  readonly sectionKey: string;
  readonly anchorId: string;
  readonly title: string;
  readonly meta?: string | undefined;
  readonly caption?: string | undefined;
  readonly dataBlock?: string | undefined;
  readonly dataSlice?: string | undefined;
  readonly eager: boolean;
  readonly lazyCss: boolean;
  readonly onMount: (key: string) => void;
  readonly children: () => ReactElement;
}): ReactElement {
  const hostRef = useRef<HTMLDivElement>(null);
  const [everMounted, setEverMounted] = useState(eager);
  if (eager && !everMounted) {
    setEverMounted(true);
  }
  const mounted = eager || everMounted;

  useEffect(() => {
    if (mounted) {
      return;
    }
    const node = hostRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      onMount(sectionKey);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          onMount(sectionKey);
        }
      },
      { rootMargin: '400px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [mounted, onMount, sectionKey]);

  return (
    <div
      ref={hostRef}
      id={anchorId}
      className="wb-states-section"
      data-wb-lazy={lazyCss ? 'true' : undefined}
    >
      {mounted ? (
        children()
      ) : (
        <section
          className="wb-story-frame wb-story-frame-placeholder"
          data-wb-block={dataBlock}
          data-wb-slice={dataSlice}
        >
          <header className="wb-story-header" dir="auto">
            <div className="wb-story-header-row">
              <div className="wb-story-title-group">
                <h2 className="wb-story-title">{title}</h2>
                {meta && <span className="wb-story-badge">{meta}</span>}
              </div>
            </div>
            {caption && (
              <p className="wb-story-caption" dir="auto">
                {caption}
              </p>
            )}
          </header>
          <div className="wb-lazy-body">
            <button
              type="button"
              className="wb-action-btn"
              aria-label={`Load ${title} preview`}
              onClick={() => onMount(sectionKey)}
            >
              Load preview
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function ModeSwitcher({
  combinator,
  onOverview,
  onCombinator,
}: {
  readonly combinator: boolean;
  readonly onOverview: () => void;
  readonly onCombinator: () => void;
}): ReactElement {
  return (
    <div className="wb-states-mode-bar">
      <div className="wb-seg" role="group" aria-label="States mode">
        <button
          type="button"
          className="wb-seg-btn"
          aria-pressed={!combinator}
          data-active={!combinator}
          onClick={onOverview}
        >
          Overview
        </button>
        <button
          type="button"
          className="wb-seg-btn"
          aria-pressed={combinator}
          data-active={combinator}
          onClick={onCombinator}
        >
          Combinator
        </button>
      </div>
    </div>
  );
}

export function StatesView({
  component,
  route,
  themes,
  update,
  renderArtboards,
  renderPreview,
  renderMatrixSubject,
}: StatesViewProps): ReactElement {
  const { surface, raw, freeze, block, slice, mode } = route;
  const [globalFilters, setGlobalFilters] = useState<Values>({});
  const [mountedKeys, setMountedKeys] = useState<ReadonlySet<string>>(() => new Set());

  const defaults = useMemo(() => defaultValues(component.props), [component.props]);
  const finiteKeys = useMemo(
    () =>
      Object.keys(component.props).filter((key) => finiteDomain(component.props[key]!).length > 0),
    [component.props],
  );

  const declaredSlices = useMemo(() => componentStates(component), [component]);
  const declaredCases = useMemo(() => component.cases ?? [], [component.cases]);

  const sections = useMemo<readonly StateSection[]>(() => {
    const list: StateSection[] = [];
    const effectiveSlices: readonly MatrixView[] =
      declaredSlices.length > 0
        ? declaredSlices
        : declaredCases.length === 0 && finiteKeys.length > 0
          ? [
              {
                id: 'default',
                title: 'States',
                ...(finiteKeys[0] !== undefined ? { rows: finiteKeys[0] } : {}),
                ...(finiteKeys[1] !== undefined ? { cols: finiteKeys[1] } : {}),
              },
            ]
          : [];

    for (const view of effectiveSlices) {
      list.push({
        kind: 'slice',
        key: `slice:${view.id}`,
        anchorId: `wb-state-slice-${view.id}`,
        view,
      });
    }
    for (const item of declaredCases) {
      list.push({
        kind: 'case',
        key: `case:${item.id}`,
        anchorId: `wb-state-case-${item.id}`,
        item,
      });
    }
    return list;
  }, [declaredCases, declaredSlices, finiteKeys]);

  // Memoize built slice grids so scrolling/mounting a lazy section doesn't invalidate memoized cells.
  const sliceGrids = useMemo(() => {
    const map = new Map<
      string,
      {
        readonly axes: { rows?: string; cols?: string; group?: string };
        readonly grid: ReturnType<typeof buildSlice>;
        readonly totalRows: number;
      }
    >();
    for (const section of sections) {
      if (section.kind !== 'slice') {
        continue;
      }
      const { view } = section;
      const axes = {
        ...(view.rows === undefined ? {} : { rows: view.rows }),
        ...(view.cols === undefined ? {} : { cols: view.cols }),
        ...(view.group === undefined ? {} : { group: view.group }),
      };
      // Slice-declared `fixed` invariants take precedence over global overview filters.
      const sliceValues = { ...defaults, ...globalFilters, ...view.fixed };
      const grid = buildSlice(component.props, sliceValues, axes);
      const totalRows = grid.groups.length * (grid.groups[0]?.rows.length ?? 0);
      map.set(section.key, { axes, grid, totalRows });
    }
    return map;
  }, [component.props, defaults, globalFilters, sections]);

  const markMounted = useCallback((sectionKey: string): void => {
    setMountedKeys((previous) => {
      if (previous.has(sectionKey)) {
        return previous;
      }
      const next = new Set(previous);
      next.add(sectionKey);
      return next;
    });
  }, []);

  const markManyMounted = useCallback((keys: readonly string[]): void => {
    setMountedKeys((previous) => {
      if (keys.every((key) => previous.has(key))) {
        return previous;
      }
      const next = new Set(previous);
      for (const key of keys) {
        next.add(key);
      }
      return next;
    });
  }, []);

  const jumpToSection = useCallback(
    (section: StateSection, targetIndex: number, trigger: HTMLElement | null): void => {
      // Mount all sections through the target so intermediate sections do not expand mid-scroll.
      const toMount = sections.slice(0, targetIndex + 1).map((entry) => entry.key);
      markManyMounted(toMount);
      trigger?.closest<HTMLDialogElement>('dialog[open]')?.close();
      if (slice || block) {
        update({ slice: undefined, block: undefined }, 'push');
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const element = document.getElementById(section.anchorId);
          if (!element) {
            return;
          }
          const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
          element.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        });
      });
    },
    [block, markManyMounted, sections, slice, update],
  );

  const modeSwitcher = (
    <ModeSwitcher
      combinator={mode !== 'overview'}
      onOverview={() => update({ mode: 'overview', slice: undefined }, 'replace')}
      onCombinator={() => update({ mode: 'slice', block: undefined }, 'replace')}
    />
  );

  if (mode !== 'overview') {
    return (
      <Matrix
        component={component}
        slice={slice}
        mode={mode}
        raw={raw}
        freeze={freeze}
        themes={themes}
        header={modeSwitcher}
        onSliceChange={(selected) => update({ slice: selected }, 'replace')}
        onModeChange={(selected: MatrixMode) => update({ mode: selected }, 'replace')}
        renderArtboards={renderArtboards}
        renderSubject={renderMatrixSubject}
      />
    );
  }

  const visibleSections = slice
    ? sections.filter((section) => section.kind === 'slice' && section.view.id === slice)
    : block
      ? sections.filter((section) => section.kind === 'case' && section.item.id === block)
      : sections;

  const isFiltered = Boolean(slice || block);
  const disableLazy = raw || freeze || isFiltered;
  const visibleSlices = visibleSections.filter((section) => section.kind === 'slice');
  const filterableKeys = finiteKeys.filter((key) =>
    visibleSlices.some(
      ({ view }) =>
        view.rows !== key &&
        view.cols !== key &&
        view.group !== key &&
        !Object.hasOwn(view.fixed ?? {}, key),
    ),
  );
  const activeFilterCount = Object.keys(globalFilters).length;
  const canFocusSection = sections.length > 1;

  const labelProp = (key: string): string => component.props[key]?.label ?? key;
  const labelValue = (key: string | undefined, value: PropValue | undefined): string =>
    key === undefined || value === undefined ? '' : showValue(component.props[key], value);

  const updateFilter = (key: string, value: PropValue | undefined): void => {
    setGlobalFilters((previous) => {
      const next = { ...previous };
      if (value === undefined) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const clearSectionFilter = (): void => {
    markManyMounted(visibleSections.map((section) => section.key));
    update({ slice: undefined, block: undefined }, 'push');
  };

  return (
    <div className="wb-inspector wb-states-overview">
      {!raw && (
        <ViewSettings>
          <div className="wb-states-sidebar">
            {modeSwitcher}
            {isFiltered && (
              <div className="wb-states-filter-banner">
                <span className="wb-inspector-note">Showing 1 filtered section.</span>
                <button type="button" className="wb-action-btn" onClick={clearSectionFilter}>
                  Show all sections
                </button>
              </div>
            )}
            {sections.length > 0 && (
              <nav className="wb-toc" aria-label="State sections">
                <h2 className="wb-toc-heading">Sections ({sections.length})</h2>
                <ul className="wb-toc-list">
                  {sections.map((section, sectionIndex) => {
                    const active =
                      (section.kind === 'slice' && section.view.id === slice) ||
                      (section.kind === 'case' && section.item.id === block);
                    const title =
                      section.kind === 'slice' ? section.view.title : section.item.title;
                    const tag =
                      section.kind === 'slice'
                        ? 'Slice'
                        : caseKinds[section.item.kind].split(' ')[0];
                    return (
                      <li key={section.key}>
                        <button
                          type="button"
                          className="wb-toc-link"
                          data-active={active || undefined}
                          onClick={(event) =>
                            jumpToSection(section, sectionIndex, event.currentTarget)
                          }
                        >
                          <span>{title}</span>
                          <span className="wb-toc-tag">{tag}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}
            {filterableKeys.length > 0 && visibleSlices.length > 0 && (
              <section className="wb-states-filters" aria-label="Global slice filters">
                <details>
                  <summary className="wb-disclosure">
                    Global filters{activeFilterCount > 0 ? ` (${String(activeFilterCount)})` : ''}
                  </summary>
                  <div className="wb-states-filter-fields">
                    {filterableKeys.map((key) => (
                      <FilterField
                        key={key}
                        name={key}
                        prop={component.props[key]!}
                        override={globalFilters[key]}
                        value={defaults[key]!}
                        onChange={(value) => updateFilter(key, value)}
                      />
                    ))}
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        className="wb-action-btn"
                        onClick={() => setGlobalFilters({})}
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                </details>
              </section>
            )}
          </div>
        </ViewSettings>
      )}

      {visibleSections.length > 0 ? (
        <div className="wb-inspector-blocks">
          {visibleSections.map((section, index) => {
            const eager =
              disableLazy || index < EAGER_SECTION_COUNT || mountedKeys.has(section.key);
            const lazyCss = !disableLazy && !eager && index >= EAGER_SECTION_COUNT;

            if (section.kind === 'slice') {
              const { view } = section;
              const built = sliceGrids.get(section.key)!;

              return (
                <LazyStateSection
                  key={section.key}
                  sectionKey={section.key}
                  anchorId={section.anchorId}
                  title={view.title}
                  meta="Slice"
                  caption={view.caption}
                  dataSlice={view.id}
                  eager={eager}
                  lazyCss={lazyCss}
                  onMount={markMounted}
                >
                  {() => (
                    <StoryFrame
                      title={view.title}
                      headingLevel="h2"
                      meta="Slice"
                      caption={view.caption}
                      dataSlice={view.id}
                      controls={view.controls}
                      actions={view.actions}
                      reset={view.reset}
                      raw={raw}
                    >
                      {(story) =>
                        renderArtboards(
                          (theme) => (
                            <div className="wb-matrix-artboard">
                              <SliceGrid
                                grid={built.grid}
                                rowLimit={built.totalRows}
                                axes={built.axes}
                                labelProp={labelProp}
                                labelValue={labelValue}
                                renderSample={(values, identity) => (
                                  <OverviewSample
                                    key={JSON.stringify([identity, values])}
                                    component={component}
                                    theme={theme}
                                    assignment={values}
                                    identity={identity}
                                    view={view}
                                    story={story}
                                    renderSubject={renderMatrixSubject}
                                  />
                                )}
                              />
                            </div>
                          ),
                          { slice: view.id, canFocus: canFocusSection },
                        )
                      }
                    </StoryFrame>
                  )}
                </LazyStateSection>
              );
            }

            const { item } = section;
            const Sample = item.render;
            const surfaces: readonly SurfaceMode[] = item.compareSurfaces
              ? ['base', 'overlay']
              : [surface];
            const meta = caseMeta(item);

            return (
              <LazyStateSection
                key={section.key}
                sectionKey={section.key}
                anchorId={section.anchorId}
                title={item.title}
                meta={meta}
                caption={item.caption}
                dataBlock={item.id}
                eager={eager}
                lazyCss={lazyCss}
                onMount={markMounted}
              >
                {() => (
                  <StoryFrame
                    title={item.title}
                    headingLevel="h2"
                    meta={meta}
                    caption={item.caption}
                    dataBlock={item.id}
                    controls={item.controls}
                    actions={item.actions}
                    reset={item.reset}
                    raw={raw}
                  >
                    {(story) =>
                      renderArtboards(
                        (theme) => (
                          <div className="wb-surface-previews">
                            {surfaces.map((choice) => (
                              <div key={choice} style={{ maxInlineSize: item.width }}>
                                {item.compareSurfaces && (
                                  <p className="wb-inspector-meta wb-preview-surface">
                                    {choice === 'base' ? 'Base' : 'Overlay'}
                                  </p>
                                )}
                                {renderPreview(
                                  theme,
                                  choice,
                                  item,
                                  (ctx) => (
                                    <Sample ctx={ctx} />
                                  ),
                                  choice,
                                  undefined,
                                  story,
                                )}
                              </div>
                            ))}
                          </div>
                        ),
                        { block: item.id, canFocus: canFocusSection },
                      )
                    }
                  </StoryFrame>
                )}
              </LazyStateSection>
            );
          })}
        </div>
      ) : (
        <p className="wb-inspector-note">No state slices or cases registered.</p>
      )}
    </div>
  );
}
