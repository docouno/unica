import { createRef } from 'react';
import {
  Listbox,
  ListboxGroup,
  ListboxOption,
  Select,
  SelectContent,
  SelectGroup,
  SelectOption,
  SelectTrigger,
} from '../src/index.js';
import type {
  ListboxGroupProps,
  ListboxItem,
  ListboxOptionProps,
  ListboxProps,
  ListboxSection,
  PickerMessages,
  SelectContentProps,
  SelectGroupProps,
  SelectOptionProps,
  SelectProps,
  SelectTriggerProps,
} from '../src/server.js';

const button = createRef<HTMLButtonElement>();
const div = createRef<HTMLDivElement>();
const options: readonly (ListboxItem | ListboxSection)[] = [
  { value: '__proto__', label: 'Reserved spelling', description: undefined },
  { label: 'Team', options: [{ value: '', label: 'Empty key' }] },
];

const messages = {
  selectionAnnouncement: (labels) => labels.join(' · '),
  selectedCount: (count) => `${count} chosen`,
} satisfies Partial<PickerMessages>;

const listbox: ListboxProps = {
  'aria-label': 'Roles',
  options,
  defaultValue: '',
  messages,
  onValueChange: (next: string | null) => String(next),
};
const wrappedListGroup: ListboxGroupProps = { ref: div, label: 'Team' };
const listOption: ListboxOptionProps = { ref: div, value: 'a', label: 'Analyst' };
const select: SelectProps = {
  ref: button,
  'aria-labelledby': 'roles-label',
  multiple: true,
  defaultValue: [''],
  onValueChange: (next: readonly string[]) => next.join(),
  name: 'role',
  form: 'settings',
  options,
};
const trigger: SelectTriggerProps = { ref: button, title: 'Full title' };
const content: SelectContentProps = { ref: div, className: 'role-panel' };
const group: SelectGroupProps = { ref: div, label: 'Workspace' };
const row: SelectOptionProps = { ref: div, value: '', label: 'Empty key' };

<Listbox {...listbox} ref={div} value={null} />;
<Listbox
  aria-label="Roles"
  multiple
  defaultValue={['']}
  onValueChange={(next) => next.includes('')}
>
  <ListboxGroup {...wrappedListGroup}>
    <ListboxOption {...listOption} />
  </ListboxGroup>
</Listbox>;
<div role="listbox" aria-label="External collection">
  <ListboxOption {...listOption} reserveIconSpace selected active size="s" />
</div>;
<Select {...select} searchable clearable>
  <SelectTrigger {...trigger} />
  <SelectContent {...content} />
</Select>;
<Select options={options} value={null} defaultValue={null} />;
<Select value="" onValueChange={(next) => next?.trim()} status="warning" variant="ghost">
  <SelectTrigger {...trigger} />
  <SelectContent {...content}>
    <SelectGroup {...group}>
      <SelectOption {...row} />
    </SelectGroup>
  </SelectContent>
</Select>;

// @ts-expect-error A listbox needs an accessible name.
<Listbox options={options} />;
// @ts-expect-error Catalog data and option children are alternatives.
<Listbox aria-label="Choices" options={options}>
  <ListboxOption {...listOption} />
</Listbox>;
// @ts-expect-error Multiple answers are arrays.
<Listbox aria-label="Choices" options={options} multiple value="a" />;
// @ts-expect-error Single answers are strings or null.
<Select options={options} defaultValue={['']} />;
// @ts-expect-error Multiple callbacks receive a readonly array.
<Select options={options} multiple onValueChange={(values: string[]) => values.push('a')} />;
// @ts-expect-error Each part owns its native element and ref type.
<SelectTrigger ref={div} />;
// @ts-expect-error A trigger cannot submit the ancestor form.
<SelectTrigger type="submit" />;
// @ts-expect-error The popup owns its native mode.
<SelectContent popover="manual" />;
// @ts-expect-error Managed options get selection from their Select root.
<SelectOption {...row} selected />;
// @ts-expect-error A label is associated through native label or ARIA.
<Select options={options} label="Choices" />;
// @ts-expect-error Theming owns material recipes.
<Select options={options} appearance="glass" />;
// @ts-expect-error Preview states are not part of the package.
<Select options={options} previewState="open" />;

// @ts-expect-error Visibility comes from the rendered collection.
<ListboxOption {...listOption} hidden />;
// @ts-expect-error A group and its choices stay in the same interaction model.
<ListboxGroup {...wrappedListGroup} inert />;
// @ts-expect-error A managed option is exposed to assistive technology.
<SelectOption {...row} aria-hidden="true" />;
// @ts-expect-error Omit the group to remove its choices from the catalog.
<SelectGroup {...group} hidden />;
