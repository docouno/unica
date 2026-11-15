import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { WarningCircleIcon } from '@phosphor-icons/react';
import { defineSpecimen } from '../../workbench/types.js';
import { Button } from '../button/button.proto.js';
import { Checkbox, CheckboxGroup } from './binary-controls.proto.js';
import { Sample, SurfacePair } from './binary-controls.examples.js';

function Sizes(): ReactElement {
  return (
    <div className="binary-demo-stack">
      {(['s', 'm', 'l'] as const).map((size) => (
        <div className="binary-demo-size" key={size}>
          <span className="binary-demo-caption">
            {size.toUpperCase()} ·{' '}
            {size === 's'
              ? '16px / 30px row'
              : size === 'm'
                ? '20px / 40px row'
                : '24px / 48px row'}
          </span>
          <div className="binary-demo-row">
            <Checkbox size={size} label="Unselected" />
            <Checkbox size={size} label="Selected" defaultChecked />
            <Checkbox size={size} label="Partly selected" indeterminate />
          </div>
        </div>
      ))}
    </div>
  );
}

function Interaction(): ReactElement {
  return (
    <div>
      {(['rest', 'hover', 'active', 'focus'] as const).map((state) => (
        <div className="binary-demo-state" key={state}>
          <span className="binary-demo-caption">
            {state === 'focus'
              ? 'Keyboard focus'
              : state === 'active'
                ? 'Pressed'
                : state === 'hover'
                  ? 'Hover'
                  : 'Rest'}
          </span>
          <Checkbox aria-label={`${state} unselected`} previewState={state} />
          <Checkbox aria-label={`${state} selected`} defaultChecked previewState={state} />
          <Checkbox aria-label={`${state} mixed`} indeterminate previewState={state} />
        </div>
      ))}
    </div>
  );
}

function Availability(): ReactElement {
  return (
    <div className="binary-demo-grid">
      <Sample title="Read-only · full-contrast value">
        <Checkbox
          label="Essential updates"
          description="Required by your organization."
          readOnly
          defaultChecked
        />
        <Checkbox label="External sharing" description="Managed by an administrator." readOnly />
        <Checkbox
          label="Selected permissions"
          description="Some permissions are set by policy."
          readOnly
          indeterminate
        />
      </Sample>
      <Sample title="Disabled · excluded from editing">
        <Checkbox label="Export archive" description="Available after verification." disabled />
        <Checkbox label="Audit trail" defaultChecked disabled />
        <Checkbox label="Selected permissions" indeterminate disabled />
      </Sample>
    </div>
  );
}

