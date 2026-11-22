import { previewProps } from '../preview-code.js';
import { size, disabled, readOnly, required, choice, toggle, eventProp } from '../control-props.js';
import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { WarningCircleIcon } from '@phosphor-icons/react';
import { defineComponent } from '../../workbench/types.js';
import { Button } from '../../prototypes/button/button.proto.js';
import { Checkbox, CheckboxGroup } from '@docouno/unica';
import { Sample, SurfacePair } from '../binary-examples.js';

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
  const [mixed, setMixed] = useState(true);
  return (
    <div className="binary-demo-row">
      <Checkbox label="Include notes" />
      <Checkbox label="Include attachments" defaultChecked />
      <Checkbox
        label="Include collections"
        indeterminate={mixed}
        onCheckedChange={() => setMixed(false)}
      />
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
  const requiredMessage = 'Select a format to continue.';
  return (
    <div className="binary-demo-grid">
      <form
        className="binary-demo-field"
        onInvalid={() => setAttempted(true)}
        onSubmit={(event) => event.preventDefault()}
      >
        <span className="binary-demo-legend" id={`${id}-label`}>
          Include in the export
        </span>
        <span className="binary-demo-caption" id={`${id}-help`}>
          Choose at least one format.
        </span>
        <CheckboxGroup
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-help${invalid ? ` ${id}-error` : ''}`}
          name="format"
          required
          requiredMessage={requiredMessage}
          value={values}
          onValueChange={setValues}
          status={invalid ? 'danger' : 'neutral'}
        >
          <Checkbox value="markdown" label="Markdown" />
          <Checkbox value="pdf" label="PDF" />
        </CheckboxGroup>
        {invalid && (
          <span className="binary-demo-message" id={`${id}-error`} role="alert">
            <WarningCircleIcon size={16} aria-hidden="true" />
            {requiredMessage}
          </span>
        )}
        <div className="binary-demo-action-row">
          <Button size="s" variant="secondary" type="submit">
            Check selection
          </Button>
        </div>
      </form>
      <Sample title="Validation and availability">
        <Checkbox
          label="Selected value needs attention"
          description="This permission conflicts with the current policy."
          defaultChecked
          status="danger"
        />
        <Checkbox label="Some values need attention" indeterminate status="danger" />
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
        <Checkbox
          className="binary-demo-external-control"
          id={`${id}-input`}
          aria-labelledby={id}
        />
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
  status: 'UI',
  summary: 'Independent choices, partial selection, and group validation.',
  componentName: 'Checkbox',
  form: 'owned',
  props: {
    size,
    disabled,
    readOnly,
    required,
    status: choice('Field', 'Validation state of the selection.', ['neutral', 'danger'], 'neutral'),
    defaultChecked: {
      ...toggle('Selection', 'Starts with Product updates selected.', true),
      demo: true,
    },
    indeterminate: toggle('Selection', 'Show a mixed state on the first control.'),
    description: {
      kind: 'string',
      group: 'Content',
      default: '',
      description: 'Supporting text for Product updates.',
    },
    onCheckedChange: eventProp(
      'Reports the changed subscription and checked state.',
      'handleCheckedChange',
    ),
  },
  constraints: [
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: [{ key: 'status', value: 'danger' }],
      reason: 'Disabled controls suppress invalid styling and semantics.',
    },
    {
      kind: 'precedence',
      when: { disabled: true },
      affects: [
        { key: 'readOnly', value: true },
        { key: 'required', value: true },
      ],
      reason: 'Disabled controls are excluded from focus, validation, and submission.',
    },
  ],
  render: function CheckboxPreview({ values, ctx }) {
    const { size, disabled, readOnly, status, defaultChecked, description, ...props } = values;
    const shared = { size, disabled, readOnly, status };
    const log = ctx.action('onCheckedChange');
    return (
      <form {...ctx.form}>
        <div {...ctx.subject} className="binary-demo-subject">
          <Checkbox
            key={String(defaultChecked)}
            {...shared}
            {...props}
            defaultChecked={defaultChecked}
            description={description || undefined}
            label="Product updates"
            name="subscriptions"
            value="updates"
            onCheckedChange={(checked: boolean) => log({ subscription: 'updates', checked })}
          />
        </div>
        <div {...ctx.subject} className="binary-demo-subject">
          <Checkbox
            {...shared}
            label="Weekly digest"
            name="subscriptions"
            value="digest"
            onCheckedChange={(checked: boolean) => log({ subscription: 'digest', checked })}
          />
        </div>
      </form>
    );
  },
  code: ({ size, disabled, readOnly, status, defaultChecked }, attributes) => {
    const digestAttributes = previewProps(
      { size, disabled, readOnly, status },
      { size: 'm', disabled: false, readOnly: false, status: 'neutral' },
    );
    const initialSelection = defaultChecked ? ' defaultChecked' : '';
    return `<>
  <Checkbox label="Product updates" name="subscriptions" value="updates"${initialSelection}${attributes} />
  <Checkbox label="Weekly digest" name="subscriptions" value="digest"${digestAttributes} onCheckedChange={handleDigestChange} />
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
    { id: 'selection', rows: 'defaultChecked', cols: 'indeterminate', title: 'Selection & mixed' },
  ],
  cases: [
    {
      id: 'interaction',
      title: 'Interaction states',
      caption:
        'Tab to a checkbox or point at its label and hold the pointer button. Space or a click toggles the value.',
      kind: 'behavior',
      mode: 'live',
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
        'Submit without a format to see the required-group error. A selection clears it. Tab to a danger example to inspect its focus ring.',
      kind: 'behavior',
      mode: 'live',
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
      mode: 'live',
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
