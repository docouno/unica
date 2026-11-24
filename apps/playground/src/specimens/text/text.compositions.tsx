import { useId, useState } from 'react';
import { Divider, Input, Stack, Text, Title } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { TextFrame } from './text.examples.js';

export function ReaderExample({ ctx }: PreviewProps) {
  return (
    <TextFrame ctx={ctx}>
      <article dir="auto" style={{ maxInlineSize: '60ch' }}>
        <Stack gap={12}>
          <Title as="h2" size="heading-m">
            Before the release
          </Title>
          <Text {...ctx.subject} size="body-l">
            Give every release a named owner and a way to verify the result.
          </Text>
          <Text>
            Record <Text as="strong">one acceptance check</Text> in the release notes. Mark it{' '}
            <Text as="em">verified</Text> once a reviewer has repeated it.
          </Text>
          <Divider />
          <Text size="caption-l" color="secondary">
            Release handbook · Section 2
          </Text>
        </Stack>
      </article>
    </TextFrame>
  );
}

export const readerCode = `import '@docouno/unica/styles.css';
import { Divider, Stack, Text, Title } from '@docouno/unica';

export function HandbookEntry() {
  return (
    <article dir="auto" style={{ maxInlineSize: '60ch' }}>
      <Stack gap={12}>
        <Title as="h2" size="heading-m">Before the release</Title>
        <Text size="body-l">
          Give every release a named owner and a way to verify the result.
        </Text>
        <Text>
          Record <Text as="strong">one acceptance check</Text> in the release notes. Mark it{' '}
          <Text as="em">verified</Text> once a reviewer has repeated it.
        </Text>
        <Divider />
        <Text size="caption-l" color="secondary">Release handbook · Section 2</Text>
      </Stack>
    </article>
  );
}`;

export function SettingsExample({ ctx }: PreviewProps) {
  const fieldId = useId();
  const helpId = `${fieldId}-help`;
  const [name, setName] = useState('Docs team');

  return (
    <TextFrame ctx={ctx}>
      <Stack gap={4} style={{ maxInlineSize: '28rem' }}>
        <Text {...ctx.subject} as="label" htmlFor={fieldId} weight="medium">
          Display name
        </Text>
        <Input
          id={fieldId}
          aria-describedby={helpId}
          dir="auto"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <Text id={helpId} size="caption-l" color="secondary" dir="auto">
          This name appears on your published notes.
        </Text>
      </Stack>
      <Stack gap={4}>
        <Text size="caption-l" color="secondary">
          Byline preview
        </Text>
        <Text dir="auto" style={{ overflowWrap: 'anywhere' }}>
          By <bdi>{name.trim() || 'Unnamed author'}</bdi>
        </Text>
      </Stack>
    </TextFrame>
  );
}

export const settingsCode = `import { useId, useState } from 'react';
import '@docouno/unica/styles.css';
import { Input, Stack, Text } from '@docouno/unica';

export function DisplayNameSetting() {
  const fieldId = useId();
  const helpId = fieldId + '-help';
  const [name, setName] = useState('Docs team');

  return (
    <Stack gap={12}>
      <Stack gap={4} style={{ maxInlineSize: '28rem' }}>
        <Text as="label" htmlFor={fieldId} weight="medium">Display name</Text>
        <Input id={fieldId} aria-describedby={helpId} dir="auto" value={name}
          onChange={(event) => setName(event.currentTarget.value)} />
        <Text id={helpId} size="caption-l" color="secondary" dir="auto">
          This name appears on your published notes.
        </Text>
      </Stack>
      <Stack gap={4}>
        <Text size="caption-l" color="secondary">Byline preview</Text>
        <Text dir="auto" style={{ overflowWrap: 'anywhere' }}>
          By <bdi>{name.trim() || 'Unnamed author'}</bdi>
        </Text>
      </Stack>
    </Stack>
  );
}`;
