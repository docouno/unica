import { useId, useState } from 'react';
import { NumberInput, Stack, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function PortionEstimate({ fieldProps = {} } = {}) {
  const id = useId();
  const [amount, setAmount] = useState(2);
  return (
    <Stack gap={12} style={{ inlineSize: 'min(100%, 32rem)' }}>
      <Stack gap={8}>
        <Text as="label" size="body-s" htmlFor={id}>
          Portions
        </Text>
        <div {...fieldProps} style={{ display: 'flex' }}>
          <NumberInput
            id={id}
            min={0.5}
            max={12}
            step={0.5}
            defaultValue={2}
            aria-describedby={id + '-help'}
            onInput={(event) => {
              const { validity, valueAsNumber } = event.currentTarget;
              setAmount(validity.valid ? valueAsNumber : NaN);
            }}
          />
        </div>
        <Text id={id + '-help'} size="caption-l" color="muted">
          <bdi>Allow 80 g of dry rice per portion.</bdi>
        </Text>
      </Stack>
      <Text as="p" role="status" size="body-s">
        <bdi>
          {Number.isFinite(amount)
            ? `Dry rice: ${amount * 80} g.`
            : 'Enter 0.5 to 12 portions in half portions for an estimate.'}
        </bdi>
      </Text>
    </Stack>
  );
}
