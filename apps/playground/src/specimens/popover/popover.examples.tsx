import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertTitle,
  Button,
  Checkbox,
  Input,
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  SegmentedControl,
  Spinner,
  Text,
} from '@docouno/unica';
import type { PopoverAlign, PopoverSide, PopoverSize } from '@docouno/unica';
import { CheckIcon, ClockIcon } from '@phosphor-icons/react';
import { useEffect, useId, useRef, useState } from 'react';
import type { ReactElement, ReactNode, Ref } from 'react';
import type { PreviewContext } from '../../workbench/types.js';
import './popover.examples.css';

interface ExampleProps {
  readonly ctx: PreviewContext;
}

interface PanelExampleProps {
  readonly ctx: PreviewContext;
  readonly size?: PopoverSize;
  readonly title: string;
  readonly description?: string;
  readonly trigger?: string;
  readonly ref?: Ref<HTMLDivElement>;
  readonly children: ReactNode;
}

function PanelExample({
  ctx,
  size,
  title,
  description,
  trigger = title,
  ref,
  children,
}: PanelExampleProps): ReactElement {
  return (
    <Popover ref={ref}>
      <PopoverTrigger {...ctx.subject} asChild>
        <Button variant="secondary">{trigger}</Button>
      </PopoverTrigger>
      <PopoverContent {...ctx.subject} size={size}>
        <PopoverHeader>
          <PopoverTitle>{title}</PopoverTitle>
          <PopoverClose />
          {description && (
            <PopoverDescription>
              <bdi>{description}</bdi>
            </PopoverDescription>
          )}
        </PopoverHeader>
        {children}
      </PopoverContent>
    </Popover>
  );
}

const sides = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'start', label: 'Start' },
  { value: 'end', label: 'End' },
] as const;
const alignments = [
  { value: 'start', label: 'Start' },
  { value: 'center', label: 'Center' },
  { value: 'end', label: 'End' },
] as const;
const anchors = [
  { value: 'center', label: 'Center' },
  { value: 'top-start', label: 'Top start' },
  { value: 'bottom-end', label: 'Bottom end' },
] as const;

export function PlacementExamples({ ctx }: ExampleProps): ReactElement {
  const id = useId();
  const [side, setSide] = useState<PopoverSide>('bottom');
  const [align, setAlign] = useState<PopoverAlign>('center');
  const [anchor, setAnchor] = useState('center');

  return (
    <div className="popover-demo-stack">
      <div className="popover-demo-options">
        <div className="popover-demo-field">
          <Text id={`${id}-side`} size="body-s" color="secondary">
            Side
          </Text>
          <SegmentedControl
            aria-labelledby={`${id}-side`}
            size="s"
            items={sides}
            value={side}
            onValueChange={(value) => setSide(value as PopoverSide)}
          />
        </div>
        <div className="popover-demo-field">
          <Text id={`${id}-align`} size="body-s" color="secondary">
            Alignment
          </Text>
          <SegmentedControl
            aria-labelledby={`${id}-align`}
            size="s"
            items={alignments}
            value={align}
            onValueChange={(value) => setAlign(value as PopoverAlign)}
          />
        </div>
        <div className="popover-demo-field">
          <Text id={`${id}-anchor`} size="body-s" color="secondary">
            Anchor
          </Text>
          <SegmentedControl
            aria-labelledby={`${id}-anchor`}
            size="s"
            items={anchors}
            value={anchor}
            onValueChange={setAnchor}
          />
        </div>
      </div>
      <div className="popover-demo-placement" data-anchor={anchor}>
        <Popover>
          <PopoverTrigger {...ctx.subject} asChild>
            <Button variant="secondary">Page settings</Button>
          </PopoverTrigger>
          <PopoverContent {...ctx.subject} side={side} align={align}>
            <PopoverHeader>
              <PopoverTitle>Page settings</PopoverTitle>
              <PopoverClose />
              <PopoverDescription>
                <bdi>Adjust the way this page appears.</bdi>
              </PopoverDescription>
            </PopoverHeader>
            <PopoverBody>
              <div className="popover-demo-field">
                <Text as="label" htmlFor={id} size="body-s" color="secondary">
                  Display name
                </Text>
                <Input id={id} defaultValue="Release notes" />
              </div>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <Button variant="secondary">Next focus stop</Button>
      </div>
    </div>
  );
}

