import { useState } from 'react';
import { Stack, Text } from '@docouno/unica';
import { DateRangePicker } from '../../prototypes/date-picker/date-picker.proto.js';
import '@docouno/unica/styles.css';

const entries = [
  { title: 'Outline', date: '2026-09-07' },
  { title: 'Draft', date: '2026-09-16' },
  { title: 'Final notes', date: '2026-09-28' },
];
const dateLabel = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' });

export function PeriodRecords({ pickerProps = {} } = {}) {
  const [period, setPeriod] = useState({ start: '', end: '' });
  const matches = entries.filter(
    ({ date }) => !period.start || (date >= period.start && date <= period.end),
  );
  return (
    <Stack gap={12} style={{ inlineSize: 'min(100%, 24rem)' }}>
      <DateRangePicker
        {...pickerProps}
        label="Modified during"
        description={<bdi>Leave the period empty to show every record.</bdi>}
        clearable
        onValueChange={([start, end]) => setPeriod({ start, end })}
      />
      <Text size="body-s" role="status">
        <bdi dir="ltr">
          {matches.length} {matches.length === 1 ? 'record' : 'records'}
        </bdi>
      </Text>
      {matches.length > 0 && (
        <ul aria-label="Matching records" style={{ margin: 0, paddingInlineStart: '1.25em' }}>
          {matches.map(({ title, date }) => (
            <li key={date}>
              <Text as="span" size="body-s" color="secondary">
                <bdi>
                  {title} · <time dateTime={date}>{dateLabel.format(new Date(date))}</time>
                </bdi>
              </Text>
            </li>
          ))}
        </ul>
      )}
    </Stack>
  );
}
