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
import './scrollbar.examples.css';

const densityClasses = {
  ordinary: 'unica-scrollbar',
  compact: 'unica-scrollbar unica-scrollbar--compact',
};

interface PlaygroundValues {
  readonly density: keyof typeof densityClasses;
  readonly axis: 'vertical' | 'horizontal' | 'both';
  readonly height: number;
  readonly longContent: boolean;
}

const topics = [
  ['Overview', 'A short introduction and the essentials.'],
  ['Getting started', 'Create a workspace and invite your team.'],
  ['Writing', 'Keep notes clear, useful and easy to find.'],
  ['Organizing', 'Group related pages without losing context.'],
  ['Sharing', 'Choose who can read and edit your work.'],
  ['Search', 'Find a page by its title or contents.'],
  ['Shortcuts', 'Move through common actions with a keyboard.'],
  ['Preferences', 'Make the workspace comfortable for you.'],
  ['Notifications', 'Stay informed about the changes that matter.'],
  ['History', 'Review earlier versions and restore a change.'],
  ['Importing', 'Bring existing documents into your workspace.'],
  ['Exporting', 'Keep a portable copy of your work.'],
] as const;

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
const guidePath =
  'Workspace guide / Getting started / Access and permissions / Notifications / Email delivery settings';

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

function scrollportStyle(axis: PlaygroundValues['axis'], height: number): CSSProperties {
  return {
    inlineSize: 'min(100%, 22rem)',
    minInlineSize: 0,
    blockSize: height,
    overflowX: axis === 'vertical' ? 'hidden' : 'auto',
    overflowY: axis === 'horizontal' ? 'hidden' : 'auto',
    overscrollBehavior: 'contain',
  };
}

const wideContentStyle = { inlineSize: 'max-content' };
const indexEntries = {
  vertical: topics.map(([title]) => title),
  both: topics.map(([title, description]) => `${title} — ${description}`),
};
const indexStyle = { display: 'grid', gap: 'var(--space-8)', margin: 0, paddingInlineStart: '2em' };

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

export function scrollbarPlaygroundCode({
  axis,
  density,
  height,
  longContent,
}: PlaygroundValues): string {
  const content =
    longContent && axis !== 'horizontal'
      ? `<ol style={${JSON.stringify(indexStyle)}}>
        {${JSON.stringify(indexEntries[axis])}.map(entry => <li key={entry}><bdi>{entry}</bdi></li>)}
      </ol>`
      : longContent
        ? guidePath
        : 'Guide';
  const width =
    longContent && axis !== 'vertical' ? ` style={${JSON.stringify(wideContentStyle)}}` : '';
  return `import '@docouno/unica/styles.css';

<div
  className="${densityClasses[density]}"
  tabIndex={0}
  role="region"
  aria-label="Workspace guide"
  style={${JSON.stringify(scrollportStyle(axis, height))}}
  onScroll={({ currentTarget }) => {
    console.log({ left: currentTarget.scrollLeft, top: currentTarget.scrollTop });
  }}
>
  <div${width}>
    ${content}
  </div>
</div>`;
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
