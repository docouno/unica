import { useState } from 'react';
import { Stack, Text } from '@docouno/unica';
import { Calendar } from '../../prototypes/date-picker/date-picker.proto.js';
import '@docouno/unica/styles.css';

const mediumDate = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' });

export function SelectedPeriod({ calendarProps = {} } = {}) {
  const [period, setPeriod] = useState({ start: '2026-09-25', end: '2026-10-07' });
  return (
    <Stack gap={12} style={{ inlineSize: '100%', minInlineSize: 0 }}>
      <Text as="p" size="body-s" role="status">
        <bdi dir="ltr">
          Selected period:{' '}
          <time dateTime={period.start}>{mediumDate.format(new Date(period.start))}</time> –{' '}
          <time dateTime={period.end}>{mediumDate.format(new Date(period.end))}</time>
        </bdi>
      </Text>
      <Calendar
        size="s"
        layout="year"
        month="2026-01"
        {...calendarProps}
        mode="range"
        range={[period.start, period.end]}
        onRangeChange={([start, end]) => setPeriod({ start, end })}
      />
    </Stack>
  );
}
