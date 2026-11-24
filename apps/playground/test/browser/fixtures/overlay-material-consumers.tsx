import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@docouno/unica';
import type { JSX } from 'react';
import { Combobox } from '../../../src/prototypes/combobox/combobox.proto.js';
import {
  DatePicker,
  DateRangePicker,
} from '../../../src/prototypes/date-picker/date-picker.components.proto.js';
import { Select } from '../../../src/prototypes/select/select.proto.js';

const roles = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor', description: 'Edit pages and publish changes' },
];

export default function OverlayMaterialConsumersFixture(): JSX.Element {
  return (
    <div
      style={{
        display: 'grid',
        justifyItems: 'start',
        gap: 16,
        inlineSize: 'min(100%, 280px)',
        padding: 24,
      }}
    >
      <Select label="Workspace role" options={roles} />
      <Select label="Project role" options={roles} searchable />
      <Combobox label="Assigned role" options={roles} />
      <Popover>
        <PopoverTrigger>Open note</PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>Project note</PopoverTitle>
          <PopoverClose />
        </PopoverContent>
      </Popover>
      <DatePicker label="Start date" />
      <DateRangePicker label="Schedule" />
    </div>
  );
}
