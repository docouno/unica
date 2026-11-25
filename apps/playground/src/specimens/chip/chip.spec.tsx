import { FolderIcon } from '@phosphor-icons/react';
import { Chip } from '../../prototypes/chip/chip.proto.js';
import { defineComponent } from '../../workbench/types.js';
import { size, disabled, choice, toggle, eventProp } from '../control-props.js';
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
  status: 'Proto',
  summary: 'Compact, wrapping choices. A check marks each selected option.',
  componentName: 'Chip',
  form: 'wrap',
  props: {
    size,
    disabled,
    type: {
      ...choice(
        'Interaction',
        'Preview a native checkbox or radio. The standalone copy uses a checkbox. Single and multiple choice shows radio groups.',
        ['checkbox', 'radio'],
        'checkbox',
      ),
      demo: true,
    },
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
    onChange: eventProp(
      'Receives the native input’s React change event. The event log shows its checked value.',
      '(event) => console.log(event.currentTarget.checked)',
      'ChangeEventHandler<HTMLInputElement>',
    ),
  },
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
        onChange={(event) => ctx.action('onChange')(event.currentTarget.checked)}
      >
        Collections
      </Chip>
    );
  }, 'border-box'),
  code: (values) => {
    const { iconLeft, size, disabled, defaultChecked } = values;
    const attrs = previewProps(
      { size, disabled, defaultChecked },
      { size: 'm', disabled: false, defaultChecked: false },
    );
    return `import { Chip } from './prototypes/chip/chip.proto.js';
${iconLeft === 'folder' ? "import { FolderIcon } from '@phosphor-icons/react';\n" : ''}import '@docouno/unica/styles.css';

export function CollectionFilter() {
  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <Chip name="formats" value="collections"${attrs}${iconLeft === 'folder' ? ' iconLeft={FolderIcon}' : ''} onChange={(event) => console.log(event.currentTarget.checked)}>Collections</Chip>
    </form>
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
        'The first rows pin rest, hover, press, focus and disabled choices with and without a check. The three outlines compare keyboard focus at each size. Tab to the live choices to try focus and activation.',
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
      ],
      caption:
        'Change a topic to preview waiting feedback. Preview failure keeps the selected topics available. Show results confirms the current count after waiting or a failure.',
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
      code: fitSource.replaceAll('../../prototypes/', './prototypes/'),
    },
  ],
});
