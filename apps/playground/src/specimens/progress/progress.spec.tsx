import { Progress } from '../../prototypes/progress/progress.proto.js';
import { previewProps } from '../preview-code.js';
import { defineComponent } from '../../workbench/types.js';

const { default: Study } = await import('../../prototypes/progress/progress.examples.js');

export default defineComponent({
  id: 'progress',
  title: 'Progress',
  category: 'Feedback & Status',
  status: 'Proto',
  summary:
    'Measured work, unknown phases, and honest completion. Material changes with the theme; the meaning of the data stays the same.',
  componentName: 'Progress',
  props: {
    size: {
      kind: 'enum',
      group: 'Appearance',
      default: 'm',
      description: 'Track and label density.',
      choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    status: {
      kind: 'enum',
      group: 'Appearance',
      default: 'accent',
      description: 'Semantic color of the phase.',
      choices: [
        { value: 'neutral' },
        { value: 'accent' },
        { value: 'info' },
        { value: 'success' },
        { value: 'warning' },
        { value: 'danger' },
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
      description: 'Use the measured value. Turn off for a phase with no known duration.',
      demo: true,
    },
    showValue: {
      kind: 'boolean',
      group: 'Content',
      default: true,
      description: 'Show the percentage beside the label.',
    },
    paused: {
      kind: 'boolean',
      group: 'Activity',
      default: false,
      description: 'Keep the measured amount visible while the phase is paused.',
    },
    active: {
      kind: 'boolean',
      group: 'Activity',
      default: false,
      description: 'Indicate that work is advancing.',
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { determinate: false },
      affects: ['value', 'active'],
      reason: 'An indeterminate phase has no measured amount or active leading edge.',
    },
    {
      kind: 'ignored',
      when: { paused: true },
      affects: ['active'],
      reason: 'Paused work has no active leading edge.',
    },
  ],
  render: ({ ctx, values: { value, determinate, ...props } }) => (
    <Progress
      {...ctx.subject}
      {...props}
      label="Uploading assets"
      value={determinate ? value : null}
    />
  ),
  code: ({ value, determinate, ...props }) =>
    `<Progress label="Uploading assets" value={${determinate ? value : 'null'}}${previewProps(props, { size: 'm', status: 'accent', showValue: true, paused: false, active: false })} />`,
  matrixViews: [
    {
      id: 'scale',
      rows: 'size',
      cols: 'value',
      title: 'Three weights · one measured range',
      reference: () => <Study section="scale" />,
    },
    {
      id: 'statuses',
      rows: 'status',
      cols: 'paused',
      title: 'Semantic color needs context',
      reference: () => <Study section="statuses" />,
    },
  ],
  cases: [
    {
      id: 'boundaries',
      title: 'Zero, a first byte & a finished phase',
      kind: 'content',
      render: () => <Study section="boundaries" />,
    },
    {
      id: 'waiting',
      title: 'Preparing & transferring · the same accent',
      kind: 'behavior',
      render: () => <Study section="waiting" />,
    },
    {
      id: 'labels',
      title: 'Labels, units & compact placement',
      kind: 'behavior',
      render: () => <Study section="labels" />,
    },
    {
      id: 'motion',
      mode: 'live',
      title: 'Active light & a quiet finish',
      kind: 'behavior',
      render: () => <Study section="motion" />,
    },
    {
      id: 'phases',
      mode: 'live',
      title: 'A phase is not an outcome',
      kind: 'behavior',
      render: () => <Study section="phases" />,
    },
    {
      id: 'overlay',
      title: 'Unknown & measured work on a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <Study section="overlay" />,
    },
  ],
});
