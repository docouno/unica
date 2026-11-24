import { useId, useState } from 'react';
import { Radio, RadioGroup, Stack, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

const schedules = [
  { value: 'immediate', label: 'As events happen', help: 'Receive each update immediately.' },
  {
    value: 'daily',
    label: 'Daily summary',
    help: 'Combine updates into one message each morning.',
  },
  { value: 'none', label: 'No email', help: 'Updates remain available in your inbox.' },
];

export function DeliveryPreferences({ groupProps = {} } = {}) {
  const id = useId();
  const [selected, setSelected] = useState('');
  const schedule = schedules.find((option) => option.value === selected);
  return (
    <Stack gap={24} style={{ inlineSize: 'min(100%, 26rem)' }}>
      <Stack gap={8}>
        <Text id={id} size="body-s" weight="medium">
          Delivery schedule
        </Text>
        <RadioGroup
          {...groupProps}
          aria-labelledby={id}
          value={selected || null}
          onValueChange={setSelected}
        >
          {schedules.map(({ value, label, help }) => (
            <Radio key={value} value={value} label={label} description={<bdi>{help}</bdi>} />
          ))}
        </RadioGroup>
        <Text size="caption-l" color="secondary" role="status">
          <bdi>{schedule ? `Selected: ${schedule.label}.` : 'No choice made yet.'}</bdi>
        </Text>
      </Stack>
      <Stack gap={8}>
        <Text id={id + '-dates'} size="body-s" weight="medium">
          Date display
        </Text>
        <RadioGroup
          {...groupProps}
          aria-labelledby={id + '-dates'}
          orientation="horizontal"
          defaultValue="relative"
        >
          <Radio value="relative" label="Relative dates" />
          <Radio value="absolute" label="Absolute dates" />
          <Radio value="system" label="System preference" />
        </RadioGroup>
      </Stack>
    </Stack>
  );
}
