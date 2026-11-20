import type {
  ComponentDefinition,
  Constraint,
  PropDefinition,
  PropSchema,
  PropValue,
  Values,
  WorkbenchConfig,
} from './types.js';

export function finiteDomain(prop: PropDefinition): readonly PropValue[] {
  switch (prop.kind) {
    case 'enum':
    case 'slot':
      return prop.choices.map(({ value }) => value);
    case 'boolean':
      return [false, true];
    case 'string':
    case 'number':
      return prop.examples ?? [];
    case 'action':
      return [];
  }
}

export function defaultValues(props: PropSchema): Values {
  return Object.fromEntries(
    Object.entries(props).flatMap(([key, prop]) =>
      prop.kind === 'action' ? [] : [[key, prop.default]],
    ),
  );
}

export function showValue(prop: PropDefinition | undefined, value: PropValue): string {
  if (prop?.kind === 'enum' || prop?.kind === 'slot') {
    return prop.choices.find((choice) => choice.value === value)?.label ?? String(value);
  }
  return value === '' ? 'Empty' : String(value);
}

export function ruleAffects(rule: Constraint, key: string, value: PropValue | undefined): boolean {
  return rule.affects.some((target) =>
    typeof target === 'string' ? target === key : target.key === key && target.value === value,
  );
}

function matchesRule(rule: Constraint, values: Values): boolean {
  return (
    Object.entries(rule.when).every(([key, value]) => values[key] === value) &&
    rule.affects.some((target) => typeof target === 'string' || values[target.key] === target.value)
  );
}

export function evaluate(
  constraints: readonly Constraint[] | undefined,
  values: Values,
): { valid: boolean; matches: readonly Constraint[] } {
  const matches = (constraints ?? []).filter((rule) => matchesRule(rule, values));
  return { valid: matches.every(({ kind }) => kind !== 'forbidden'), matches };
}

