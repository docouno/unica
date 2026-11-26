import { useId, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import {
  ArrowUpRightIcon,
  EnvelopeSimpleIcon,
  LinkSimpleIcon,
  MagnifyingGlassIcon,
} from '@phosphor-icons/react';
import { Input, Text } from '@docouno/unica';
import type { FieldStatus, InputProps } from '@docouno/unica';
import { FormField } from '@docouno/unica';
import type { PreviewProps, PreviewContext } from '../../workbench/types.js';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import './input.examples.css';

export function MeasuredInput({
  subject,
  ...props
}: InputProps & { readonly subject: PreviewContext['subject'] }): ReactElement {
  return (
    <div {...subject} className="input-study-subject" data-width={props.width}>
      <Input {...props} />
    </div>
  );
}
function Sample({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="input-study-stack">
      <Text size="caption-l" color="secondary" weight="medium">
        <bdi>{title}</bdi>
      </Text>
      {children}
    </div>
  );
}

export function InputRoles({ ctx }: PreviewProps): ReactElement {
  const id = useId();
  return (
    <div className="input-study-stack">
      <div className="input-study-grid">
        <Sample title="Default form field">
          <FormField controlId={`${id}-name`} label="Collection name">
            <MeasuredInput subject={ctx.subject} id={`${id}-name`} defaultValue="Research notes" />
          </FormField>
        </Sample>
        <Sample title="Ghost inline editor">
          <div className="input-study-property">
            <Text
              as="label"
              htmlFor={`${id}-reference`}
              size="body-s"
              weight="medium"
              color="primary"
            >
              Reference
            </Text>
            <MeasuredInput
              subject={ctx.subject}
              id={`${id}-reference`}
              variant="ghost"
              placeholder="Add a reference"
            />
          </div>
        </Sample>
      </div>
    </div>
  );
}

export function InputAnatomy({ ctx }: PreviewProps): ReactElement {
  const id = useId();
  return (
    <div className="input-study-grid">
      <FormField controlId={`${id}-mail`} label="Work email">
        <MeasuredInput
          subject={ctx.subject}
          id={`${id}-mail`}
          type="email"
          dir="ltr"
          iconLeft={EnvelopeSimpleIcon}
          defaultValue="team@example.com"
        />
      </FormField>
      <FormField controlId={`${id}-ref`} label="Reference">
        <MeasuredInput
          subject={ctx.subject}
          id={`${id}-ref`}
          iconRight={ArrowUpRightIcon}
          defaultValue="Release notes"
        />
      </FormField>
      <FormField
        controlId={`${id}-addr`}
        label="Public address"
        description={<bdi>The address starts with https:// and ends in .example.</bdi>}
      >
        <MeasuredInput
          subject={ctx.subject}
          id={`${id}-addr`}
          iconLeft={LinkSimpleIcon}
          dir="ltr"
          prefix="https://"
          suffix=".example"
          defaultValue="field-notes"
          clearable
        />
      </FormField>
      <FormField
        controlId={`${id}-draft`}
        label="Reference file"
        description={<bdi>The filename ends in .md.</bdi>}
        status="warning"
        message={<bdi>The last check found a moved file.</bdi>}
        feedbackIcon={false}
      >
        <MeasuredInput
          subject={ctx.subject}
          id={`${id}-draft`}
          dir="ltr"
          iconRight={ArrowUpRightIcon}
          suffix=".md"
          defaultValue="release-notes"
          status="warning"
          loading
          clearable
        />
      </FormField>
    </div>
  );
}

export function InputInteraction({ ctx }: PreviewProps): ReactElement {
  const id = useId();
  return (
    <div className="input-study-stack">
      <div className="input-study-grid">
        <FormField controlId={`${id}-default`} label="Search collections">
          <MeasuredInput
            subject={ctx.subject}
            id={`${id}-default`}
            type="search"
            defaultValue="Research"
            iconLeft={MagnifyingGlassIcon}
            clearable
          />
        </FormField>
        <FormField controlId={`${id}-ghost`} label="Collection name">
          <MeasuredInput
            subject={ctx.subject}
            id={`${id}-ghost`}
            variant="ghost"
            defaultValue="Field notes"
            placeholder="Name this collection"
            clearable
          />
        </FormField>
      </div>
      <div className="input-study-grid">
        {(['s', 'm', 'l'] as const).map((size) => (
          <Sample key={size} title={`${size.toUpperCase()} · End slot alignment`}>
            <MeasuredInput
              subject={ctx.subject}
              size={size}
              aria-label={`Trailing icon ${size}`}
              defaultValue="Field notes"
              iconRight={ArrowUpRightIcon}
            />
            <MeasuredInput
              subject={ctx.subject}
              size={size}
              aria-label={`Clear target ${size}`}
              defaultValue="Field notes"
              clearable
            />
          </Sample>
        ))}
      </div>
    </div>
  );
}

const messages = {
  info: 'Visible to workspace members.',
  success: 'This address is available.',
  warning: 'Review this address before publishing.',
  danger: 'Choose a different address.',
} as const;

export function InputFeedback({ ctx }: PreviewProps): ReactElement {
  const id = useId();
  return (
    <div className="input-study-grid">
      {(['info', 'success', 'warning', 'danger'] as const).map((status) => (
        <Sample key={status} title={status}>
          {(['default', 'ghost'] as const).map((variant) => {
            const fieldId = `${id}-${status}-${variant}`;
            return (
              <FormField
                key={variant}
                controlId={fieldId}
                label={variant === 'default' ? 'Workspace address' : 'Inline address'}
                status={status}
                message={<bdi>{messages[status]}</bdi>}
                feedbackIcon={false}
              >
                <MeasuredInput
                  subject={ctx.subject}
                  id={fieldId}
                  variant={variant}
                  status={status}
                  defaultValue="north-studio"
                  placeholder="Enter a workspace address"
                  clearable
                />
              </FormField>
            );
          })}
        </Sample>
      ))}
    </div>
  );
}

export function InputAvailability({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="input-study-grid">
      <Sample title="Editable">
        <MeasuredInput
          subject={ctx.subject}
          aria-label="Editable address"
          defaultValue="north-studio"
          clearable
        />
        <MeasuredInput
          subject={ctx.subject}
          aria-label="Empty address"
          placeholder="Add an address"
          clearable
        />
      </Sample>
      <Sample title="Read only">
        <MeasuredInput
          subject={ctx.subject}
          aria-label="Archived address"
          defaultValue="north-studio"
          readOnly
          status="warning"
          clearable
        />
        <MeasuredInput
          subject={ctx.subject}
          aria-label="Busy, read-only address"
          defaultValue="north-studio"
          readOnly
          status="danger"
          loading
          clearable
        />
      </Sample>
      <Sample title="Disabled">
        <MeasuredInput
          subject={ctx.subject}
          aria-label="Managed address"
          defaultValue="north-studio"
          status="danger"
          disabled
          loading
          clearable
        />
        <MeasuredInput
          subject={ctx.subject}
          aria-label="Managed code"
          variant="ghost"
          defaultValue="COL-014"
          disabled
          clearable
        />
      </Sample>
      <Sample title="Checking">
        <MeasuredInput
          subject={ctx.subject}
          aria-label="Checking address"
          defaultValue="north-studio"
          loading
          status="warning"
          clearable
        />
        <MeasuredInput
          subject={ctx.subject}
          aria-label="Checking empty address"
          variant="ghost"
          placeholder="Add an address"
          loading
          clearable
        />
      </Sample>
    </div>
  );
}

export function InputLive({ ctx }: PreviewProps): ReactElement {
  const id = useId();
  const [value, setValue] = useState('north-studio');
  const [phase, setPhase] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>(
    'idle',
  );
  const busy = phase === 'checking';
  const status: FieldStatus =
    phase === 'available'
      ? 'success'
      : phase === 'taken' || phase === 'invalid'
        ? 'danger'
        : 'neutral';
  const result =
    phase === 'available'
      ? messages.success
      : phase === 'taken'
        ? messages.danger
        : phase === 'checking'
          ? 'Checking this address…'
          : phase === 'invalid'
            ? 'Enter an address using letters, numbers, or hyphens.'
            : '';
  useStoryAction(ctx, (action) => {
    if (action === 'check') {
      setPhase(/^[a-z0-9-]+$/i.test(value) ? 'checking' : 'invalid');
    } else if (busy && (action === 'available' || action === 'taken')) {
      setPhase(action);
    }
  });
  return (
    <div className="input-study-stack input-study-form">
      <div className="input-study-field">
        <Text as="label" htmlFor={id} size="body-s" weight="medium" color="primary">
          Workspace address
        </Text>
        <MeasuredInput
          subject={ctx.subject}
          id={id}
          aria-describedby={`${id}-hint ${id}-result`}
          dir="ltr"
          prefix="@"
          value={value}
          placeholder="Choose an address"
          clearLabel="Clear workspace address"
          clearable
          loading={busy}
          status={status}
          onChange={(event) => {
            setValue(event.currentTarget.value);
            setPhase('idle');
          }}
        />
        <div className="input-study-support">
          <Text id={`${id}-hint`} size="caption-l" color="muted">
            <bdi>Enter the part after @ using letters, numbers, and hyphens.</bdi>
          </Text>
          <Text
            id={`${id}-result`}
            size="caption-l"
            color={status === 'neutral' ? 'muted' : status}
            role="status"
            aria-atomic="true"
          >
            <bdi>{result}</bdi>
          </Text>
        </div>
      </div>
    </div>
  );
}

export function InputOverflow({ ctx }: PreviewProps): ReactElement {
  const id = useId();
  return (
    <div className="input-study-grid">
      <FormField
        controlId={`${id}-affixes`}
        label="Long affixes"
        description={
          <bdi>
            The archive adds https://archive.example/ before the name and /published/overview after
            it.
          </bdi>
        }
      >
        <MeasuredInput
          subject={ctx.subject}
          id={`${id}-affixes`}
          dir="ltr"
          prefix="https://archive.example/"
          suffix="/published/overview"
          defaultValue="collection-with-a-long-title"
          clearable
        />
      </FormField>
      <FormField
        controlId={`${id}-url`}
        label="Reference URL · LTR value"
        description={<bdi>Paste the full address of the reference.</bdi>}
      >
        <MeasuredInput
          subject={ctx.subject}
          id={`${id}-url`}
          type="url"
          dir="ltr"
          defaultValue="https://example.com/research/collections/releases"
          clearable
        />
      </FormField>
      <Sample title="Auto width">
        <MeasuredInput
          subject={ctx.subject}
          width="auto"
          aria-label="Short reference code"
          defaultValue="COL-014"
        />
      </Sample>
      <Sample title="Full width">
        <MeasuredInput
          subject={ctx.subject}
          aria-label="Long collection name"
          defaultValue="Working papers and research on public design systems"
        />
      </Sample>
    </div>
  );
}

export function InputSurfaces({ ctx }: PreviewProps): ReactElement {
  const id = useId();
  const fields = (
    <div className="input-study-stack">
      <MeasuredInput
        subject={ctx.subject}
        aria-label="Collection name"
        defaultValue="Research notes"
        clearable
      />
      <MeasuredInput
        subject={ctx.subject}
        aria-label="New collection name"
        placeholder="Add a name"
      />
      <MeasuredInput
        subject={ctx.subject}
        aria-label="Inline name"
        variant="ghost"
        defaultValue="Research notes"
        placeholder="Name this collection"
      />
      <FormField controlId={id} label="Empty inline name">
        <MeasuredInput
          subject={ctx.subject}
          id={id}
          variant="ghost"
          placeholder="Name this collection"
        />
      </FormField>
      <MeasuredInput
        subject={ctx.subject}
        aria-label="Work email"
        type="email"
        dir="ltr"
        status="danger"
        defaultValue="research@"
        clearable
      />
    </div>
  );
  return ctx.surface === 'overlay' ? (
    <div className="unica-overlay-surface input-study-overlay" data-surface="overlay">
      {fields}
    </div>
  ) : (
    fields
  );
}
