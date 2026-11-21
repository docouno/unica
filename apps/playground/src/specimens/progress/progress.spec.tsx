import { Progress } from '@docouno/unica';
import { previewProps } from '../preview-code.js';
import { defineComponent } from '../../workbench/types.js';
import { activityNameReference, labelledByText, withActivityNameCode } from './activity-name.js';

const { default: Study } = await import('./progress.examples.js');

export default defineComponent({
  id: 'progress',
  title: 'Progress',
  category: 'Feedback & Status',
  status: 'UI',
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
    max: {
      kind: 'number',
      group: 'Measurement',
      default: 100,
      examples: [80, 100],
      description: 'Positive total in the same units as the value.',
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
    label: {
      kind: 'string',
      group: 'Content',
      default: 'Uploading assets',
      examples: ['Uploading assets', ''],
      description: 'Visible label and default accessible name.',
    },
    valueLabel: {
      kind: 'string',
      group: 'Content',
      default: '',
      description: 'Custom measurement text shown in place of a percentage.',
    },
    'aria-label': {
      kind: 'string',
      group: 'Semantics',
      label: 'Accessible name',
      default: '',
      examples: ['', 'Archive transfer'],
      description: 'Use an external name when there is no visible label.',
    },
    labelledByText,
    'aria-valuetext': {
      kind: 'string',
      group: 'Semantics',
      label: 'Accessible value text',
      default: '',
      description: 'Describe the measured amount in its original units.',
    },
  },
  constraints: [
    {
      kind: 'forbidden',
      when: { label: '', labelledByText: '' },
      affects: [{ key: 'aria-label', value: '' }],
      reason: 'Give the operation a name even when the heading is hidden.',
    },
    {
      kind: 'ignored',
      when: { determinate: false },
      affects: ['value', 'max', 'active', 'aria-valuetext', 'status'],
      reason: 'Waiting uses a fixed accent texture. Its value slot keeps its space when shown.',
    },
    {
      kind: 'precedence',
      when: { determinate: false, showValue: true },
      affects: ['valueLabel'],
      reason: 'Custom units reserve their space while hidden from sight and assistive technology.',
    },
    {
      kind: 'precedence',
      when: { showValue: false, determinate: true },
      affects: ['valueLabel'],
      reason:
        'Custom units remain available to assistive technology unless accessible value text takes precedence.',
    },
    {
      kind: 'ignored',
      when: { showValue: false, determinate: false },
      affects: ['valueLabel'],
      reason: 'The waiting phase has no measurement and the value slot is off.',
    },
    {
      kind: 'precedence',
      when: { paused: true },
      affects: ['active'],
      reason: 'Paused work has no leading-edge glow. Its waiting texture stays still.',
    },
    ...(['warning', 'danger', 'success'] as const).map((status) => ({
      kind: 'ignored' as const,
      when: { status },
      affects: ['active'],
      reason: 'This status suppresses the leading-edge glow.',
    })),
  ],
  render: ({ ctx, values: { value, determinate, labelledByText, ...props } }) => {
    const id = `${ctx.id}-operation`;
    const reference = activityNameReference(id, labelledByText);
    if (!reference && !props.label.trim() && !props['aria-label'].trim()) {
      return <span>Give the operation a name.</span>;
    }
    return (
      <>
        {reference}
        <Progress
          {...ctx.subject}
          {...props}
          value={determinate ? value : null}
          aria-labelledby={reference ? id : undefined}
        />
      </>
    );
  },
  code: ({ value, determinate, labelledByText, ...props }) => {
    const label = labelledByText.trim() ? ' aria-labelledby="operation-label"' : '';
    if (!label && !props.label.trim() && !props['aria-label'].trim()) {
      return '';
    }
    const attributes = previewProps(props, {
      size: 'm',
      status: 'accent',
      max: 100,
      showValue: true,
      paused: false,
      active: false,
      valueLabel: '',
      'aria-label': '',
      'aria-valuetext': '',
    });
    return withActivityNameCode(
      `<Progress value={${determinate ? value : 'null'}}${attributes}${label} />`,
      labelledByText,
    );
  },
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
      fixed: { active: true },
      title: 'Semantic color needs context',
      reference: () => <Study section="statuses" />,
    },
    {
      id: 'activity',
      rows: 'determinate',
      cols: 'paused',
      fixed: { active: true, status: 'accent', value: 45, max: 100 },
      title: 'Active and paused work',
      caption: 'Compare a partial measurement and the waiting phase with the same accent.',
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
  usage: [
    {
      id: 'units',
      title: 'Transfer with custom units',
      code: `<Progress label="Uploading archive" value={42} max={80} valueLabel="42 of 80 MB" />`,
      render: () => (
        <Progress label="Uploading archive" value={42} max={80} valueLabel="42 of 80 MB" />
      ),
    },
  ],
});
