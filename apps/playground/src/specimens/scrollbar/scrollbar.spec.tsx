import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { defineComponent } from '../../workbench/types.js';
import { Card, CardAction, CardHeader } from '../../prototypes/card/card.proto.js';
import { CodeBlock } from '../../prototypes/code/code.proto.js';
import {
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from '../../prototypes/popover/popover.proto.js';
import { Button } from '../../prototypes/button/button.proto.js';
import { Text } from '../../prototypes/text/text.proto.js';
import { Title } from '../../prototypes/title/title.proto.js';
import '../../prototypes/scrollbar/scrollbar.css';
import '../../prototypes/scrollbar/scrollbar.examples.css';

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

function TopicList({ short = false }: { readonly short?: boolean }): ReactElement {
  return (
    <ol className="scrollbar-demo-list">
      {(short ? topics.slice(0, 2) : topics).map(([title, description]) => (
        <li key={title}>
          <Text as="strong" size="body-s">
            {title}
          </Text>
          <Text size="caption-l" color="secondary">
            {description}
          </Text>
        </li>
      ))}
    </ol>
  );
}

function BaseExample(): ReactElement {
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
        <div
          className="scrollbar-proto scrollbar-demo-body"
          tabIndex={0}
          role="region"
          aria-labelledby={id}
        >
          <TopicList />
        </div>
      </Card>
      <Text className="scrollbar-demo-note" size="caption-l" color="secondary">
        The title stays in place. Scroll the content with a wheel, touch or the keyboard.
      </Text>
    </div>
  );
}

function OverlayExample(): ReactElement {
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
          <PopoverBody tabIndex={0} role="region" aria-label="Reference topics">
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

function StateExample(): ReactElement {
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
          className="scrollbar-proto scrollbar-demo-body"
          tabIndex={0}
          role="region"
          aria-labelledby={id}
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

function HorizontalExample(): ReactElement {
  return (
    <div className="scrollbar-demo-stack">
      <CodeBlock language="Query" tabIndex={0} role="region" aria-label="Scrollable query">
        {
          'SELECT title, author, updated_at, access, workspace, path FROM documents ORDER BY updated_at DESC;'
        }
      </CodeBlock>
      <CodeBlock
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

export default defineComponent({
  id: 'scrollbar',
  title: 'Scrollbar',
  category: 'Layout',
  status: 'Proto',
  summary: 'Native scrolling, a transparent track and a quiet thumb in the surface palette.',
  defaultSurface: 'base',
  componentName: 'div',
  props: {
    axis: {
      kind: 'enum',
      group: 'Viewport',
      default: 'vertical',
      description: 'Choose the overflowing axis to inspect.',
      choices: [{ value: 'vertical' }, { value: 'horizontal' }, { value: 'both' }],
    },
    height: {
      kind: 'number',
      group: 'Viewport',
      default: 160,
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
  render: ({ ctx, values: { axis, height, longContent } }) => (
    <div
      {...ctx.subject}
      className="scrollbar-proto scrollbar-demo-body"
      tabIndex={0}
      role="region"
      aria-label="Workspace guide"
      style={{
        inlineSize: 'min(100%, 22rem)',
        blockSize: height,
        overflowX: axis === 'vertical' ? 'hidden' : 'auto',
        overflowY: axis === 'horizontal' ? 'hidden' : 'auto',
      }}
      onScroll={({ currentTarget }) => {
        ctx.action('onScroll')({ left: currentTarget.scrollLeft, top: currentTarget.scrollTop });
      }}
    >
      <div style={longContent && axis !== 'vertical' ? { minInlineSize: '32rem' } : undefined}>
        {axis === 'horizontal' ? (
          <Text>
            {longContent
              ? 'Guide / Getting started / Permissions / Notification delivery'
              : 'Guide'}
          </Text>
        ) : (
          <TopicList short={!longContent} />
        )}
      </div>
    </div>
  ),
  code: ({ axis, height, longContent }) => {
    const overflowX = axis === 'vertical' ? 'hidden' : 'auto';
    const overflowY = axis === 'horizontal' ? 'hidden' : 'auto';
    const guide = longContent
      ? 'Guide / Getting started / Permissions / Notification delivery'
      : 'Guide';
    const contents =
      axis === 'horizontal'
        ? `<Text>${guide}</Text>`
        : `<TopicList${longContent ? '' : ' short'} />`;
    const sized =
      longContent && axis !== 'vertical'
        ? `<div style={{ minInlineSize: '32rem' }}>${contents}</div>`
        : contents;
    return `<div\n  className="scrollbar-proto"\n  tabIndex={0}\n  role="region"\n  aria-label="Workspace guide"\n  style={{ inlineSize: 'min(100%, 22rem)', blockSize: ${height}, overflowX: '${overflowX}', overflowY: '${overflowY}' }}\n  onScroll={handleScroll}\n>\n  ${sized}\n</div>`;
  },
  matrixViews: [
    { id: 'overflow', title: 'Scrolling axes and content', rows: 'axis', cols: 'longContent' },
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
      render: () => <OverlayExample />,
    },
    {
      id: 'states',
      mode: 'live',
      title: 'Fits · Overflows · Focus',
      surface: 'base',
      caption:
        'The thumb becomes clearer on hover and drag. The region has its own keyboard focus; touch keeps system scrolling.',
      kind: 'behavior',
      render: () => <StateExample />,
    },
    {
      id: 'axes',
      mode: 'live',
      title: 'Horizontal & both axes',
      surface: 'base',
      caption: 'Code stays LTR inside RTL layouts. No extra scroll wrapper or synthetic thumb.',
      kind: 'behavior',
      render: () => <HorizontalExample />,
    },
  ],
  usage: [
    {
      id: 'base',
      code: `<Card>
  <CardHeader><Title as="h3">Workspace guide</Title></CardHeader>
  <div className="scrollbar-proto" role="region" aria-label="Topics" tabIndex={0} style={{ blockSize: 240, overflow: 'auto' }}>
    <TopicList />
  </div>
</Card>`,
      title: 'Ordinary surfaces',
      surface: 'base',
      caption: 'A quiet position indicator for reading areas, sidebars and page scrolling.',
      render: () => <BaseExample />,
    },
  ],
});
