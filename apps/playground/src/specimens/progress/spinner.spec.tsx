import { Spinner } from '../../prototypes/progress/progress.proto.js';
import { defineComponent } from '../../workbench/types.js';

const { default: Study } = await import('../../prototypes/progress/spinner.examples.js');

export default defineComponent({
  id: 'spinner',
  title: 'Spinner',
  category: 'Feedback & Status',
  status: 'Proto',
  summary:
    'Compact activity for work with an unknown duration. The surrounding text tells you what is happening.',
  componentName: 'Spinner',
  props: {
    size: {
      kind: 'enum',
      group: 'Appearance',
      default: 'inherit',
      description: 'Diameter of the activity glyph.',
      choices: [{ value: 'inherit' }, { value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    tone: {
      kind: 'enum',
      group: 'Appearance',
      default: 'inherit',
      description: 'Foreground color inherited or chosen for the activity.',
      choices: [
        { value: 'inherit' },
        { value: 'neutral' },
        { value: 'muted' },
        { value: 'accent' },
      ],
    },
    delay: {
      kind: 'number',
      group: 'Activity',
      default: 0,
      description: 'Wait this many milliseconds before showing activity.',
    },
    'aria-label': {
      kind: 'string',
      group: 'Semantics',
      default: '',
      label: 'Accessible name',
      description: 'Accessible name for an otherwise silent glyph.',
    },
  },
  render: ({ ctx, values }) => <Spinner key={values.delay} {...ctx.subject} {...values} />,
  matrixViews: [
    {
      id: 'scale',
      rows: 'size',
      title: 'One footprint · four sizes',
      reference: () => <Study section="scale" />,
    },
    {
      id: 'tones',
      rows: 'tone',
      title: 'A quiet default · a deliberate accent',
      reference: () => <Study section="tones" />,
    },
  ],
  cases: [
    {
      id: 'motion',
      title: 'Motion & a readable still frame',
      kind: 'behavior',
      render: () => <Study section="motion" />,
    },
    {
      id: 'lifecycle',
      mode: 'live',
      title: 'Short waits & completion',
      kind: 'behavior',
      render: () => <Study section="lifecycle" />,
    },
    {
      id: 'overlay',
      title: 'Waiting on a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <Study section="overlay" />,
    },
  ],
  usage: [
    {
      id: 'placement',
      code: `<span><Spinner size="s" /> Saving changes</span>`,
      title: 'Inline & reserved control slots',
      render: () => <Study section="placement" />,
    },
  ],
});