export function componentCode(component: ComponentDefinition, values: Values): string {
  const props: string[] = [];
  for (const [key, prop] of Object.entries(component.props)) {
    if (prop.demo) {
      continue;
    }
    if (prop.kind === 'action') {
      props.push(`${key}={${prop.code}}`);
      continue;
    }
    const value = values[key];
    if (value === undefined || value === prop.default) {
      continue;
    }
    if (value === true) {
      props.push(key);
    } else if (prop.kind === 'slot') {
      const code = prop.choices.find((choice) => choice.value === value)?.code;
      props.push(`${key}={${code ?? JSON.stringify(value)}}`);
    } else if (typeof value === 'string' && !/["&<>\r\n]/.test(value)) {
      props.push(`${key}="${value}"`);
    } else {
      props.push(`${key}={${JSON.stringify(value)}}`);
    }
  }
  const attributes = props.length ? ` ${props.join(' ')}` : '';
  return (
    component.code?.(values, attributes) ??
    `<${component.componentName ?? component.title}${attributes} />`
  );
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Workbench: ${message}`);
  }
}

function distinct(values: readonly (string | number | boolean)[], label: string): void {
  const seen = new Set<PropValue>();
  for (const value of values) {
    assert(!seen.has(value), `${label} must be unique. Duplicate: ${String(value)}.`);
    seen.add(value);
  }
}

function validValue(
  prop: PropDefinition | undefined,
  value: PropValue,
  declaredOnly: boolean,
): boolean {
  switch (prop?.kind) {
    case 'enum':
    case 'slot':
      return finiteDomain(prop).includes(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'number':
      return (
        typeof value === 'number' &&
        Number.isFinite(value) &&
        (!declaredOnly || !prop.examples || prop.examples.includes(value))
      );
    case 'string':
      return (
        typeof value === 'string' &&
        (!declaredOnly || !prop.examples || prop.examples.includes(value))
      );
    default:
      return false;
  }
}

function ids(entries: readonly { id: string }[], label: string): void {
  for (const { id } of entries) {
    assert(/^[a-z0-9][a-z0-9-]*$/.test(id), `invalid ${label} ID "${id}".`);
  }
  distinct(
    entries.map(({ id }) => id),
    `${label} IDs`,
  );
}

export function validateComponent(component: ComponentDefinition): void {
  const prefix = `"${component.id}"`;
  const { props, constraints, cases = [], usage = [], matrixViews = [] } = component;
  for (const [key, prop] of Object.entries(props)) {
    assert(
      /^[a-z][a-zA-Z0-9]*(?:-[a-zA-Z0-9]+)*$/.test(key),
      `${prefix} has invalid prop key "${key}".`,
    );
    assert(
      prop.description.trim() && prop.group.trim(),
      `${prefix} prop "${key}" needs a group and description.`,
    );
    const domain = finiteDomain(prop);
    distinct(domain, `${prefix} "${key}" values`);
    if (prop.kind !== 'action') {
      assert(
        validValue(prop, prop.default, true),
        `${prefix} prop "${key}" has a default outside its domain.`,
      );
      assert(
        domain.every((value) => validValue(prop, value, false)),
        `${prefix} prop "${key}" has an invalid choice.`,
      );
    }
  }

  for (const [index, rule] of (constraints ?? []).entries()) {
    const label = `${prefix} rule ${String(index + 1)}`;
    assert(
      rule.reason.trim() && rule.affects.length,
      `${label} needs a reason and affected props.`,
    );
    for (const [key, value] of Object.entries(rule.when)) {
      assert(
        Object.hasOwn(props, key) && validValue(props[key], value, true),
        `${label} has an invalid condition for "${key}".`,
      );
    }
    for (const target of rule.affects) {
      const key = typeof target === 'string' ? target : target.key;
      const prop = Object.hasOwn(props, key) ? props[key] : undefined;
      assert(prop && prop.kind !== 'action', `${label} affects unknown value prop "${key}".`);
      if (typeof target !== 'string') {
        assert(validValue(prop, target.value, true), `${label} has an invalid value for "${key}".`);
      }
    }
  }

  const initial = evaluate(constraints, defaultValues(props));
  assert(
    initial.valid,
    `${prefix} defaults are forbidden. ${initial.matches
      .filter(({ kind }) => kind === 'forbidden')
      .map(({ reason }) => reason)
      .join(' ')}`,
  );

  ids(cases, `${prefix} case`);
  ids(usage, `${prefix} usage`);
  ids(matrixViews, `${prefix} slice`);
  for (const view of matrixViews) {
    const label = `${prefix} slice "${view.id}"`;
    const axes = [view.rows, view.cols, view.group].filter((key) => key !== undefined);
    distinct(axes, `${label} axes`);
    for (const key of axes) {
      const prop = Object.hasOwn(props, key) ? props[key] : undefined;
      assert(prop && finiteDomain(prop).length, `${label} has an invalid axis "${key}".`);
    }
    for (const [key, value] of Object.entries(view.fixed ?? {})) {
      assert(
        Object.hasOwn(props, key) && validValue(props[key], value, false) && !axes.includes(key),
        `${label} has an invalid fixed value for "${key}".`,
      );
    }
  }
}

export function validateCatalog(config: WorkbenchConfig): void {
  ids([...config.components, ...config.scenes], 'item');
  const itemIds = new Set(config.components.map(({ id }) => id));
  distinct(config.categories, 'categories');
  distinct(
    config.themes.map(({ id }) => id),
    'theme IDs',
  );
  const familyLabels = new Map<string, string>();
  for (const theme of config.themes) {
    assert(
      theme.family !== 'all' && theme.family.trim(),
      `theme "${theme.id}" needs a family key other than "all".`,
    );
    const previousLabel = familyLabels.get(theme.family);
    assert(
      previousLabel === undefined || previousLabel === theme.familyLabel,
      `theme "${theme.id}" disagrees with the label for family "${theme.family}".`,
    );
    familyLabels.set(theme.family, theme.familyLabel);
  }
  distinct(
    config.themes.map(({ family, colorScheme }) => JSON.stringify([family, colorScheme])),
    'theme family and scheme combinations',
  );
  for (const component of config.components) {
    assert(
      config.categories.includes(component.category),
      `"${component.id}" uses unregistered category "${component.category}".`,
    );
    validateComponent(component);
  }
  for (const scene of config.scenes) {
    distinct(scene.uses ?? [], `"${scene.id}" scene references`);
    for (const id of scene.uses ?? []) {
      assert(itemIds.has(id), `"${scene.id}" references missing component "${id}".`);
    }
  }
}

interface Axis {
  readonly key: string;
  readonly values: readonly PropValue[];
}

function variableAxes(props: PropSchema, fixed: Values): readonly Axis[] {
  return Object.entries(props).flatMap(([key, prop]) => {
    const values = Object.hasOwn(fixed, key) ? [] : finiteDomain(prop);
    return values.length ? [{ key, values }] : [];
  });
}

function assignmentBase(props: PropSchema, fixed: Values, axes: readonly Axis[]): Values {
  const values = { ...defaultValues(props), ...fixed };
  for (const { key } of axes) {
    delete values[key];
  }
  return values;
}

export function buildSlice(
  props: PropSchema,
  values: Values,
  { rows, cols, group }: { rows?: string; cols?: string; group?: string },
): {
  columns: readonly (PropValue | undefined)[];
  groups: readonly {
    value: PropValue | undefined;
    rows: readonly { value: PropValue | undefined; cells: readonly Values[] }[];
  }[];
} {
  const domain = (key: string | undefined): readonly (PropValue | undefined)[] => {
    const prop = key === undefined ? undefined : props[key];
    return prop ? finiteDomain(prop) : [undefined];
  };
  const columns = domain(cols);
  return {
    columns,
    groups: domain(group).map((groupValue) => ({
      value: groupValue,
      rows: domain(rows).map((rowValue) => ({
        value: rowValue,
        cells: columns.map((colValue) => ({
          ...values,
          ...(group !== undefined && groupValue !== undefined && { [group]: groupValue }),
          ...(rows !== undefined && rowValue !== undefined && { [rows]: rowValue }),
          ...(cols !== undefined && colValue !== undefined && { [cols]: colValue }),
        })),
      })),
    })),
  };
}

export function fullCellCount(
  props: PropSchema,
  fixed: Values,
  themeCount: number,
  limit = 64,
): number {
  let count = themeCount;
  for (const { values } of variableAxes(props, fixed)) {
    count *= values.length;
    if (count > limit) {
      return limit + 1;
    }
  }
  return Math.min(count, limit + 1);
}

export function* buildFull(props: PropSchema, fixed: Values): Generator<Values> {
  const axes = variableAxes(props, fixed);
  const current = { ...assignmentBase(props, fixed, axes) };
  function* explore(index: number): Generator<Values> {
    const axis = axes[index];
    if (!axis) {
      yield { ...current };
      return;
    }
    for (const value of axis.values) {
      current[axis.key] = value;
      yield* explore(index + 1);
    }
  }
  yield* explore(0);
}

export interface PairwiseResult {
  readonly rows: Values[];
  readonly covered: number;
  readonly total: number;
}

interface Coordinate {
  readonly axis: number;
  readonly choice: number;
}

function pairKey(left: Coordinate, right: Coordinate): string {
  if (left.axis > right.axis) {
    return pairKey(right, left);
  }
  return `${left.axis}:${left.choice}|${right.axis}:${right.choice}`;
}

export function* buildPairwise(
  props: PropSchema,
  constraints: readonly Constraint[] | undefined,
  fixed: Values,
): Generator<void, PairwiseResult> {
  const axes = variableAxes(props, fixed);
  const base = assignmentBase(props, fixed, axes);
  const forbidden = (constraints ?? []).filter(({ kind }) => kind === 'forbidden');
  const isValid = (values: Values): boolean => !forbidden.some((rule) => matchesRule(rule, values));
  const rows: Values[] = [];
  const result = (pairs: number): PairwiseResult => ({ rows, covered: pairs, total: pairs });

  if (axes.length < 2) {
    for (const values of buildFull(props, fixed)) {
      if (isValid(values)) {
        rows.push(values);
      }
      yield;
    }
    return result(0);
  }

  // A pair becomes an obligation only after a complete, valid assignment witnesses it.
  // Search from a pair and prune forbidden partial assignments before growing the row.
  const covered = new Set<string>();
  const assigned = new Map<number, Coordinate>();
  let current = { ...base };
  let steps = 0;
  const shouldYield = (): boolean => ++steps % 256 === 0;
  const set = (coordinate: Coordinate): void => {
    const axis = axes[coordinate.axis]!;
    assigned.set(coordinate.axis, coordinate);
    current[axis.key] = axis.values[coordinate.choice]!;
  };

  function* complete(index: number): Generator<void, boolean> {
    if (shouldYield()) {
      yield;
    }
    if (!isValid(current)) {
      return false;
    }
    const axis = axes[index];
    if (!axis) {
      return true;
    }
    if (assigned.has(index)) {
      return yield* complete(index + 1);
    }
    const options: { coordinate: Coordinate; uncovered: number }[] = [];
    for (const [choice] of axis.values.entries()) {
      const coordinate = { axis: index, choice };
      let uncovered = 0;
      for (const existing of assigned.values()) {
        if (!covered.has(pairKey(existing, coordinate))) {
          uncovered += 1;
        }
      }
      options.push({ coordinate, uncovered });
      if (shouldYield()) {
        yield;
      }
    }
    options.sort((a, b) => b.uncovered - a.uncovered);
    for (const { coordinate } of options) {
      set(coordinate);
      if (yield* complete(index + 1)) {
        return true;
      }
      assigned.delete(index);
      delete current[axis.key];
    }
    return false;
  }

  for (const [left, axis] of axes.entries()) {
    for (let right = left + 1; right < axes.length; right += 1) {
      for (const [a] of axis.values.entries()) {
        for (const [b] of axes[right]!.values.entries()) {
          if (shouldYield()) {
            yield;
          }
          const first = { axis: left, choice: a };
          const second = { axis: right, choice: b };
          if (covered.has(pairKey(first, second))) {
            continue;
          }
          current = { ...base };
          assigned.clear();
          set(first);
          set(second);
          if (yield* complete(0)) {
            rows.push({ ...current });
            for (const x of assigned.values()) {
              for (const y of assigned.values()) {
                if (x.axis < y.axis) {
                  covered.add(pairKey(x, y));
                }
              }
            }
          }
        }
      }
    }
  }
  return result(covered.size);
}
