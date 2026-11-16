import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import { Card, CardAction, CardHeader } from '../card/card.proto.js';
import { CodeBlock } from '../code/code.proto.js';
import {
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from '../popover/popover.proto.js';
import { Button } from '../button/button.proto.js';
import { Text } from '../text/text.proto.js';
import { Title } from '../title/title.proto.js';
import './scrollbar.css';
import './scrollbar.examples.css';

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

export default defineSpecimen({
  id: 'scrollbar',
  title: 'Scrollbar',
  group: 'Foundations',
  summary: 'Native scrolling, a transparent track and a quiet thumb in the surface palette.',
  defaultSurface: 'base',
  sections: [
    {
      id: 'base',
      title: 'Ordinary surfaces',
      kind: 'matrix',
      surface: 'base',
      caption: 'A quiet position indicator for reading areas, sidebars and page scrolling.',
      render: () => <BaseExample />,
    },
    {
      id: 'overlay',
      title: 'Inside the overlay',
      kind: 'matrix',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'Compact width in a tight panel. Only the body scrolls; the header and Close stay available.',
      render: () => <OverlayExample />,
    },
    {
      id: 'states',
      title: 'Fits · Overflows · Focus',
      kind: 'states',
      surface: 'base',
      caption:
        'The thumb becomes clearer on hover and drag. The region has its own keyboard focus; touch keeps system scrolling.',
      render: () => <StateExample />,
    },
    {
      id: 'axes',
      title: 'Horizontal & both axes',
      kind: 'matrix',
      surface: 'base',
      caption: 'Code stays LTR inside RTL layouts. No extra scroll wrapper or synthetic thumb.',
      render: () => <HorizontalExample />,
    },
  ],
});
