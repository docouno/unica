import { useId, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { LinkSimpleIcon } from '@phosphor-icons/react';
import { Text } from '../text/text.proto.js';
import { Title } from '../title/title.proto.js';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
} from './popover.proto.js';
import type { PopoverAlign, PopoverSide, PopoverSize } from './popover.proto.js';
import './popover.examples.css';

interface PanelExampleProps {
  readonly size?: PopoverSize;
  readonly title: string;
  readonly description: string;
  readonly trigger?: string;
  readonly side?: PopoverSide;
  readonly align?: PopoverAlign;
  readonly children?: ReactNode;
}

function PanelExample({
  size = 'm',
  title,
  description,
  trigger = 'Page details',
  side = 'bottom',
  align = 'center',
  children,
}: PanelExampleProps): ReactElement {
  const [open, setOpen] = useState(true);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <Popover side={side} align={align}>
      <button
        ref={triggerRef}
        type="button"
        className="popover-demo-button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen(!open)}
      >
        {trigger}
      </button>
      <PopoverContent
        size={size}
        id={`${id}-panel`}
        hidden={!open}
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
      >
        <PopoverTitle id={`${id}-title`}>{title}</PopoverTitle>
        <PopoverClose
          onClick={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}
        />
        <PopoverDescription id={`${id}-description`}>{description}</PopoverDescription>
        {children}
      </PopoverContent>
    </Popover>
  );
}

export function SizeExamples(): ReactElement {
  return (
    <div className="popover-demo-stack">
      <Text className="popover-demo-note" size="caption-l" color="secondary">
        Visual prototype · Close and reopen each panel. Native buttons stand in for triggers.
      </Text>
      <div className="popover-demo-sample">
        <Text size="caption-l" color="muted">
          S · 18rem · Quick context
        </Text>
        <PanelExample
          size="s"
          title="Release notes"
          description="A shared record of what shipped and why."
        />
      </div>
      <div className="popover-demo-sample">
        <Text size="caption-l" color="muted">
          M · 22rem · Default
        </Text>
        <PanelExample
          title="Page visibility"
          description="People in your workspace can find and read this page."
        >
          <Text size="body-s" color="muted">
            Workspace · Product handbook
          </Text>
        </PanelExample>
      </div>
      <div className="popover-demo-sample">
        <Text size="caption-l" color="muted">
          L · 28rem · More room
        </Text>
        <PanelExample
          size="l"
          title="Publishing checklist"
          description="Keep the release useful for everyone who follows your work."
        >
          <ul className="popover-demo-list">
            <li>Summarize the change and its impact.</li>
            <li>Link the decision and supporting research.</li>
            <li>Ask a teammate to review before sharing.</li>
          </ul>
        </PanelExample>
      </div>
    </div>
  );
}

