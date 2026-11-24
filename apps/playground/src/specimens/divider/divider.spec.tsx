import { Divider, Flex } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import { previewProps } from '../preview-code.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { Content, HostLayout, Overlay, Surfaces, Wrapping } from './divider.examples.js';
import { FormattingToolbar } from './divider-toolbar.examples.js';
import toolbarSource from './divider-toolbar.examples.tsx?raw';

const props = {
  orientation: {
    kind: 'enum',
    group: 'Geometry',
    default: 'horizontal',
    description: 'Sets the axis. A vertical line stretches to the height of its containing row.',
    choices: [{ value: 'horizontal' }, { value: 'vertical' }],
  },
  label: {
    kind: 'string',
    group: 'Content',
    default: '',
    description:
      'A connecting phrase for a horizontal divider. Empty or whitespace-only text gives a plain line.',
    examples: ['', 'or', 'or email'],
  },
  labelPosition: {
    kind: 'enum',
    group: 'Geometry',
    default: 'center',
    description: 'Aligns the phrase with the logical start, center or end of its row.',
    choices: [{ value: 'start' }, { value: 'center' }, { value: 'end' }],
  },
  decorative: {
    kind: 'boolean',
    group: 'Semantics',
    default: true,
    description:
      'On a plain line, set false to expose a semantic separator. Omit this prop when supplying a label.',
  },
  'aria-label': {
    kind: 'string',
    group: 'Semantics',
    default: '',
    description: 'Optional accessible name for a plain semantic separator.',
  },
} as const satisfies PropSchema;

function dividerProps(values: ComponentValues<typeof props>) {
  const { orientation, label, labelPosition, decorative, 'aria-label': name } = values;
  if (!decorative) {
    return { orientation, decorative: false as const, ...(name.trim() && { 'aria-label': name }) };
  }
  if (orientation === 'horizontal' && label.trim()) {
    return { label, labelPosition };
  }
  return { orientation };
}

export default defineComponent({
  id: 'divider',
  title: 'Divider',
  category: 'Surfaces & Structure',
  status: 'UI',
  componentName: 'Divider',
  summary: 'A thin boundary between content or action groups, with an optional connecting phrase.',
  props,
  constraints: [
    {
      kind: 'ignored',
      when: { orientation: 'vertical' },
      affects: ['label', 'labelPosition'],
      reason:
        'The example omits label and labelPosition because a vertical separator accepts only plain-line props.',
    },
    {
      kind: 'precedence',
      when: { decorative: false },
      affects: ['label', 'labelPosition'],
      reason:
        'The example selects the plain semantic form and omits both label props. To supply a connecting phrase, omit decorative and the separator name.',
    },
    {
      kind: 'ignored',
      when: { label: '' },
      affects: ['labelPosition'],
      reason: 'There is no phrase to position on a plain horizontal line.',
    },
    {
      kind: 'ignored',
      when: { decorative: true },
      affects: ['aria-label'],
      reason: 'Only a plain semantic separator can have an accessible name.',
    },
  ],
  render: withOverlaySurface(({ ctx, values }) => (
    <Flex
      align="center"
      justify="center"
      style={{
        inlineSize: ctx.tab === 'states' ? '13rem' : '100%',
        maxInlineSize: '100%',
        minBlockSize: '2.75rem',
      }}
    >
      <Divider {...ctx.subject} {...dividerProps(values)} />
    </Flex>
  )),
  code: (values) => {
    const attributes = previewProps(dividerProps(values), {
      orientation: 'horizontal',
      labelPosition: 'center',
    });
    if (values.orientation === 'vertical') {
      return `import { Divider, Flex } from '@docouno/unica';

<Flex align="center" justify="center" style={{ minBlockSize: '2.75rem' }}>
  <Divider${attributes} />
</Flex>`;
    }
    return `import { Divider } from '@docouno/unica';

<Divider${attributes} />`;
  },
  states: [
    {
      id: 'orientation',
      title: 'Horizontal & vertical',
      rows: 'orientation',
      caption:
        'Compare a line that fills the available width with a line that stretches to the height of its row.',
    },
    {
      id: 'labels',
      title: 'Start, center & end',
      rows: 'labelPosition',
      cols: 'label',
      caption:
        'Start and end leave a line on the opposite side of the phrase. Center leaves a line on each side.',
    },
  ],
  cases: [
    {
      id: 'layout',
      title: 'Lines in flex and grid layouts',
      kind: 'content',
      mode: 'pinned',
      caption:
        'The surrounding content sets the length of the boundary in a stack, a metadata row and a two-column grid.',
      render: withOverlaySurface(HostLayout, 'border-box'),
    },
    {
      id: 'wrapping',
      title: 'When the label wraps',
      kind: 'content',
      mode: 'pinned',
      caption: 'Compare the same phrase at each logical position in a narrow row.',
      render: withOverlaySurface(Wrapping, 'border-box'),
    },
    {
      id: 'content',
      title: 'Unbroken & empty labels',
      kind: 'content',
      mode: 'pinned',
      caption:
        'A long unbroken value wraps within the row. An empty label leaves a single uninterrupted line.',
      render: withOverlaySurface(Content, 'border-box'),
    },
    {
      id: 'surfaces',
      title: 'Canvas & card',
      kind: 'surface',
      mode: 'pinned',
      caption:
        'Compare the same three dividers on the canvas and inside a card. The canvas keeps its base material inside the overlay.',
      render: withOverlaySurface(Surfaces, 'border-box'),
    },
    {
      id: 'overlay',
      title: 'On a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      mode: 'pinned',
      caption:
        'A static panel shows a plain line, a metadata separator and a connecting phrase on the same material.',
      render: Overlay,
    },
  ],
  compositions: [
    {
      id: 'context',
      title: 'Between action groups',
      mode: 'live',
      caption:
        'Toggle emphasis or list style. The vertical rule stretches between the two action groups with a 4px inset at each end.',
      code: toolbarSource,
      render: withOverlaySurface(
        ({ ctx }) => <FormattingToolbar dividerProps={ctx.subject} />,
        'border-box',
      ),
    },
  ],
});
