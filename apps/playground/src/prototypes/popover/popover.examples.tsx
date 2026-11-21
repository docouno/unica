import { useEffect, useId, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { CheckIcon, ClockIcon, LinkSimpleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { Button } from '../button/button.proto.js';
import { Input } from '../input/input.proto.js';
import { Text } from '@docouno/unica';
import {
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
} from './popover.proto.js';
import type { PopoverSize } from './popover.proto.js';
import './popover.examples.css';

interface PanelExampleProps {
  readonly size?: PopoverSize;
  readonly title: string;
  readonly description?: string;
  readonly trigger?: string;
  readonly children?: ReactNode;
  readonly scroll?: boolean;
}

function PanelExample({
  size = 'm',
  title,
  description,
  trigger = 'Page details',
  children,
  scroll,
}: PanelExampleProps): ReactElement {
  const [open, setOpen] = useState(true);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <Popover>
      <Button
        ref={triggerRef}
        variant="secondary"
        tone="neutral"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen(!open)}
      >
        {trigger}
      </Button>
      <PopoverContent
        size={size}
        id={`${id}-panel`}
        hidden={!open}
        className={scroll ? 'popover-demo-constrained' : ''}
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined}
      >
        <PopoverHeader>
          <PopoverTitle id={`${id}-title`}>{title}</PopoverTitle>
          {description && (
            <PopoverDescription id={`${id}-description`}>{description}</PopoverDescription>
          )}
        </PopoverHeader>
        <PopoverClose
          onClick={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}
        />
        {children}
      </PopoverContent>
    </Popover>
  );
}

function Note({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <Text className="popover-demo-note" size="caption-l" color="secondary">
      {children}
    </Text>
  );
}

export function SizeExamples(): ReactElement {
  return (
    <div className="popover-demo-stack">
      <Note>
        Pinned open for comparison. Close and reopen each panel; try live dismissal in Anchoring &
        focus.
      </Note>
      <div className="popover-demo-sample">
        <Text size="caption-l" color="muted">
          S · Quick context · 18rem
        </Text>
        <PanelExample size="s" title="Page details" description="A shared record of what shipped.">
          <dl className="popover-demo-metadata">
            <div>
              <dt>Updated</dt>
              <dd>Today, 09:41</dd>
            </div>
            <div>
              <dt>Access</dt>
              <dd>Workspace</dd>
            </div>
          </dl>
        </PanelExample>
      </div>
      <div className="popover-demo-sample">
        <Text size="caption-l" color="muted">
          M · Compact settings · 22rem
        </Text>
        <PanelExample
          title="Reading preferences"
          description="Changes apply as you go."
          trigger="Reading preferences"
        >
          <div className="popover-demo-choices">
            <label>
              <input type="checkbox" defaultChecked />
              <span>
                Show page outline<small>Keep headings within reach.</small>
              </span>
            </label>
            <label>
              <input type="checkbox" />
              <span>
                Use a wider column<small>More room for tables and diagrams.</small>
              </span>
            </label>
          </div>
        </PanelExample>
      </div>
      <div className="popover-demo-sample">
        <Text size="caption-l" color="muted">
          L · Supporting context · 28rem
        </Text>
        <PanelExample size="l" title="Before you publish" trigger="Publishing checklist">
          <PopoverBody>
            <ul className="popover-demo-list">
              <li>Explain what changed and who it helps.</li>
              <li>Link the decision and supporting research.</li>
              <li>Invite a teammate to review the details.</li>
            </ul>
            <Text size="body-s" color="secondary">
              A second pair of eyes catches what a checklist misses.
            </Text>
          </PopoverBody>
        </PanelExample>
      </div>
    </div>
  );
}

export function StateExamples(): ReactElement {
  return (
    <div className="popover-demo-stack">
      <Note>
        Close stays quiet until needed. The samples below pin its appearance; they do not move
        keyboard focus.
      </Note>
      <div className="popover-demo-close-states">
        {(['rest', 'hover', 'active', 'focus'] as const).map((state) => (
          <div key={state}>
            <PopoverClose previewState={state} aria-label={`Close · ${state} preview`} />
            <Text size="caption-l" color="secondary">
              {state}
            </Text>
          </div>
        ))}
      </div>
      <PanelExample
        title="Page settings"
        description="Update the details people see."
        trigger="Settings"
      >
        <PopoverBody>
          <Input label="Display name" defaultValue="Release notes" />
          <Input
            label="Page path"
            dir="ltr"
            readOnly
            value="/handbook/release-notes"
            description="Read only · You can select and copy this path."
          />
          <Input
            label="Archive location"
            disabled
            value="Workspace archive"
            description="Only workspace owners can change this."
          />
        </PopoverBody>
      </PanelExample>
      <div className="popover-demo-disabled">
        <Button variant="secondary" tone="neutral" disabled>
          Workspace settings
        </Button>
        <Text size="caption-l" color="secondary">
          Unavailable trigger · No panel opens.
        </Text>
      </div>
    </div>
  );
}

