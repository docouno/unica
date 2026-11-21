import { useId, useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';
import { defineComponent } from '../../workbench/types.js';
import type { PreviewContext } from '../../workbench/types.js';
import { Card, CardAction, CardHeader } from '../../prototypes/card/card.proto.js';
import { CodeBlock } from '../../prototypes/code-block/code-block.proto.js';
import {
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from '../../prototypes/popover/popover.proto.js';
import { Button } from '../../prototypes/button/button.proto.js';
import { Text, Title } from '@docouno/unica';
import './scrollbar.examples.css';

const densityClasses = {
  ordinary: 'unica-scrollbar',
  compact: 'unica-scrollbar unica-scrollbar--compact',
};

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

const topicListStyle = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  fontFamily: 'var(--font-family-base)',
  fontStyle: 'normal',
  letterSpacing: 'normal',
  overflowWrap: 'anywhere',
} satisfies CSSProperties;

const topicRowStyle = {
  display: 'grid',
  gap: 'var(--space-4)',
  padding: 'var(--space-12) var(--space-8)',
} satisfies CSSProperties;

const topicRowBorder = '1px solid var(--border-subtle)';
const dividedTopicRowStyle = { ...topicRowStyle, borderBlockStart: topicRowBorder };

const topicTitleStyle = {
  minInlineSize: 0,
  fontSize: 'var(--text-size-body-s)',
  lineHeight: 'var(--text-size-body-s-lh)',
  fontWeight: 700,
} satisfies CSSProperties;

const topicDescriptionStyle = {
  margin: 0,
  minInlineSize: 0,
  fontSize: 'var(--text-size-caption-l)',
  lineHeight: 'var(--text-size-caption-l-lh)',
  fontWeight: 400,
  color: 'var(--fg-secondary)',
} satisfies CSSProperties;

const scrollportFrame = {
  minBlockSize: 0,
  overscrollBehavior: 'contain',
  padding: 'var(--space-4)',
  margin: 'calc(-1 * var(--space-4))',
} satisfies CSSProperties;

const readingScrollportStyle = {
  ...scrollportFrame,
  blockSize: 240,
  overflow: 'auto',
} satisfies CSSProperties;

function TopicList({ short = false }: { readonly short?: boolean }): ReactElement {
  return (
    <ol style={topicListStyle}>
      {(short ? topics.slice(0, 2) : topics).map(([title, description], index) => (
        <li key={title} style={index ? dividedTopicRowStyle : topicRowStyle}>
          <strong style={topicTitleStyle}>{title}</strong>
          <p style={topicDescriptionStyle}>{description}</p>
        </li>
      ))}
    </ol>
  );
}

function BaseExample({ ctx }: { readonly ctx: PreviewContext }): ReactElement {
  const id = useId();
  return (
    <div className="scrollbar-demo-stack">
      <Card className="scrollbar-demo-card">
        <CardHeader>
          <Title as="h3" size="heading-s" id={id}>
            Workspace guide
          </Title>
          <CardAction>
            <Text size="caption-l" color="muted">
              12 topics
            </Text>
          </CardAction>
        </CardHeader>
        <section
          {...ctx.subject}
          className="unica-scrollbar scrollbar-demo-body"
          tabIndex={0}
          aria-labelledby={id}
          style={readingScrollportStyle}
        >
          <TopicList />
        </section>
      </Card>
      <Text className="scrollbar-demo-note" size="caption-l" color="secondary">
        The title stays in place. Scroll the content with a wheel, touch or the keyboard.
      </Text>
    </div>
  );
}

function OverlayExample({ ctx }: { readonly ctx: PreviewContext }): ReactElement {
  const id = useId();
  const [open, setOpen] = useState(true);
  return (
    <div className="scrollbar-demo-stack">
      {open ? (
        <PopoverContent className="scrollbar-demo-overlay" aria-labelledby={id}>
          <PopoverHeader>
            <PopoverTitle id={id}>Quick reference</PopoverTitle>
            <PopoverDescription>Keep the guide close while you work.</PopoverDescription>
          </PopoverHeader>
          <PopoverClose onClick={() => setOpen(false)} />
          <PopoverBody {...ctx.subject} tabIndex={0} role="region" aria-label="Reference topics">
            <TopicList />
          </PopoverBody>
        </PopoverContent>
      ) : (
        <Button variant="secondary" tone="neutral" onClick={() => setOpen(true)}>
          Open reference
        </Button>
      )}
      <Text className="scrollbar-demo-note" size="caption-l" color="secondary">
        A compact native scrollbar belongs to the body, inside the panel padding. The track stays
        transparent.
      </Text>
    </div>
  );
}

function StateExample({ ctx }: { readonly ctx: PreviewContext }): ReactElement {
  const id = useId();
  const [overflow, setOverflow] = useState(false);
  return (
    <div className="scrollbar-demo-stack">
      <label className="scrollbar-demo-switch">
        <input
          type="checkbox"
          checked={overflow}
          onChange={(event) => setOverflow(event.target.checked)}
        />
        Show all topics
      </label>
      <Card className="scrollbar-demo-card">
        <Title as="h3" size="heading-s" id={id}>
          Reading list
        </Title>
        <div
          {...ctx.subject}
          className="unica-scrollbar scrollbar-demo-body"
          tabIndex={0}
          role="region"
          aria-labelledby={id}
          style={readingScrollportStyle}
        >
          <TopicList short={!overflow} />
        </div>
      </Card>
      <Text className="scrollbar-demo-note" size="caption-l" color="secondary">
        No overflow means no scrollbar. Tab to the region for a visible focus ring; arrow keys and
        Page Down scroll it.
      </Text>
    </div>
  );
}

function HorizontalExample({ ctx }: { readonly ctx: PreviewContext }): ReactElement {
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
      <Text className="scrollbar-demo-note" size="caption-l" color="secondary">
        The same quiet thumb works on either axis. The corner stays transparent.
      </Text>
    </div>
  );
}

