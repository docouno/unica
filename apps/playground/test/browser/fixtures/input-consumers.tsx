import type { ReactElement } from 'react';
import { useState } from 'react';
import { FormField, Select } from '@docouno/unica';
import { FileInput } from '../../../src/prototypes/file-input/file-input.proto.js';
import { Autocomplete, Combobox } from '../../../src/prototypes/combobox/combobox.proto.js';
import {
  DatePicker,
  DateRangePicker,
} from '../../../src/prototypes/date-picker/date-picker.proto.js';
import { NumberInput } from '../../../src/prototypes/number-input/number-input.proto.js';

const choices = [
  { value: 'notes', label: 'Research notes' },
  { value: 'releases', label: 'Release notes' },
];

export default function InputConsumers(): ReactElement {
  const [updates, setUpdates] = useState<readonly unknown[]>([]);
  const note = (value: unknown): void => setUpdates((previous) => [...previous, value]);
  return (
    <div style={{ display: 'grid', gap: 16, padding: 12 }}>
      <form
        data-testid="picker-form"
        onSubmit={(event) => {
          event.preventDefault();
          note('submit');
        }}
      >
        <div data-testid="catalog-picker">
          <Combobox
            label="Catalog entry"
            defaultSelection={choices[0]}
            onSelectionChange={(option) => note(['selection', option?.value ?? null])}
            onQueryChange={(text) => note(['query', text])}
            options={choices}
            status="warning"
            searchState="loading"
          />
        </div>
        <div data-testid="free-picker">
          <Autocomplete
            label="Entry title"
            name="title"
            defaultValue="Draft title"
            onTextChange={(text) => note(['title', text])}
            options={choices}
            browsable
            status="info"
            searchState="loading"
          />
        </div>
        <button type="reset">Reset picker form</button>
      </form>
      <div data-testid="date-picker">
        <DatePicker
          label="Review date"
          defaultValue="2026-09-16"
          unavailable={['2026-09-17']}
          status="warning"
          loading
          clearable
        />
      </div>
      <div data-testid="range-picker">
        <DateRangePicker
          label="Review range"
          defaultValue={['2026-09-14', '2026-09-23']}
          clearable
          readOnly
        />
      </div>
      <div data-testid="search-select">
        <Combobox label="Search choice" options={choices} defaultSelection={choices[0]} />
      </div>
      <div data-testid="trigger-select">
        <FormField
          label="Primary choice"
          description="Select a value."
          status="danger"
          message="Choose a catalog entry."
        >
          <Select options={choices} searchable />
        </FormField>
      </div>
      <div data-testid="file-readonly">
        <FileInput
          label="Approved attachment"
          description="A saved reference."
          initialFileName="plan.pdf"
          readOnly
        />
      </div>
      <div data-testid="file-editable">
        <FileInput
          label="Upload attachment"
          aria-label="Attachment for case 42"
          description="Attach a document."
          name="attachment"
        />
      </div>
      <div data-testid="number-fields">
        <NumberInput label="Compact count" size="s" defaultValue={3} />
        <NumberInput
          label="Touch count"
          size="l"
          defaultValue={3}
          description="Use whole numbers."
        />
      </div>
      <div data-testid="disabled-date">
        <DatePicker
          label="Disabled date"
          disabled
          status="danger"
          description="Date entry is unavailable."
        />
      </div>
      <output data-testid="picker-updates">{JSON.stringify(updates)}</output>
    </div>
  );
}
