import type { ReactNode } from 'react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  Code,
  Flex,
  Link,
  Stack,
  Text,
  Title,
} from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import './code.examples.css';

export function CodeFrame({ ctx, children }: PreviewProps & { readonly children: ReactNode }) {
  return (
    <Stack
      gap={12}
      data-surface={ctx.surface}
      className={
        ctx.surface === 'overlay'
          ? 'code-example-frame unica-overlay-surface'
          : 'code-example-frame'
      }
    >
      {children}
    </Stack>
  );
}

export function WrappingExample({ ctx }: PreviewProps) {
  return (
    <CodeFrame ctx={ctx}>
      <Stack gap={12} className="code-example-prose" lang="en" dir="ltr">
        <Text size="body-m">
          Open{' '}
          <Code {...ctx.subject}>
            packages/client/src/connections/reconnect-with-exponential-backoff.ts
          </Code>{' '}
          to change the retry policy.
        </Text>
        <Text size="body-s">
          Set <Code>--connection-draining-timeout-seconds=45</Code> if shutdown needs more time.
        </Text>
        <Text size="body-s">
          Pass <Code>{'--label="release  candidate"'}</Code> with both spaces inside the quotes.
        </Text>
        <Text dir="rtl" size="body-s">
          <bdi>Request URL</bdi> · <Code>v2/routes/:id?draft=true&amp;limit=20</Code>
        </Text>
        <Text size="body-s">
          A retry limit of <Code>{0}</Code> disables retries. An empty prefix <Code>{''}</Code>
          keeps the file name unchanged.
        </Text>
      </Stack>
    </CodeFrame>
  );
}

export function SurfacesExample({ ctx }: PreviewProps) {
  return (
    <CodeFrame ctx={ctx}>
      <Text size="body-s">
        <bdi>
          Read <Code {...ctx.subject}>Cache-Control</Code> before reusing a response.
        </bdi>
      </Text>
      <Card size="s">
        <Text size="body-s">
          <bdi>
            Private messages send <Code>Cache-Control: no-store</Code>.
          </bdi>
        </Text>
      </Card>
      <Card size="s" variant="subtle">
        <Text size="body-s">
          <bdi>
            Cache the stylesheet for an hour with <Code>Cache-Control: max-age=3600</Code>.
          </bdi>
        </Text>
      </Card>
    </CodeFrame>
  );
}

const responses = [
  {
    status: 'neutral',
    title: 'Response format',
    header: 'Content-Type',
    value: 'application/json',
  },
  { status: 'info', title: 'Continue the upload', header: 'HTTP/1.1', value: '100 Continue' },
  { status: 'success', title: 'File created', header: 'HTTP/1.1', value: '201 Created' },
  { status: 'warning', title: 'Retry later', header: 'HTTP/1.1', value: '429 Too Many Requests' },
  { status: 'danger', title: 'Access denied', header: 'HTTP/1.1', value: '403 Forbidden' },
] as const;

export function MessagesExample({ ctx }: PreviewProps) {
  return (
    <CodeFrame ctx={ctx}>
      {responses.map(({ status, title, header, value }) => (
        <Alert key={status} status={status} size="s" role="none">
          <AlertTitle>
            <bdi>{title}</bdi>
          </AlertTitle>
          <AlertDescription>
            <bdi dir="ltr">
              <Code>{header}</Code>
              {status === 'neutral' ? ': ' : ' '}
              <Code {...(status === 'info' ? ctx.subject : {})} status={status}>
                {value}
              </Code>
            </bdi>
          </AlertDescription>
        </Alert>
      ))}
    </CodeFrame>
  );
}

export function BoundariesExample({ ctx }: PreviewProps) {
  return (
    <CodeFrame ctx={ctx}>
      <Alert status="info" size="s" role="none">
        <AlertTitle>
          <bdi>Support receipt</bdi>
        </AlertTitle>
        <AlertDescription>
          <Stack gap={12}>
            <Text size="body-s" color="secondary">
              <bdi>
                Include <Code {...ctx.subject}>request_id</Code> from{' '}
                <Code status="neutral">response.json</Code> in your report.
              </bdi>
            </Text>
            <Card size="s">
              <Text size="body-s">
                <bdi>
                  Request ID: <Code>req_71af</Code>
                </bdi>
              </Text>
            </Card>
            <Text size="body-s" color="inherit">
              <bdi>
                The <Code plate={false}>X-Request-ID</Code> header carries the same value.
              </bdi>
            </Text>
          </Stack>
        </AlertDescription>
      </Alert>
    </CodeFrame>
  );
}

export function OverlayExample({ ctx }: PreviewProps) {
  return (
    <div className="code-example-overlay">
      <Stack
        gap={12}
        className="unica-overlay-surface code-example-panel"
        data-surface="overlay"
        role="group"
        aria-labelledby={ctx.id}
      >
        <Title id={ctx.id} as="h3" size="heading-s">
          Request details
        </Title>
        <Text size="body-s">
          <bdi>
            Send <Code {...ctx.subject}>Content-Type: application/json</Code> with the request. Keep{' '}
            <Code>Authorization</Code> out of shared logs.
          </bdi>
        </Text>
        <Text size="body-s">
          <bdi>
            Queued for processing: <Code status="success">202 Accepted</Code>.
          </bdi>
        </Text>
      </Stack>
    </div>
  );
}

export function PlainActions({ ctx }: PreviewProps) {
  return (
    <CodeFrame ctx={ctx}>
      <Flex wrap="wrap" align="center" gap={12}>
        <Button asChild size="s">
          <a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch">
            <bdi>
              Read{' '}
              <Code {...ctx.subject} plate={false}>
                fetch()
              </Code>
            </bdi>
          </a>
        </Button>
        <Link href="https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal">
          <bdi>
            <Code plate={false}>AbortSignal</Code> reference
          </bdi>
        </Link>
      </Flex>
    </CodeFrame>
  );
}
