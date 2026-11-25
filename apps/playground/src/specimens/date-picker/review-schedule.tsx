import { useState } from 'react';
import { Stack, Text } from '@docouno/unica';
import { DatePicker } from '../../prototypes/date-picker/date-picker.proto.js';
import '@docouno/unica/styles.css';

const reviewDate = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' });

export function ReviewSchedule({ pickerProps = {} } = {}) {
  const [date, setDate] = useState('');
  return (
    <Stack gap={12} style={{ inlineSize: 'min(100%, 24rem)' }}>
      <DatePicker
        {...pickerProps}
        label="Review date"
        description={<bdi>Optional. Enter a date or choose one from the calendar.</bdi>}
        clearable
        onValueChange={setDate}
      />
      <Text as="p" size="body-s" color="secondary" role="status">
        <bdi>
          {date ? (
            <>
              Review scheduled for <time dateTime={date}>{reviewDate.format(new Date(date))}</time>.
            </>
          ) : (
            'No review scheduled.'
          )}
        </bdi>
      </Text>
    </Stack>
  );
}
