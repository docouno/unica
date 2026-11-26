import { ChipGroup } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { disabled, eventProp, required, size, toggle, choice } from '../control-props.js';
import { previewProps } from '../preview-code.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { FilterFit } from './filter-fit.js';
import fitSource from './filter-fit.tsx?raw';

const items = [
  { value: 'notes', label: 'Notes' },
  { value: 'guides', label: 'Guides' },
  { value: 'archives', label: 'Archives', disabled: true },
] as const;

export default defineComponent({
  id: 'chip-group',
  title: 'ChipGroup',
  componentName: 'ChipGroup',
  category: 'Selection & Pickers',
  status: 'UI',
  summary: 'Choose one or several values using a labeled group of wrapping chips.',
  props: {
    size,
    disabled,
    required,
    multiple: toggle(
      'Interaction',
      'Allow independent checkbox choices. The default is a radio group.',
    ),
    label: {
      kind: 'string',
      group: 'Content',
      description: 'Visible group legend.',
      default: 'Document format',
    },
    name: {
      kind: 'string',
      group: 'Host',
      description: 'FormData key for enabled selections.',
      default: 'format',
      examples: ['format', ''],
    },
    items: {
      kind: 'slot',
      group: 'Content',
      publicType: "ChipGroupProps['items']",
      description:
        'Ordered options with unique values, visible labels, optional icons and availability.',
      choices: [{ value: 'formats', label: 'Document formats', code: 'items' }],
      default: 'formats',
    },
    defaultValue: {
      kind: 'slot',
      group: 'Interaction',
      publicType: 'string | null | readonly string[]',
      description: 'Initial answer restored by form reset. Its shape follows multiple.',
      choices: [
        { value: 'empty', label: 'Unanswered', omit: true },
        { value: 'notes', label: 'Select Notes', code: 'defaultSelection' },
      ],
      default: 'empty',
    },
    status: choice(
      'Semantics',
      'Validation state for the group.',
      ['neutral', 'danger'],
      'neutral',
    ),
    onValueChange: eventProp(
      'Receives the proposed radio value or an array of selected checkbox keys.',
      '(value) => console.log(value)',
      '((value: string) => void) | ((value: readonly string[]) => void)',
    ),
  },
  constraints: [
    {
      kind: 'precedence',
      when: { disabled: true },
      affects: ['required', { key: 'status', value: 'danger' }],
      reason:
        'A disabled group cannot accept an answer and is excluded from validation and submission.',
    },
  ],
  render: withOverlaySurface(({ ctx, values }) => {
    const { multiple, defaultValue, status, label, disabled, required, size, name } = values;
    const common = {
      ...ctx.subject,
      items,
      ...(label ? { label } : { 'aria-label': 'Document format' }),
      disabled,
      required,
      size,
      name: name ? `${ctx.id}-${name}` : name,
      status,
      message: status === 'danger' ? 'Review the selected formats.' : undefined,
      onValueChange: ctx.action('onValueChange'),
    };
    const key = `${multiple}-${defaultValue}`;
    return multiple ? (
      <ChipGroup
        {...common}
        key={key}
        multiple
        defaultValue={defaultValue === 'notes' ? ['notes'] : undefined}
      />
    ) : (
      <ChipGroup
        {...common}
        key={key}
        defaultValue={defaultValue === 'notes' ? 'notes' : undefined}
      />
    );
  }, 'border-box'),
  code: ({ multiple, defaultValue, status, label, disabled, required, size, name }) => {
    const attrs = previewProps(
      { multiple, disabled, required, size, name, status },
      { multiple: false, disabled: false, required: false, size: 'm', status: 'neutral' },
    );
    const initial =
      defaultValue === 'notes'
        ? multiple
          ? ' defaultValue={["notes"]}'
          : ' defaultValue="notes"'
        : '';
    const message = status === 'danger' ? ' message="Review the selected formats."' : '';
    const naming = label ? `label={${JSON.stringify(label)}}` : 'aria-label="Document format"';
    return `import { ChipGroup } from '@docouno/unica';
import '@docouno/unica/styles.css';

const items = ${JSON.stringify(items, null, 2)};

export function DocumentFormats() {
  return (
    <ChipGroup ${naming} items={items}${attrs}${initial}${message}
      onValueChange={(value) => console.log(value)} />
  );
}`;
  },
  states: [
    {
      id: 'selection',
      rows: 'multiple',
      cols: 'defaultValue',
      title: 'Selection models',
      caption: 'Single choice uses radio buttons. Multiple choice uses checkboxes.',
    },
  ],
  compositions: [
    {
      id: 'fit',
      title: 'Size facet in a collection toolbar',
      mode: 'live',
      reset: true,
      caption:
        'Each row starts with 12 favorite results in size M. Select more sizes, change Favorites, or clear all sizes, then Apply to see the matching count.',
      render: withOverlaySurface(({ ctx }) => <FilterFit groupProps={ctx.subject} />, 'border-box'),
      code: fitSource,
    },
  ],
});
