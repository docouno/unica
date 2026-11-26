import type { PickerMessages } from '@docouno/unica';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import { disabled, eventProp, readOnly, required, size, toggle } from '../control-props.js';

const savedLabels = { retired: 'Previous assignment' };
const customMessages = {
  unavailableGroup: 'Saved outside this catalog',
  removeUnavailable: 'Remove this saved answer',
} satisfies Partial<PickerMessages>;

export const pickerProps = {
  size,
  multiple: toggle('Interaction', 'Toggle several values immediately in selection order.'),
  disabled,
  readOnly: {
    ...readOnly,
    description: 'Keep the committed answer while allowing users to browse available options.',
  },
  required,
  value: {
    kind: 'enum',
    group: 'Interaction',
    description:
      'Supply a controlled answer. Hold a saved value to see proposals in the event log.',
    publicType: 'string | null or readonly string[] with multiple',
    default: 'omitted',
    choices: [
      { value: 'omitted', label: 'Uncontrolled', omit: true },
      { value: 'selected', label: 'Hold the selected option' },
    ],
  },
  defaultValue: {
    kind: 'enum',
    group: 'Interaction',
    description: 'Set the initial uncontrolled answer restored by native form reset.',
    publicType: 'string | null or readonly string[] with multiple',
    default: 'selected',
    choices: [
      { value: 'selected', label: 'Selected option' },
      { value: 'empty', label: 'Empty answer' },
      { value: 'retired', label: 'Saved option missing from the catalog' },
    ],
  },
  name: {
    kind: 'string',
    group: 'Host',
    default: 'choice',
    description: 'Form data key. Multiple selections use repeated entries under this name.',
  },
  form: {
    kind: 'enum',
    group: 'Host',
    publicType: 'string',
    description: 'ID of the form that owns the native carrier. Omit to use its ancestor form.',
    default: 'omitted',
    choices: [
      { value: 'omitted', label: 'Ancestor form', omit: true },
      { value: 'explicit', label: 'Explicit form ID' },
    ],
  },
  selectedLabels: {
    kind: 'enum',
    group: 'Content',
    publicType: 'Readonly<Record<string, string>>',
    description: 'Last-resort labels for saved keys when their catalog options are unavailable.',
    default: 'omitted',
    choices: [
      { value: 'omitted', label: 'Use the default unavailable label', omit: true },
      { value: 'provided', label: 'Use the saved option label' },
    ],
  },
  messages: {
    kind: 'enum',
    group: 'Content',
    publicType: 'Partial<PickerMessages>',
    description: 'Override built-in strings and formatters for the current locale.',
    default: 'omitted',
    choices: [
      { value: 'omitted', label: 'Default messages', omit: true },
      { value: 'custom', label: 'Custom unavailable messages' },
    ],
  },
  onValueChange: eventProp(
    'Reports a committed uncontrolled change or a controlled proposal. Single selection reports a key or null. Multiple selection reports keys in selection order.',
    '(value) => console.log(value)',
    '(value: string | null) => void or (value: readonly string[]) => void with multiple',
  ),
} as const satisfies PropSchema;

type PickerValues = ComponentValues<typeof pickerProps>;

export const pickerConstraints = [
  {
    kind: 'precedence',
    when: { value: 'selected' },
    affects: ['defaultValue'],
    reason: 'The controlled value determines the answer and the native reset value.',
  },
  {
    kind: 'precedence',
    when: { disabled: true },
    affects: ['required', 'readOnly'],
    reason: 'Disabled pickers skip interaction, validation, and submission.',
  },
  {
    kind: 'ignored',
    when: { readOnly: true },
    affects: ['required'],
    reason: 'A read-only picker keeps its answer and cannot require a new choice.',
  },
] as const;

export function pickerSelection(
  values: PickerValues,
  selected: string,
  onValueChange: (value: string | null | readonly string[]) => void,
) {
  const initial = values.defaultValue === 'selected' ? selected : values.defaultValue;
  const single = initial === 'empty' ? null : initial;
  if (values.multiple) {
    return {
      multiple: true as const,
      value: values.value === 'selected' ? [selected] : undefined,
      defaultValue: single === null ? [] : [single],
      onValueChange,
    };
  }
  return {
    multiple: false as const,
    value: values.value === 'selected' ? selected : undefined,
    defaultValue: single,
    onValueChange,
  };
}

export function pickerSelectionCode(values: PickerValues, selected: string): string {
  const initial = values.defaultValue === 'selected' ? selected : values.defaultValue;
  const value = values.value === 'selected' ? selected : initial;
  const item = value === 'empty' ? null : value;
  const answer = values.multiple ? (item === null ? [] : [item]) : item;
  const prop = values.value === 'selected' ? 'value' : 'defaultValue';
  return ` ${prop}={${JSON.stringify(answer)}} onValueChange={(answer) => console.log(answer)}`;
}

export function pickerContent(values: PickerValues) {
  return {
    name: values.name || undefined,
    selectedLabels: values.selectedLabels === 'provided' ? savedLabels : undefined,
    messages: values.messages === 'custom' ? customMessages : undefined,
  };
}

export function pickerContentCode(values: PickerValues): string {
  return [
    values.name ? ` name={${JSON.stringify(values.name)}}` : '',
    values.form === 'explicit' ? ' form={formId}' : '',
    values.selectedLabels === 'provided' ? ` selectedLabels={${JSON.stringify(savedLabels)}}` : '',
    values.messages === 'custom' ? ` messages={${JSON.stringify(customMessages)}}` : '',
  ].join('');
}
