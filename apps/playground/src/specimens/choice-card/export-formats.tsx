import { useId } from 'react';
import { Badge, Stack, Text } from '@docouno/unica';
import { CheckboxCard } from '../../prototypes/choice-card/choice-card.proto.js';
import '@docouno/unica/styles.css';

export function ExportFormats({ cardProps = {} } = {}) {
  const titleId = useId();
  return (
    <Stack role="group" aria-labelledby={titleId} gap={8}>
      <Text id={titleId} size="body-m" weight="semibold">
        Export formats
      </Text>
      <CheckboxCard
        {...cardProps}
        name="formats"
        value="markdown"
        label="Markdown files"
        description={<bdi>Keep editable text and links.</bdi>}
        metadata={<Badge size="s">Editable</Badge>}
        defaultChecked
      />
      <CheckboxCard
        {...cardProps}
        name="formats"
        value="pdf"
        label="PDF documents"
        description={<bdi>Keep the printed page layout.</bdi>}
        metadata={<Badge size="s">Print ready</Badge>}
      />
    </Stack>
  );
}
