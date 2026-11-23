import { size, disabled, readOnly, choice, required, eventProp } from '../control-props.js';
import { useId, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import {
  ListIcon,
  SquaresFourIcon,
  ColumnsIcon,
  SunIcon,
  MoonIcon,
  DesktopIcon,
} from '@phosphor-icons/react';
import { Button, Input, SegmentedControl } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import type { SegmentedControlOption } from '@docouno/unica';
import './segmented-control.examples.css';

const periods: readonly SegmentedControlOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const layouts = [
  { value: 'list', label: 'List', iconLeft: ListIcon },
  { value: 'grid', label: 'Grid', iconLeft: SquaresFourIcon },
  { value: 'columns', label: 'Columns', iconLeft: ColumnsIcon },
] as const satisfies readonly SegmentedControlOption[];

const glyphLayouts = layouts.map((item) => ({ ...item, iconOnly: true as const }));

const settings = [
  { value: 'light', label: 'Light', iconLeft: SunIcon },
  { value: 'dark', label: 'Dark', iconLeft: MoonIcon },
  { value: 'system', label: 'System', iconLeft: DesktopIcon },
] as const satisfies readonly SegmentedControlOption[];

const frequencies: readonly SegmentedControlOption[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

function Example({
  label,
  children,
  note,
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly note?: string;
}): ReactElement {
  return (
    <div className="segment-example">
      <div className="segment-example-label">{label}</div>
      {children}
      {note && <p className="segment-example-note">{note}</p>}
    </div>
  );
}

function LiveExample(): ReactElement {
  const [value, setValue] = useState('week');
  const [mode, setMode] = useState('list');
  return (
    <div className="segment-examples">
      <Example
        label="Time range"
        note="Click an option or use the arrow keys. Selection stays put on a second click."
      >
        <SegmentedControl
          items={periods}
          value={value}
          onValueChange={setValue}
          aria-label="Time range"
        />
        <p className="segment-example-result" aria-live="polite">
          {value === 'day'
            ? 'Today · 24 hours'
            : value === 'week'
              ? 'This week · 7 days'
              : 'This month · 30 days'}
        </p>
      </Example>
      <Example
        label="View mode"
        note="The view changes immediately; focus stays on the chosen option."
      >
        <SegmentedControl
          items={layouts.slice(0, 2)}
          value={mode}
          onValueChange={setMode}
          aria-label="View mode"
        />
        <div className="segment-view-preview" data-view={mode} aria-hidden="true">
          {['Project notes', 'Design assets', 'Release plan'].map((label) => (
            <div key={label}>
              <span className="segment-view-mark" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </Example>
    </div>
  );
}

function SizeExamples(): ReactElement {
  return (
    <div className="segment-examples">
      {(['s', 'm', 'l'] as const).map((size, index) => (
        <Example key={size} label={`${size.toUpperCase()} · ${[30, 40, 48][index]} px`}>
          <div className="segment-example-row">
            <SegmentedControl
              items={periods}
              size={size}
              defaultValue={periods[index]?.value}
              aria-label={`Time range ${size}`}
            />
            <SegmentedControl
              items={glyphLayouts}
              size={size}
              defaultValue="grid"
              aria-label={`Layout ${size}`}
            />
          </div>
        </Example>
      ))}
    </div>
  );
}

function LayoutExamples(): ReactElement {
  return (
    <div className="segment-examples">
      <Example label="Equal peers · full width">
        <SegmentedControl
          items={settings}
          width="full"
          defaultValue="system"
          aria-label="Color mode"
        />
      </Example>
      <Example label="Five short options">
        <SegmentedControl
          size="s"
          defaultValue="month"
          aria-label="Chart interval"
          items={[
            { value: 'day', label: '1D' },
            { value: 'week', label: '1W' },
            { value: 'month', label: '1M' },
            { value: 'year', label: '1Y' },
            { value: 'all', label: 'All' },
          ]}
        />
      </Example>
      <Example
        label="Vertical · explicit layout"
        note="A compact column for a narrow inspector. Long descriptions belong in a radio group."
      >
        <SegmentedControl
          orientation="vertical"
          defaultValue="comfortable"
          aria-label="Content density"
          items={[
            { value: 'compact', label: 'Compact' },
            { value: 'comfortable', label: 'Comfortable' },
            { value: 'spacious', label: 'Spacious' },
          ]}
        />
      </Example>
    </div>
  );
}

function StateExamples(): ReactElement {
  return (
    <div className="segment-examples">
      <Example
        label="Hover, held press, and selection"
        note="Hold a pointer down on a segment, then release on it to select. Release outside the control to cancel."
      >
        <SegmentedControl items={periods} defaultValue="week" aria-label="Time range interaction" />
      </Example>
      <Example
        label="Focus separate from selection"
        note="Tab to Week and move with the arrow keys. This example keeps Week selected while focus moves."
      >
        <SegmentedControl items={periods} value="week" aria-label="Fixed time range" />
      </Example>
    </div>
  );
}

function AvailabilityExamples(): ReactElement {
  return (
    <div className="segment-examples">
      <Example
        label="One option unavailable"
        note="Yearly reports become available after 12 months."
      >
        <SegmentedControl
          aria-label="Report interval"
          defaultValue="month"
          items={[...periods, { value: 'year', label: 'Year', disabled: true }]}
        />
      </Example>
      <Example
        label="Selected option unavailable"
        note="The previous choice remains visible. Choose another interval to continue."
      >
        <SegmentedControl
          aria-label="Previous report interval"
          defaultValue="week"
          items={periods.map((item) => ({ ...item, disabled: item.value === 'week' }))}
        />
      </Example>
      <Example
        label="Entire group unavailable"
        note="Connect a data source to change the interval."
      >
        <SegmentedControl
          aria-label="Unavailable interval"
          items={periods}
          defaultValue="week"
          disabled
        />
      </Example>
      <Example
        label="Read only"
        note="This interval is managed by your workspace. You can focus and read it."
      >
        <SegmentedControl
          aria-label="Managed interval"
          items={periods}
          defaultValue="week"
          readOnly
        />
      </Example>
    </div>
  );
}

function FieldExample(): ReactElement {
  const id = useId();
  const [error, setError] = useState(false);
  const [result, setResult] = useState('');
  return (
    <form
      className="segment-examples"
      onSubmit={(event) => {
        event.preventDefault();
        const frequency = new FormData(event.currentTarget).get('frequency');
        setResult(typeof frequency === 'string' ? frequency : '');
      }}
      onReset={() => {
        setError(false);
        setResult('');
      }}
    >
      <Example label="No initial answer · required choice">
        <p id={`${id}-label`} className="segment-field-label">
          Delivery frequency <span aria-hidden="true">*</span>
        </p>
        <SegmentedControl
          defaultValue={null}
          name="frequency"
          required
          status={error ? 'danger' : 'neutral'}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-help`}
          onInvalid={() => setError(true)}
          onValueChange={() => {
            setError(false);
            setResult('');
          }}
          items={frequencies}
        />
        <p id={`${id}-help`} className="segment-example-note" data-error={error || undefined}>
          {error
            ? 'Choose how often you want to receive a digest.'
            : 'One digest with the changes that matter to you.'}
        </p>
        <div className="segment-example-row">
          <Button type="submit" size="s" variant="secondary" tone="neutral">
            Save frequency
          </Button>
          <Button type="reset" size="s" variant="ghost" tone="neutral">
            Reset
          </Button>
          <output className="segment-example-note">
            {result && `Submitted frequency: ${result}`}
          </output>
        </div>
      </Example>
    </form>
  );
}

function OverflowExamples(): ReactElement {
  return (
    <div className="segment-examples">
      <Example
        label="Translation · 280 px container"
        note="The rail stays in one row. Scroll locally or use the arrow keys to reveal every complete label."
      >
        <div className="segment-narrow-example">
          <SegmentedControl
            aria-label="Localized date range"
            defaultValue="week"
            items={[
              { value: 'day', label: 'Heute' },
              { value: 'week', label: 'Diese Woche' },
              { value: 'month', label: 'Dieser Monat' },
            ]}
          />
        </div>
      </Example>
      <Example
        label="Prefer a deliberate narrow layout"
        note="Use short labels, a vertical rail, or a different picker before relying on horizontal overflow."
      >
        <div className="segment-narrow-example">
          <SegmentedControl
            width="full"
            orientation="vertical"
            aria-label="Narrow date range"
            defaultValue="week"
            items={[
              { value: 'day', label: 'Heute' },
              { value: 'week', label: 'Diese Woche' },
              { value: 'month', label: 'Dieser Monat' },
            ]}
          />
        </div>
      </Example>
      <Example label="Mixed lengths · no truncation">
        <SegmentedControl
          width="full"
          aria-label="Notification scope"
          items={[
            { value: 'all', label: 'Everything' },
            { value: 'mentions', label: 'Mentions only' },
          ]}
        />
      </Example>
    </div>
  );
}

function ToolbarExamples(): ReactElement {
  return (
    <div className="segment-examples">
      {(['s', 'm', 'l'] as const).map((size) => (
        <Example key={size} label={`${size.toUpperCase()} · shared control height`}>
          <div className="segment-example-row segment-toolbar-example">
            <SegmentedControl
              size={size}
              aria-label={`Layout in ${size} controls`}
              items={[
                { value: 'list', label: 'List' },
                { value: 'grid', label: 'Grid' },
              ]}
            />
            <Input
              className="segment-search-example"
              size={size}
              aria-label={`Find items ${size}`}
              placeholder="Find…"
            />
            <Button size={size} variant="secondary" tone="neutral">
              Apply
            </Button>
          </div>
        </Example>
      ))}
    </div>
  );
}

function OverlayExample(): ReactElement {
  return (
    <div className="segment-overlay-example">
      <h3>View options</h3>
      <Example label="Layout">
        <SegmentedControl
          width="full"
          aria-label="Overlay layout"
          items={[
            { value: 'list', label: 'List', iconLeft: ListIcon },
            { value: 'grid', label: 'Grid', iconLeft: SquaresFourIcon },
          ]}
        />
      </Example>
      <Example label="Density">
        <SegmentedControl
          size="s"
          width="full"
          defaultValue="comfortable"
          aria-label="Overlay density"
          items={[
            { value: 'compact', label: 'Compact' },
            { value: 'comfortable', label: 'Comfortable' },
          ]}
        />
      </Example>
      <p className="segment-example-note">Changes apply to this view.</p>
    </div>
  );
}

export default defineComponent({
  id: 'segmented-control',
  title: 'SegmentedControl',
  category: 'Selection & Pickers',
  status: 'UI',
  summary: 'Choose one value from a compact group of short options.',
  componentName: 'SegmentedControl',
  form: 'owned',
  props: {
    size,
    disabled,
    readOnly,
    orientation: choice(
      'Geometry',
      'Direction of the options.',
      ['horizontal', 'vertical'],
      'horizontal',
    ),
    width: choice('Geometry', 'Size to the options or fill the slot.', ['auto', 'full'], 'auto'),
    required,
    status: choice('Field', 'Validation feedback for the group.', ['neutral', 'danger'], 'neutral'),
    defaultValue: {
      kind: 'slot',
      group: 'Field',
      description: 'Mount with the first available option or an empty answer.',
      choices: [
        { value: 'implicit', label: 'First available' },
        { value: 'empty', label: 'No selection', code: 'null' },
      ],
      default: 'implicit',
    },
    name: {
      kind: 'string',
      group: 'Field',
      description: 'Form data key. An empty name omits the field from FormData.',
      default: 'preference',
      examples: ['preference', ''],
    },
    items: {
      kind: 'slot',
      group: 'Options',
      description: 'The option array supplies stable values, labels, and optional leading glyphs.',
      choices: [
        { value: 'periods', label: 'Periods', code: 'periods' },
        { value: 'layouts', label: 'Layouts with icons', code: 'layouts' },
        { value: 'glyphLayouts', label: 'Icon-only layouts', code: 'glyphLayouts' },
      ],
      default: 'periods',
    },
    onValueChange: eventProp('Reports a requested or committed selection.', 'handleValueChange'),
  },
  constraints: [
    {
      kind: 'precedence',
      when: { disabled: true },
      affects: ['required', 'readOnly', { key: 'status', value: 'danger' }],
      reason:
        'A disabled group is unavailable for input and excluded from validation and submission.',
    },
    {
      kind: 'ignored',
      when: { readOnly: true },
      affects: ['required'],
      reason:
        'A read-only group preserves its value and allows focus. It cannot require a new choice.',
    },
  ],
  render: function SegmentPreview({ values: { items, defaultValue, ...values }, ctx }) {
    const options = { periods, layouts, glyphLayouts }[items];
    return (
      <form {...ctx.form}>
        <SegmentedControl
          {...values}
          {...ctx.subject}
          key={`${items}-${defaultValue}`}
          aria-label="View preference"
          items={options}
          defaultValue={defaultValue === 'empty' ? null : undefined}
          onValueChange={ctx.action('onValueChange')}
        />
      </form>
    );
  },
  code: ({ items, name }, attributes) =>
    `<SegmentedControl aria-label="View preference"${items === 'periods' ? ' items={periods}' : ''}${name === 'preference' ? ' name="preference"' : ''}${attributes} />`,
  matrixViews: [
    {
      id: 'sizes',
      rows: 'size',
      title: 'Three sizes · text & icons',
      caption: 'Icon-only options carry an accessible text name.',
      reference: () => <SizeExamples />,
    },
    {
      id: 'layout',
      rows: 'orientation',
      cols: 'width',
      title: 'Width, orientation & content',
      reference: () => <LayoutExamples />,
    },
  ],
  cases: [
    {
      id: 'live',
      title: 'Choose a value',
      caption: 'Use pointer or keyboard to change a time range or a view preference.',
      kind: 'behavior',
      render: () => <LiveExample />,
    },
    {
      id: 'states',
      title: 'Interaction states',
      caption:
        'Use the pointer to test hover and press. Use Tab and the arrow keys to compare focus with selection.',
      kind: 'behavior',
      render: () => <StateExamples />,
    },
    {
      id: 'availability',
      title: 'Availability & retained choice',
      kind: 'behavior',
      render: () => <AvailabilityExamples />,
    },
    {
      id: 'field',
      title: 'Empty answer & validation',
      caption:
        'Save to validate and read the native form value. Reset returns the group to its initial empty answer.',
      kind: 'behavior',
      render: () => <FieldExample />,
    },
    {
      id: 'overflow',
      title: 'Narrow width & translation',
      kind: 'content',
      render: () => <OverflowExamples />,
    },
    {
      id: 'overlay',
      title: 'On a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <OverlayExample />,
    },
  ],
  usage: [
    {
      id: 'alignment',
      title: 'Alongside other controls',
      code: `<>
  <SegmentedControl size="m" items={layouts} aria-label="Layout" />
  <Input size="m" aria-label="Find items" />
  <Button size="m" variant="secondary" tone="neutral">Apply</Button>
</>`,
      render: () => <ToolbarExamples />,
    },
  ],
});
