import { Kbd, KbdGroup } from '@docouno/unica';
import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { defineComponent } from '../../workbench/types.js';
import type { Values } from '../../workbench/types.js';
import { previewProps, previewText } from '../preview-code.js';
import './kbd.examples.css';

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
  return `<KbdGroup${attrs}>\n${steps.map((step) => `  ${stepCode(step)}`).join('\n')}\n</KbdGroup>`;
}

function GroupPreview({ children }: { readonly children: ReactElement }): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const scroll = ref.current;
    const group = scroll?.firstElementChild;
    if (!scroll || !group) {
      return;
    }

    const observer = new ResizeObserver(() => {
      setOverflowing(scroll.scrollWidth > scroll.clientWidth);
    });
    observer.observe(scroll);
    observer.observe(group);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="kbd-group-preview unica-scrollbar"
      dir="ltr"
      role={overflowing ? 'region' : undefined}
      aria-label={overflowing ? 'Shortcut preview' : undefined}
      tabIndex={overflowing ? 0 : undefined}
    >
      {children}
    </div>
  );
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
      group: 'Appearance',
      default: 'inherit',
      description: 'Default size for keys and nested groups.',
      choices: [{ value: 'inherit' }, { value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    children: {
      kind: 'slot',
      group: 'Content',
      default: 'chord',
      description: 'Keys or nested chords to group.',
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
      description: 'Text placed between steps. Leave empty for a compact chord.',
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
    <GroupPreview>
      <KbdGroup {...ctx.subject} {...props}>
        {examples[children].map(renderStep)}
      </KbdGroup>
    </GroupPreview>
  ),
  code: ({ children, ...props }) => groupCode(examples[children], props),
  matrixViews: [
    {
      id: 'notation',
      title: 'Composition & separators',
      rows: 'children',
      cols: 'separator',
    },
  ],
  cases: [
    {
      id: 'size-override',
      title: 'An explicit child size overrides the group',
      kind: 'behavior',
      render: () => (
        <KbdGroup size="m">
          <Kbd>Ctrl</Kbd>
          <Kbd size="s">K</Kbd>
        </KbdGroup>
      ),
    },
  ],
  usage: [
    {
      id: 'sequence',
      title: 'A sequence of two chords',
      code: groupCode(examples.sequence, { separator: 'then' }),
      render: () => <KbdGroup separator="then">{examples.sequence.map(renderStep)}</KbdGroup>,
    },
  ],
});
