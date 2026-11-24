import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { labelledByText } from './activity-name.js';
import { progressCircleCode } from './progress-circle-code.js';
import { ProgressCirclePlayground } from './progress-circle-playground.js';
import {
  ProgressCircleBoundaries,
  ProgressCircleHandoff,
  ProgressCircleOverlay,
  ProgressCircleScale,
} from './progress-circle.examples.js';
import { TransferMeasurements } from './progress-circle-transfers.examples.js';
import transferSource from './progress-circle-transfers.examples.tsx?raw';
import './progress-circle.examples.css';

const props = {
  size: {
    kind: 'enum',
    group: 'Geometry',
    default: 'inherit',
    description: 'Inherit the surrounding text size (1em) or use a fixed icon diameter.',
    choices: [{ value: 'inherit' }, { value: 's' }, { value: 'm' }, { value: 'l' }],
  },
  tone: {
    kind: 'enum',
    group: 'Role',
    default: 'inherit',
    description: 'Foreground color inherited or chosen for the activity.',
    choices: [{ value: 'inherit' }, { value: 'neutral' }, { value: 'muted' }, { value: 'accent' }],
  },
  value: {
    kind: 'number',
    group: 'Content',
    default: 45,
    publicType: 'number | null',
    description:
      'Required. The example starts at 45. A finite value is clamped between zero and the total. Pass null while the amount is unknown.',
    examples: [0, 45, 100],
  },
  max: {
    kind: 'number',
    group: 'Content',
    default: 100,
    examples: [80, 100],
    publicType: 'number',
    description:
      'A positive finite total in the same units as the value. An invalid total uses the waiting phase.',
  },
  determinate: {
    kind: 'boolean',
    group: 'Content',
    default: true,
    description:
      'Supply the numeric value, or pass null to show an operation with no measurement yet.',
    demo: true,
  },
  'aria-label': {
    kind: 'string',
    group: 'Semantics',
    label: 'Accessible name',
    default: 'Uploading assets',
    publicType: 'string',
    examples: ['Uploading assets', ''],
    description:
      'Text that names the operation when there is no referenced label. This example starts with “Uploading assets”.',
  },
  labelledByText: { ...labelledByText, examples: ['', 'Archive transfer'] },
  'aria-valuetext': {
    kind: 'string',
    group: 'Semantics',
    label: 'Accessible value text',
    default: '',
    description:
      'Describe a known measurement in its original units. The waiting phase omits value text.',
  },
} as const satisfies PropSchema;

export type ProgressCircleValues = ComponentValues<typeof props>;

export default defineComponent({
  id: 'progress-circle',
  title: 'ProgressCircle',
  category: 'Feedback & Status',
  status: 'UI',
  summary: 'A compact progressbar that shows a measured amount or waits in the same icon slot.',
  componentName: 'ProgressCircle',
  props,
  constraints: [
    {
      kind: 'forbidden',
      when: { labelledByText: '' },
      affects: [{ key: 'aria-label', value: '' }],
      reason: 'Give the operation a name or a referenced label.',
    },
    {
      kind: 'ignored',
      when: { determinate: false },
      affects: ['value', 'max', 'aria-valuetext'],
      reason: 'An indeterminate phase has no measured amount.',
    },
  ],
  render: withOverlaySurface(ProgressCirclePlayground, 'border-box'),
  code: progressCircleCode,
  states: [
    {
      id: 'scale',
      rows: 'size',
      cols: 'value',
      title: 'Size and measured value',
      caption:
        'Compare the empty, partially filled and complete progressbar in each icon slot. The inherited size follows the surrounding text.',
    },
  ],
  cases: [
    {
      id: 'shared-footprint',
      title: 'Spinner and measured progress',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Each pair places a Spinner beside a ProgressCircle at 64%. The two share the same diameter, stroke and tone at each size.',
      render: withOverlaySurface(ProgressCircleScale, 'border-box'),
    },
    {
      id: 'boundaries',
      title: 'From empty to full',
      kind: 'content',
      mode: 'pinned',
      caption:
        'The fill advances clockwise from twelve o’clock. Pixel uses eight cells and partially fills the leading cell between eighths of the total. Completion keeps the same tone.',
      render: withOverlaySurface(ProgressCircleBoundaries, 'border-box'),
    },
    {
      id: 'handoff',
      title: 'From waiting to measured work',
      kind: 'behavior',
      mode: 'live',
      controls: {
        known: { kind: 'boolean', label: 'Measurement available', default: false },
        value: {
          kind: 'number',
          label: 'Measured percent',
          default: 42,
          min: 0,
          max: 100,
          step: 1,
        },
      },
      reset: true,
      caption:
        'Set the measured percent, then make the measurement available. The archive keeps one progressbar as it moves from preparation to transfer and completion.',
      render: withOverlaySurface(ProgressCircleHandoff, 'border-box'),
    },
    {
      id: 'overlay',
      title: 'Compact work on a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      mode: 'pinned',
      caption:
        'The archive upload has a known total. The document preparation retains its waiting shape on the same surface.',
      render: ProgressCircleOverlay,
    },
  ],
  compositions: [
    {
      id: 'context',
      title: 'File transfers and pipeline stages',
      mode: 'pinned',
      caption:
        'The surrounding text explains each unit and phase. A paused transfer keeps its last measurement, and the long collection name wraps beside its icon.',
      code: transferSource,
      render: withOverlaySurface(
        ({ ctx }) => <TransferMeasurements circleProps={ctx.subject} />,
        'border-box',
      ),
    },
  ],
});
