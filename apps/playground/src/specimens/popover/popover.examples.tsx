import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertTitle,
  Button,
  Divider,
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
  Stack,
  Spinner,
  Text,
} from '@docouno/unica';
import type { PopoverSize } from '@docouno/unica';
import { CheckIcon, ClockIcon } from '@phosphor-icons/react';
import { useEffect, useId, useRef, useState } from 'react';
import type { ReactElement, ReactNode, Ref } from 'react';
import { OverlayExampleFrame } from '../../examples/OverlayExampleFrame.js';
import { placementAlignments, placementSides } from '../../examples/overlay-placement-options.js';
import { ExampleSurface } from '../shared/example-surface.js';
import '../../examples/overlay-studies.css';
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

export function PlacementExamples({ ctx }: ExampleProps): ReactElement {
  const id = useId();
  const [name, setName] = useState('Release notes');
  const controls = ctx.story?.controls;
  const side = placementSides.find((value) => value === controls?.side) ?? 'bottom';
  const align = placementAlignments.find((value) => value === controls?.align) ?? 'center';
  const anchor = String(controls?.anchor ?? 'center');
  return (
    <OverlayExampleFrame ctx={ctx} height={520} title="Popover placement">
      <div className="hint-study-anchor" data-position={anchor}>
        <Popover>
          <PopoverTrigger {...ctx.subject} asChild>
            <Button variant="secondary">Page settings</Button>
          </PopoverTrigger>
          <PopoverContent {...ctx.subject} side={side} align={align}>
            <PopoverHeader>
              <PopoverTitle>Page settings</PopoverTitle>
              <PopoverClose />
              <PopoverDescription>
                <bdi>Changes apply as you type.</bdi>
              </PopoverDescription>
            </PopoverHeader>
            <PopoverBody>
              <Stack gap={8}>
                <Text as="label" htmlFor={id} size="body-s" color="secondary">
                  Display name
                </Text>
                <Input
                  id={id}
                  dir="auto"
                  value={name}
                  onChange={(event) => setName(event.currentTarget.value)}
                />
              </Stack>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </div>
      <div className="popover-demo-note" data-anchor={anchor}>
        <Input aria-label="Page note" placeholder="Page note" size="s" dir="auto" />
      </div>
    </OverlayExampleFrame>
  );
}

export function StateExamples({ ctx }: ExampleProps): ReactElement {
  const id = useId();
  const [name, setName] = useState('Release notes');
  return (
    <div className="popover-demo-owner">
      <ExampleSurface surface={ctx.surface}>
        <div className="popover-demo-actions">
          <PanelExample ctx={ctx} title="Page settings" description="Changes apply as you type.">
            <PopoverBody className="popover-demo-fields">
              <div className="popover-demo-field">
                <Text as="label" htmlFor={`${id}-name`} size="body-s" color="secondary">
                  Display name
                </Text>
                <Input
                  id={`${id}-name`}
                  dir="auto"
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
                <Text id={`${id}-path-hint`} size="caption-l" color="secondary" dir="auto">
                  <bdi>Read only. You can select and copy this path.</bdi>
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
                <Text id={`${id}-archive-hint`} size="caption-l" color="secondary" dir="auto">
                  <bdi>Only workspace owners can change this.</bdi>
                </Text>
              </div>
            </PopoverBody>
          </PanelExample>
          <Popover>
            <PopoverTrigger {...ctx.subject} asChild disabled>
              <Button variant="secondary">Workspace settings</Button>
            </PopoverTrigger>
            <PopoverContent aria-label="Workspace settings">
              <PopoverHeader>
                <PopoverClose />
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </div>
        <Text dir="auto" size="body-s" color="secondary">
          Page name: <bdi>{name.trim() || 'Untitled page'}</bdi>
        </Text>
      </ExampleSurface>
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
  const failNext = ctx.story?.controls.failNext === true;
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
    if (failNext) {
      ctx.story?.setControl('failNext', false);
    }
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
    <div className="popover-demo-owner">
      <ExampleSurface surface={ctx.surface}>
        <div className="popover-demo-actions">
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
                          dir={name === 'url' ? 'ltr' : 'auto'}
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
                          <Text id={errorId} size="caption-l" color="danger" dir="auto">
                            {errors[name]}
                          </Text>
                        )}
                      </div>
                    );
                  })}
                  {state === 'error' && (
                    <Alert size="s" status="danger" role="alert">
                      <AlertTitle>Changes weren’t saved</AlertTitle>
                      <AlertDescription>
                        <bdi>Your edits are still here.</bdi>
                      </AlertDescription>
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
          <Text size="body-s" weight="medium" dir="auto">
            {committed.text}
          </Text>
          <Text size="caption-l" color="secondary" dir="ltr">
            {committed.url}
          </Text>
          <Text size="caption-l" color="secondary" role="status" dir="auto">
            {notice || 'Last saved link'}
          </Text>
        </div>
      </ExampleSurface>
    </div>
  );
}

