import { useId, useState } from 'react';
import { Box, Button, Stack, Text, RadioCard, RadioCardGroup } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function BackupSchedule({ subjectProps = {} } = {}) {
  const id = useId();
  const [saved, setSaved] = useState('');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const schedule = new FormData(event.currentTarget).get('backup');
        if (typeof schedule === 'string') {
          setSaved(schedule);
        }
      }}
    >
      <Stack gap={12}>
        <Text id={id} size="body-m" weight="semibold">
          Backup schedule
        </Text>
        <RadioCardGroup name="backup" defaultValue="daily" aria-labelledby={id}>
          <div {...subjectProps}>
            <RadioCard
              value="daily"
              label="Daily"
              description={<bdi>Every day at 02:00 UTC.</bdi>}
            />
          </div>
          <div {...subjectProps}>
            <RadioCard
              value="weekly"
              label="Weekly"
              description={<bdi>Every Monday at 02:00 UTC.</bdi>}
            />
          </div>
        </RadioCardGroup>
        <Box>
          <Button type="submit" size="s">
            Save schedule
          </Button>
        </Box>
        <Text as="p" role="status" size="caption-l" color="secondary">
          {saved && (
            <bdi>
              {saved === 'daily' ? 'Last saved schedule: Daily.' : 'Last saved schedule: Weekly.'}
            </bdi>
          )}
        </Text>
      </Stack>
    </form>
  );
}