export function StateExamples({ ctx }: ExampleProps): ReactElement {
  const id = useId();
  const [name, setName] = useState('Release notes');
  return (
    <div className="popover-demo-stack">
      <div className="popover-demo-actions">
        <PanelExample ctx={ctx} title="Page settings" description="Changes apply as you type.">
          <PopoverBody className="popover-demo-fields">
            <div className="popover-demo-field">
              <Text as="label" htmlFor={`${id}-name`} size="body-s" color="secondary">
                Display name
              </Text>
              <Input
                id={`${id}-name`}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="popover-demo-field">
              <Text as="label" htmlFor={`${id}-path`} size="body-s" color="secondary">
                Page path
              </Text>
              <Input
                id={`${id}-path`}
                aria-describedby={`${id}-path-hint`}
                dir="ltr"
                readOnly
                value="/handbook/release-notes"
              />
              <Text id={`${id}-path-hint`} size="caption-l" color="secondary">
                Read only. You can select and copy this path.
              </Text>
            </div>
            <div className="popover-demo-field">
              <Text as="label" htmlFor={`${id}-archive`} size="body-s" color="secondary">
                Archive location
              </Text>
              <Input
                id={`${id}-archive`}
                aria-describedby={`${id}-archive-hint`}
                disabled
                defaultValue="Workspace archive"
              />
              <Text id={`${id}-archive-hint`} size="caption-l" color="secondary">
                Only workspace owners can change this.
              </Text>
            </div>
          </PopoverBody>
        </PanelExample>
        <Popover>
          <PopoverTrigger asChild disabled>
            <Button variant="secondary">Workspace settings</Button>
          </PopoverTrigger>
          <PopoverContent aria-label="Workspace settings">
            <PopoverHeader>
              <PopoverClose />
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </div>
      <Text size="body-s" color="secondary">
        Page name: {name.trim() || 'Untitled page'}
      </Text>
    </div>
  );
}

type SaveState = 'editing' | 'saving' | 'error';
type LinkField = 'text' | 'url';
type Draft = Readonly<Record<LinkField, string>>;
type FieldErrors = Partial<Record<LinkField, string>>;

const initialLink: Draft = {
  text: 'Read the handbook',
  url: 'https://example.com/handbook',
};

function fieldError(input: HTMLInputElement): string {
  if (input.name === 'text') {
    return 'Add a label readers can recognize.';
  }
  return input.validity.valueMissing ? 'Enter a link.' : 'Enter a complete web address.';
}

