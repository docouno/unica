import { Code, Link, Text, Title } from '@docouno/unica';
import { previewProps, previewText } from '../preview-code.js';
import { defineComponent } from '../../workbench/types.js';
import { Button } from '../../prototypes/button/button.proto.js';
import { Card } from '../../prototypes/card/card.proto.js';
import { Alert, AlertTitle, AlertDescription } from '../../prototypes/alert/alert.proto.js';
import {
  PopoverContent,
  PopoverBody,
  PopoverTitle,
} from '../../prototypes/popover/popover.proto.js';
import './code.examples.css';

const defaultLiteral = 'git status --short';

export default defineComponent({
  id: 'code',
  title: 'Code',
  category: 'Typography',
  status: 'UI',
  summary: 'Technical words that belong to the sentence. Selectable, quiet, and always complete.',
  componentName: 'Code',
  props: {
    size: {
      kind: 'enum',
      group: 'Appearance',
      default: 'inherit',
      description: 'Scale relative to prose or a control.',
      choices: [{ value: 'inherit' }, { value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    tone: {
      kind: 'enum',
      group: 'Appearance',
      default: 'inherit',
      description: 'Foreground meaning for the code.',
      choices: [
        { value: 'inherit' },
        { value: 'neutral' },
        { value: 'info' },
        { value: 'success' },
        { value: 'warning' },
        { value: 'danger' },
      ],
    },
    plate: {
      kind: 'boolean',
      group: 'Appearance',
      default: true,
      description: 'Show the local code background.',
    },
    dir: {
      kind: 'enum',
      group: 'Content',
      default: 'ltr',
      description: 'Set the base direction of the isolated literal.',
      choices: [{ value: 'ltr', label: 'LTR' }, { value: 'rtl', label: 'RTL' }, { value: 'auto' }],
    },
    children: {
      kind: 'string',
      group: 'Content',
      default: defaultLiteral,
      description: 'Inline code content.',
      examples: [defaultLiteral, '', '0', 'src/connections/reconnect-with-exponential-backoff.ts'],
    },
  },
  // Keep the literal in a line box inside the centered preview.
  render: ({ ctx, values: { children, ...props } }) => (
    <span>
      <Code {...ctx.subject} {...props}>
        {children}
      </Code>
    </span>
  ),
  code: ({ children, ...props }) =>
    `<Code${previewProps(props, { size: 'inherit', tone: 'inherit', plate: true, dir: 'ltr' })}>${previewText(children)}</Code>`,
  constraints: [
    {
      kind: 'ignored',
      when: { children: '' },
      affects: ['plate'],
      reason: 'An empty literal has no visible plate.',
    },
  ],
  matrixViews: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'plate',
      title: 'Standalone values',
      caption:
        'S / M / L use the body scale. In prose, prefer inheritance so the surrounding text owns the rhythm.',
      reference: () => (
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
      rows: 'tone',
      cols: 'plate',
      title: 'Status is meaning, not decoration',
      caption:
        'Neutral for ordinary literals. A semantic tone accompanies an explicit status, never replaces its wording.',
      reference: () => (
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
  ],
  cases: [
    {
      id: 'wrapping',
      mode: 'live',
      title: 'Every character stays available',
      caption:
        'No ellipsis or internal scroll. Wrapped plates continue across lines; spaces remain selectable. Drag to select the real text.',
      kind: 'content',
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
      title: 'Canvas · Card · Subtle Card',
      kind: 'surface',
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
          <Card size="s" variant="subtle">
            <Text size="body-s">
              Subtle Card: keep <Code>cache-control</Code> distinct from its own surface.
            </Text>
          </Card>
        </div>
      ),
    },
    {
      id: 'messages',
      title: 'The plate follows its painted context',
      kind: 'behavior',
      render: () => (
        <div className="code-example-stack code-example-compact">
          {(['neutral', 'info', 'success', 'warning', 'danger'] as const).map((status) => (
            <Alert key={status} status={status} size="s">
              <AlertTitle>{`${status} · quoted configuration`}</AlertTitle>
              <AlertDescription>
                Read <Code>response.status</Code> before retrying. An explicit matching tone{' '}
                <Code tone={status}>response.code</Code> also keeps its own tonal step.
              </AlertDescription>
            </Alert>
          ))}
          <Text size="body-s" color="muted">
            The nearest painted surface supplies the hue. An explicit tone overrides that context;
            plain Code inherits the surrounding text.
          </Text>
        </div>
      ),
    },
    {
      id: 'boundaries',
      title: 'Text passes context through · a Card starts its own',
      kind: 'content',
      render: () => (
        <Alert status="info" size="s">
          <AlertTitle>Reference details</AlertTitle>
          <div className="code-example-stack code-example-compact">
            <Text size="body-s" color="secondary">
              A local text color keeps <Code>request_id</Code> on the blue plate. An explicit{' '}
              <Code tone="neutral">config.json</Code> uses neutral colors.
            </Text>
            <Card size="s">
              <Text size="body-s">
                This opaque Card gives <Code>request_id</Code> a neutral context.
              </Text>
            </Card>
            <span>
              Plain <Code plate={false}>request_id</Code> uses the message foreground.
            </span>
          </div>
        </Alert>
      ),
    },
    {
      id: 'overlay',
      mode: 'pinned',
      title: 'Inside a floating surface',
      caption:
        'Static Popover material study. Contextual Code tints the actual surface without another backdrop filter.',
      overlayStage: true,
      surface: 'overlay',
      kind: 'surface',
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
      id: 'plain',
      title: 'Use the action foreground',
      kind: 'behavior',
      render: () => (
        <div className="code-example-actions">
          <Button size="s">
            Run <Code plate={false}>npm test</Code>
          </Button>
          <Link href="https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal">
            Read <Code plate={false}>AbortSignal</Code>
          </Link>
        </div>
      ),
    },
  ],
  usage: [
    {
      id: 'reading',
      code: `<p>Run <Code>git status --short</Code> before applying the change.</p>`,
      title: 'A natural part of the sentence',
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
      id: 'controls',
      code: `<Button variant="secondary">Copy <Code plate={false}>PATH</Code></Button>`,
      title: 'Let the action keep its voice',
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