const guidePath = 'Guide / Getting started / Permissions / Notification delivery';
const wideContentStyle = { minInlineSize: '32rem' } satisfies CSSProperties;
const guidePathStyle = {
  fontFamily: 'var(--font-family-base)',
  fontSize: 'var(--text-size-body-s)',
  lineHeight: 'var(--text-size-body-s-lh)',
} satisfies CSSProperties;

function scrollportStyle(axis: 'vertical' | 'horizontal' | 'both', height: number) {
  return {
    ...scrollportFrame,
    inlineSize: 'min(100%, 22rem)',
    blockSize: height,
    overflowX: axis === 'vertical' ? 'hidden' : 'auto',
    overflowY: axis === 'horizontal' ? 'hidden' : 'auto',
  } satisfies CSSProperties;
}

function styleCode(style: CSSProperties): string {
  const entries = Object.entries(style).map(([name, value]) => `${name}: ${JSON.stringify(value)}`);
  return `{ ${entries.join(', ')} }`;
}

function topicListCode(items: readonly (readonly [string, string])[]): string {
  return [
    `<ol style={${styleCode(topicListStyle)}}>`,
    '  {[',
    ...items.map((entry) => `    ${JSON.stringify(entry)},`),
    '  ].map(([title, description], index) => (',
    `    <li key={title} style={{ ...${styleCode(topicRowStyle)}, borderBlockStart: index ? ${JSON.stringify(topicRowBorder)} : undefined }}>`,
    `      <strong style={${styleCode(topicTitleStyle)}}>{title}</strong>`,
    `      <p style={${styleCode(topicDescriptionStyle)}}>{description}</p>`,
    '    </li>',
    '  ))}',
    '</ol>',
  ].join('\n');
}

