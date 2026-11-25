import type { ReactNode } from 'react';
import { Stack, Text } from '@docouno/unica';
import { Calendar, DatePickerPanel } from '../../prototypes/date-picker/date-picker.proto.js';
import type { PreviewProps } from '../../workbench/types.js';
import { SelectedPeriod } from './selected-period.js';

function CalendarStudy({
  label,
  pinned = false,
  children,
}: {
  readonly label: string;
  readonly pinned?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <Stack gap={8} style={{ alignItems: 'start', minInlineSize: 0 }}>
      <Text size="caption-l" color="secondary">
        <bdi>{label}</bdi>
      </Text>
      <div inert={pinned} style={{ minInlineSize: 0, maxInlineSize: '100%' }}>
        {children}
      </div>
    </Stack>
  );
}

export function CalendarSizes({ ctx }: PreviewProps) {
  return (
    <div className="date-study-grid-proto date-study-grid-sizes-proto">
      {(['s', 'm', 'l'] as const).map((size) => (
        <CalendarStudy key={size} label={`${size.toUpperCase()} · single date`}>
          <Calendar {...ctx.subject} size={size} defaultValue="2026-09-16" />
        </CalendarStudy>
      ))}
    </div>
  );
}

export function CalendarAnatomy({ ctx }: PreviewProps) {
  return <Calendar {...ctx.subject} defaultValue="2026-09-14" />;
}

export function DayStates({ ctx }: PreviewProps) {
  return (
    <CalendarStudy pinned label="Today, selection, focus & availability">
      <Calendar
        {...ctx.subject}
        value="2026-09-16"
        unavailable={['2026-09-17', '2026-09-18']}
        indicators={['2026-09-11', '2026-09-16', '2026-09-23']}
        previewDates={{
          '2026-09-08': 'hover',
          '2026-09-09': 'active',
          '2026-09-10': 'focus',
          '2026-09-17': 'focus',
          '2026-09-16': 'active',
        }}
      />
    </CalendarStudy>
  );
}

function RangePanel({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <DatePickerPanel title={label}>
      <Text size="caption-l" color="secondary">
        <bdi>{label}</bdi>
      </Text>
      {children}
    </DatePickerPanel>
  );
}

export function RangeGeometry({ ctx }: PreviewProps) {
  return (
    <div className="date-study-stack-proto">
      <RangePanel label="Accepted period · hover and press">
        <Calendar
          {...ctx.subject}
          inert
          mode="range"
          range={['2026-09-11', '2026-09-23']}
          previewDates={{
            '2026-09-15': 'hover',
            '2026-09-16': 'active',
            '2026-09-23': 'hover',
          }}
        />
      </RangePanel>
      <RangePanel label="Pending period · new start and proposed end">
        <Calendar
          {...ctx.subject}
          inert
          mode="range"
          previewAnchor="2026-09-14"
          previewCandidate="2026-09-19"
          previewRange={['2026-09-14', '2026-09-19']}
        />
      </RangePanel>
      <RangePanel label="One day · inclusive range">
        <Calendar {...ctx.subject} inert mode="range" range={['2026-09-16', '2026-09-16']} />
      </RangePanel>
      <RangePanel label="Live · choose two dates">
        <Calendar {...ctx.subject} mode="range" />
      </RangePanel>
    </div>
  );
}

export function CalendarAvailability({ ctx }: PreviewProps) {
  return (
    <div className="date-study-stack-proto">
      <CalendarStudy label="Live · restricted selection">
        <Calendar
          {...ctx.subject}
          mode="range"
          min="2026-09-07"
          max="2026-09-25"
          unavailable={['2026-09-18', '2026-09-19', '2026-09-20']}
          minRangeDays={2}
          maxRangeDays={10}
        />
      </CalendarStudy>
      <CalendarStudy pinned label="Blocked end date · pinned">
        <Calendar
          {...ctx.subject}
          mode="range"
          range={['2026-09-08', '2026-09-11']}
          previewAnchor="2026-09-14"
          previewCandidate="2026-09-22"
          previewRange={['2026-09-14', '2026-09-22']}
          unavailable={['2026-09-18', '2026-09-19', '2026-09-20']}
          previewDates={{ '2026-09-22': 'hover' }}
        />
      </CalendarStudy>
      <CalendarStudy label="No availability this month">
        <Calendar
          {...ctx.subject}
          unavailable={Array.from(
            { length: 30 },
            (_, index) => `2026-09-${String(index + 1).padStart(2, '0')}`,
          )}
        />
      </CalendarStudy>
      <CalendarStudy pinned label="Selected date becomes unavailable · pinned">
        <Calendar {...ctx.subject} value="2026-09-16" unavailable={['2026-09-16']} />
      </CalendarStudy>
      <CalendarStudy label="Read only · navigation remains available">
        <Calendar {...ctx.subject} readOnly defaultValue="2026-09-16" />
      </CalendarStudy>
      <CalendarStudy label="Disabled · selection retained">
        <Calendar {...ctx.subject} disabled defaultValue="2026-09-16" />
      </CalendarStudy>
    </div>
  );
}

export function CalendarNavigation({ ctx }: PreviewProps) {
  return (
    <div className="date-study-stack-proto">
      <CalendarStudy label="Month selector · 3 columns">
        <Calendar {...ctx.subject} initialView="months" defaultValue="2026-09-14" />
      </CalendarStudy>
      <CalendarStudy label="Year selector · 12-year window">
        <Calendar {...ctx.subject} initialView="years" defaultValue="2026-09-14" />
      </CalendarStudy>
      <CalendarStudy label="Localized · Sunday first">
        <Calendar
          {...ctx.subject}
          locale="de-DE"
          weekStartsOn={0}
          month="2026-12"
          defaultValue="2026-12-24"
        />
      </CalendarStudy>
    </div>
  );
}

export function ConsecutiveMonths({ ctx }: PreviewProps) {
  return (
    <SelectedPeriod
      calendarProps={{
        ...ctx.subject,
        layout: 'months',
        month: '2026-09',
        size: 'm',
        numberOfMonths: 2,
      }}
    />
  );
}
