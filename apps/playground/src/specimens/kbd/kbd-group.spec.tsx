import { Kbd, KbdGroup } from '@docouno/unica';
import type { ReactElement } from 'react';
import { ExampleSurface } from '../shared/example-surface.js';
import { defineComponent } from '../../workbench/types.js';
import type { Values } from '../../workbench/types.js';
import { previewProps, previewText } from '../preview-code.js';
import {
  GroupSizeExample,
  SequenceExample,
  VisibleStepsExample,
  sequenceCode,
} from './kbd-group.examples.js';

import { KeyboardViewport } from './kbd.viewport.js';

type Step = string | readonly string[];

const examples = {
  single: ['Enter'],
  chord: ['⌘', 'K'],
  sequence: [
    ['Ctrl', 'K'],
    ['Ctrl', 'C'],
  ],
} satisfies Record<string, readonly Step[]>;

function renderStep(step: Step): ReactElement {
  return typeof step === 'string' ? (
    <Kbd key={step}>{step}</Kbd>
  ) : (
    <KbdGroup key={step.join(' ')}>{step.map(renderStep)}</KbdGroup>
  );
}

function stepCode(step: Step): string {
  return typeof step === 'string'
    ? `<Kbd>${previewText(step)}</Kbd>`
    : `<KbdGroup>${step.map(stepCode).join('')}</KbdGroup>`;
}

function groupCode(steps: readonly Step[], props: Values): string {
  const attrs = previewProps(props, { size: 'inherit', separator: '+' });
  return `import { Kbd, KbdGroup } from '@docouno/unica';\n\n<KbdGroup${attrs}>\n${steps.map((step) => `  ${stepCode(step)}`).join('\n')}\n</KbdGroup>`;
}

export default defineComponent({
  id: 'kbd-group',
  title: 'KbdGroup',
  category: 'Typography',
  status: 'UI',
  summary: 'Keyboard chords and sequences that stay together on one line.',
  componentName: 'KbdGroup',
  props: {
    size: {
      kind: 'enum',
      group: 'Geometry',
      default: 'inherit',
      description:
        'Set the default size of keys and nested groups. An explicit child size overrides it.',
      choices: [{ value: 'inherit' }, { value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    children: {
      kind: 'slot',
      group: 'Content',
      default: 'chord',
      publicType: 'ReactNode',
      description:
        'Keys or nested chords in source order. The editor starts with a two-key example. The component supplies no keys.',
      choices: [
        { value: 'single', label: 'Single key' },
        { value: 'chord', label: 'Two keys' },
        { value: 'sequence', label: 'Two chords' },
      ],
    },
    separator: {
      kind: 'string',
      group: 'Content',
      default: '+',
      publicType: 'string',
      description:
        'Visible and spoken text between steps. An empty separator leaves a visual gap and supplies a spoken “plus”.',
      examples: ['+', '', 'then'],
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { children: 'single' },
      affects: ['separator'],
      reason: 'A separator appears between two or more steps.',
    },
  ],
  render: ({ ctx, values: { children, ...props } }) => (
    <ExampleSurface surface={ctx.surface}>
      <KeyboardViewport label="Shortcut preview">
        <KbdGroup {...ctx.subject} {...props}>
          {examples[children].map(renderStep)}
        </KbdGroup>
      </KeyboardViewport>
    </ExampleSurface>
  ),
  code: ({ children, ...props }) => groupCode(examples[children], props),
  states: [
    {
      id: 'notation',
      title: 'Steps and separators',
      rows: 'children',
      cols: 'separator',
      fixed: { size: 's' },
      caption:
        'An empty separator keeps a gap and reads “plus”. For a sequence, “then” joins the two chords and each inner chord keeps its plus sign.',
    },
  ],
  cases: [
    {
      id: 'size-override',
      title: 'An explicit child size',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Both groups use medium keys. Setting a small size on the final key changes only that key.',
      render: GroupSizeExample,
    },
    {
      id: 'visible-steps',
      title: 'Optional keys',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Hide the modifier or leave out the final key. Separators appear only between visible steps.',
      controls: {
        showShift: { kind: 'boolean', default: true, label: 'Show Shift' },
        showEnter: { kind: 'boolean', default: true, label: 'Show Enter' },
      },
      reset: true,
      render: VisibleStepsExample,
    },
  ],
  compositions: [
    {
      id: 'sequence',
      title: 'A command in a shortcut reference',
      mode: 'pinned',
      caption: 'Read each chord as a unit. Release the first chord before pressing the second.',
      code: sequenceCode,
      render: SequenceExample,
    },
  ],
});
