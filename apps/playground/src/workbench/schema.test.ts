import { expect, it } from 'vitest';
import {
  buildFull,
  buildPairwise,
  buildSlice,
  componentCode,
  defaultValues,
  evaluate,
  fullCellCount,
  ruleAffects,
  validateCatalog,
  validateComponent,
} from './schema.js';
import { defineComponent, defineScene } from './types.js';
import type { Constraint, PropSchema, Values } from './types.js';

const bool = {
  kind: 'boolean',
  default: false,
  group: 'Controls',
  description: 'A flag.',
} as const;
const flags = { a: bool, b: bool, c: bool };
const rules: readonly Constraint[] = [
  {
    kind: 'forbidden',
    when: { a: true },
    affects: [{ key: 'c', value: false }],
    reason: 'A needs C.',
  },
  {
    kind: 'forbidden',
    when: { b: true },
    affects: [{ key: 'c', value: true }],
    reason: 'B needs C off.',
  },
  { kind: 'ignored', when: { c: true }, affects: ['b'], reason: 'C hides B.' },
  { kind: 'precedence', when: { a: true }, affects: ['b'], reason: 'A wins over B.' },
];

function finish<T>(iterator: Generator<void, T>): T {
  let step = iterator.next();
  while (!step.done) {
    step = iterator.next();
  }
  return step.value;
}

function pairs(rows: readonly Values[]): Set<string> {
  const result = new Set<string>();
  for (const row of rows) {
    const entries = Object.entries(row).sort(([a], [b]) => a.localeCompare(b));
    for (const [i, left] of entries.entries()) {
      for (const right of entries.slice(i + 1)) {
        result.add(JSON.stringify([left, right]));
      }
    }
  }
  return result;
}

const choices = [false, true] as const;
const oracle = choices.flatMap((a) =>
  choices.flatMap((b) => choices.flatMap((c) => ((a && !c) || (b && c) ? [] : [{ a, b, c }]))),
);

it('covers exactly the feasible pairs, including constraints with no direct conflict in the pair', () => {
  const result = finish(buildPairwise(flags, rules, {}));
  expect(result).toEqual(finish(buildPairwise(flags, rules, {})));
  expect(
    result.rows.every((row) =>
      oracle.some(
        (candidate) => candidate.a === row.a && candidate.b === row.b && candidate.c === row.c,
      ),
    ),
  ).toBe(true);
  expect(pairs(result.rows)).toEqual(pairs(oracle));
  expect(result.total).toBe(pairs(oracle).size);
  expect(result.covered).toBe(result.total);
  expect(pairs(result.rows)).not.toContain(
    JSON.stringify([
      ['a', true],
      ['b', true],
    ]),
  );
});

it('keeps ignored and precedence values, evaluates every reason, and retains forbidden coordinates', () => {
  const allowed = { a: true, b: false, c: true };
  expect(evaluate(rules, allowed)).toEqual({ valid: true, matches: rules.slice(2) });
  expect(ruleAffects(rules[0]!, 'c', false)).toBe(true);
  expect(ruleAffects(rules[0]!, 'c', true)).toBe(false);

  const slice = buildSlice(
    flags,
    { a: false, b: false, c: false },
    { rows: 'a', cols: 'b', group: 'c' },
  );
  expect(slice.columns).toEqual(choices);
  expect(slice.groups.map(({ value }) => value)).toEqual(choices);
  const cells = slice.groups.flatMap(({ rows }) => rows.flatMap((row) => row.cells));
  expect(cells).toHaveLength(8);
  expect(cells.filter((cell) => evaluate(rules, cell).valid)).toHaveLength(oracle.length);
});

it('distinguishes assignments with zero obligations from no valid result and respects fixed values', () => {
  expect(finish(buildPairwise({}, undefined, {}))).toEqual({ rows: [{}], total: 0, covered: 0 });
  expect(finish(buildPairwise(flags, rules, { b: false, c: false }))).toEqual({
    rows: [{ a: false, b: false, c: false }],
    total: 0,
    covered: 0,
  });
  expect(finish(buildPairwise(flags, rules, { a: true, c: false })).rows).toEqual([]);
  expect(finish(buildPairwise({ a: bool }, undefined, {})).rows).toEqual([
    { a: false },
    { a: true },
  ]);
  expect([...buildFull(flags, { c: true })]).toHaveLength(4);
});

