import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { tagCode } from './tag-code.js';
import { FitExample } from './tag-fit.examples.js';
import fitSource from './tag-fit.examples.tsx?raw';
import { Groups, Locked, OverlayLabels, RemovalFlow } from './tag-groups.examples.js';
import { TagPlayground } from './tag-playground.js';
import { Anatomy, LongLabels, Palette, RemovalStates } from './tag.examples.js';
import '../../prototypes/tag/tag.examples.css';

const props = {
  size: {
    kind: 'enum',
    group: 'Geometry',
    default: 'm',
    description:
      'Set the label, leading glyph and remove plate size. The hit target can extend beyond the painted capsule.',
    choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
  },
  status: {
    kind: 'enum',
    group: 'Role',
    default: 'neutral',
    description:
      'Identify the meaning of the assigned value. All statuses use the same removal action.',
    choices: [
      { value: 'neutral' },
      { value: 'accent' },
      { value: 'info' },
      { value: 'success' },
      { value: 'warning' },
      { value: 'danger' },
    ],
  },
  iconLeft: {
    kind: 'slot',
    group: 'Content',
    default: 'none',
    publicType: 'GlyphSource',
    description: 'Supply a decorative glyph before the label.',
    choices: [
      { value: 'none', label: 'None' },
      { value: 'tag', label: 'Tag icon', code: 'TagIcon' },
    ],
  },
  label: {
    kind: 'string',
    group: 'Content',
    default: 'Documentation',
    examples: ['Documentation', 'API'],
    demo: true,
    description:
      'The example supplies this text as children and includes it in the required removeLabel. Blank text uses “Label”.',
  },
  disabled: {
    kind: 'boolean',
    group: 'Availability',
    default: false,
    description: 'Keep the label visible and disable its native remove button.',
  },
  pending: {
    kind: 'boolean',
    group: 'Availability',
    default: false,
    description:
      'Show a Spinner in the remove plate while a request is pending. An enabled button retains its keyboard focus.',
  },
  onRemove: {
    kind: 'action',
    group: 'Interaction',
    publicType: '() => void',
    description: 'Required. The owner removes the assigned value when its button is activated.',
    code: 'handleRemove',
  },
} as const satisfies PropSchema;

export type TagValues = ComponentValues<typeof props>;

export default defineComponent({
  id: 'tag',
  title: 'Tag & TagGroup',
  category: 'Feedback & Status',
  status: 'Proto',
  summary:
    'Removable assigned values and wrapping groups with keyboard navigation and optional disclosure.',
  componentName: 'Tag',
  props,
  render: withOverlaySurface(TagPlayground, 'border-box'),
  code: tagCode,
  states: [
    {
      id: 'palette',
      title: 'Status at each size',
      rows: 'status',
      cols: 'size',
      fixed: { label: 'API' },
      caption: 'Compare all six status colors on the same assigned value at each size.',
    },
  ],
  cases: [
    {
      id: 'anatomy',
      title: 'Label, leading icon and remove plate',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Compare the leading inset and the remove plate with and without an icon. Remove a value and restore it from its own position.',
      render: withOverlaySurface(Anatomy, 'border-box'),
    },
    {
      id: 'status-meaning',
      title: 'Status and classification',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Each status pairs a value with a classification glyph. The remove action is the same in all six examples.',
      render: withOverlaySurface(Palette, 'border-box'),
    },
    {
      id: 'states',
      title: 'Remove button feedback',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Compare rest, hover, press, focus, disabled and pending with and without a leading glyph. The pinned controls keep their values.',
      render: withOverlaySurface(RemovalStates, 'border-box'),
    },
    {
      id: 'groups',
      title: 'Wrapping and disclosure',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Reveal the remaining values and move between actions with the arrow keys. Locked values stay in the group.',
      render: withOverlaySurface(Groups, 'border-box'),
    },
    {
      id: 'locked',
      title: 'Locked values',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'All values are required. Expand or collapse the list to read them while removal is unavailable.',
      render: withOverlaySurface(Locked, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Reading long values',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Focus or hover a clipped value to inspect it. The full-value list is also available with a touch or keyboard.',
      render: withOverlaySurface(LongLabels, 'border-box'),
    },
    {
      id: 'removal',
      title: 'Removal outcomes',
      kind: 'behavior',
      mode: 'live',
      controls: { deferred: { kind: 'boolean', label: 'Wait for confirmation', default: false } },
      actions: [
        { id: 'confirm', label: 'Confirm removal' },
        { id: 'reject', label: 'Reject removal' },
      ],
      reset: true,
      caption:
        'Remove a label immediately or hold its request to compare confirmation and rejection. After the last removal, reapply the labels from the empty list.',
      render: withOverlaySurface(RemovalFlow, 'border-box'),
    },
    {
      id: 'overlay',
      title: 'Assigned groups on a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      mode: 'live',
      reset: true,
      caption:
        'Remove an optional group and inspect the remaining labels on the panel. Workspace policy stays assigned.',
      render: OverlayLabels,
    },
  ],
  compositions: [
    {
      id: 'fit',
      title: 'Tags beside fields and controls',
      mode: 'live',
      reset: true,
      caption:
        'Compare the same assigned values at three sizes. Add a value or remove it from a field and follow the change across the three rows.',
      code: fitSource.replaceAll('../../prototypes/', './prototypes/'),
      render: withOverlaySurface(({ ctx }) => <FitExample tagProps={ctx.subject} />, 'border-box'),
    },
  ],
});