export default defineComponent({
  id: 'scrollbar',
  title: 'Scrollbar',
  category: 'Layout',
  status: 'UI',
  summary: 'Native scrolling, a transparent track and a quiet thumb in the surface palette.',
  defaultSurface: 'base',
  componentName: 'div',
  props: {
    density: {
      kind: 'enum',
      group: 'Scrollbar',
      default: 'ordinary',
      demo: true,
      description: 'Add the compact modifier for a smaller native gutter.',
      choices: [{ value: 'ordinary' }, { value: 'compact' }],
    },
    axis: {
      kind: 'enum',
      group: 'Viewport',
      default: 'vertical',
      demo: true,
      description: 'Choose the overflowing axis to inspect.',
      choices: [{ value: 'vertical' }, { value: 'horizontal' }, { value: 'both' }],
    },
    height: {
      kind: 'number',
      group: 'Viewport',
      default: 160,
      demo: true,
      description: 'Block size of the scroll container in CSS pixels.',
      examples: [96, 160, 240],
    },
    longContent: {
      kind: 'boolean',
      group: 'Content',
      default: true,
      description: 'Choose content that can overflow the scrolling region.',
      demo: true,
    },
    onScroll: {
      kind: 'action',
      group: 'Events',
      code: 'handleScroll',
      description: 'Records the native scroll position.',
    },
  },
  render: ({ ctx, values: { axis, density, height, longContent } }) => (
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
        {axis === 'horizontal' ? (
          <p style={guidePathStyle}>{longContent ? guidePath : 'Guide'}</p>
        ) : (
          <TopicList short={!longContent} />
        )}
      </div>
    </div>
  ),
  code: ({ axis, density, height, longContent }) => {
    const contents =
      axis === 'horizontal'
        ? `<p style={${styleCode(guidePathStyle)}}>${longContent ? guidePath : 'Guide'}</p>`
        : topicListCode(longContent ? topics : topics.slice(0, 2));
    const innerStyle =
      longContent && axis !== 'vertical' ? ` style={${styleCode(wideContentStyle)}}` : '';
    return `import '@docouno/unica/styles.css';

<div
  className="${densityClasses[density]}"
  tabIndex={0}
  role="region"
  aria-label="Workspace guide"
  style={${styleCode(scrollportStyle(axis, height))}}
  onScroll={({ currentTarget }) => {
    console.log({ left: currentTarget.scrollLeft, top: currentTarget.scrollTop });
  }}
>
  <div${innerStyle}>
${contents.replace(/^/gm, '    ')}
  </div>
</div>`;
  },
  matrixViews: [
    { id: 'overflow', title: 'Scrolling axes and content', rows: 'axis', cols: 'longContent' },
    { id: 'density', title: 'Density and scrolling axes', rows: 'density', cols: 'axis' },
  ],
  cases: [
    {
      id: 'overlay',
      mode: 'live',
      title: 'Inside the overlay',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'Compact width in a tight panel. Only the body scrolls; the header and Close stay available.',
      kind: 'surface',
      render: OverlayExample,
    },
    {
      id: 'states',
      mode: 'live',
      title: 'Fits · Overflows · Focus',
      surface: 'base',
      caption:
        'The thumb becomes clearer on hover and drag. The region has its own keyboard focus; touch keeps system scrolling.',
      kind: 'behavior',
      render: StateExample,
    },
    {
      id: 'axes',
      mode: 'live',
      title: 'Horizontal & both axes',
      surface: 'base',
      caption: 'Code stays LTR inside RTL layouts. No extra scroll wrapper or synthetic thumb.',
      kind: 'behavior',
      render: HorizontalExample,
    },
  ],
  usage: [
    {
      id: 'base',
      code: `import '@docouno/unica/styles.css';

<section
  aria-label="Workspace guide"
  className="unica-scrollbar"
  tabIndex={0}
  style={${styleCode(readingScrollportStyle)}}
>
${topicListCode(topics).replace(/^/gm, '  ')}
</section>`,
      title: 'Ordinary surfaces',
      surface: 'base',
      caption: 'A quiet position indicator for reading areas, sidebars and page scrolling.',
      render: BaseExample,
    },
  ],
});