export function PlacementExamples(): ReactElement {
  const [side, setSide] = useState<PopoverSide>('bottom');
  const [align, setAlign] = useState<PopoverAlign>('start');
  return (
    <div className="popover-demo-placement">
      <Text className="popover-demo-note" size="caption-l" color="secondary">
        12 logical placements · 8px offset · No arrow. This in-flow study does not simulate
        collision handling or top-layer dismissal.
      </Text>
      <div className="popover-demo-options">
        <label>
          Side
          <select value={side} onChange={(event) => setSide(event.target.value as PopoverSide)}>
            {(['top', 'bottom', 'start', 'end'] as const).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Alignment
          <select value={align} onChange={(event) => setAlign(event.target.value as PopoverAlign)}>
            {(['start', 'center', 'end'] as const).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <PanelExample
        key={`${side}-${align}`}
        side={side}
        align={align}
        size="s"
        trigger="Details"
        title="Page info"
        description="Updated today. Ready for review."
      />
    </div>
  );
}

function FieldExamples(): ReactElement {
  const id = useId();
  return (
    <div className="popover-demo-fields">
      <label htmlFor={`${id}-name`}>
        Display name
        <input id={`${id}-name`} defaultValue="Release notes" />
      </label>
      <label htmlFor={`${id}-path`}>
        Page path · Read only
        <input id={`${id}-path`} readOnly value="/handbook/release-notes" />
      </label>
      <label htmlFor={`${id}-archive`}>
        Archive · Unavailable
        <input id={`${id}-archive`} disabled value="Managed by workspace" />
      </label>
    </div>
  );
}

export function StateExamples(): ReactElement {
  return (
    <div className="popover-demo-stack">
      <Text className="popover-demo-note" size="caption-l" color="secondary">
        Native field and button stand-ins · Try hover, keyboard focus, and editing. Full overlay
        keyboard behavior belongs to the library implementation.
      </Text>
      <PanelExample
        title="Page settings"
        description="Edit the name without leaving your document."
        trigger="Settings"
      >
        <FieldExamples />
      </PanelExample>
      <PanelExample
        size="s"
        title="A longer title that still leaves room to close"
        description="This description stays readable at larger text sizes and wraps naturally on narrow screens."
        trigger="Long content"
      >
        <Text size="body-s" color="secondary">
          https://example.com/handbook/release-coordination-and-publishing-guidelines
        </Text>
      </PanelExample>
    </div>
  );
}

export function EditorExample(): ReactElement {
  const id = useId();
  const [open, setOpen] = useState(true);
  const [saved, setSaved] = useState(false);
  const [linkText, setLinkText] = useState('Read the team handbook');
  const [url, setUrl] = useState('https://example.com/handbook');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = (): void => {
    setOpen(false);
    triggerRef.current?.focus();
  };
  return (
    <div className="popover-demo-editor">
      <div className="popover-demo-editor-bar">
        <Text size="caption-l" color="muted">
          Folio / Product / Release notes
        </Text>
        <Text size="caption-l" color="muted">
          Draft
        </Text>
      </div>
      <div className="popover-demo-prose">
        <Text size="caption-l" color="muted">
          TEAM HANDBOOK
        </Text>
        <Title as="h2" size="heading-xl">
          Small changes, shared clearly.
        </Title>
        <Text color="secondary">
          A useful release note connects the work to the people it helps. Start with the outcome,
          then add the context.
        </Text>
        <Popover align="start" className="popover-demo-link-anchor">
          <button
            ref={triggerRef}
            type="button"
            className="popover-demo-link-trigger"
            aria-expanded={open}
            aria-controls={`${id}-panel`}
            onClick={() => {
              setOpen(!open);
              setSaved(false);
            }}
          >
            <LinkSimpleIcon size="1em" aria-hidden="true" />
            <span>{linkText}</span>
          </button>
          <PopoverContent id={`${id}-panel`} hidden={!open} aria-labelledby={`${id}-title`}>
            <PopoverTitle id={`${id}-title`}>Edit link</PopoverTitle>
            <PopoverClose onClick={close} />
            <PopoverDescription>Give readers a clear next step.</PopoverDescription>
            <form
              className="popover-demo-fields"
              onSubmit={(event) => {
                event.preventDefault();
                const text = new FormData(event.currentTarget).get('text');
                if (typeof text === 'string') {
                  setLinkText(text);
                }
                setSaved(true);
                close();
              }}
            >
              <label htmlFor={`${id}-text`}>
                Text
                <input
                  id={`${id}-text`}
                  name="text"
                  defaultValue="Read the team handbook"
                  required
                />
              </label>
              <label htmlFor={`${id}-url`}>
                Link
                <input
                  id={`${id}-url`}
                  name="url"
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  required
                  dir="ltr"
                />
              </label>
              <div className="popover-demo-actions">
                <button type="button" className="popover-demo-button" onClick={close}>
                  Cancel
                </button>
                <button type="submit" className="popover-demo-button" data-primary="true">
                  Save link
                </button>
              </div>
            </form>
          </PopoverContent>
        </Popover>
        <Text size="body-s" color="muted" role="status">
          {saved ? 'Link updated in this preview.' : 'Keep the next step close to the context.'}
        </Text>
        <div className="popover-demo-prose-tail">
          <Title as="h3" size="heading-s">
            Before you publish
          </Title>
          <Text color="secondary">
            Check the details, invite a second pair of eyes, and share when the story is ready.
          </Text>
        </div>
      </div>
    </div>
  );
}
