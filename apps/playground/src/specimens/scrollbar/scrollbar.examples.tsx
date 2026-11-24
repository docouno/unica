import type { CSSProperties, ReactElement } from 'react';
import {
  Button,
  Card,
  CardAction,
  CardHeader,
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Text,
  Title,
} from '@docouno/unica';
import { CodeBlock } from '../../prototypes/code-block/code-block.proto.js';
import type { PreviewProps } from '../../workbench/types.js';
import {
  densityClasses,
  guidePath,
  indexEntries,
  indexStyle,
  scrollportStyle,
  topics,
  wideContentStyle,
} from './scrollbar.preview.js';
import type { PlaygroundValues } from './scrollbar.preview.js';
import './scrollbar.examples.css';

const listStyle = {
  display: 'grid',
  gap: 'var(--space-16)',
  listStyle: 'none',
  margin: 0,
  padding: 'var(--space-8)',
} satisfies CSSProperties;

const cardStyle = { inlineSize: 'min(100%, 28rem)' };
const readingStyle = {
  blockSize: 240,
  overflow: 'auto',
  overscrollBehavior: 'contain',
} satisfies CSSProperties;
function TopicList(): ReactElement {
  return (
    <ol role="list" style={listStyle}>
      {topics.map(([title, description]) => (
        <li key={title}>
          <Text as="strong" size="body-s">
            {title}
          </Text>
          <Text size="caption-l" color="secondary">
            <bdi>{description}</bdi>
          </Text>
        </li>
      ))}
    </ol>
  );
}

const topicListCode = `<ol role="list" style={${JSON.stringify(listStyle)}}>
  {[${topics.map((pair) => JSON.stringify(pair)).join(',\n    ')}].map(([title, description]) => (
    <li key={title}>
      <Text as="strong" size="body-s">{title}</Text>
      <Text size="caption-l" color="secondary"><bdi>{description}</bdi></Text>
    </li>
  ))}
</ol>`;

export function ScrollbarPlayground({
  ctx,
  values: { axis, density, height, longContent },
}: PreviewProps & { readonly values: PlaygroundValues }): ReactElement {
  return (
    <div
      {...ctx.subject}
      className={`${densityClasses[density]} scrollbar-demo-body`}
      tabIndex={0}
      role="region"
      aria-label="Workspace guide"
      style={scrollportStyle(axis, height)}
      onScroll={({ currentTarget }) => {
        ctx.action('onScroll')({ left: currentTarget.scrollLeft, top: currentTarget.scrollTop });
      }}
    >
      <div style={longContent && axis !== 'vertical' ? wideContentStyle : undefined}>
        {longContent && axis !== 'horizontal' ? (
          <ol style={indexStyle}>
            {indexEntries[axis].map((entry) => (
              <li key={entry}>
                <bdi>{entry}</bdi>
              </li>
            ))}
          </ol>
        ) : longContent ? (
          guidePath
        ) : (
          'Guide'
        )}
      </div>
    </div>
  );
}

export function ReadingComposition({ ctx }: PreviewProps): ReactElement {
  return (
    <Card style={cardStyle}>
      <CardHeader>
        <Title as="h3" size="heading-s" id={ctx.id}>
          Workspace guide
        </Title>
        <CardAction>
          <Text size="caption-l" color="muted">
            <bdi>{topics.length} topics</bdi>
          </Text>
        </CardAction>
      </CardHeader>
      <section
        {...ctx.subject}
        className="unica-scrollbar scrollbar-demo-body"
        tabIndex={0}
        aria-labelledby={ctx.id}
        style={readingStyle}
      >
        <TopicList />
      </section>
    </Card>
  );
}

export const readingCompositionCode = `import '@docouno/unica/styles.css';
import { useId } from 'react';
import { Card, CardAction, CardHeader, Text, Title } from '@docouno/unica';

export function ReadingGuide() {
  const headingId = useId();
  return (
    <Card style={${JSON.stringify(cardStyle)}}>
      <CardHeader>
        <Title as="h3" size="heading-s" id={headingId}>Workspace guide</Title>
        <CardAction><Text size="caption-l" color="muted"><bdi>${topics.length} topics</bdi></Text></CardAction>
      </CardHeader>
      <section className="unica-scrollbar" tabIndex={0} aria-labelledby={headingId} style={${JSON.stringify(readingStyle)}}>
        ${topicListCode}
      </section>
    </Card>
  );
}`;

export function OverlayExample({ ctx }: PreviewProps): ReactElement {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" tone="neutral">
          Open reference
        </Button>
      </PopoverTrigger>
      <PopoverContent className="scrollbar-demo-overlay">
        <PopoverHeader>
          <PopoverTitle>Quick reference</PopoverTitle>
          <PopoverDescription>
            <bdi>Keep the guide close while you work.</bdi>
          </PopoverDescription>
          <PopoverClose />
        </PopoverHeader>
        <PopoverBody {...ctx.subject} tabIndex={0} role="region" aria-label="Reference topics">
          <TopicList />
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

export function OverflowExample({ ctx }: PreviewProps): ReactElement {
  return (
    <Card style={cardStyle}>
      <Title as="h3" size="heading-s" id={ctx.id}>
        Reading list
      </Title>
      <section
        {...ctx.subject}
        className="unica-scrollbar scrollbar-demo-body"
        tabIndex={0}
        aria-labelledby={ctx.id}
        style={readingStyle}
      >
        {ctx.story?.controls.allTopics === true ? (
          <TopicList />
        ) : (
          <Text size="body-s">Overview</Text>
        )}
      </section>
    </Card>
  );
}

export function AxesExample({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="scrollbar-demo-stack">
      <CodeBlock language="Query" tabIndex={0} role="region" aria-label="Scrollable query">
        {
          'SELECT title, author, updated_at, access, workspace, path FROM documents ORDER BY updated_at DESC;'
        }
      </CodeBlock>
      <CodeBlock
        {...ctx.subject}
        className="scrollbar-demo-code"
        language="Activity"
        tabIndex={0}
        role="region"
        aria-label="Activity log, scrolls in both directions"
      >
        {topics
          .map(
            ([title], index) =>
              `${String(index + 1).padStart(2, '0')}  Updated  ${title.padEnd(16)}  workspace/guides/${title.toLowerCase().replaceAll(' ', '-')}  ·  changes saved`,
          )
          .join('\n')}
      </CodeBlock>
    </div>
  );
}
