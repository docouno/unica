import { useState } from 'react';
import { Stack, Text } from '@docouno/unica';
import { NumberInput } from '../../prototypes/number-input/number-input.proto.js';
import '@docouno/unica/styles.css';

export function PortionEstimate({ fieldProps = {} } = {}) {
  const [portions, setPortions] = useState('2');
  const amount = Number(portions);
  const valid = amount >= 0.5 && amount <= 12 && Number.isInteger(amount * 2);
  return (
    <Stack gap={12}>
      <NumberInput
        {...fieldProps}
        label="Portions"
        min={0.5}
        max={12}
        step={0.5}
        value={portions === '' ? '' : amount}
        description={<bdi>Allow 80 g of dry rice per portion.</bdi>}
        onValueChange={(next) => setPortions(String(next))}
      />
      <Text as="p" role="status" size="body-s">
        <bdi>
          {valid
            ? `Dry rice: ${amount * 80} g.`
            : 'Enter 0.5 to 12 portions in half portions for an estimate.'}
        </bdi>
      </Text>
    </Stack>
  );
}
