import { useId } from 'react';
import { Badge, Stack, Text, CheckboxCard } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ExportFormats({ subjectProps = {} } = {}) {
  const titleId = useId();
  return (
    <Stack role="group" aria-labelledby={titleId} gap={8}>
      <Text id={titleId} size="body-m" weight="semibold">
        Export formats
      </Text>
      <div {...subjectProps}>
        <CheckboxCard
          name="formats"
          value="markdown"
          label="Markdown files"
          description={<bdi>Keep editable text and links.</bdi>}
          metadata={<Badge size="s">Editable</Badge>}
          defaultChecked
        />
      </div>
      <div {...subjectProps}>
        <CheckboxCard
          name="formats"
          value="pdf"
          label="PDF documents"
          description={<bdi>Keep the printed page layout.</bdi>}
          metadata={<Badge size="s">Print ready</Badge>}
        />
      </div>
    </Stack>
  );
}
