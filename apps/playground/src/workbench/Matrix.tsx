import { memo, startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import {
  buildFull,
  buildPairwise,
  buildSlice,
  componentStates,
  defaultValues,
  evaluate,
  finiteDomain,
  fullCellCount,
  showValue,
} from './schema.js';
import type { PairwiseResult } from './schema.js';
import { StoryFrame } from './StoryFrame.js';
import type {
  ComponentDefinition,
  Constraint,
  MatrixMode,
  MatrixView,
  PropDefinition,
  PropValue,
  StoryContext,
  Values,
  WorkbenchTheme,
} from './types.js';
import { ViewSettings } from './ViewSettings.js';
import './matrix.css';

const FULL_LIMIT = 64;
const AXES = ['rows', 'cols', 'group'] as const;
const AXIS_LABELS = { rows: 'Rows', cols: 'Columns', group: 'Group' };
const MODES = { slice: 'Slice', pairwise: 'Pairwise', full: 'Full' } as const;

type Axis = (typeof AXES)[number];
type Axes = Partial<Record<Axis, string>>;

interface MatrixProps {
  readonly component: ComponentDefinition;
  readonly slice: string | undefined;
  readonly mode: MatrixMode;
  readonly raw: boolean;
  readonly freeze?: boolean;
  readonly themes: readonly WorkbenchTheme[];
  readonly header?: ReactNode;
  readonly onSliceChange: (slice: string) => void;
  readonly onModeChange: (mode: MatrixMode) => void;
  readonly renderArtboards: (render: (theme: WorkbenchTheme) => ReactNode) => ReactNode;
  readonly renderSubject: (
    theme: WorkbenchTheme,
    values: Values,
    identity: string,
    sample?: Pick<MatrixView, 'surface' | 'overlayStage'>,
    story?: StoryContext,
  ) => ReactNode;
}

interface MatrixViewProps extends MatrixProps {
  readonly views: readonly MatrixView[];
  readonly view: MatrixView | undefined;
}

interface PairwiseRequest {
  readonly component: ComponentDefinition;
  readonly fixed: Values;
}

function usePairwise(request: PairwiseRequest | undefined) {
  const [settled, setSettled] = useState<{
    request: PairwiseRequest;
    result: PairwiseResult;
  }>();
  useEffect(() => {
    if (!request) {
      return;
    }

    const { component, fixed } = request;
    const search = buildPairwise(component.props, component.constraints, fixed);
    let timer: number;
    const step = (): void => {
      const deadline = performance.now() + 6;
      do {
        const outcome = search.next();
        if (outcome.done) {
          startTransition(() => {
            setSettled({ request, result: outcome.value });
          });
          return;
        }
      } while (performance.now() < deadline);
      timer = window.setTimeout(step, 0);
    };
    timer = window.setTimeout(step, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [request]);
  return settled?.request === request ? settled?.result : undefined;
}

interface ValuePickerProps {
  readonly name: string;
  readonly prop: PropDefinition;
  readonly mode: MatrixMode;
  readonly override: PropValue | undefined;
  readonly value: PropValue;
  readonly onChange: (value: PropValue | undefined) => void;
}

function ValuePicker({
  name,
  prop,
  mode,
  override,
  value,
  onChange,
}: ValuePickerProps): ReactElement {
  const examples = finiteDomain(prop);
  const domain =
    override !== undefined && examples.length > 0 && !examples.includes(override)
      ? [...examples, override]
      : examples;
  const label = prop.label ?? name;
  const choice = domain.findIndex((entry) => entry === override);

  return (
    <label className="wb-matrix-field" title={prop.description}>
      {label}
      {domain.length > 0 ? (
        <select
          className="wb-field"
          value={choice < 0 ? '' : String(choice)}
          onChange={(event) => {
            const input = event.currentTarget.value;
            onChange(input === '' ? undefined : domain[Number(input)]);
          }}
        >
          <option value="">
            {mode === 'slice' ? 'Default (' + showValue(prop, value) + ')' : 'Any value'}
          </option>
          {domain.map((entry, index) => (
            <option key={String(entry)} value={String(index)}>
              {showValue(prop, entry)}
            </option>
          ))}
        </select>
      ) : (
        <input
          className="wb-field"
          type={prop.kind === 'number' ? 'number' : 'text'}
          step={prop.kind === 'number' ? 'any' : undefined}
          value={String(override ?? value)}
          onChange={(event) => {
            const input = event.currentTarget;
            onChange(
              prop.kind === 'number'
                ? Number.isFinite(input.valueAsNumber)
                  ? input.valueAsNumber
                  : undefined
                : input.value,
            );
          }}
        />
      )}
    </label>
  );
}

const MatrixSample = memo(function MatrixSample({
  component,
  theme,
  assignment,
  identity,
  view,
  story,
  renderSubject,
}: Pick<MatrixViewProps, 'component' | 'view' | 'renderSubject'> & {
  readonly theme: WorkbenchTheme;
  readonly assignment: Values;
  readonly identity: string;
  readonly story?: StoryContext | undefined;
}): ReactElement {
  const decision = evaluate(component.constraints, assignment);
  return (
    <>
      {decision.valid && renderSubject(theme, assignment, identity, view, story)}
      <RuleNotes rules={decision.matches} />
    </>
  );
});

export function RuleNotes({
  rules,
}: {
  readonly rules: readonly Constraint[];
}): ReactElement | null {
  if (rules.length === 0) {
    return null;
  }
  const kinds = new Set(rules.map((rule) => rule.kind));
  const labels = [
    kinds.has('forbidden') ? 'N/A' : '',
    kinds.has('ignored') ? 'Ignored' : '',
    kinds.has('precedence') ? 'Precedence' : '',
  ].filter(Boolean);

  return (
    <details className="wb-matrix-notes">
      <summary className="wb-disclosure" title={rules.map((rule) => rule.reason).join('\n')}>
        {labels.join(' · ')}
      </summary>
      <ul>
        {rules.map((rule, index) => (
          <li key={index}>{rule.reason}</li>
        ))}
      </ul>
    </details>
  );
}

export interface SliceGridProps {
  readonly grid: ReturnType<typeof buildSlice>;
  readonly rowLimit: number;
  readonly axes: Axes;
  readonly labelProp: (key: string) => string;
  readonly labelValue: (key: string | undefined, value: PropValue | undefined) => string;
  readonly renderSample: (values: Values, id: string) => ReactNode;
}

export function SliceGrid({
  grid,
  rowLimit,
  axes,
  labelProp,
  labelValue,
  renderSample,
}: SliceGridProps): ReactElement {
  const axisLabels = [axes.rows, axes.cols].flatMap((key) => (key ? [labelProp(key)] : []));
  return (
    <>
      {grid.groups.map((group, groupIndex) => {
        const rowsPerGroup = group.rows.length;
        const remaining = rowLimit - groupIndex * rowsPerGroup;
        if (remaining <= 0) {
          return null;
        }
        const groupLabel =
          axes.group === undefined
            ? undefined
            : labelProp(axes.group) + ': ' + labelValue(axes.group, group.value);
        const tableLabel = [groupLabel, ...axisLabels].filter(Boolean).join(' × ');
        return (
          <div
            key={groupIndex}
            className="wb-matrix-group"
            data-wb-result-row={axisLabels.length === 0 ? '' : undefined}
          >
            {groupLabel && <h3 className="wb-matrix-group-label">{groupLabel}</h3>}
            {axisLabels.length === 0 ? (
              renderSample(group.rows[0]!.cells[0]!, 'group-' + String(groupIndex))
            ) : (
              <div
                className="wb-matrix-scroll wb-scroll"
                role="region"
                aria-label={tableLabel}
                tabIndex={0}
              >
                <table className="wb-matrix-grid" aria-label={tableLabel}>
                  {axes.cols !== undefined && (
                    <thead>
                      <tr>
                        {axes.rows !== undefined && <th scope="col">{labelProp(axes.rows)}</th>}
                        {grid.columns.map((column, columnIndex) => (
                          <th key={columnIndex} scope="col">
                            {labelValue(axes.cols, column)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {group.rows.slice(0, remaining).map((row, rowIndex) => (
                      <tr key={rowIndex} data-wb-result-row="">
                        {axes.rows !== undefined && (
                          <th scope="row">{labelValue(axes.rows, row.value)}</th>
                        )}
                        {row.cells.map((assignment, columnIndex) => (
                          <td key={columnIndex}>
                            {renderSample(
                              assignment,
                              JSON.stringify([
                                axes,
                                group.value,
                                row.value,
                                grid.columns[columnIndex],
                              ]),
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// Keep a keyboard action for tall rows and for browsers without an observer.
function MoreRows({
  visible,
  total,
  onMore,
}: {
  readonly visible: number;
  readonly total: number;
  readonly onMore: () => void;
}): ReactElement {
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!button.current || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (
        !document.activeElement?.hasAttribute('data-wb-more-rows') &&
        entries.some((entry) => entry.isIntersecting)
      ) {
        onMore();
      }
    });
    observer.observe(button.current);
    return () => observer.disconnect();
  }, [onMore]);

  return (
    <button
      type="button"
      ref={button}
      data-wb-more-rows=""
      className="wb-action-btn"
      onClick={(event) => {
        const board = event.currentTarget.parentElement;
        onMore();
        if (event.detail === 0 && board) {
          // Continue keyboard inspection at the first appended row, including the last batch.
          requestAnimationFrame(() => {
            const first = board.querySelectorAll<HTMLElement>('[data-wb-result-row]')[visible];
            if (first) {
              first.tabIndex = -1;
              first.focus();
            }
          });
        }
      }}
    >
      Show more rows ({visible} of {total})
    </button>
  );
}

export function Matrix(props: MatrixProps): ReactElement {
  const views = componentStates(props.component);
  const view = views.find((candidate) => candidate.id === props.slice) ?? views[0];
  return <MatrixContent key={props.component.id} {...props} views={views} view={view} />;
}

function MatrixContent({
  component,
  views,
  view,
  mode,
  raw,
  freeze = false,
  themes,
  header,
  onSliceChange,
  onModeChange,
  renderArtboards,
  renderSubject,
}: MatrixViewProps): ReactElement {
  const { props } = component;
  const themeCount = themes.length;
  const defaults = useMemo(() => defaultValues(props), [props]);
  const finiteKeys = useMemo(
    () => Object.keys(props).filter((key) => finiteDomain(props[key]!).length > 0),
    [props],
  );
  const initialAxes: Axes = view
    ? {
        ...(view.rows === undefined ? {} : { rows: view.rows }),
        ...(view.cols === undefined ? {} : { cols: view.cols }),
        ...(view.group === undefined ? {} : { group: view.group }),
      }
    : {
        ...(finiteKeys[0] === undefined ? {} : { rows: finiteKeys[0] }),
        ...(finiteKeys[1] === undefined ? {} : { cols: finiteKeys[1] }),
      };
  const [axes, setAxes] = useState<Axes>(initialAxes);
  const [overridesOpen, setOverridesOpen] = useState(false);
  const [fixed, setFixed] = useState<Values>(() => ({ ...view?.fixed }));
  const [matrixRevision, setMatrixRevision] = useState(0);
  const [previousView, setPreviousView] = useState(view);
  if (view !== previousView) {
    setPreviousView(view);
    setAxes(initialAxes);
    setFixed({ ...view?.fixed });
  }
  const values = useMemo(() => ({ ...defaults, ...fixed }), [defaults, fixed]);
  const cellCount = fullCellCount(props, fixed, themeCount, FULL_LIMIT);
  const fullAvailable = cellCount <= FULL_LIMIT;
  const modeShown = mode === 'full' && !fullAvailable ? 'slice' : mode;
  const hasThemes = themeCount > 0;

  useEffect(() => {
    if (!raw && mode === 'full' && !fullAvailable) {
      onModeChange('slice');
    }
  }, [fullAvailable, mode, onModeChange, raw]);

  const request = useMemo(
    () => (hasThemes && modeShown === 'pairwise' ? { component, fixed } : undefined),
    [component, fixed, hasThemes, modeShown],
  );
  const audit = usePairwise(request);
  const pending = request !== undefined && audit === undefined;
  const grid = useMemo(
    () => (modeShown === 'slice' ? buildSlice(props, values, axes) : undefined),
    [axes, modeShown, props, values],
  );
  const cartesian = useMemo(
    () => (hasThemes && modeShown === 'full' ? Array.from(buildFull(props, fixed)) : undefined),
    [fixed, hasThemes, modeShown, props],
  );
  const renderedAssignments = audit?.rows ?? cartesian;
  const source = grid ?? renderedAssignments;
  const [revealed, setRevealed] = useState<{
    source: typeof source;
    themes: readonly WorkbenchTheme[];
    count: number;
  }>();
  if (revealed && (revealed.source !== source || revealed.themes !== themes)) {
    // Isolating an existing board preserves its rows. Newly added themes start with one batch.
    const onlyRemovedThemes = themes.every((theme) => revealed.themes.includes(theme));
    setRevealed(
      revealed.source === source && onlyRemovedThemes ? { ...revealed, themes } : undefined,
    );
  }
  const rowCount = grid
    ? grid.groups.length * (grid.groups[0]?.rows.length ?? 0)
    : (renderedAssignments?.length ?? 0);
  const cellsPerRow = Math.max(1, themeCount * (grid?.columns.length ?? 1));
  const batch = Math.max(1, Math.floor(2 / cellsPerRow));
  // Full is already bounded. Frozen captures include offscreen rows.
  const eager =
    raw || freeze || modeShown === 'full' || (rowCount <= 4 && rowCount * cellsPerRow <= 8);
  const visible = eager ? rowCount : Math.min(rowCount, revealed?.count ?? batch);
  const showMore = useCallback(() => {
    setRevealed({ source, themes, count: visible + batch });
  }, [source, themes, visible, batch]);
  const varyingKeys = finiteKeys.filter((key) => !Object.hasOwn(fixed, key));
  const overrideKeys = Object.keys(props).filter(
    (key) =>
      props[key]!.kind !== 'action' &&
      (modeShown !== 'slice' || !Object.values(axes).includes(key)),
  );

  const labelProp = (key: string): string => props[key]!.label ?? key;
  const labelValue = (key: string | undefined, value: PropValue | undefined): string =>
    key === undefined || value === undefined ? '' : showValue(props[key], value);

  const sample = (
    theme: WorkbenchTheme,
    assignment: Values,
    id: string,
    story?: StoryContext,
  ): ReactNode => (
    <MatrixSample
      key={JSON.stringify([id, assignment])}
      component={component}
      theme={theme}
      assignment={assignment}
      identity={id}
      view={view}
      story={story}
      renderSubject={renderSubject}
    />
  );

  function reset(): void {
    setAxes(initialAxes);
    setFixed({ ...view?.fixed });
    setMatrixRevision((previous) => previous + 1);
  }

  function fixValue(key: string, value: PropValue | undefined): void {
    if (value !== undefined && Object.values(axes).includes(key)) {
      setAxes(Object.fromEntries(Object.entries(axes).filter(([, prop]) => prop !== key)));
    }
    setFixed((previous) => {
      const next = { ...previous };
      if (value === undefined) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  }

  const renderBoards = (story?: StoryContext): ReactNode =>
    renderArtboards((theme) => (
      <div className="wb-matrix-artboard">
        {grid && (
          <SliceGrid
            grid={grid}
            rowLimit={visible}
            axes={axes}
            labelProp={labelProp}
            labelValue={labelValue}
            renderSample={(values, identity) => sample(theme, values, identity, story)}
          />
        )}
        {renderedAssignments && renderedAssignments.length > 0 && (
          <ul className="wb-matrix-combinations">
            {renderedAssignments.slice(0, visible).map((assignment, index) => (
              <li
                key={JSON.stringify(assignment)}
                className="wb-matrix-combination"
                data-wb-result-row=""
              >
                <dl className="wb-matrix-coordinate">
                  {varyingKeys.map((key) => (
                    <div key={key}>
                      <dt>{labelProp(key)}</dt>
                      <dd>{labelValue(key, assignment[key])}</dd>
                    </div>
                  ))}
                </dl>
                {sample(theme, assignment, 'combination-' + String(index), story)}
              </li>
            ))}
          </ul>
        )}
        {visible < rowCount && <MoreRows visible={visible} total={rowCount} onMore={showMore} />}
      </div>
    ));

  return (
    <section className="wb-matrix" aria-label="Component matrix" data-wb-matrix-mode={modeShown}>
      {!raw && (
        <ViewSettings>
          <>
            {header}
            <section className="wb-matrix-controls" aria-label="Matrix settings">
              <div className="wb-matrix-toolbar">
                {views.length > 0 && (
                  <label className="wb-matrix-field">
                    Slice
                    <select
                      className="wb-field"
                      value={view?.id ?? ''}
                      onChange={(event) => {
                        onSliceChange(event.currentTarget.value);
                      }}
                    >
                      {views.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.title}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {finiteKeys.length > 0 &&
                  modeShown === 'slice' &&
                  AXES.map((axis) => (
                    <label key={axis} className="wb-matrix-field">
                      {AXIS_LABELS[axis]}
                      <select
                        className="wb-field"
                        value={axes[axis] ?? ''}
                        onChange={(event) => {
                          const key = event.currentTarget.value;
                          if (key && Object.hasOwn(fixed, key)) {
                            fixValue(key, undefined);
                          }
                          setAxes((previous) => {
                            const next = { ...previous };
                            if (key === '') {
                              delete next[axis];
                            } else {
                              next[axis] = key;
                            }
                            return next;
                          });
                        }}
                      >
                        <option value="">None</option>
                        {finiteKeys.map((key) => (
                          <option
                            key={key}
                            value={key}
                            disabled={axes[axis] !== key && Object.values(axes).includes(key)}
                          >
                            {labelProp(key)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                <div role="group" className="wb-seg" aria-label="Matrix mode">
                  {(Object.keys(MODES) as MatrixMode[]).map((candidate) => (
                    <button
                      type="button"
                      className="wb-seg-btn"
                      key={candidate}
                      aria-pressed={candidate === modeShown}
                      data-active={candidate === modeShown}
                      disabled={candidate === 'full' && !fullAvailable}
                      onClick={() => {
                        onModeChange(candidate);
                      }}
                    >
                      {MODES[candidate]}
                    </button>
                  ))}
                </div>
                <button type="button" className="wb-action-btn" onClick={reset}>
                  Reset matrix
                </button>
              </div>
              {overrideKeys.length > 0 && (
                <details
                  className="wb-matrix-overrides"
                  open={overridesOpen}
                  onToggle={(event) => setOverridesOpen(event.currentTarget.open)}
                >
                  <summary className="wb-disclosure">Global values</summary>
                  <div className="wb-matrix-toolbar">
                    {overrideKeys.map((key) => (
                      <ValuePicker
                        key={key}
                        name={key}
                        prop={props[key]!}
                        mode={modeShown}
                        override={fixed[key]}
                        value={defaults[key]!}
                        onChange={(value) => {
                          fixValue(key, value);
                        }}
                      />
                    ))}
                  </div>
                </details>
              )}
            </section>
          </>
        </ViewSettings>
      )}

      {!fullAvailable && (!raw || mode === 'full') && (
        <p className="wb-matrix-status" role="status">
          Full exceeds {FULL_LIMIT} cells across the selected themes. Fix more values or select
          fewer themes.
        </p>
      )}
      {pending && (
        <p className="wb-matrix-status" role="status" data-wb-pending="">
          Calculating pairwise coverage…
        </p>
      )}
      {audit && (
        <p className="wb-matrix-status" role="status">
          {audit.rows.length === 0
            ? 'No valid combinations for the fixed values. Edit global values or reset the matrix.'
            : audit.total === 0
              ? 'No pairs to cover · ' + String(audit.rows.length) + ' combinations'
              : String(audit.covered) +
                ' / ' +
                String(audit.total) +
                ' compatible pairs · ' +
                String(audit.rows.length) +
                ' combinations'}
        </p>
      )}
      {cartesian && (
        <p className="wb-matrix-status">
          {cartesian.length} combinations · {cellCount} theme cells
        </p>
      )}

      {modeShown === 'slice' && view ? (
        <StoryFrame
          key={view.id}
          title={view.title}
          headingLevel="h2"
          caption={view.caption}
          dataSlice={view.id}
          controls={view.controls}
          actions={view.actions}
          reset={view.reset}
          externalRevision={matrixRevision}
          raw={raw}
        >
          {(story) => renderBoards(story)}
        </StoryFrame>
      ) : (
        <div>{renderBoards()}</div>
      )}
    </section>
  );
}
