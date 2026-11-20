import { ProgressCircle } from '../../prototypes/progress/progress-circle.proto.js';
import { previewProps } from '../preview-code.js';
import { defineComponent } from '../../workbench/types.js';

const { default: Study } = await import('../../prototypes/progress/progress-circle.examples.js');

export default defineComponent({
  id: 'progress-circle',
  title: 'ProgressCircle',
  category: 'Feedback & Status',
  status: 'Proto',
  summary:
    'The Spinner silhouette adapted to a measured amount. The same small icon slot, with no new visual pattern.',
  componentName: 'ProgressCircle',
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
    value: {
      kind: 'number',
      group: 'Measurement',
      default: 45,
      description: 'Measured completion for a known phase.',
      examples: [0, 45, 100],
    },
    determinate: {
      kind: 'boolean',
      group: 'Measurement',
      default: true,
      description: 'Turn off while the operation has no known duration.',
      demo: true,
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { determinate: false },
      affects: ['value'],
      reason: 'An indeterminate phase has no measured amount.',
    },
  ],
  render: ({ ctx, values: { determinate, value, size, tone } }) => (
    <ProgressCircle
      {...ctx.subject}
      size={size}
      tone={tone}
      value={determinate ? value : null}
      aria-label="Uploading assets"
    />
  ),
  code: ({ determinate, value, size, tone }) =>
    `<ProgressCircle aria-label="Uploading assets" value={${determinate ? value : 'null'}}${previewProps({ size, tone }, { size: 'inherit', tone: 'inherit' })} />`,
  matrixViews: [
    {
      id: 'scale',
      rows: 'size',
      cols: 'value',
      title: 'Spinner → measured amount · one silhouette',
      reference: () => <Study section="scale" />,
    },
  ],
  cases: [
    {
      id: 'boundaries',
      title: 'From empty to full',
      kind: 'content',
      render: () => <Study section="boundaries" />,
    },
    {
      id: 'handoff',
      mode: 'live',
      title: 'From waiting to measured work',
      kind: 'behavior',
      render: () => <Study section="handoff" />,
    },
    {
      id: 'overlay',
      title: 'Compact work on a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <Study section="overlay" />,
    },
  ],
  usage: [
    {
      id: 'context',
      code: `<div>
  <ProgressCircle value={elapsed} max={total} aria-label="Upload progress" />
  <span>Uploading assets</span>
</div>`,
      title: 'File transfers & pipeline stages',
      render: () => <Study section="context" />,
    },
  ],
});
