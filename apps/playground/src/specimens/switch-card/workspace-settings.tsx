import { Grid, Stack, Text, RadioCard, RadioCardGroup, SwitchCard } from '@docouno/unica';
import '@docouno/unica/styles.css';

const sizes = Object.freeze({ Compact: 's', Default: 'm', Spacious: 'l' });

export function WorkspaceSettings({ subjectProps = {} } = {}) {
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
            <RadioCardGroup
              aria-label={`Access policy · ${density}`}
              size={size}
              defaultValue="workspace"
            >
              <RadioCard
                value="workspace"
                label="Workspace access"
                description={<bdi>People in this workspace can read shared pages.</bdi>}
              />
              <RadioCard
                value="invite"
                label="Invite only"
                description={<bdi>Only invited people can read these pages.</bdi>}
              />
            </RadioCardGroup>
            <div {...subjectProps}>
              <SwitchCard
                size={size}
                label="Activity notifications"
                description={<bdi>Notify members when shared pages change.</bdi>}
                defaultChecked
              />
            </div>
          </Grid>
        </Stack>
      ))}
    </Stack>
  );
}
