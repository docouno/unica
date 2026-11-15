import { defineSpecimen } from '../../workbench/types.js';
import { Code } from './code.proto.js';
import { Button } from '../button/button.proto.js';
import { Card } from '../card/card.proto.js';
import { Alert } from '../feedback/feedback.proto.js';
import { Link } from '../link/link.proto.js';
import { PopoverContent, PopoverBody, PopoverTitle } from '../popover/popover.proto.js';
import { Text } from '../text/text.proto.js';
import { Title } from '../title/title.proto.js';
import './code.examples.css';

export default defineSpecimen({
  id: 'code',
  title: 'Code',
  group: 'Typography',
  summary: 'Technical words that belong to the sentence. Selectable, quiet, and always complete.',
  sections: [
    {
      id: 'reading',
      title: 'A natural part of the sentence',
      kind: 'matrix',
      caption:
        'Inherited size and weight. Optical compensation beside Inter; equal size beside Pixel’s monospace text.',
      render: () => (
        <div className="code-example-stack">
          <div className="code-example-stack code-example-compact">
            <Text size="caption-l" color="muted">
              HEADING · INHERITED WEIGHT
            </Text>
            <Title as="h3" size="heading-m">
              A safer default for <Code>retry()</Code>
            </Title>
            <Text size="body-m">
              Set <Code>maxAttempts</Code> to <Code>3</Code> and leave <Code>backoff</Code> enabled.
              A short pause gives the service time to recover.
            </Text>
          </div>
          <div className="code-example-stack code-example-compact">
            <Text size="caption-l" color="muted">
              SMALL BODY · MULTIPLE TOKENS
            </Text>
            <Text size="body-s">
              Use <Code>--dry-run</Code> before <Code>--apply</Code>. The <Code>config.json</Code>{' '}
              file stays unchanged until you confirm the update.
            </Text>
          </div>
          <Text size="caption-l" color="muted">
            Accepts <Code>string | null</Code>. Default: <Code>null</Code>.
          </Text>
        </div>
      ),
    },
    {
      id: 'sizes',
      title: 'Standalone values',
      kind: 'matrix',
      caption:
        'S / M / L use the body scale. In prose, prefer inheritance so the surrounding text owns the rhythm.',
      render: () => (
        <div className="code-example-stack">
          {(['s', 'm', 'l'] as const).map((size) => (
            <div className="code-example-row" key={size}>
              <Text size="caption-l" color="muted">
                {size.toUpperCase()}
              </Text>
              <div>
                <Code size={size}>release_candidate</Code>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'tones',
      title: 'Status is meaning, not decoration',
      kind: 'matrix',
      caption:
        'Neutral for ordinary literals. A semantic tone accompanies an explicit status, never replaces its wording.',
      render: () => (
        <div className="code-example-stack code-example-compact">
          <Text size="body-s">
            Format <Code>application/json</Code>
          </Text>
          <Text size="body-s">
            Information <Code tone="info">100 CONTINUE</Code>
          </Text>
          <Text size="body-s">
            Created <Code tone="success">201 CREATED</Code>
          </Text>
          <Text size="body-s">
            Retry later <Code tone="warning">429 RATE_LIMITED</Code>
          </Text>
          <Text size="body-s">
            Access denied <Code tone="danger">403 FORBIDDEN</Code>
          </Text>
        </div>
      ),
    },
    {
      id: 'wrapping',
      title: 'Every character stays available',
      kind: 'states',
      caption:
        'No ellipsis or internal scroll. Wrapped plates continue across lines; spaces remain selectable. Drag to select the real text.',
      render: () => (
        <div className="code-example-stack code-example-measure">
          <Text size="body-m">
            Open <Code>packages/client/src/connections/reconnect-with-exponential-backoff.ts</Code>{' '}
            to change the retry policy.
          </Text>
          <Text size="body-s">
            Use <Code>--connection-draining-timeout-seconds=45</Code> when the service needs more
            time.
          </Text>
          <Text size="body-s">
            The exact argument is <Code>{'--label="release  candidate"'}</Code>, including both
            spaces.
          </Text>
          <Text size="body-s">
            Treat <Code>v2/routes/:id?draft=true&amp;limit=20</Code> as a complete address.
            Punctuation remains in source order when the page direction changes.
          </Text>
          <Text size="body-s">
            A value of <Code>0</Code> is present; an absent value gets surrounding explanatory text.
          </Text>
        </div>
      ),
    },
    {
      id: 'surfaces',
      title: 'Canvas · Card · Message',
      kind: 'states',
      render: () => (
        <div className="code-example-stack">
          <Text size="body-s">
            Canvas: read <Code>cache-control</Code> before reusing a response.
          </Text>
          <Card size="s">
            <Text size="body-s">
              Card: set <Code>cache-control</Code> to <Code>no-store</Code> for private data.
            </Text>
          </Card>
          <Alert status="warning" title="The value has expired">
            Request a new{' '}
            <Code tone="inherit" plate={false}>
              access_token
            </Code>{' '}
            before retrying.
          </Alert>
        </div>
      ),
    },
    {
      id: 'overlay',
      title: 'Inside a floating surface',
      kind: 'states',
      caption:
        'Static Popover material study. Code itself stays opaque and has no backdrop filter.',
      overlayStage: true,
      surface: 'overlay',
      render: () => (
        <PopoverContent size="l" role="group" aria-label="Code on overlay material">
          <PopoverBody>
            <PopoverTitle>Request details</PopoverTitle>
            <Text size="body-s">
              Send <Code>content-type: application/json</Code> with the request. Keep{' '}
              <Code>authorization</Code> out of shared logs.
            </Text>
            <Text size="body-s">
              Accepted <Code tone="success">202 ACCEPTED</Code>
            </Text>
          </PopoverBody>
        </PopoverContent>
      ),
    },
    {
      id: 'controls',
      title: 'Let the action keep its voice',
      kind: 'context',
      caption:
        'Unplated code can inherit the enclosing control’s foreground. Only the Button or Link is interactive; Code adds no Tab stop.',
      render: () => (
        <div className="code-example-stack">
          <div className="code-example-actions">
            <Button size="s">
              Run{' '}
              <Code plate={false} tone="inherit">
                npm test
              </Code>
            </Button>
            <Button size="s" variant="secondary" tone="neutral">
              Open{' '}
              <Code plate={false} tone="inherit">
                config.ts
              </Code>
            </Button>
          </div>
          <Text size="body-s">
            Read the{' '}
            <Link href="https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal">
              <Code plate={false} tone="inherit">
                AbortSignal
              </Code>{' '}
              reference
            </Link>{' '}
            before canceling a request.
          </Text>
          <Text size="body-s">
            <strong>
              Keep <Code>strict</Code> enabled.
            </strong>{' '}
            It catches mistakes before they reach the reader.
          </Text>
        </div>
      ),
    },
  ],
});
