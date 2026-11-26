import { useId, useState } from 'react';
import { Button, Stack, Text, CheckboxCard } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function RetentionOption({ subjectProps = {} } = {}) {
  const detailsId = useId();
  const [open, setOpen] = useState(false);
  return (
    <Stack gap={8}>
      <div {...subjectProps}>
        <CheckboxCard
          name="retain"
          value="source-files"
          label="Keep source files"
          description={<bdi>Retain the originals alongside the exported documents.</bdi>}
          secondary={
            <Button
              type="button"
              size="s"
              variant="ghost"
              tone="neutral"
              aria-expanded={open}
              aria-controls={detailsId}
              onClick={() => setOpen(!open)}
            >
              {open ? 'Hide retention policy' : 'View retention policy'}
            </Button>
          }
        />
      </div>
      <div id={detailsId} hidden={!open}>
        <Text size="body-s" color="secondary">
          <bdi>Original files stay available for 30 days. You can remove them sooner.</bdi>
        </Text>
      </div>
    </Stack>
  );
}
