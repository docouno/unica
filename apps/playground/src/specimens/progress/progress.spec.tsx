import { Progress, Text } from '@docouno/unica';
import { previewProps } from '../preview-code.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { defineComponent } from '../../workbench/types.js';
import { labelledByText, withActivityName, withActivityNameCode } from './activity-name.js';
import {
  BoundariesExample,
  LabelsExample,
  MotionExample,
  OverlayExample,
  PhaseExample,
  WaitingExample,
} from './progress.examples.js';
import { ArchiveTransfer } from './archive-transfer.js';
import transferSource from './archive-transfer.tsx?raw';
import { TransferRecovery } from './transfer-recovery.js';
import recoverySource from './transfer-recovery.tsx?raw';

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
      group: 'Geometry',
      default: 'm',
      description: 'Track and label density.',
      choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    status: {
      kind: 'enum',
      group: 'Role',
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
      group: 'Content',
      default: 45,
      publicType: 'number | null',
      description: 'Measured amount. Pass null while progress cannot be measured.',
      examples: [0, 45, 100],
    },
    max: {
      kind: 'number',
      group: 'Content',
      default: 100,
      examples: [80, 100],
      description: 'Positive total in the same units as the value.',
    },
    determinate: {
      kind: 'boolean',
      group: 'Content',
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
      group: 'Interaction',
      default: false,
      description: 'Keep the measured amount visible while the phase is paused.',
    },
    active: {
      kind: 'boolean',
      group: 'Interaction',
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
  render: withOverlaySurface(
    ({ ctx, values: { value, determinate, labelledByText, ...props } }) => {
      const id = `${ctx.id}-operation`;
      const reference = labelledByText.trim();
      if (!reference && !props.label.trim() && !props['aria-label'].trim()) {
        return <Text size="body-s">Give the operation a name.</Text>;
      }
      return withActivityName(
        'Progress',
        id,
        reference,
        <Progress
          {...ctx.subject}
          {...props}
          value={determinate ? value : null}
          aria-labelledby={reference ? id : undefined}
        />,
      );
    },
    'border-box',
  ),
  code: ({ value, determinate, labelledByText, ...props }) => {
    if (!labelledByText.trim() && !props.label.trim() && !props['aria-label'].trim()) {
      return `import { Text } from '@docouno/unica';

<Text size="body-s">Give the operation a name.</Text>`;
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
      'Progress',
      labelledByText,
      (label) => `<Progress value={${determinate ? value : 'null'}}${attributes}${label} />`,
    );
  },
  states: [
    {
      id: 'scale',
      rows: 'size',
      cols: 'value',
      title: 'Three weights · one measured range',
    },
    {
      id: 'statuses',
      rows: 'status',
      cols: 'paused',
      fixed: { active: true },
      title: 'Semantic color needs context',
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
      caption:
        '99.6% still reads 99%. Reaching 100% does not choose a success color or dismiss the task.',
      kind: 'content',
      mode: 'pinned',
      render: withOverlaySurface(BoundariesExample, 'border-box'),
    },
    {
      id: 'waiting',
      title: 'Preparing & transferring · the same accent',
      caption:
        'Preparing and transferring share the same accent paint. The candy stripe changes texture without dimming the operation; reduced motion stops its travel.',
      kind: 'behavior',
      mode: 'pinned',
      render: withOverlaySurface(WaitingExample, 'border-box'),
    },
    {
      id: 'labels',
      title: 'Labels, units & compact placement',
      caption:
        'Custom units replace percentages, long labels wrap cleanly, and compact variants omit empty headers while keeping an accessible name.',
      kind: 'behavior',
      mode: 'pinned',
      render: withOverlaySurface(LabelsExample, 'border-box'),
    },
    {
      id: 'motion',
      title: 'Active light & a quiet finish',
      caption:
        'Frost breathes behind an active measured edge. Pausing quiets the light; reaching 100% settles it. Soft and Pixel stay matte.',
      kind: 'behavior',
      mode: 'live',
      controls: {
        active: { kind: 'boolean', label: 'Active', default: true },
      },
      actions: [
        { id: 'reach-100', label: 'Reach 100%' },
        { id: 'replay', label: 'Replay' },
      ],
      reset: true,
      render: withOverlaySurface(MotionExample, 'border-box'),
    },
    {
      id: 'phases',
      title: 'A phase is not an outcome',
      caption:
        'Controlled phase study. Percent applies to Transferring, Paused, and Interrupted; Preparing/Verifying have no known total and Transferred/Complete are at 100%.',
      kind: 'behavior',
      mode: 'live',
      controls: {
        phase: {
          kind: 'enum',
          label: 'Phase',
          default: 'Transferring',
          choices: [
            'Preparing',
            'Transferring',
            'Paused',
            'Transferred',
            'Verifying',
            'Complete',
            'Interrupted',
          ],
        },
        value: { kind: 'number', label: 'Percent', default: 64, min: 0, max: 100, step: 1 },
      },
      reset: true,
      render: withOverlaySurface(PhaseExample, 'border-box'),
    },
    {
      id: 'overlay',
      title: 'Unknown & measured work on a floating surface',
      caption: 'Progress adapts automatically inside an overlay container without changing props.',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      mode: 'pinned',
      render: OverlayExample,
    },
  ],
  compositions: [
    {
      id: 'transfer-controls',
      title: 'Transfer with pause & cancel actions',
      caption:
        'Pause and resume an upload at 42 of 80 MB. Cancel closes the transfer and reports where it stopped.',
      mode: 'live',
      reset: true,
      code: transferSource,
      render: withOverlaySurface(
        ({ ctx }) => <ArchiveTransfer progressProps={ctx.subject} />,
        'border-box',
      ),
    },
    {
      id: 'interrupted-recovery',
      title: 'Interrupted transfer with explanation & retry',
      caption:
        'Retry opens the reconnection phase and keeps the last confirmed percentage in the message. Dismiss closes the status. The example holds the reconnection phase for inspection.',
      mode: 'live',
      reset: true,
      code: recoverySource,
      render: withOverlaySurface(
        ({ ctx }) => <TransferRecovery progressProps={ctx.subject} />,
        'border-box',
      ),
    },
  ],
});
