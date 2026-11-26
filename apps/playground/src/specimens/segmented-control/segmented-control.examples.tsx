import { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ListIcon, SquaresFourIcon, SunIcon, MoonIcon, DesktopIcon } from '@phosphor-icons/react';
import { Button, Flex, Title, SegmentedControl, Stack, Text } from '@docouno/unica';
import type { SegmentedControlOption } from '@docouno/unica';
import { FormField } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';
import { periods, layouts, glyphLayouts } from './segmented-control.options.js';
import { DocumentResults } from './view-toolbar.js';

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

function Example({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <Stack gap={8} style={{ minInlineSize: 0 }}>
      <Text size="caption-l" color="secondary">
        <bdi>{label}</bdi>
      </Text>
      {children}
    </Stack>
  );
}

export function LiveExample({ ctx }: PreviewProps) {
  const [value, setValue] = useState('week');
  const [mode, setMode] = useState('list');
  return (
    <Stack gap={24} style={{ minInlineSize: 0 }}>
      <Example label="Time range">
        <SegmentedControl
          {...ctx.subject}
          items={periods}
          value={value}
          onValueChange={setValue}
          aria-label="Time range"
        />
        <Text size="body-s" role="status">
          <bdi>
            {value === 'day'
              ? 'September 16, 2026'
              : value === 'week'
                ? 'September 14–20, 2026'
                : 'September 1–30, 2026'}
          </bdi>
        </Text>
      </Example>
      <Example label="View mode">
        <SegmentedControl
          {...ctx.subject}
          items={layouts.slice(0, 2)}
          value={mode}
          onValueChange={setMode}
          aria-label="View mode"
        />
        <DocumentResults view={mode} />
      </Example>
    </Stack>
  );
}

export function SizeExamples({ ctx }: PreviewProps) {
  return (
    <Stack gap={24} style={{ minInlineSize: 0 }}>
      {(['s', 'm', 'l'] as const).map((size, index) => (
        <Example key={size} label={`${size.toUpperCase()} density`}>
          <Flex gap={12} align="center" wrap="wrap">
            <SegmentedControl
              {...ctx.subject}
              items={periods}
              size={size}
              defaultValue={periods[index]?.value}
              aria-label={`Time range ${size}`}
            />
            <SegmentedControl
              {...ctx.subject}
              items={glyphLayouts}
              size={size}
              defaultValue="grid"
              aria-label={`Layout ${size}`}
            />
          </Flex>
        </Example>
      ))}
    </Stack>
  );
}

export function LayoutExamples({ ctx }: PreviewProps) {
  return (
    <Stack gap={24} style={{ minInlineSize: 0 }}>
      <Example label="Full-width color modes">
        <SegmentedControl
          {...ctx.subject}
          items={settings}
          width="full"
          defaultValue="system"
          aria-label="Color mode"
        />
      </Example>
      <Example label="Five short options">
        <SegmentedControl
          {...ctx.subject}
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
      <Example label="Vertical · explicit layout">
        <SegmentedControl
          {...ctx.subject}
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
    </Stack>
  );
}

export function StateExamples({ ctx }: PreviewProps) {
  return (
    <Stack gap={24} style={{ minInlineSize: 0 }}>
      <Example label="Hover, held press, and selection">
        <SegmentedControl
          {...ctx.subject}
          items={periods}
          defaultValue="week"
          aria-label="Time range interaction"
        />
      </Example>
      <Example label="Focus separate from selection">
        <SegmentedControl
          {...ctx.subject}
          items={periods}
          value="week"
          aria-label="Fixed time range"
        />
      </Example>
    </Stack>
  );
}