type SaveState = 'editing' | 'invalid' | 'saving' | 'error';

export function FormExamples(): ReactElement {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [open, setOpen] = useState(true);
  const [committed, setCommitted] = useState({
    text: 'Read the handbook',
    url: 'https://example.com/handbook',
  });
  const [draft, setDraft] = useState(committed);
  const [state, setState] = useState<SaveState>('editing');
  const [fail, setFail] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => () => clearTimeout(timer.current), []);
  const close = (): void => {
    clearTimeout(timer.current);
    setOpen(false);
    setDraft(committed);
    setState('editing');
    triggerRef.current?.focus();
  };
  return (
    <div className="popover-demo-stack">
      <div className="popover-demo-options">
        <label>
          Preview state
          <select
            value={state}
            onChange={(event) => {
              clearTimeout(timer.current);
              if (event.target.value === 'invalid') {
                setDraft({ ...draft, url: 'https://' });
              }
              setState(event.target.value as SaveState);
              setOpen(true);
            }}
          >
            <option value="editing">Editing</option>
            <option value="invalid">Validation</option>
            <option value="saving">Saving (pinned)</option>
            <option value="error">Save failed</option>
          </select>
        </label>
        <label className="popover-demo-check">
          <input
            type="checkbox"
            checked={fail}
            onChange={(event) => setFail(event.target.checked)}
          />
          Simulate save failure
        </label>
      </div>
      <Note>
        Submit to try a short local save. Cancel or Close discards the draft, including a pending
        preview save. Reopen to inspect the last saved values.
      </Note>
      <Popover>
        <Button
          ref={triggerRef}
          variant="secondary"
          tone="neutral"
          iconLeft={LinkSimpleIcon}
          aria-haspopup="dialog"
          aria-controls={`${id}-panel`}
          aria-expanded={open}
          onClick={() => {
            if (open) {
              close();
            } else {
              setDraft(committed);
              setOpen(true);
              setNotice('');
            }
          }}
        >
          Edit link
        </Button>
        <PopoverContent hidden={!open} id={`${id}-panel`} aria-labelledby={`${id}-title`}>
          <PopoverHeader>
            <PopoverTitle id={`${id}-title`}>Edit link</PopoverTitle>
            <PopoverDescription>Give readers a clear next step.</PopoverDescription>
          </PopoverHeader>
          <PopoverClose onClick={close} />
          <form
            className="popover-demo-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (state === 'saving') {
                return;
              }
              if (!draft.text.trim() || !/^https?:\/\/\S+\.\S+$/i.test(draft.url)) {
                setState('invalid');
                (!draft.text.trim() ? textRef : inputRef).current?.focus();
                return;
              }
              setState('saving');
              timer.current = setTimeout(() => {
                if (fail) {
                  setState('error');
                  return;
                }
                setCommitted(draft);
                setState('editing');
                setOpen(false);
                setNotice('Link saved.');
                triggerRef.current?.focus();
              }, 900);
            }}
          >
            <PopoverBody>
              <Input
                ref={textRef}
                label="Text"
                value={draft.text}
                readOnly={state === 'saving'}
                onChange={(event) => setDraft({ ...draft, text: event.target.value })}
                status={state === 'invalid' && !draft.text.trim() ? 'danger' : 'neutral'}
                message={
                  state === 'invalid' && !draft.text.trim()
                    ? 'Add a label readers can recognize.'
                    : undefined
                }
              />
              <Input
                ref={inputRef}
                label="Link"
                type="url"
                dir="ltr"
                value={draft.url}
                readOnly={state === 'saving'}
                onChange={(event) => {
                  setDraft({ ...draft, url: event.target.value });
                }}
                status={
                  state === 'invalid' && !/^https?:\/\/\S+\.\S+$/i.test(draft.url)
                    ? 'danger'
                    : 'neutral'
                }
                message={
                  state === 'invalid' && !/^https?:\/\/\S+\.\S+$/i.test(draft.url)
                    ? 'Enter a complete web address.'
                    : undefined
                }
              />
              {state === 'error' && (
                <div className="popover-demo-error" role="alert">
                  <WarningCircleIcon size="1em" aria-hidden="true" />
                  <div>
                    <strong>Changes weren’t saved</strong>
                    <span>Your edits are still here. Try again.</span>
                  </div>
                </div>
              )}
            </PopoverBody>
            <PopoverFooter>
              <Button variant="secondary" tone="neutral" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" className="popover-demo-save" loading={state === 'saving'}>
                {state === 'error' ? 'Try again' : 'Save link'}
              </Button>
            </PopoverFooter>
            <span className="popover-demo-sr" role="status">
              {state === 'saving' ? 'Saving link.' : ''}
            </span>
          </form>
        </PopoverContent>
      </Popover>
      <div className="popover-demo-result">
        <Text size="body-s" weight="medium">
          {committed.text}
        </Text>
        <Text size="caption-l" color="secondary" dir="ltr">
          {committed.url}
        </Text>
        <Text size="caption-l" color="secondary" role="status">
          {notice || 'Last saved link'}
        </Text>
      </div>
    </div>
  );
}

