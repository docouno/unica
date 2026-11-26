import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import { eventProp } from '../control-props.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { tagGroupCases } from './tag-group-cases.js';
import { tagGroupCode } from './tag-group-code.js';
import { TagGroupForm } from './tag-group-form.examples.js';
import formSource from './tag-group-form.examples.tsx?raw';
import { TagGroupPlayground } from './tag-group-playground.js';
import { ControlledDisclosure } from './tag-groups.examples.js';
import { referenceProp, tagSize } from './tag-props.js';

const props = {
  items: {
    kind: 'slot',
    group: 'Content',
    publicType: 'readonly TagGroupItem[]',
    default: 'assigned',
    description: 'Required ordered items with stable IDs, labels and accessible remove names.',
    choices: [
      { value: 'assigned', label: 'Assigned labels', code: 'items' },
      { value: 'empty', label: 'Empty collection', code: '[]' },
    ],
  },
  'aria-label': {
    kind: 'string',
    group: 'Accessibility',
    default: 'Assigned labels',
    publicType: 'string',
    description: 'Name the toolbar when a visible heading is unavailable.',
  },
  'aria-labelledby': {
    kind: 'enum',
    group: 'Accessibility',
    default: 'none',
    publicType: 'string',
    description: 'Reference a visible heading by ID. The referenced text takes precedence.',
    choices: [
      { value: 'none', label: 'Omit', omit: true },
      { value: 'heading', label: 'Reference heading' },
    ],
  },
  size: tagSize,
  disabled: {
    kind: 'boolean',
    group: 'Availability',
    default: false,
    description: 'Disable the remove buttons. The disclosure remains available.',
  },
  maxVisible: {
    kind: 'number',
    group: 'Disclosure',
    default: 3,
    publicType: 'number',
    examples: [1, 3, 6],
    description: 'This example initially shows three items. Omit maxVisible to show all items.',
  },
  expanded: {
    kind: 'enum',
    group: 'Disclosure',
    default: 'uncontrolled',
    publicType: 'boolean',
    description: 'Supply an owner-controlled value. Choose the initial state for this example.',
    choices: [
      { value: 'uncontrolled', label: 'Uncontrolled', omit: true },
      { value: 'closed', label: 'Controlled, initially collapsed' },
      { value: 'open', label: 'Controlled, initially expanded' },
    ],
  },
  defaultExpanded: {
    kind: 'boolean',
    group: 'Disclosure',
    default: false,
    description: 'Start expanded in uncontrolled mode.',
  },
  messages: {
    kind: 'slot',
    group: 'Language',
    default: 'none',
    publicType: 'Partial<TagGroupMessages>',
    description: 'Customize disclosure copy, the empty label and removal announcements.',
    choices: [
      { value: 'none', label: 'Default messages' },
      { value: 'topics', label: 'Topic messages', code: 'messages' },
    ],
  },
  ref: referenceProp('Ref<HTMLDivElement>', 'Receive the toolbar root.'),
  emptyFocusRef: referenceProp(
    'RefObject<HTMLElement | null>',
    'Send focus to this external element when no group action remains.',
  ),
  onRemove: eventProp(
    'Required. Request removal of the item with this ID.',
    'handleRemove',
    '(id: string) => void',
  ),
  onExpandedChange: eventProp(
    'Receive a request to show or hide the remaining items.',
    'handleExpansion',
    '(expanded: boolean) => void',
  ),
} as const satisfies PropSchema;

export type TagGroupValues = ComponentValues<typeof props>;

export default defineComponent({
  id: 'tag-group',
  title: 'TagGroup',
  category: 'Feedback & Status',
  status: 'UI',
  summary: 'Wrap assigned values into a toolbar with one Tab stop and optional disclosure.',
  componentName: 'TagGroup',
  props,
  constraints: [
    {
      kind: 'precedence',
      when: { 'aria-labelledby': 'heading' },
      affects: ['aria-label'],
      reason: 'The resolved heading supplies the toolbar name.',
    },
    ...(['closed', 'open'] as const).map((expanded) => ({
      kind: 'ignored' as const,
      when: { expanded },
      affects: [{ key: 'defaultExpanded', value: true }],
      reason: 'The controlled expanded value takes precedence over defaultExpanded.',
    })),
  ],
  render: withOverlaySurface(TagGroupPlayground, 'border-box'),
  code: tagGroupCode,
  states: [
    {
      id: 'sizing',
      title: 'Wrapping and availability',
      rows: 'size',
      cols: 'disabled',
      fixed: { maxVisible: 3 },
      caption: 'Compare remove and disclosure buttons at each size with and without removal.',
    },
  ],
  cases: [
    tagGroupCases.groups,
    tagGroupCases.locked,
    {
      id: 'disclosure',
      title: 'Controlled disclosure',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      controls: { accept: { kind: 'boolean', label: 'Accept disclosure requests', default: true } },
      caption: 'Toggle the disclosure and change whether the owner accepts the request.',
      render: withOverlaySurface(ControlledDisclosure, 'border-box'),
    },
    tagGroupCases.removal,
    tagGroupCases.overlay,
  ],
  compositions: [
    {
      id: 'form',
      title: 'Assigned metadata beside a form field',
      mode: 'live',
      reset: true,
      controls: { locked: { kind: 'boolean', label: 'Disable fieldset', default: false } },
      caption:
        'Remove a label, then submit or reset the form. The text field controls the submitted data, and resetting it keeps the remaining labels.',
      code: formSource.replace('useRef<HTMLInputElement>', 'useRef'),
      render: withOverlaySurface(
        ({ ctx }) => (
          <TagGroupForm
            groupProps={ctx.subject}
            fieldsetDisabled={ctx.story?.controls.locked === true}
          />
        ),
        'border-box',
      ),
    },
  ],
});