export function AvailabilityExamples({ ctx }: PreviewProps) {
  return (
    <Stack gap={24} style={{ minInlineSize: 0 }}>
      <Example label="One option unavailable">
        <SegmentedControl
          {...ctx.subject}
          aria-label="Report interval"
          defaultValue="month"
          items={[...periods, { value: 'year', label: 'Year', disabled: true }]}
        />
      </Example>
      <Example label="Selected option unavailable">
        <SegmentedControl
          {...ctx.subject}
          aria-label="Previous report interval"
          defaultValue="week"
          items={periods.map((item) => ({ ...item, disabled: item.value === 'week' }))}
        />
      </Example>
      <Example label="Entire group unavailable">
        <SegmentedControl
          {...ctx.subject}
          aria-label="Unavailable interval"
          items={periods}
          defaultValue="week"
          disabled
        />
      </Example>
      <Example label="Read only">
        <SegmentedControl
          {...ctx.subject}
          aria-label="Managed interval"
          items={periods}
          defaultValue="week"
          readOnly
        />
      </Example>
    </Stack>
  );
}

export function FieldExample({ ctx }: PreviewProps) {
  const id = useId();
  const [feedback, setFeedback] = useState<{ error?: true; result?: string }>({});
  const feedbackRevision = useRef(0);
  const { error, result } = feedback;

  function report(next: typeof feedback) {
    feedbackRevision.current += 1;
    setFeedback(next);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const frequency = new FormData(event.currentTarget).get('frequency');
        report(typeof frequency === 'string' ? { result: frequency } : {});
      }}
      onReset={(event) => {
        const reset = event.nativeEvent;
        const form = event.currentTarget;
        const revision = feedbackRevision.current;
        // Wait for late cancellation, then clear only feedback that predates this reset.
        setTimeout(() => {
          if (
            !reset.defaultPrevented &&
            form.isConnected &&
            feedbackRevision.current === revision
          ) {
            setFeedback({});
          }
        }, 0);
      }}
    >
      <Stack gap={12}>
        <FormField
          target="group"
          label="Delivery frequency"
          labelId={`${id}-label`}
          required
          description={<bdi>How often should we send a digest?</bdi>}
          status={error ? 'danger' : 'neutral'}
          message={error ? <bdi>Choose a delivery frequency.</bdi> : undefined}
        >
          <SegmentedControl
            {...ctx.subject}
            defaultValue={null}
            name="frequency"
            required
            status={error ? 'danger' : 'neutral'}
            aria-labelledby={`${id}-label`}
            onInvalid={() => report({ error: true })}
            onValueChange={() => report({})}
            items={frequencies}
          />
        </FormField>
        <Flex gap={12} wrap="wrap" align="center">
          <Button type="submit" size="s" variant="secondary" tone="neutral">
            Save frequency
          </Button>
          <Button type="reset" size="s" variant="ghost" tone="neutral">
            Reset
          </Button>
          <output>
            <Text as="span" size="caption-l">
              <bdi>{result && `Submitted frequency: ${result}`}</bdi>
            </Text>
          </output>
        </Flex>
      </Stack>
    </form>
  );
}

export function OverflowExamples({ ctx }: PreviewProps) {
  return (
    <Stack gap={24} style={{ minInlineSize: 0 }}>
      <Example label="Translation · 280 px container">
        <div style={{ inlineSize: 'min(280px, 100%)', minInlineSize: 0 }}>
          <SegmentedControl
            {...ctx.subject}
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
      <Example label="Prefer a deliberate narrow layout">
        <div style={{ inlineSize: 'min(280px, 100%)', minInlineSize: 0 }}>
          <SegmentedControl
            {...ctx.subject}
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
          {...ctx.subject}
          width="full"
          aria-label="Notification scope"
          items={[
            { value: 'all', label: 'Everything' },
            { value: 'mentions', label: 'Mentions only' },
          ]}
        />
      </Example>
    </Stack>
  );
}

export function OverlayExample({ ctx }: PreviewProps) {
  return (
    <div style={{ inlineSize: 'min(100%, 360px)', minInlineSize: 0 }}>
      <ExampleSurface surface={ctx.surface} sizing="border-box" gap={24}>
        <Title as="h3" size="body-m">
          View options
        </Title>
        <Example label="Layout">
          <SegmentedControl
            {...ctx.subject}
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
            {...ctx.subject}
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
      </ExampleSurface>
    </div>
  );
}
