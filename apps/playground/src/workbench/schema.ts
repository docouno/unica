import type {
  ComponentDefinition,
  CompositionBlock,
  Constraint,
  MatrixView,
  PropDefinition,
  PropSchema,
  PropValue,
  StoryFrameOptions,
  Values,
  WorkbenchConfig,
} from './types.js';

export function componentStates(component: ComponentDefinition): readonly MatrixView[] {
  return component.states ?? [];
}

export function componentCompositions(component: ComponentDefinition): readonly CompositionBlock[] {
  return component.compositions ?? [];
}

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

function jsxChildText(text: string): string {
  return /[{}<>]/.test(text) ? `{${JSON.stringify(text)}}` : text;
}

function formatPropAttribute(key: string, value: PropValue): string {
  if (value === true) {
    return key;
  }
  if (typeof value === 'string' && !/["&<>\r\n]/.test(value)) {
    return `${key}="${value}"`;
  }
  return `${key}={${JSON.stringify(value)}}`;
}

export function componentCode(component: ComponentDefinition, values: Values): string {
  const props: string[] = [];
  let childBody: string | undefined;
  let defaultPropChildBody: string | undefined;
  const customCode = component.code !== undefined;
  const hasChildrenProp = Object.hasOwn(component.props, 'children');

  if (!customCode && component.defaultProps) {
    for (const [key, value] of Object.entries(component.defaultProps)) {
      if (Object.hasOwn(component.props, key)) {
        continue;
      }
      if (key === 'children') {
        if (typeof value === 'string' && value.length > 0) {
          defaultPropChildBody = jsxChildText(value);
        } else if (typeof value === 'number') {
          defaultPropChildBody = `{${String(value)}}`;
        }
        continue;
      }
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        props.push(formatPropAttribute(key, value));
      }
    }
  }

  for (const [key, prop] of Object.entries(component.props)) {
    if (prop.demo) {
      continue;
    }
    if (prop.kind === 'action') {
      props.push(`${key}={${prop.code}}`);
      continue;
    }
    const value = values[key];
    if (!customCode && key === 'children') {
      if (prop.kind === 'slot') {
        const slotCode = prop.choices.find((choice) => choice.value === value)?.code;
        childBody = slotCode
          ? slotCode.trim().startsWith('<')
            ? slotCode
            : `{${slotCode}}`
          : undefined;
      } else if (typeof value === 'string') {
        childBody = value.length > 0 ? jsxChildText(value) : undefined;
      } else if (typeof value === 'number') {
        childBody = `{${String(value)}}`;
      }
      continue;
    }
    if (value === undefined || value === prop.default) {
      continue;
    }
    if (prop.kind === 'enum' && prop.choices.find((choice) => choice.value === value)?.omit) {
      continue;
    }
    if (prop.kind === 'slot') {
      const code = prop.choices.find((choice) => choice.value === value)?.code;
      props.push(`${key}={${code ?? JSON.stringify(value)}}`);
    } else {
      props.push(formatPropAttribute(key, value));
    }
  }

  const attributes = props.length ? ` ${props.join(' ')}` : '';
  if (component.code) {
    return component.code(values, attributes);
  }
  const tag = component.componentName ?? component.title;
  const fallbackChildBody =
    typeof component.defaultChildren === 'string' && component.defaultChildren.length > 0
      ? jsxChildText(component.defaultChildren)
      : typeof component.defaultChildren === 'number'
        ? `{${String(component.defaultChildren)}}`
        : defaultPropChildBody;
  const body = hasChildrenProp ? childBody : fallbackChildBody;
  if (body !== undefined && body.length > 0) {
    return `<${tag}${attributes}>${body}</${tag}>`;
  }
  return `<${tag}${attributes} />`;
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

function validateStoryFrameOptions(options: StoryFrameOptions, label: string): void {
  if (options.controls) {
    for (const [key, control] of Object.entries(options.controls)) {
      assert(key.trim().length > 0, `${label} control key must not be empty.`);
      assert(control.label.trim().length > 0, `${label} control "${key}" needs a label.`);
      if (control.kind === 'enum') {
        const values = control.choices.map((choice) =>
          typeof choice === 'string' ? choice : choice.value,
        );
        assert(values.length > 0, `${label} control "${key}" needs at least one choice.`);
        distinct(values, `${label} "${key}" choices`);
        assert(
          values.includes(control.default),
          `${label} control "${key}" has a default outside its choices.`,
        );
      } else if (control.kind === 'number') {
        assert(
          Number.isFinite(control.default),
          `${label} control "${key}" default must be a finite number.`,
        );
        if (control.min !== undefined) {
          assert(
            Number.isFinite(control.min),
            `${label} control "${key}" min must be a finite number.`,
          );
          assert(control.default >= control.min, `${label} control "${key}" default is below min.`);
        }
        if (control.max !== undefined) {
          assert(
            Number.isFinite(control.max),
            `${label} control "${key}" max must be a finite number.`,
          );
          assert(control.default <= control.max, `${label} control "${key}" default exceeds max.`);
        }
        if (control.min !== undefined && control.max !== undefined) {
          assert(control.min <= control.max, `${label} control "${key}" min exceeds max.`);
        }
        if (control.step !== undefined) {
          assert(
            Number.isFinite(control.step) && control.step > 0,
            `${label} control "${key}" step must be a positive finite number.`,
          );
        }
      }
    }
  }
  if (options.actions) {
    ids(options.actions, `${label} action`);
    for (const action of options.actions) {
      assert(action.label.trim().length > 0, `${label} action "${action.id}" needs a label.`);
    }
  }
}

export function validateComponent(component: ComponentDefinition): void {
  const prefix = `"${component.id}"`;
  const { props, constraints, cases = [] } = component;
  const slices = componentStates(component);
  const compositions = componentCompositions(component);

  assert(typeof component.render === 'function', `${prefix} needs a render function or component.`);

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
  for (const item of cases) {
    validateStoryFrameOptions(item, `${prefix} case "${item.id}"`);
  }

  ids(compositions, `${prefix} composition`);
  for (const item of compositions) {
    validateStoryFrameOptions(item, `${prefix} composition "${item.id}"`);
  }

  ids(slices, `${prefix} slice`);
  for (const view of slices) {
    const label = `${prefix} slice "${view.id}"`;
    validateStoryFrameOptions(view, label);
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
  if (config.componentTabs) {
    assert(config.componentTabs.length > 0, 'componentTabs must contain at least one tab.');
    ids(config.componentTabs, 'tab');
    const seenTokens = new Set<string>(config.componentTabs.map(({ id }) => id));
    for (const tab of config.componentTabs) {
      assert(tab.label.trim().length > 0, `tab "${tab.id}" needs a label.`);
      if (tab.kind === 'custom') {
        assert(typeof tab.render === 'function', `custom tab "${tab.id}" needs a render function.`);
      }
      for (const alias of tab.aliases ?? []) {
        assert(/^[a-z0-9][a-z0-9-]*$/.test(alias), `invalid tab alias "${alias}".`);
        assert(!seenTokens.has(alias), `tab alias "${alias}" collides with another tab or alias.`);
        seenTokens.add(alias);
      }
    }
  }
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
    validateStoryFrameOptions(scene, `"${scene.id}" scene`);
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
