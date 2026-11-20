import { Fragment, startTransition, useEffect, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import {
  buildFull,
  buildPairwise,
  buildSlice,
  defaultValues,
  evaluate,
  finiteDomain,
  fullCellCount,
  showValue,
} from './schema.js';
import type { PairwiseResult } from './schema.js';
import type {
  ComponentDefinition,
  Constraint,
  MatrixMode,
  MatrixView,
  PropDefinition,
  PropValue,
  Values,
  WorkbenchTheme,
} from './types.js';
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
  readonly themeCount: number;
  readonly onSliceChange: (slice: string) => void;
  readonly onModeChange: (mode: MatrixMode) => void;
  readonly renderArtboards: (render: (theme: WorkbenchTheme) => ReactNode) => ReactNode;
  readonly renderSubject: (
    theme: WorkbenchTheme,
    values: Values,
    identity: string,
    sample?: Pick<MatrixView, 'surface' | 'overlayStage'>,
  ) => ReactNode;
  readonly renderReference: (theme: WorkbenchTheme, view: MatrixView) => ReactNode;
}

interface MatrixViewProps extends MatrixProps {
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

function RuleNotes({ rules }: { readonly rules: readonly Constraint[] }): ReactElement | null {
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

interface SliceGridProps {
  readonly grid: ReturnType<typeof buildSlice>;
  readonly axes: Axes;
  readonly labelProp: (key: string) => string;
  readonly labelValue: (key: string | undefined, value: PropValue | undefined) => string;
  readonly renderSample: (values: Values, id: string) => ReactNode;
}

function SliceGrid({
  grid,
  axes,
  labelProp,
  labelValue,
  renderSample,
}: SliceGridProps): ReactElement {
  const axisLabels = [axes.rows, axes.cols].flatMap((key) => (key ? [labelProp(key)] : []));
  return (
    <>
      {grid.groups.map((group, groupIndex) => {
        const groupLabel =
          axes.group === undefined
            ? undefined
            : labelProp(axes.group) + ': ' + labelValue(axes.group, group.value);
        const tableLabel = [groupLabel, ...axisLabels].filter(Boolean).join(' × ');
        return (
          <div key={groupIndex} className="wb-matrix-group">
            {groupLabel && <h3 className="wb-matrix-group-label">{groupLabel}</h3>}
            {axisLabels.length === 0 ? (
              renderSample(group.rows[0]!.cells[0]!, 'group-' + String(groupIndex))
            ) : (
              <div className="wb-matrix-scroll" role="region" aria-label={tableLabel} tabIndex={0}>
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
                    {group.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
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

export function Matrix(props: MatrixProps): ReactElement {
  const views = props.component.matrixViews;
  const view = views?.find((candidate) => candidate.id === props.slice) ?? views?.[0];
  return (
    <MatrixContent key={JSON.stringify([props.component.id, view?.id])} {...props} view={view} />
  );
}

function MatrixContent({
  component,
  view,
  mode,
  raw,
  themeCount,
  onSliceChange,
  onModeChange,
  renderArtboards,
  renderSubject,
  renderReference,
}: MatrixViewProps): ReactElement {
  const { props } = component;
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
  const [fixed, setFixed] = useState<Values>(() => ({ ...view?.fixed }));
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
  const varyingKeys = finiteKeys.filter((key) => !Object.hasOwn(fixed, key));
  const overrideKeys = Object.keys(props).filter(
    (key) =>
      props[key]!.kind !== 'action' &&
      (modeShown !== 'slice' || !Object.values(axes).includes(key)),
  );

  const labelProp = (key: string): string => props[key]!.label ?? key;
  const labelValue = (key: string | undefined, value: PropValue | undefined): string =>
    key === undefined || value === undefined ? '' : showValue(props[key], value);

  const sample = (theme: WorkbenchTheme, assignment: Values, id: string): ReactNode => {
    const decision = evaluate(component.constraints, assignment);
    return (
      <Fragment key={JSON.stringify([id, assignment])}>
        {decision.valid && renderSubject(theme, assignment, id, view)}
        <RuleNotes rules={decision.matches} />
      </Fragment>
    );
  };

  function reset(): void {
    setAxes(initialAxes);
    setFixed({ ...view?.fixed });
  }

  function fixValue(key: string, value: PropValue | undefined): void {
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

  return (
    <section className="wb-matrix" aria-label="Component matrix" data-wb-matrix-mode={modeShown}>
      {!raw && (
        <div className="wb-matrix-controls">
          <div className="wb-matrix-toolbar">
            {component.matrixViews && component.matrixViews.length > 0 && (
              <label className="wb-matrix-field">
                Slice
                <select
                  className="wb-field"
                  value={view?.id ?? ''}
                  onChange={(event) => {
                    onSliceChange(event.currentTarget.value);
                  }}
                >
                  {component.matrixViews.map((candidate) => (
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
            <details className="wb-matrix-overrides">
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
        </div>
      )}

      {(view?.title || view?.caption) && (
        <header className="wb-matrix-heading">
          <h2>{view.title}</h2>
          {view.caption && <p>{view.caption}</p>}
        </header>
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

      {renderArtboards((theme) => (
        <div className="wb-matrix-artboard">
          {grid && (
            <SliceGrid
              grid={grid}
              axes={axes}
              labelProp={labelProp}
              labelValue={labelValue}
              renderSample={(values, identity) => sample(theme, values, identity)}
            />
          )}
          {renderedAssignments && renderedAssignments.length > 0 && (
            <ul className="wb-matrix-combinations">
              {renderedAssignments.map((assignment, index) => (
                <li key={JSON.stringify(assignment)} className="wb-matrix-combination">
                  <dl className="wb-matrix-coordinate">
                    {varyingKeys.map((key) => (
                      <div key={key}>
                        <dt>{labelProp(key)}</dt>
                        <dd>{labelValue(key, assignment[key])}</dd>
                      </div>
                    ))}
                  </dl>
                  {sample(theme, assignment, 'combination-' + String(index))}
                </li>
              ))}
            </ul>
          )}
          {modeShown === 'slice' && view?.reference && (
            <div className="wb-matrix-reference">
              <h3 className="wb-matrix-group-label">Reference example</h3>
              {renderReference(theme, view)}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
