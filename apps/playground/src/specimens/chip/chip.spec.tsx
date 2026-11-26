import { FolderIcon } from '@phosphor-icons/react';
import { Chip } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { size, disabled, required, toggle, eventProp } from '../control-props.js';
import { previewProps } from '../preview-code.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import {
  SelectionWidths,
  Interaction,
  Groups,
  Availability,
  Overflow,
  Validation,
  ResultFeedback,
  FloatingFilters,
} from './chip.examples.js';
import { FilterFit } from './filter-fit.js';
import fitSource from './filter-fit.tsx?raw';

export default defineComponent({
  id: 'chip',
  title: 'Chip',
  category: 'Selection & Pickers',
  status: 'UI',
  summary: 'Compact, wrapping choices. A check marks each selected option.',
  componentName: 'Chip',
  props: {
    size,
    disabled,
    required,
    defaultChecked: toggle('Interaction', 'Start with the option selected.'),
    iconLeft: {
      kind: 'slot',
      group: 'Content',
      default: 'none',
      publicType: 'GlyphSource',
      description: 'Leading option icon. A check replaces it when selected.',
      choices: [
        { value: 'none', label: 'None', omit: true },
        { value: 'folder', label: 'Folder', code: 'FolderIcon' },
      ],
    },
    onCheckedChange: eventProp(
      'Receives a proposed checked value. The controlled owner decides whether to accept it.',
      '(checked) => console.log(checked)',
      '(checked: boolean) => void',
    ),
    onChange: eventProp(
      'Receives the native input’s React change event. The event log shows its checked value.',
      '(event) => console.log(event.currentTarget.checked)',
      'ChangeEventHandler<HTMLInputElement>',
    ),
  },
  constraints: [
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: ['required'],
      reason: 'An unavailable checkbox is excluded from validation and submission.',
    },
  ],
  render: withOverlaySurface(({ values, ctx }) => {
    const { iconLeft, ...control } = values;
    return (
      <Chip
        {...control}
        {...ctx.subject}
        key={String(values.defaultChecked)}
        name="formats"
        value="collections"
        style={{ justifySelf: 'center', alignSelf: 'center' }}
        iconLeft={iconLeft === 'folder' ? FolderIcon : undefined}
        onCheckedChange={ctx.action('onCheckedChange')}
        onChange={(event) => ctx.action('onChange')(event.currentTarget.checked)}
      >
        Collections
      </Chip>
    );
  }, 'border-box'),
  code: (values) => {
    const { iconLeft, size, disabled, required, defaultChecked } = values;
    const attrs = previewProps(
      { size, disabled, required, defaultChecked },
      { size: 'm', disabled: false, required: false, defaultChecked: false },
    );
    return `import { Chip } from '@docouno/unica';
${iconLeft === 'folder' ? "import { FolderIcon } from '@phosphor-icons/react';\n" : ''}import '@docouno/unica/styles.css';

export function CollectionFilter() {
  return (
    <Chip
      name="formats"
      value="collections"${attrs}${iconLeft === 'folder' ? ' iconLeft={FolderIcon}' : ''}
      onCheckedChange={(checked) => console.log(checked)}
      onChange={(event) => console.log(event.currentTarget.checked)}
    >
      Collections
    </Chip>
  );
}`;
  },
  states: [
    {
      id: 'anatomy',
      rows: 'size',
      cols: 'defaultChecked',
      group: 'iconLeft',
      title: 'Scale and selection',
      caption:
        'Compare the three chip sizes with and without a leading icon. Activate a chip to compare its checked appearance with its starting state.',
    },
  ],
  cases: [
    {
      id: 'selection-widths',
      title: 'Stable widths and icon replacement',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'At 100% text, the base face heights are 20, 24 and 28px. Larger text can increase them. Toggle Research and Collections to compare their stable widths and see the folder give way to a check.',
      render: withOverlaySurface(SelectionWidths, 'border-box'),
    },
    {
      id: 'groups',
      title: 'Single and multiple choice',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      actions: [
        { id: 'all', label: 'Select all available topics' },
        { id: 'clear', label: 'Clear topics' },
      ],
      caption:
        'Arrow keys select a format. Tab visits individual topics and Space toggles them. Select all or clear the available topics together.',
      render: withOverlaySurface(Groups, 'border-box'),
    },
    {
      id: 'states',
      title: 'Interaction states',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Hover, hold the pointer down, and Tab to each size to compare the real input states. Unavailable choices stay visible and retain their check when selected.',
      render: withOverlaySurface(Interaction, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Unavailable values',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      controls: { locked: { kind: 'boolean', label: 'Lock the whole group', default: false } },
      caption:
        'PDF remains selected by policy. Toggle Markdown or HTML, then lock the group to inspect the retained choices while every option is disabled.',
      render: withOverlaySurface(Availability, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Long names and narrow spaces',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Hover or focus a clipped name to inspect it. On touch, open the full-name chooser before selecting. Both sets of choices update the same selection.',
      render: withOverlaySurface(Overflow, 'border-box'),
    },
    {
      id: 'validation',
      title: 'Required choice',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Continue with no format selected to focus the first option and show the group error. Choose a format and continue to confirm it. Clear choice restores the unanswered question.',
      render: withOverlaySurface(Validation, 'border-box'),
    },
    {
      id: 'feedback',
      title: 'Selection and result feedback',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      actions: [
        { id: 'show', label: 'Show results' },
        { id: 'fail', label: 'Preview failure' },
        { id: 'stale', label: 'Finish previous update' },
      ],
      caption:
        'Change a topic to preview waiting feedback. Preview failure keeps the selected topics available. Finish previous update leaves the current request in place. Show results confirms the current count.',
      render: withOverlaySurface(ResultFeedback, 'border-box'),
    },
    {
      id: 'overlay',
      title: 'On a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      mode: 'live',
      reset: true,
      caption:
        'Select content types and toggle Favorites only on the same surface. Compare the option materials on Base and Overlay.',
      render: FloatingFilters,
    },
  ],
  compositions: [
    {
      id: 'fit',
      title: 'Compact geometry and neighboring controls',
      mode: 'live',
      reset: true,
      caption:
        'Compare the independent control heights at each density. All three rows start with 12 favorite Design systems results in size M. Change Favorites or the size chips, then Apply to update that row’s count. Clearing all sizes includes every size.',
      render: withOverlaySurface(({ ctx }) => <FilterFit chipProps={ctx.subject} />, 'border-box'),
      code: fitSource,
    },
  ],
});
