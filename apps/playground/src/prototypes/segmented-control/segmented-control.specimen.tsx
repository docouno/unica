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
import { Button } from '../button/button.proto.js';
import { Input } from '../input/input.proto.js';
import { defineSpecimen } from '../../workbench/types.js';
import { SegmentedControl, SegmentedControlItem } from './segmented-control.proto.js';
import type { SegmentItem } from './segmented-control.proto.js';
import './segmented-control.examples.css';

const periods: readonly SegmentItem[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
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
        <SegmentedControl value={mode} onValueChange={setMode} aria-label="View mode">
          <SegmentedControlItem value="list" iconLeft={ListIcon}>
            List
          </SegmentedControlItem>
          <SegmentedControlItem value="grid" iconLeft={SquaresFourIcon}>
            Grid
          </SegmentedControlItem>
        </SegmentedControl>
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
            <SegmentedControl size={size} defaultValue="grid" aria-label={`Layout ${size}`}>
              <SegmentedControlItem value="list" iconLeft={ListIcon} iconOnly>
                List
              </SegmentedControlItem>
              <SegmentedControlItem value="grid" iconLeft={SquaresFourIcon} iconOnly>
                Grid
              </SegmentedControlItem>
              <SegmentedControlItem value="columns" iconLeft={ColumnsIcon} iconOnly>
                Columns
              </SegmentedControlItem>
            </SegmentedControl>
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
        <SegmentedControl width="full" defaultValue="system" aria-label="Color mode">
          <SegmentedControlItem value="light" iconLeft={SunIcon}>
            Light
          </SegmentedControlItem>
          <SegmentedControlItem value="dark" iconLeft={MoonIcon}>
            Dark
          </SegmentedControlItem>
          <SegmentedControlItem value="system" iconLeft={DesktopIcon}>
            System
          </SegmentedControlItem>
        </SegmentedControl>
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
  const rows: readonly {
    label: string;
    target: string;
    state?: 'hover' | 'active';
    focus?: boolean;
  }[] = [
    { label: 'Rest', target: 'week' },
    { label: 'Hover · unselected', target: 'month', state: 'hover' },
    { label: 'Hover · selected', target: 'week', state: 'hover' },
    { label: 'Press · unselected', target: 'month', state: 'active' },
    { label: 'Press · selected', target: 'week', state: 'active' },
    { label: 'Focus · selected', target: 'week', focus: true },
    { label: 'Focus · before selection', target: 'month', focus: true },
    { label: 'Focus + press', target: 'week', state: 'active', focus: true },
  ];
  return (
    <div className="segment-state-list">
      {rows.map((row) => (
        <Example key={row.label} label={row.label}>
          <SegmentedControl value="week" size="s" aria-label={row.label}>
            {periods.map((item) => (
              <SegmentedControlItem
                key={item.value}
                value={item.value}
                {...(item.value === row.target && row.state ? { previewState: row.state } : {})}
                previewFocus={item.value === row.target && row.focus === true}
              >
                {item.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </Example>
      ))}
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
  const [value, setValue] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [result, setResult] = useState('');
  return (
    <div className="segment-examples">
      <Example label="No initial answer · required choice">
        <p id={`${id}-label`} className="segment-field-label">
          Delivery frequency <span aria-hidden="true">*</span>
        </p>
        <SegmentedControl
          value={value}
          invalid={error}
          aria-required="true"
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-help`}
          onValueChange={(next) => {
            setValue(next);
            setError(false);
            setResult('');
          }}
          items={[
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
          ]}
        />
        <p
          id={`${id}-help`}
          className="segment-example-note"
          data-error={error || undefined}
          role={error ? 'alert' : undefined}
        >
          {error
            ? 'Choose how often you want to receive a digest.'
            : 'One digest with the changes that matter to you.'}
        </p>
        <div className="segment-example-row">
          <Button
            size="s"
            variant="secondary"
            tone="neutral"
            onClick={() => {
              setError(value === null);
              setResult(value ? 'Frequency saved.' : '');
            }}
          >
            Save frequency
          </Button>
          <Button
            size="s"
            variant="ghost"
            tone="neutral"
            onClick={() => {
              setValue(null);
              setError(false);
              setResult('');
            }}
          >
            Reset
          </Button>
          <span className="segment-example-note" role="status">
            {result}
          </span>
        </div>
      </Example>
      <Example label="Error + focus · pinned preview">
        <SegmentedControl
          value={null}
          invalid
          aria-label="Delivery frequency, error preview"
          aria-describedby={`${id}-error`}
        >
          <SegmentedControlItem value="daily" previewFocus>
            Daily
          </SegmentedControlItem>
          <SegmentedControlItem value="weekly">Weekly</SegmentedControlItem>
          <SegmentedControlItem value="monthly">Monthly</SegmentedControlItem>
        </SegmentedControl>
        <p id={`${id}-error`} className="segment-example-note" data-error>
          Choose a frequency to continue.
        </p>
      </Example>
    </div>
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
            <Input size={size} aria-label={`Find items ${size}`} placeholder="Find…" />
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

export default defineSpecimen({
  id: 'segmented-control',
  title: 'SegmentedControl',
  group: 'Forms',
  summary: 'One value, 2–5 peer options. A quiet rail with a clear, stationary selection.',
  sections: [
    {
      id: 'live',
      title: 'Choose a value',
      kind: 'context',
      caption:
        'Live pointer and keyboard interaction. These controls change a parameter, without owning tabs or panels.',
      render: () => <LiveExample />,
    },
    {
      id: 'sizes',
      title: 'Three sizes · text & icons',
      kind: 'matrix',
      caption:
        'Stable 500 weight in every state. Icon-only options retain their text names; native titles are tooltip stand-ins.',
      render: () => <SizeExamples />,
    },
    {
      id: 'layout',
      title: 'Width, orientation & content',
      kind: 'matrix',
      render: () => <LayoutExamples />,
    },
    {
      id: 'states',
      title: 'Interaction states',
      kind: 'states',
      caption:
        'Pinned visual comparisons. Week stays selected; hover, held press, and focus are previewed independently.',
      render: () => <StateExamples />,
    },
    {
      id: 'availability',
      title: 'Availability & retained choice',
      kind: 'states',
      render: () => <AvailabilityExamples />,
    },
    {
      id: 'field',
      title: 'Empty answer & validation',
      kind: 'states',
      caption:
        'Local validation and reset preview. Native form integration is part of the library implementation.',
      render: () => <FieldExample />,
    },
    {
      id: 'overflow',
      title: 'Narrow width & translation',
      kind: 'states',
      render: () => <OverflowExamples />,
    },
    {
      id: 'alignment',
      title: 'Alongside other controls',
      kind: 'context',
      caption: 'An ordinary control row; this does not introduce an ARIA toolbar.',
      render: () => <ToolbarExamples />,
    },
    {
      id: 'overlay',
      title: 'On a floating surface',
      kind: 'context',
      surface: 'overlay',
      overlayStage: true,
      render: () => <OverlayExample />,
    },
  ],
});
