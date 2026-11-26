import { useId, useState } from 'react';
import { Flex, NumberInput, Slider, Stack, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ImageQuality({ sliderProps = {} } = {}) {
  const id = useId();
  const [quality, setQuality] = useState(60);
  const [entry, setEntry] = useState('60');
  const [editorVersion, setEditorVersion] = useState(0);
  return (
    <Stack gap={8}>
      <Flex gap={16} wrap="wrap" align="start">
        <Stack gap={4} style={{ flex: '2 1 16rem' }}>
          <Flex align="baseline" gap={8} justify="space-between">
            <Text as="label" size="body-s" htmlFor={id}>
              Image quality
            </Text>
            <Text as="span" size="caption-l" color="secondary">
              <bdi>{quality}%</bdi>
            </Text>
          </Flex>
          <Slider
            {...sliderProps}
            id={id}
            aria-describedby={id + '-help'}
            value={quality}
            formatValue={(next) => next + '%'}
            showValue={false}
            marks={[
              { value: 0, label: '0%' },
              { value: 50, label: '50%' },
              { value: 100, label: '100%' },
            ]}
            onValueChange={(next) => {
              setQuality(next);
              setEntry(String(next));
            }}
          />
        </Stack>
        <Stack gap={4} style={{ flex: '1 1 10rem' }}>
          <Text as="label" size="body-s" htmlFor={id + '-exact'}>
            Exact image quality percentage
          </Text>
          <NumberInput
            key={editorVersion}
            id={id + '-exact'}
            aria-describedby={id + '-help'}
            min={0}
            max={100}
            suffix="%"
            value={entry === '' ? '' : Number(entry)}
            onValueChange={(next) => {
              setEntry(String(next));
              if (next !== '' && next >= 0 && next <= 100) {
                setQuality(Math.round(next));
              }
            }}
            onBlur={(event) => {
              setEntry(String(quality));
              if (event.currentTarget.validity.badInput) {
                // A native unfinished draft survives a numerically unchanged prop.
                setEditorVersion((version) => version + 1);
              }
            }}
          />
        </Stack>
      </Flex>
      <Text as="p" id={id + '-help'} size="caption-l" color="secondary">
        <bdi>Choose a percentage from 0 to 100. Fractions round to the nearest whole percent.</bdi>
      </Text>
    </Stack>
  );
}
