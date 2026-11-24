import { Flex, ProgressCircle, Stack, Text } from '@docouno/unica';

const transfers = [
  { label: 'Sending references.pdf', value: 42, max: 80, unit: 'MB' },
  { label: 'Processing archive', value: 3, max: 8, unit: 'stages' },
  {
    label: 'Transfer paused while waiting for connection',
    value: 42,
    max: 80,
    unit: 'MB',
    paused: true,
  },
  {
    label: 'Validating records from a long document collection',
    value: 1284,
    max: 1528,
    unit: 'records',
    compact: true,
  },
];

const numbers = new Intl.NumberFormat('en-US');

export function TransferMeasurements({ circleProps = {} } = {}) {
  return (
    <Stack gap={16}>
      {transfers.map(({ label, value, max, unit, paused, compact }) => {
        const amount = `${numbers.format(value)} of ${numbers.format(max)} ${unit}`;
        return (
          <Flex key={label} align="start" gap={8}>
            <Flex align="center" style={{ flex: 'none', blockSize: 'var(--text-size-body-s-lh)' }}>
              <ProgressCircle
                {...circleProps}
                size={compact ? 's' : 'm'}
                tone={paused || compact ? 'muted' : 'accent'}
                value={value}
                max={max}
                aria-label={label}
                aria-valuetext={amount}
              />
            </Flex>
            <Text size="body-s" color={paused ? 'secondary' : 'primary'}>
              <bdi>
                <span aria-hidden="true">{label} · </span>
                <Text as="span" size="body-s" color="secondary" style={{ display: 'inline-block' }}>
                  {amount}
                </Text>
              </bdi>
            </Text>
          </Flex>
        );
      })}
    </Stack>
  );
}