type ContentState = 'ready' | 'loading' | 'empty' | 'error';
export function ContentExamples(): ReactElement {
  const [state, setState] = useState<ContentState>('ready');
  return (
    <div className="popover-demo-stack">
      <div className="popover-demo-options">
        <label>
          Content preview
          <select value={state} onChange={(event) => setState(event.target.value as ContentState)}>
            <option value="ready">Ready</option>
            <option value="loading">Loading</option>
            <option value="empty">Empty</option>
            <option value="error">Load failed</option>
          </select>
        </label>
      </div>
      <PanelExample size="s" title="Recent activity" trigger="Recent activity">
        <PopoverBody className="popover-demo-remote" aria-busy={state === 'loading'}>
          {state === 'ready' && (
            <ul className="popover-demo-activity">
              <li>
                <CheckIcon aria-hidden="true" size="1em" />
                <div>
                  <Text size="body-s">Review completed</Text>
                  <Text size="caption-l" color="secondary">
                    Today · 09:41
                  </Text>
                </div>
              </li>
              <li>
                <ClockIcon aria-hidden="true" size="1em" />
                <div>
                  <Text size="body-s">Draft updated</Text>
                  <Text size="caption-l" color="secondary">
                    Yesterday · 16:20
                  </Text>
                </div>
              </li>
            </ul>
          )}
          {state === 'loading' && (
            <div className="popover-demo-empty" role="status">
              <ClockIcon aria-hidden="true" size="1.25em" />
              <Text size="body-s">Loading activity…</Text>
              <Text size="caption-l" color="secondary">
                Fetching the latest changes.
              </Text>
            </div>
          )}
          {state === 'empty' && (
            <div className="popover-demo-empty">
              <ClockIcon aria-hidden="true" size="1.25em" />
              <Text size="body-s" weight="medium">
                No activity yet
              </Text>
              <Text size="caption-l" color="secondary">
                Updates will appear here after the first edit.
              </Text>
            </div>
          )}
          {state === 'error' && (
            <div className="popover-demo-empty" role="alert">
              <WarningCircleIcon aria-hidden="true" size="1.25em" />
              <Text size="body-s" weight="medium">
                Couldn’t load activity
              </Text>
              <Text size="caption-l" color="secondary">
                Check your connection and try again.
              </Text>
              <Button variant="secondary" tone="neutral" size="s" onClick={() => setState('ready')}>
                Try again
              </Button>
            </div>
          )}
        </PopoverBody>
      </PanelExample>
      <Note>
        Controlled content states. Retry restores the ready preview. Status belongs to the content;
        the surface keeps the same material.
      </Note>
    </div>
  );
}

export function OverflowExamples(): ReactElement {
  return (
    <div className="popover-demo-stack">
      <Note>
        Long text wraps. In a short viewport, only the body scrolls; the heading, Close and actions
        remain visible. This study pins a 360px height limit.
      </Note>
      <PanelExample
        size="s"
        title="A longer title that still leaves room to close"
        description="Descriptions wrap naturally at larger text sizes."
        trigger="Long content"
      >
        <Text size="body-s" color="secondary" dir="ltr">
          https://example.com/handbook/release-coordination-and-publishing-guidelines
        </Text>
      </PanelExample>
      <PanelExample
        title="Page history"
        description="A short review of recent changes."
        trigger="View history"
        scroll
      >
        <PopoverBody tabIndex={0} aria-label="Page history entries">
          <ol className="popover-demo-history">
            {[
              'Review completed',
              'Summary clarified',
              'Reference added',
              'Title updated',
              'Draft created',
              'Outline prepared',
            ].map((title, index) => (
              <li key={title}>
                <Text size="body-s" weight="medium">
                  {title}
                </Text>
                <Text size="caption-l" color="secondary">
                  Revision {12 - index} · {index === 0 ? 'Today' : `${index} days ago`}
                </Text>
                <Text size="body-s" color="secondary">
                  The previous version remains available in the document history.
                </Text>
              </li>
            ))}
          </ol>
        </PopoverBody>
        <PopoverFooter data-separated="">
          <Text size="caption-l" color="secondary">
            6 revisions · Scroll to inspect
          </Text>
        </PopoverFooter>
      </PanelExample>
    </div>
  );
}
