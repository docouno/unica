import {
  size,
  variant,
  status,
  width,
  disabled,
  readOnly,
  clearable,
  loading,
  toggle,
  eventProp,
} from '../control-props.js';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { GlobeHemisphereWestIcon } from '@phosphor-icons/react';
import { Button } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { Select } from '../../prototypes/select/select.proto.js';
import { regionOptions, roleOptions, simpleOptions } from '../../prototypes/select/select.data.js';
import { Study, StudyNote } from '../../prototypes/select/select.examples.js';

function LiveSelect(): ReactElement {
  const [values, setValues] = useState<readonly string[]>(['amsterdam', 'london']);
  const [value, setValue] = useState<string | null>('editor');
  return (
    <div className="select-study-live-proto">
      <StudyNote>
        Live native popovers. Click outside, press Escape, or Tab away. Arrows browse without
        changing the saved answer. Multiple choices apply immediately; search never clears them.
      </StudyNote>
      <Select
        label="Workspace role"
        options={roleOptions}
        value={value}
        onValueChange={setValue}
        clearable
      />
      <Select
        label="Deployment regions"
        options={regionOptions}
        values={values}
        onValuesChange={setValues}
        multiple
        searchable
        placeholder="Choose regions…"
      />
      <Button variant="secondary" tone="neutral" size="s" width="auto">
        Next focus target
      </Button>
      <div className="select-study-result-proto" aria-live="polite">
        Saved role: {value ?? 'None'} · Regions:{' '}
        {values.length
          ? values
              .map((key) => regionOptions.find((option) => option.value === key)?.label)
              .join(', ')
          : 'None'}
      </div>
    </div>
  );
}
function DataStates(): ReactElement {
  const [state, setState] = useState('failed');
  return (
    <div className="select-study-stack-proto">
      <label className="select-study-native-control-proto">
        Preview data state
        <select value={state} onChange={(event) => setState(event.currentTarget.value)}>
          <option value="ready">Ready</option>
          <option value="loading">Loading</option>
          <option value="empty">Empty catalog</option>
          <option value="failed">Load failed</option>
        </select>
      </label>
      <Select
        label="Available regions"
        options={state === 'empty' ? [] : regionOptions}
        defaultValue="london"
        orphanLabels={{ london: 'London' }}
        loading={state === 'loading'}
        previewOpen
        errorState={
          state === 'failed' ? (
            <span className="select-empty-copy-proto">
              <strong>Regions couldn’t be loaded</strong>
              <span>Your saved selection is kept.</span>
              <Button
                className="select-empty-action"
                size="s"
                variant="secondary"
                tone="neutral"
                onClick={() => setState('ready')}
              >
                Try again
              </Button>
            </span>
          ) : undefined
        }
        emptyState="No regions are available yet."
      />
      <StudyNote>
        This selector pins a data state. Try again restores local options; no request is sent. A
        previous answer stays visible during loading and failure.
      </StudyNote>
    </div>
  );
}
export default defineComponent({
  id: 'select',
  title: 'Select',
  category: 'Selection & Pickers',
  status: 'Proto',
  summary:
    'A compact catalog picker with shared Listbox rows, optional search and a stable one-line summary.',
  componentName: 'Select',
  props: {
    size,
    variant,
    status,
    width,
    disabled,
    readOnly,
    clearable,
    loading,
    multiple: toggle('Selection', 'Allow selection of several results.'),
    searchable: toggle('Selection', 'Allow typing a query in the options panel.'),
    onValueChange: eventProp(
      'Reports the selected value in single selection.',
      'handleValueChange',
    ),
    onValuesChange: eventProp(
      'Reports selected values in multiple selection.',
      'handleValuesChange',
    ),
  },
  render: ({ values, ctx }) => (
    <Select
      {...values}
      {...ctx.subject}
      id={ctx.id}
      label="Deployment region"
      options={regionOptions}
      defaultValue="amsterdam"
      defaultValues={['amsterdam']}
      onValueChange={ctx.action('onValueChange')}
      onValuesChange={ctx.action('onValuesChange')}
    />
  ),
  code: ({ multiple }, attributes) => {
    const selection = multiple ? "defaultValues={['amsterdam']}" : 'defaultValue="amsterdam"';
    return `<Select label="Deployment region" options={regionOptions} ${selection}${attributes} />`;
  },
  matrixViews: [
    {
      id: 'roles',
      rows: 'size',
      cols: 'variant',
      title: 'Default & ghost · S / M / L',
      reference: () => (
        <div className="select-study-grid-proto">
          {(['s', 'm', 'l'] as const).map((size) => (
            <Study
              title={`${size.toUpperCase()} · ${size === 's' ? '30' : size === 'm' ? '40' : '48'}px`}
              key={size}
            >
              <Select
                size={size}
                options={simpleOptions}
                label="Workspace role"
                defaultValue="editor"
              />
              <Select
                size={size}
                variant="ghost"
                options={simpleOptions}
                defaultValue="viewer"
                aria-label={`Inline role ${size}`}
                width="auto"
              />
              <Select
                size={size}
                options={regionOptions}
                defaultValue="london"
                iconLeft={GlobeHemisphereWestIcon}
                aria-label={`Region ${size}`}
              />
            </Study>
          ))}
        </div>
      ),
    },
  ],
  cases: [
    {
      id: 'panels',
      title: 'Single & multiple · open anatomy',
      surface: 'overlay',
      overlayStage: true,
      kind: 'behavior',
      render: () => (
        <div className="select-study-grid-proto">
          <Study
            title="Single · explicit selection"
            note="These panels stay open for material comparison. The live example closes after a single choice."
          >
            <Select
              label="Workspace role"
              options={roleOptions}
              defaultValue="editor"
              previewOpen
            />
          </Study>
          <Study
            title="Multiple · search & selection"
            note="Search and clear-selection are separate actions. Header stays visible while the list scrolls."
          >
            <Select
              label="Deployment regions"
              options={regionOptions}
              multiple
              defaultValues={['amsterdam', 'london']}
              searchable
              previewOpen
              previewActive="london"
            />
          </Study>
        </div>
      ),
    },
    {
      id: 'states',
      title: 'Trigger states',
      kind: 'behavior',
      render: () => (
        <div className="select-study-grid-proto">
          <Study title="Empty">
            <Select label="Workspace role" options={simpleOptions} placeholder="Choose a role…" />
          </Study>
          {(['hover', 'pressed', 'focus'] as const).map((state) => (
            <Study
              key={state}
              title={
                state === 'focus'
                  ? 'Keyboard focus'
                  : state === 'pressed'
                    ? 'Pressed · no translation'
                    : 'Hover'
              }
            >
              <Select
                label="Workspace role"
                options={simpleOptions}
                defaultValue="editor"
                previewState={state}
              />
            </Study>
          ))}
          <Study title="Disabled">
            <Select label="Workspace role" options={simpleOptions} value="editor" disabled />
          </Study>
          <Study title="Read only · can still browse">
            <Select label="Workspace role" options={roleOptions} defaultValue="editor" readOnly />
          </Study>
          <StudyNote>
            Labeled hover, press and focus examples pin appearance. Open controls transfer the focus
            treatment to the panel content; no ring remains on the trigger.
          </StudyNote>
        </div>
      ),
    },
    {
      id: 'feedback',
      title: 'Field feedback · neutral panel',
      kind: 'behavior',
      render: () => (
        <div className="select-study-grid-proto">
          <Study title="Required · no answer">
            <Select
              label="Workspace role"
              required
              options={simpleOptions}
              placeholder="Choose a role…"
              status="danger"
              message="Choose a role before inviting people."
            />
          </Study>
          <Study title="Warning">
            <Select
              label="Workspace role"
              options={simpleOptions}
              defaultValue="editor"
              status="warning"
              message="Editors can publish to shared spaces."
            />
          </Study>
          <Study title="Success">
            <Select
              label="Deployment region"
              options={regionOptions}
              defaultValue="london"
              status="success"
              message="This region meets your residency policy."
            />
          </Study>
          <Study title="Information">
            <Select
              label="Deployment region"
              options={regionOptions}
              defaultValue="london"
              status="info"
              message="Your organization recommends London."
            />
          </Study>
          <Study
            title="Invalid field · ordinary options"
            note="Field status never turns the choice list red."
          >
            <Select
              label="Workspace role"
              options={simpleOptions}
              status="danger"
              message="Select an available role."
              previewOpen
            />
          </Study>
          <Study title="Ghost · invalid inline value">
            <Select
              variant="ghost"
              label="Workspace role"
              options={simpleOptions}
              status="danger"
              placeholder="Choose a role…"
              message="A role is required for this member."
            />
          </Study>
          <Study title="Disabled overrides validation & loading">
            <Select
              label="Workspace role"
              options={simpleOptions}
              defaultValue="editor"
              status="danger"
              disabled
              loading
              message="Choose a role before continuing."
              description="Managed by your organization."
            />
          </Study>
        </div>
      ),
    },
    {
      id: 'search',
      title: 'Search & empty results',
      kind: 'behavior',
      render: () => (
        <div className="select-study-grid-proto">
          <Study
            title="Filtered · hidden selection retained"
            note="London stays selected while only Americas match. Clear search restores the full catalog."
          >
            <Select
              label="Deployment regions"
              options={regionOptions}
              multiple
              defaultValues={['london', 'virginia']}
              searchable
              previewOpen
              previewQuery="Americas"
            />
          </Study>
          <Study
            title="No matching results"
            note="Clear the query inside the search field; it does not clear the answer."
          >
            <Select
              label="Deployment region"
              options={regionOptions}
              defaultValue="london"
              searchable
              previewOpen
              previewQuery="Oslo"
              clearable
            />
          </Study>
          <Study title="Empty catalog">
            <Select
              label="Deployment region"
              options={[]}
              previewOpen
              emptyState="No regions are available yet."
            />
          </Study>
        </div>
      ),
    },
    {
      id: 'loading',
      title: 'Loading, refresh & recovery',
      kind: 'behavior',
      render: () => (
        <div className="select-study-grid-proto">
          <Study
            title="First load · S / M / L"
            note="The shared Spinner owns its theme-specific drawing and motion. There is no catalog to search yet."
          >
            {(['s', 'm', 'l'] as const).map((size) => (
              <Select
                key={size}
                size={size}
                options={[]}
                loading
                searchable
                previewOpen
                aria-label={`Initial load ${size}`}
              />
            ))}
          </Study>
          <Study
            title="Refresh · known catalog"
            note="Existing options and saved answers stay readable. Browse and search remain available; changes wait for the refresh."
          >
            <Select
              label="Deployment regions"
              options={regionOptions.slice(0, 3)}
              multiple
              defaultValues={['amsterdam', 'london']}
              loading
              searchable
              previewOpen
            />
          </Study>
          <Study title="Failed request · explicit recovery">
            <DataStates />
          </Study>
          <Study
            title="Read only · refresh"
            note="The value remains readable while new options arrive. Loading never enables editing."
          >
            <Select
              label="Workspace role"
              options={simpleOptions}
              defaultValue="editor"
              readOnly
              loading
              previewOpen
            />
          </Study>
        </div>
      ),
    },
    {
      id: 'availability',
      title: 'Read only & unavailable selections',
      kind: 'behavior',
      render: () => (
        <div className="select-study-grid-proto">
          <Study
            title="Read only + search"
            note="Browse and filter. Choices and selection clearing stay locked."
          >
            <Select
              label="Workspace role"
              options={roleOptions}
              defaultValue="editor"
              readOnly
              searchable
              previewOpen
            />
          </Study>
          <Study
            title="Saved option removed"
            note="The saved row explains its status. Select it to remove the answer, or choose a replacement."
          >
            <Select
              label="Workspace role"
              options={simpleOptions}
              defaultValue="maintainer"
              orphanLabels={{ maintainer: 'Maintainer' }}
              clearable
              previewOpen
            />
          </Study>
          <Study
            title="Remove one unavailable answer"
            note="Removing Maintainer keeps the valid Editor selection."
          >
            <Select
              label="Workspace roles"
              options={simpleOptions}
              multiple
              defaultValues={['editor', 'maintainer']}
              orphanLabels={{ maintainer: 'Maintainer' }}
              previewOpen
              searchable
            />
          </Study>
          <Study title="Saved option disabled">
            <Select label="Workspace role" options={roleOptions} defaultValue="admin" previewOpen />
          </Study>
          <Study title="All options disabled">
            <Select
              label="Workspace role"
              options={simpleOptions.map((option) => ({ ...option, disabled: true }))}
              previewOpen
              description="Your administrator manages these roles."
            />
          </Study>
        </div>
      ),
    },
    {
      id: 'summary',
      title: 'One line · meaningful labels & overflow',
      kind: 'behavior',
      render: () => (
        <div className="select-study-grid-proto">
          <Study title="Full width · names before counts">
            <Select
              label="Deployment regions"
              options={regionOptions}
              multiple
              defaultValues={['amsterdam', 'london', 'stockholm']}
            />
          </Study>
          <Study title="Compact filter · remaining names in +N">
            <div className="select-study-narrow-proto">
              <Select
                size="s"
                variant="ghost"
                aria-label="Filter regions"
                options={regionOptions}
                multiple
                defaultValues={['amsterdam', 'frankfurt', 'london', 'stockholm', 'virginia']}
              />
            </div>
          </Study>
          <Study
            title="Long value · fixed height"
            note="The full value remains available in the panel and accessible name."
          >
            <Select
              label="Permission policy"
              options={[
                {
                  value: 'long',
                  label: 'Organization-wide editorial and publishing permissions',
                  description: 'Review and publish changes across every workspace.',
                },
                ...simpleOptions,
              ]}
              defaultValue="long"
            />
          </Study>
          <Study title="Long placeholder">
            <Select
              label="Permission policy"
              options={simpleOptions}
              placeholder="Choose an organization-wide permission policy…"
            />
          </Study>
        </div>
      ),
    },
    {
      id: 'live',
      title: 'Live · focus, dismissal & search',
      kind: 'behavior',
      render: () => <LiveSelect />,
    },
  ],
});
