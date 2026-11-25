import { useState } from 'react';
import { Stack, Text } from '@docouno/unica';
import { DateRangePicker } from '../../prototypes/date-picker/date-picker.proto.js';
import '@docouno/unica/styles.css';

const initial = { start: '2026-09-14', end: '2026-09-23' };
const dateLabel = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' });

export function PeriodDuration({ pickerProps = {} } = {}) {
  const [period, setPeriod] = useState(initial);
  let summary = 'No period selected.';
  if (period.start) {
    const start = new Date(period.start);
    const end = new Date(period.end);
    const days = 1 + (end.getTime() - start.getTime()) / 86_400_000;
    summary = `${dateLabel.formatRange(start, end)} · ${days} calendar ${days === 1 ? 'day' : 'days'}`;
  }
  return (
    <Stack gap={12} style={{ inlineSize: 'min(100%, 24rem)' }}>
      <DateRangePicker
        {...pickerProps}
        label="Review period"
        description={<bdi>Choose up to 14 calendar days, including both endpoints.</bdi>}
        defaultValue={[initial.start, initial.end]}
        maxRangeDays={14}
        clearable
        onValueChange={([start, end]) => setPeriod({ start, end })}
      />
      <Text size="body-s" color="secondary" role="status">
        <bdi dir="ltr">{summary}</bdi>
      </Text>
    </Stack>
  );
}