export function FormExamples({ ctx }: ExampleProps): ReactElement {
  const formId = `${ctx.id}-link-form`;
  const [open, setOpen] = useState(false);
  const [committed, setCommitted] = useState(initialLink);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<SaveState>('editing');
  const [failNext, setFailNext] = useState(false);
  const [notice, setNotice] = useState('');
  const pending = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(pending.current), []);

  const changeOpen = (next: boolean): void => {
    setOpen(next);
    setState('editing');
    setErrors({});
    if (next) {
      setNotice('');
    } else {
      clearTimeout(pending.current);
      pending.current = undefined;
    }
  };

  const submit = (draft: Draft): void => {
    if (pending.current !== undefined) {
      return;
    }
    setState('saving');
    setFailNext(false);
    pending.current = setTimeout(() => {
      pending.current = undefined;
      if (failNext) {
        setState('error');
      } else {
        setCommitted(draft);
        changeOpen(false);
        setNotice('Link saved.');
      }
    }, 900);
  };

  const saving = state === 'saving';
  return (
    <div className="popover-demo-stack">
      <div className="popover-demo-actions">
        <Checkbox checked={failNext} onCheckedChange={setFailNext} label="Fail the next save" />
        <Popover open={open} onOpenChange={changeOpen}>
          <PopoverTrigger {...ctx.subject} asChild>
            <Button variant="secondary">Edit link</Button>
          </PopoverTrigger>
          <PopoverContent {...ctx.subject}>
            <PopoverHeader>
              <PopoverTitle>Edit link</PopoverTitle>
              <PopoverClose />
              <PopoverDescription>
                <bdi>Give readers a clear next step.</bdi>
              </PopoverDescription>
            </PopoverHeader>
            <PopoverBody>
              <form
                {...ctx.form}
                className="popover-demo-fields"
                id={formId}
                onInvalid={(event) => {
                  const input = event.target;
                  if (
                    input instanceof HTMLInputElement &&
                    (input.name === 'text' || input.name === 'url')
                  ) {
                    const name = input.name;
                    const error = fieldError(input);
                    setErrors((current) => ({ ...current, [name]: error }));
                  }
                }}
                onSubmit={(event) => {
                  event.preventDefault();
                  const values = new FormData(event.currentTarget);
                  const rawText = values.get('text');
                  const url = values.get('url');
                  if (typeof rawText !== 'string' || typeof url !== 'string') {
                    return;
                  }
                  const text = rawText.trim();
                  if (text) {
                    submit({ text, url: url.trim() });
                  } else {
                    setErrors({ text: 'Add a label readers can recognize.' });
                    event.currentTarget
                      .querySelector<HTMLInputElement>('input[name="text"]')
                      ?.focus();
                  }
                }}
              >
                {(['text', 'url'] as const).map((name) => {
                  const inputId = `${formId}-${name}`;
                  const errorId = `${inputId}-error`;
                  return (
                    <div key={name} className="popover-demo-field">
                      <Text as="label" htmlFor={inputId} size="body-s" color="secondary">
                        {name === 'text' ? 'Text' : 'Web address'}
                      </Text>
                      <Input
                        id={inputId}
                        required
                        dir={name === 'url' ? 'ltr' : undefined}
                        name={name}
                        type={name}
                        defaultValue={committed[name]}
                        readOnly={saving}
                        status={errors[name] ? 'danger' : 'neutral'}
                        aria-describedby={errors[name] ? errorId : undefined}
                        onChange={() => {
                          if (errors[name]) {
                            setErrors((current) => ({ ...current, [name]: undefined }));
                          }
                        }}
                      />
                      {errors[name] && (
                        <Text id={errorId} size="caption-l" color="danger">
                          {errors[name]}
                        </Text>
                      )}
                    </div>
                  );
                })}
                {state === 'error' && (
                  <Alert size="s" status="danger" role="alert">
                    <AlertTitle>Changes weren’t saved</AlertTitle>
                    <AlertDescription>Your edits are still here.</AlertDescription>
                  </Alert>
                )}
              </form>
            </PopoverBody>
            <PopoverFooter>
              <Button size="s" variant="secondary" onClick={() => changeOpen(false)}>
                Cancel
              </Button>
              <Button size="s" type="submit" form={formId} loading={saving}>
                {saving ? 'Saving…' : state === 'error' ? 'Try again' : 'Save link'}
              </Button>
            </PopoverFooter>
          </PopoverContent>
        </Popover>
      </div>
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
const activityStates = [
  { value: 'ready', label: 'Ready' },
  { value: 'loading', label: 'Loading' },
  { value: 'empty', label: 'Empty' },
  { value: 'error', label: 'Load failed' },
] as const;

export function ContentExamples({ ctx }: ExampleProps): ReactElement {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ContentState>('ready');
  return (
    <div className="popover-demo-stack">
      <div className="popover-demo-field">
        <Text id={id} size="body-s" color="secondary">
          Activity state
        </Text>
        <SegmentedControl
          aria-labelledby={id}
          size="s"
          items={activityStates}
          value={state}
          onValueChange={(value) => setState(value as ContentState)}
        />
      </div>
      <div className="popover-demo-actions">
        <PanelExample ctx={ctx} size="s" title="Recent activity" ref={panel}>
          <PopoverBody>
            {state === 'ready' && (
              <ul className="popover-demo-entries">
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
              <div className="popover-demo-message" role="status">
                <Spinner size="s" />
                <Text size="body-s">Loading activity…</Text>
                <Text size="caption-l" color="secondary">
                  Fetching the latest changes.
                </Text>
              </div>
            )}
            {state === 'empty' && (
              <div className="popover-demo-message">
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
              <Alert size="s" status="danger" role="alert">
                <AlertTitle>Couldn’t load activity</AlertTitle>
                <AlertDescription>Check your connection and try again.</AlertDescription>
                <AlertActions>
                  <Button
                    size="s"
                    variant="secondary"
                    onClick={() => {
                      panel.current?.focus({ preventScroll: true });
                      setState('ready');
                    }}
                  >
                    Try again
                  </Button>
                </AlertActions>
              </Alert>
            )}
          </PopoverBody>
        </PanelExample>
      </div>
    </div>
  );
}

const revisions = [
  'Review completed',
  'Summary clarified',
  'Reference added',
  'Title updated',
  'Draft created',
  'Outline prepared',
] as const;

export function OverflowExamples({ ctx }: ExampleProps): ReactElement {
  return (
    <div className="popover-demo-actions">
      <PanelExample
        ctx={ctx}
        size="s"
        title="A longer title that still leaves room to close"
        description="The description and address wrap at larger text sizes."
        trigger="Long text"
      >
        <PopoverBody>
          <Text className="popover-demo-url" size="body-s" color="secondary" dir="ltr">
            https://example.com/handbook/release-coordination-and-publishing-guidelines
          </Text>
        </PopoverBody>
      </PanelExample>
      <Popover>
        <PopoverTrigger {...ctx.subject} asChild>
          <Button variant="secondary">View history</Button>
        </PopoverTrigger>
        <PopoverContent
          {...ctx.subject}
          style={{ maxBlockSize: 'min(360px, var(--overlay-available-height, 100dvb))' }}
        >
          <PopoverHeader>
            <PopoverTitle>Page history</PopoverTitle>
            <PopoverClose />
            <PopoverDescription>
              <bdi>A short review of recent changes.</bdi>
            </PopoverDescription>
          </PopoverHeader>
          <PopoverBody tabIndex={0} aria-label="Page history entries">
            <ol className="popover-demo-history">
              {revisions.map((title, index) => (
                <li key={title}>
                  <Text size="body-s" weight="medium">
                    {title}
                  </Text>
                  <Text size="caption-l" color="secondary">
                    <bdi>
                      Revision {12 - index} · {index === 0 ? 'Today' : `${index} days ago`}
                    </bdi>
                  </Text>
                  <Text size="body-s" color="secondary">
                    <bdi>The previous version is available in the document history.</bdi>
                  </Text>
                </li>
              ))}
            </ol>
          </PopoverBody>
          <PopoverFooter className="popover-demo-history-footer">
            <Text size="caption-l" color="secondary">
              <bdi>6 revisions</bdi>
            </Text>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function DetailsExample({ ctx }: ExampleProps): ReactElement {
  return (
    <div className="popover-demo-actions">
      <PanelExample ctx={ctx} size="s" title="Release details">
        <PopoverBody>
          <Text size="body-s">Published today for everyone in the workspace.</Text>
        </PopoverBody>
      </PanelExample>
    </div>
  );
}