function Validation(): ReactElement {
  const id = useId();
  const [values, setValues] = useState<string[]>([]);
  const [attempted, setAttempted] = useState(false);
  const invalid = attempted && values.length === 0;
  return (
    <div className="binary-demo-grid">
      <div className="binary-demo-field">
        <span className="binary-demo-legend" id={`${id}-label`}>
          Include in the export
        </span>
        <span className="binary-demo-caption" id={`${id}-help`}>
          Choose at least one format.
        </span>
        <CheckboxGroup
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-help${invalid ? ` ${id}-error` : ''}`}
          value={values}
          onValueChange={setValues}
          status={invalid ? 'danger' : 'neutral'}
        >
          <Checkbox
            value="markdown"
            label="Markdown"
            aria-describedby={invalid ? `${id}-error` : undefined}
          />
          <Checkbox
            value="pdf"
            label="PDF"
            aria-describedby={invalid ? `${id}-error` : undefined}
          />
        </CheckboxGroup>
        {invalid && (
          <span className="binary-demo-message" id={`${id}-error`} role="alert">
            <WarningCircleIcon size={16} />
            Select a format to continue.
          </span>
        )}
        <div className="binary-demo-action-row">
          <Button size="s" variant="secondary" onClick={() => setAttempted(true)}>
            Check selection
          </Button>
        </div>
      </div>
      <Sample title="Pinned validation intersections">
        <Checkbox
          label="Selected value needs attention"
          description="This permission conflicts with the current policy."
          defaultChecked
          status="danger"
        />
        <Checkbox
          label="Some values need attention"
          indeterminate
          status="danger"
          previewState="focus"
        />
        <Checkbox
          label="Unavailable value"
          description="Disabled takes priority over invalid styling."
          disabled
          status="danger"
        />
      </Sample>
    </div>
  );
}

function Aggregate(): ReactElement {
  const [values, setValues] = useState<string[]>(['notes']);
  const id = useId();
  return (
    <div className="binary-demo-narrow binary-demo-stack">
      <div>
        <Checkbox
          label="Select all available items"
          checked={values.length === 3}
          indeterminate={values.length > 0 && values.length < 3}
          onCheckedChange={(next) => setValues(next ? ['notes', 'images', 'files'] : [])}
        />
        <CheckboxGroup
          className="binary-demo-options"
          aria-label="Available items"
          value={values}
          onValueChange={setValues}
        >
          <Checkbox value="notes" label="Notes" />
          <Checkbox value="images" label="Images" />
          <Checkbox value="files" label="Attachments" />
          <Checkbox
            value="archive"
            label="Archived items"
            description="Restore these items before selecting them."
            disabled
          />
        </CheckboxGroup>
      </div>
      <span className="binary-demo-caption" role="status">
        {values.length} of 3 available items selected
      </span>
      <div className="binary-demo-field">
        <span className="binary-demo-legend" id={id}>
          Include metadata
        </span>
        <CheckboxGroup aria-labelledby={id} orientation="horizontal" defaultValue={['dates']}>
          <Checkbox value="dates" label="Dates" />
          <Checkbox value="authors" label="Authors" />
          <Checkbox value="tags" label="Tags" />
        </CheckboxGroup>
      </div>
    </div>
  );
}

function Overflow(): ReactElement {
  const id = useId();
  return (
    <div className="binary-demo-narrow binary-demo-stack">
      <Checkbox
        label="Include notes from every collection this team can access"
        description="The indicator stays aligned with the first line; descriptions wrap beneath the label, not beneath the square."
        defaultChecked
      />
      <Checkbox
        size="s"
        label="Keep this device trusted for 30 days"
        description="Only use this on a device you own."
      />
      <Checkbox
        size="l"
        label="Allow contributors to download original attachments and all previous revisions"
      />
      <Checkbox label="Include attachments_from_external_sources_without_short_names" />
      <div className="binary-demo-row">
        <Checkbox aria-labelledby={id} />
        <span className="binary-demo-caption" id={id}>
          Select this row · external accessible name
        </span>
      </div>
    </div>
  );
}

export default defineSpecimen({
  id: 'checkbox',
  title: 'Checkbox',
  group: 'Forms',
  summary: 'Independent choices, clear partial selection, and calm availability feedback.',
  sections: [
    { id: 'sizes', title: 'Size & selection', kind: 'matrix', render: () => <Sizes /> },
    {
      id: 'interaction',
      title: 'Interaction states',
      kind: 'states',
      caption:
        'Appearance pins: rest, hover, press, keyboard focus. The controls still respond to clicks and Space; pins do not move focus.',
      render: () => <Interaction />,
    },
    {
      id: 'availability',
      title: 'Read-only & disabled',
      kind: 'states',
      render: () => <Availability />,
    },
    {
      id: 'validation',
      title: 'Validation',
      kind: 'states',
      caption:
        'Local validation preview. The check button reveals the error; selecting a format clears it.',
      render: () => <Validation />,
    },
    {
      id: 'group',
      title: 'Groups & select all',
      kind: 'context',
      caption:
        'Live selection. A partial selection moves to all; another activation clears the available items.',
      render: () => <Aggregate />,
    },
    { id: 'overflow', title: 'Labels & density', kind: 'states', render: () => <Overflow /> },
    {
      id: 'surfaces',
      title: 'Base & overlay',
      kind: 'context',
      caption: 'Static material plates, with live native controls.',
      render: () => (
        <SurfacePair>
          <Checkbox label="Include notes" />
          <Checkbox label="Include attachments" defaultChecked />
          <Checkbox label="Selected collections" indeterminate />
        </SurfacePair>
      ),
    },
  ],
});
