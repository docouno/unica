import { useId, useState } from 'react';
import { Button, Flex, Stack, Text } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { LayoutExample } from './layout.examples.js';

const stages = [
  { label: 'Draft', requirement: 'The author can still edit the record.' },
  { label: 'In review', requirement: 'A reviewer checks the record before release.' },
  { label: 'Ready', requirement: 'The review is complete and the record can be released.' },
] as const;

export function ReversedFocusOrder({ ctx }: PreviewProps) {
  const [selected, setSelected] = useState<string | null>('Draft');
  const stage = stages.find(({ label }) => label === selected);

  return (
    <LayoutExample>
      <Stack gap={8}>
        <Flex
          {...ctx.subject}
          role="group"
          aria-label="Stage descriptions"
          direction="row-reverse"
          gap={8}
          wrap="wrap"
        >
          {stages.map(({ label }) => (
            <Button
              key={label}
              size="s"
              variant="secondary"
              tone="neutral"
              pressed={selected === label}
              onPressedChange={(pressed) => setSelected(pressed ? label : null)}
            >
              {label}
            </Button>
          ))}
        </Flex>
        <Text role="status" size="body-s" color="secondary">
          {stage?.requirement ?? 'Choose a stage to read its description.'}
        </Text>
      </Stack>
    </LayoutExample>
  );
}

const record = 'The release checklist is ready for review.';

export function RecordActions({ ctx }: PreviewProps) {
  const [open, setOpen] = useState(false);
  const recordId = useId();

  return (
    <Stack gap={8}>
      <Flex {...ctx.subject} align="center" gap={8} wrap="wrap">
        <Text as="span" size="body-s" weight="semibold">
          Quarterly release checklist
        </Text>
        <Button
          size="s"
          aria-expanded={open}
          aria-controls={recordId}
          onClick={() => setOpen(!open)}
        >
          {open ? 'Close record' : 'Open record'}
        </Button>
        <Button asChild size="s" variant="secondary" tone="neutral">
          <a
            href={`data:text/plain;charset=utf-8,${encodeURIComponent(record)}`}
            download="release-checklist.txt"
          >
            Download
          </a>
        </Button>
      </Flex>
      <Text id={recordId} hidden={!open} size="body-s">
        {record}
      </Text>
    </Stack>
  );
}

export const recordActionsCode = `import { useId, useState } from 'react';
import { Button, Flex, Stack, Text } from '@docouno/unica';

const record = 'The release checklist is ready for review.';

export function RecordActions() {
  const [open, setOpen] = useState(false);
  const recordId = useId();

  return (
    <Stack gap={8}>
      <Flex align="center" gap={8} wrap="wrap">
        <Text as="span" size="body-s" weight="semibold">Quarterly release checklist</Text>
        <Button size="s" aria-expanded={open} aria-controls={recordId} onClick={() => setOpen(!open)}>
          {open ? 'Close record' : 'Open record'}
        </Button>
        <Button asChild size="s" variant="secondary" tone="neutral">
          <a href={'data:text/plain;charset=utf-8,' + encodeURIComponent(record)} download="release-checklist.txt">
            Download
          </a>
        </Button>
      </Flex>
      <Text id={recordId} hidden={!open} size="body-s">{record}</Text>
    </Stack>
  );
}`;
