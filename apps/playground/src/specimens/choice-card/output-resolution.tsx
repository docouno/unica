import { useId, useState } from 'react';
import { Stack, Text } from '@docouno/unica';
import { RadioCard } from '../../prototypes/choice-card/choice-card.proto.js';
import '@docouno/unica/styles.css';

const options = [
  { value: 'screen', label: 'Screen', dpi: 96 },
  { value: 'print', label: 'Print', dpi: 300 },
];

export function OutputResolution({ cardProps = {} } = {}) {
  const id = useId();
  const [resolution, setResolution] = useState(96);
  return (
    <Stack gap={12}>
      <Text id={id} size="body-m" weight="semibold">
        Output resolution
      </Text>
      <Text id={id + '-help'} size="body-s" color="secondary">
        <bdi>Export an 8 × 6 inch image.</bdi>
      </Text>
      <Stack gap={8} role="radiogroup" aria-labelledby={id} aria-describedby={id + '-help'}>
        {options.map(({ value, label, dpi }) => (
          <RadioCard
            key={value}
            {...cardProps}
            name={id}
            value={value}
            label={label}
            description={<bdi>{dpi} pixels per inch.</bdi>}
            checked={resolution === dpi}
            onChange={() => setResolution(dpi)}
          />
        ))}
      </Stack>
      <Text role="status" size="body-s">
        <bdi>
          Output: {8 * resolution} × {6 * resolution} pixels.
        </bdi>
      </Text>
    </Stack>
  );
}
