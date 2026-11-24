import { useId } from 'react';
import { Grid, Stack, Text } from '@docouno/unica';
import { RadioCard, SwitchCard } from '../../prototypes/choice-card/choice-card.proto.js';
import '@docouno/unica/styles.css';

const sizes = Object.freeze({ Compact: 's', Default: 'm', Spacious: 'l' });

export function WorkspaceSettings({ cardProps = {} } = {}) {
  const id = useId();
  return (
    <Stack gap={24} style={{ inlineSize: '100%' }}>
      {Object.entries(sizes).map(([density, size]) => (
        <Stack gap={12} key={size}>
          <Text size="caption-l" color="secondary">
            <bdi>
              {size.toUpperCase()} · {density}
            </bdi>
          </Text>
          <Grid
            gap={12}
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 15rem), 1fr))' }}
          >
            <RadioCard
              size={size}
              name={id + '-' + size}
              label="Workspace access"
              description={<bdi>People in this workspace can read shared pages.</bdi>}
              defaultChecked
            />
            <SwitchCard
              {...cardProps}
              size={size}
              label="Activity notifications"
              description={<bdi>Notify members when shared pages change.</bdi>}
              defaultChecked
            />
          </Grid>
        </Stack>
      ))}
    </Stack>
  );
}
