import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { tagCode } from './tag-code.js';
import { FitExample } from './tag-fit.examples.js';
import fitSource from './tag-fit.examples.tsx?raw';
import { tagGroupCases } from './tag-group-cases.js';
import { TagPlayground } from './tag-playground.js';
import { referenceProp, tagSize } from './tag-props.js';
import { Anatomy, EmbeddedTag, LongLabels, Palette, RemovalStates } from './tag.examples.js';
import './tag.examples.css';

const props = {
  size: tagSize,
  status: {
    kind: 'enum',
    group: 'Role',
    default: 'neutral',
    publicType: 'TagStatus',
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
  removeIcon: {
    kind: 'slot',
    group: 'Content',
    default: 'none',
    publicType: 'GlyphSource',
    description: 'Replace the default close glyph. The button still performs removal.',
    choices: [
      { value: 'none', label: 'Default close glyph' },
      { value: 'minus', label: 'Minus icon', code: 'MinusIcon' },
    ],
  },
  children: {
    kind: 'string',
    label: 'label',
    group: 'Content',
    default: 'Documentation',
    examples: ['Documentation', 'API'],
    publicType: 'string | ReactNode',
    description:
      'Required visible label. Rich phrasing content requires textValue. This example uses “Label” when the input is blank.',
  },
  textValue: {
    kind: 'string',
    group: 'Content',
    default: '',
    publicType: 'string',
    description: 'Full plain-text value for a clipped label. Required with rich phrasing content.',
  },
  removeLabel: {
    kind: 'string',
    group: 'Accessibility',
    default: '',
    publicType: 'string',
    description:
      'Required accessible name for the remove button. With a blank input, the example uses “Remove” followed by the visible label.',
  },
  removeTabIndex: {
    kind: 'enum',
    group: 'Accessibility',
    default: '0',
    publicType: '0 | -1',
    choices: [
      { value: '0', label: 'Sequential focus (0)' },
      { value: '-1', label: 'Programmatic focus (-1)' },
    ],
    description: 'Set -1 when a containing widget coordinates the remove button’s focus.',
  },
  disabled: {
    kind: 'boolean',
    group: 'Availability',
    default: false,
    description: 'Keep the label visible and disable its native remove button.',
  },
  loading: {
    kind: 'boolean',
    group: 'Availability',
    default: false,
    description:
      'Show a spinner while removal is pending. The button retains focus and ignores further requests.',
  },
  ref: referenceProp('Ref<HTMLSpanElement>', 'Receive the passive Tag root.'),
  removeRef: referenceProp('Ref<HTMLButtonElement>', 'Receive the native remove button.'),
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
  title: 'Tag',
  category: 'Feedback & Status',
  status: 'UI',
  summary: 'Assigned values with a dedicated remove action and a clipped-label hint.',
  componentName: 'Tag',
  props,
  constraints: [
    {
      kind: 'precedence',
      when: { disabled: true },
      affects: [{ key: 'loading', value: true }],
      reason: 'Native disabled state takes priority over loading and shows the remove glyph.',
    },
  ],
  render: withOverlaySurface(TagPlayground, 'border-box'),
  code: tagCode,
  states: [
    {
      id: 'palette',
      title: 'Status at each size',
      rows: 'status',
      cols: 'size',
      fixed: { children: 'API' },
      caption: 'Compare all six status colors on the same assigned value at each size.',
    },
    {
      id: 'availability',
      title: 'Disabled and loading',
      rows: 'disabled',
      cols: 'loading',
      fixed: { children: 'Research', iconLeft: 'tag' },
      caption: 'Compare the spinner, native disabled button and their precedence.',
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
      mode: 'live',
      reset: true,
      caption:
        'Hover, press or Tab to the available remove buttons. Compare their feedback with loading and disabled, with and without a leading glyph.',
      render: withOverlaySurface(RemovalStates, 'border-box'),
    },
    tagGroupCases.groups,
    tagGroupCases.locked,
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
      id: 'embedded',
      title: 'Embedded in a field',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'The standalone value clips. In the TagsInput prototype the same value wraps, stays selectable and shares the field’s corner geometry.',
      render: withOverlaySurface(EmbeddedTag, 'border-box'),
    },
    tagGroupCases.removal,
    tagGroupCases.overlay,
  ],
  compositions: [
    {
      id: 'fit',
      title: 'Tags beside fields and controls',
      mode: 'live',
      reset: true,
      caption:
        'Add or remove a label to compare the same collection beside Input, Button and Badge at three sizes.',
      code: fitSource,
      render: withOverlaySurface(({ ctx }) => <FitExample tagProps={ctx.subject} />, 'border-box'),
    },
  ],
});