export function ContentExamples({ ctx }: ExampleProps): ReactElement {
  const panel = useRef<HTMLDivElement>(null);
  const state = ctx.story?.controls.activity ?? 'ready';
  return (
    <div className="popover-demo-actions">
      <PanelExample ctx={ctx} size="s" title="Recent activity" ref={panel}>
        <PopoverBody>
          {state === 'ready' && (
            <ul className="popover-demo-entries">
              <li>
                <CheckIcon aria-hidden="true" size="1em" />
                <div>
                  <Text size="body-s">Review completed</Text>
                  <Text size="caption-l" color="secondary" dir="auto">
                    Today · 09:41
                  </Text>
                </div>
              </li>
              <li>
                <ClockIcon aria-hidden="true" size="1em" />
                <div>
                  <Text size="body-s">Draft updated</Text>
                  <Text size="caption-l" color="secondary" dir="auto">
                    Yesterday · 16:20
                  </Text>
                </div>
              </li>
            </ul>
          )}
          {state === 'loading' && (
            <div className="popover-demo-message" role="status">
              <Spinner size="s" />
              <Text size="body-s" dir="auto">
                Loading activity…
              </Text>
              <Text size="caption-l" color="secondary" dir="auto">
                Fetching the latest changes.
              </Text>
            </div>
          )}
          {state === 'empty' && (
            <div className="popover-demo-message">
              <ClockIcon aria-hidden="true" size="1.25em" />
              <Text size="body-s" weight="medium" dir="auto">
                No activity yet
              </Text>
              <Text size="caption-l" color="secondary" dir="auto">
                Updates will appear here after the first edit.
              </Text>
            </div>
          )}
          {state === 'error' && (
            <Alert size="s" status="danger" role="alert">
              <AlertTitle>Couldn’t load activity</AlertTitle>
              <AlertDescription>
                <bdi>Try again to load recent changes.</bdi>
              </AlertDescription>
              <AlertActions>
                <Button
                  size="s"
                  variant="secondary"
                  onClick={() => {
                    panel.current?.focus({ preventScroll: true });
                    ctx.story?.setControl('activity', 'ready');
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
  );
}

const revisions = [
  ['Review completed', 'The release checklist was approved.'],
  ['Summary clarified', 'The introduction now identifies the intended audience.'],
  ['Reference added', 'The guidelines include a link to the source document.'],
  ['Title updated', 'The heading now identifies the release.'],
  ['Draft created', 'The first draft was saved for review.'],
  ['Outline prepared', 'The author outlined the publishing steps.'],
] as const;

export function OverflowExamples({ ctx }: ExampleProps): ReactElement {
  return (
    <div className="popover-demo-actions">
      <PanelExample
        ctx={ctx}
        size="s"
        title="Release coordination and publishing guidelines"
        description="The editorial team reviews this guide before each release."
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
          <PopoverBody tabIndex={0} role="region" aria-label="Page history entries">
            <ol className="popover-demo-history">
              {revisions.map(([title, summary], index) => (
                <li key={title}>
                  {index > 0 && <Divider decorative />}
                  <Text size="body-s" weight="medium" dir="auto">
                    {title}
                  </Text>
                  <Text size="caption-l" color="secondary" dir="auto">
                    <bdi>
                      Revision {12 - index} ·{' '}
                      {index === 0 ? 'Today' : index === 1 ? 'Yesterday' : `${index} days ago`}
                    </bdi>
                  </Text>
                  <Text size="body-s" color="secondary">
                    <bdi>{summary}</bdi>
                  </Text>
                </li>
              ))}
            </ol>
          </PopoverBody>
          <Divider decorative />
          <PopoverFooter>
            <Text size="caption-l" color="secondary" dir="auto">
              <bdi>6 revisions</bdi>
            </Text>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
    </div>
  );
}
