import { previewProps } from '../preview-code.js';
import { size, disabled, readOnly, choice, toggle, eventProp } from '../control-props.js';
import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { WarningCircleIcon } from '@phosphor-icons/react';
import { defineComponent } from '../../workbench/types.js';
import { Button } from '../../prototypes/button/button.proto.js';
import { Checkbox, CheckboxGroup } from '../../prototypes/binary-controls/binary-controls.proto.js';
import { Sample, SurfacePair } from '../../prototypes/binary-controls/binary-controls.examples.js';

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
      <div className="binary-demo-external-row">
        <Checkbox id={`${id}-input`} aria-labelledby={id} />
        <label className="binary-demo-external-label" id={id} htmlFor={`${id}-input`}>
          Select this row · external accessible name
        </label>
      </div>
    </div>
  );
}

export default defineComponent({
  id: 'checkbox',
  title: 'Checkbox',
  category: 'Forms',
  status: 'Proto',
  summary: 'Independent choices, clear partial selection, and calm availability feedback.',
  componentName: 'Checkbox',
  form: 'owned',
  props: {
    size,
    disabled,
    readOnly,
    status: choice('Field', 'Feedback tone of the selection.', ['neutral', 'danger'], 'neutral'),
    indeterminate: toggle('Selection', 'Show a mixed state on the first control.'),
    onCheckedChange: eventProp(
      'Reports the changed subscription and checked state.',
      'handleCheckedChange',
    ),
  },
  constraints: [
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: ['status'],
      reason: 'The disabled state suppresses feedback color.',
    },
  ],
  render: function CheckboxPreview({ values, ctx }) {
    const [updates, setUpdates] = useState(true);
    const [digest, setDigest] = useState(false);
    return (
      <form
        {...ctx.form}
        onReset={() => {
          setUpdates(true);
          setDigest(false);
        }}
      >
        <Checkbox
          {...values}
          {...ctx.subject}
          id={`${ctx.id}-updates`}
          label="Product updates"
          name="subscriptions"
          value="updates"
          checked={updates}
          onCheckedChange={(checked) => {
            setUpdates(checked);
            ctx.action('onCheckedChange')({ subscription: 'updates', checked });
          }}
        />
        <Checkbox
          size={values.size}
          disabled={values.disabled}
          readOnly={values.readOnly}
          status={values.status}
          {...ctx.subject}
          id={`${ctx.id}-digest`}
          label="Weekly digest"
          name="subscriptions"
          value="digest"
          checked={digest}
          onCheckedChange={(checked) => {
            setDigest(checked);
            ctx.action('onCheckedChange')({ subscription: 'digest', checked });
          }}
        />
      </form>
    );
  },
  code: ({ size, disabled, readOnly, status }, attributes) => {
    const digestAttributes = previewProps(
      { size, disabled, readOnly, status },
      { size: 'm', disabled: false, readOnly: false, status: 'neutral' },
    );
    return `<>
  <Checkbox label="Product updates" name="subscriptions" value="updates" checked={updates}${attributes} />
  <Checkbox label="Weekly digest" name="subscriptions" value="digest" checked={digest}${digestAttributes} onCheckedChange={handleDigestChange} />
</>`;
  },
  matrixViews: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'status',
      title: 'Size & selection',
      reference: () => <Sizes />,
    },
  ],
  cases: [
    {
      id: 'interaction',
      title: 'Interaction states',
      caption:
        'Appearance pins: rest, hover, press, keyboard focus. The controls still respond to clicks and Space; pins do not move focus.',
      kind: 'behavior',
      render: () => <Interaction />,
    },
    {
      id: 'availability',
      title: 'Read-only & disabled',
      kind: 'behavior',
      render: () => <Availability />,
    },
    {
      id: 'validation',
      title: 'Validation',
      caption:
        'Local validation preview. The check button reveals the error; selecting a format clears it.',
      kind: 'behavior',
      render: () => <Validation />,
    },
    {
      id: 'overflow',
      title: 'Labels & density',
      kind: 'content',
      render: () => <Overflow />,
    },
    {
      id: 'surfaces',
      title: 'Base & overlay',
      caption: 'Static material plates, with live native controls.',
      kind: 'surface',
      render: () => (
        <SurfacePair>
          <Checkbox label="Include notes" />
          <Checkbox label="Include attachments" defaultChecked />
          <Checkbox label="Selected collections" indeterminate />
        </SurfacePair>
      ),
    },
  ],
  usage: [
    {
      id: 'group',
      title: 'Groups & select all',
      caption:
        'Live selection. A partial selection moves to all; another activation clears the available items.',
      code: `<>
  <Checkbox
    label="Select all available items"
    checked={selected.length === available.length}
    indeterminate={selected.length > 0 && selected.length < available.length}
    onCheckedChange={(checked) => setSelected(checked ? available : [])}
  />
  <CheckboxGroup aria-label="Available items" value={selected} onValueChange={setSelected}>
    <Checkbox value="notes" label="Notes" />
    <Checkbox value="images" label="Images" />
  </CheckboxGroup>
</>`,
      render: () => <Aggregate />,
    },
  ],
});
