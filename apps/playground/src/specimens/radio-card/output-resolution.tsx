import { useId, useState } from 'react';
import { Stack, Text, RadioCard, RadioCardGroup } from '@docouno/unica';
import '@docouno/unica/styles.css';

const options = [
  { value: 'screen', label: 'Screen', dpi: 96 },
  { value: 'print', label: 'Print', dpi: 300 },
];

export function OutputResolution({ subjectProps = {} } = {}) {
  const id = useId();
  const [selected, setSelected] = useState('screen');
  const resolution = options.find((option) => option.value === selected)?.dpi ?? 96;
  return (
    <Stack gap={12}>
      <Text id={id} size="body-m" weight="semibold">
        Output resolution
      </Text>
      <Text id={id + '-help'} size="body-s" color="secondary">
        <bdi>Export an 8 × 6 inch image.</bdi>
      </Text>
      <RadioCardGroup
        value={selected}
        onValueChange={setSelected}
        aria-labelledby={id}
        aria-describedby={id + '-help'}
      >
        {options.map(({ value, label, dpi }) => (
          <div key={value} {...subjectProps}>
            <RadioCard
              value={value}
              label={label}
              description={<bdi>{dpi} pixels per inch.</bdi>}
            />
          </div>
        ))}
      </RadioCardGroup>
      <Text role="status" size="body-s">
        <bdi>
          Output: {8 * resolution} × {6 * resolution} pixels.
        </bdi>
      </Text>
    </Stack>
  );
}
