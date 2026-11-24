import { useId, useState } from 'react';
import { Button, Code, Flex, Link, Text, Title } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { CodeFrame } from './code.examples.js';

export function ReadingComposition({ ctx }: PreviewProps) {
  return (
    <CodeFrame ctx={ctx}>
      <Title as="h3" size="heading-m">
        <bdi>
          A safer default for <Code {...ctx.subject}>retry()</Code>
        </bdi>
      </Title>
      <Text size="body-m">
        <bdi>
          Set <Code>maxAttempts</Code> to <Code>3</Code> to limit the number of requests.
        </bdi>
      </Text>
      <Text size="body-s">
        <bdi>
          <strong>
            Leave <Code>backoff</Code> enabled.
          </strong>{' '}
          A longer wait after each failure gives the service time to recover.
        </bdi>
      </Text>
      <Text size="caption-l" color="muted">
        <bdi>
          The <Code>onRetry</Code> callback receives the attempt number.
        </bdi>
      </Text>
    </CodeFrame>
  );
}

export const readingCode = `import '@docouno/unica/styles.css';
import { Code, Stack, Text, Title } from '@docouno/unica';

<Stack gap={12}>
  <Title as="h3" size="heading-m">
    <bdi>A safer default for <Code>retry()</Code></bdi>
  </Title>
  <Text size="body-m">
    <bdi>Set <Code>maxAttempts</Code> to <Code>3</Code> to limit the number of requests.</bdi>
  </Text>
  <Text size="body-s">
    <bdi>
      <strong>Leave <Code>backoff</Code> enabled.</strong>{' '}
      A longer wait after each failure gives the service time to recover.
    </bdi>
  </Text>
  <Text size="caption-l" color="muted">
    <bdi>The <Code>onRetry</Code> callback receives the attempt number.</bdi>
  </Text>
</Stack>`;

const config = '{ "compilerOptions": { "strict": true } }';
const configDownload = 'data:application/json;charset=utf-8,' + encodeURIComponent(config);
const strictReference = 'https://www.typescriptlang.org/tsconfig/strict.html';

export function ActionsComposition({ ctx }: PreviewProps) {
  const [open, setOpen] = useState(false);
  const configId = useId();

  return (
    <CodeFrame ctx={ctx}>
      <Flex align="center" gap={8} wrap="wrap">
        <Button
          size="s"
          aria-expanded={open}
          aria-controls={configId}
          onClick={() => setOpen(!open)}
        >
          <bdi>
            {open ? 'Hide' : 'Show'}{' '}
            <Code {...ctx.subject} plate={false}>
              tsconfig.json
            </Code>
          </bdi>
        </Button>
        <Button asChild size="s" variant="secondary" tone="neutral">
          <a href={configDownload} download="tsconfig.json">
            <bdi>
              Download <Code plate={false}>tsconfig.json</Code>
            </bdi>
          </a>
        </Button>
      </Flex>
      <Text id={configId} hidden={!open} size="body-s">
        <Code>{config}</Code>
      </Text>
      <Text size="body-s">
        <bdi>
          The{' '}
          <Link href={strictReference}>
            <Code plate={false}>strict</Code> option
          </Link>{' '}
          enables the full family of strict type checks.
        </bdi>
      </Text>
    </CodeFrame>
  );
}

export const actionsCode = `import { useId, useState } from 'react';
import '@docouno/unica/styles.css';
import { Button, Code, Flex, Link, Stack, Text } from '@docouno/unica';

const config = '{ "compilerOptions": { "strict": true } }';
const configDownload = 'data:application/json;charset=utf-8,' + encodeURIComponent(config);
const strictReference = 'https://www.typescriptlang.org/tsconfig/strict.html';

export function ConfigActions() {
  const [open, setOpen] = useState(false);
  const configId = useId();

  return (
    <Stack gap={12}>
      <Flex align="center" gap={8} wrap="wrap">
        <Button size="s" aria-expanded={open} aria-controls={configId} onClick={() => setOpen(!open)}>
          <bdi>{open ? 'Hide' : 'Show'} <Code plate={false}>tsconfig.json</Code></bdi>
        </Button>
        <Button asChild size="s" variant="secondary" tone="neutral">
          <a href={configDownload} download="tsconfig.json">
            <bdi>Download <Code plate={false}>tsconfig.json</Code></bdi>
          </a>
        </Button>
      </Flex>
      <Text id={configId} hidden={!open} size="body-s"><Code>{config}</Code></Text>
      <Text size="body-s">
        <bdi>
          The <Link href={strictReference}><Code plate={false}>strict</Code> option</Link>{' '}
          enables the full family of strict type checks.
        </bdi>
      </Text>
    </Stack>
  );
}`;