it('counts the theme multiplier and N/A assignments in the Full limit', () => {
  const number = (count: number) =>
    ({
      kind: 'number',
      default: 0,
      group: 'Scale',
      description: 'An explicit domain.',
      examples: Array.from({ length: count }, (_, index) => index),
    }) as const;
  expect(fullCellCount({ a: number(8), b: number(8) }, {}, 1)).toBe(64);
  expect(fullCellCount({ a: number(5), b: number(13) }, {}, 1)).toBe(65);
  expect(fullCellCount({ a: number(3), b: number(4) }, {}, 6)).toBe(65);
  expect(fullCellCount({ a: number(3), b: number(4) }, {}, 1)).toBe(12);
  expect(fullCellCount({ a: number(5), b: number(13) }, { a: 0 }, 4)).toBe(52);
});

it('yields during an audit and handles more dimensions than a named slice', () => {
  const props = { ...flags, d: bool, e: bool, f: bool, g: bool, h: bool, i: bool, j: bool };
  expect(buildPairwise(props, [], {}).next().done).toBe(false);
  const result = finish(buildPairwise(props, [], {}));
  expect(result.covered).toBe(180);
  expect(result.rows.length).toBeLessThan(2 ** 10);
});

it('fails clearly for invalid defaults, duplicate keys, bad axes, and stale scene references', () => {
  const base = {
    id: 'test',
    title: 'Test',
    category: 'Controls',
    status: 'Proto',
    props: flags,
    render: () => null,
  } as const;
  const component = defineComponent(base);
  expect(() => validateComponent(component)).not.toThrow();
  expect(() =>
    validateComponent({
      ...component,
      props: {
        a: {
          kind: 'enum',
          choices: [{ value: 'allowed' }],
          default: 'missing',
          group: 'Control',
          description: 'A mode.',
        },
      },
    }),
  ).toThrow(/test.*a.*default/i);
  expect(() =>
    validateComponent({
      ...component,
      constraints: [{ kind: 'forbidden', when: { b: false }, affects: ['a'], reason: 'Conflict.' }],
    }),
  ).toThrow(/defaults are forbidden/);
  expect(() =>
    validateComponent({
      ...component,
      matrixViews: [{ id: 'unknown', title: 'Unknown', rows: 'missing' }],
    }),
  ).toThrow(/invalid axis/);
  expect(() =>
    validateComponent({
      ...component,
      matrixViews: [
        { id: 'slice', title: 'One' },
        { id: 'slice', title: 'Two' },
      ],
    }),
  ).toThrow(/unique/);
  expect(() =>
    validateCatalog({
      title: 'Lab',
      themes: [],
      categories: ['Controls'],
      components: [component],
      scenes: [
        defineScene({
          id: 'scene',
          title: 'Scene',
          group: 'Scenes',
          uses: ['missing'],
          render: () => null,
        }),
      ],
    }),
  ).toThrow(/references missing component/);
});

it('shows only changed values with real slot and action syntax and no demo props', () => {
  const props = {
    disabled: { ...bool, default: true },
    mode: {
      kind: 'enum',
      choices: [{ value: 'default' }, { value: 'ghost' }],
      default: 'default',
      group: 'Design',
      description: 'A role.',
    },
    title: { kind: 'string', default: 'Default', group: 'Content', description: 'A title.' },
    icon: {
      kind: 'slot',
      choices: [{ value: 'empty' }, { value: 'add', code: '<AddIcon />' }],
      default: 'empty',
      group: 'Content',
      description: 'A slot.',
    },
    showcase: { ...bool, demo: true },
    onChange: {
      kind: 'action',
      code: 'handleChange',
      group: 'Events',
      description: 'A callback.',
    },
  } satisfies PropSchema;
  const component = defineComponent({
    id: 'control',
    title: 'Control examples',
    category: 'Forms',
    componentName: 'Control',
    status: 'Proto',
    props,
    render: () => null,
  });
  const values = defaultValues(props);
  expect(componentCode(component, values)).toBe('<Control onChange={handleChange} />');
  expect(
    componentCode(component, {
      ...values,
      disabled: false,
      mode: 'ghost',
      title: 'R&D',
      icon: 'add',
      showcase: true,
    }),
  ).toBe(
    '<Control disabled={false} mode="ghost" title={"R&D"} icon={<AddIcon />} onChange={handleChange} />',
  );
});
