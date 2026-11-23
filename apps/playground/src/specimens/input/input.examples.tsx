import { useId, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import {
  ArrowUpRightIcon,
  EnvelopeSimpleIcon,
  LinkSimpleIcon,
  MagnifyingGlassIcon,
} from '@phosphor-icons/react';
import { Input, Text } from '@docouno/unica';
import type { FieldStatus } from '@docouno/unica';
import { FormField } from '../../prototypes/form-field/form-field.proto.js';
import './input.examples.css';

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
        {title}
      </Text>
      {children}
    </div>
  );
}

export function InputRoles(): ReactElement {
  const id = useId();
  return (
    <div className="input-study-stack">
      <div className="input-study-grid">
        <Sample title="Default form field">
          <FormField htmlFor={`${id}-name`} label="Collection name">
            <Input id={`${id}-name`} defaultValue="Research notes" />
          </FormField>
        </Sample>
        <Sample title="Ghost inline editor">
          <div className="input-study-property">
            <label htmlFor={`${id}-reference`}>Reference</label>
            <Input id={`${id}-reference`} variant="ghost" placeholder="Add a reference…" />
          </div>
        </Sample>
      </div>
    </div>
  );
}

export function InputAnatomy(): ReactElement {
  const id = useId();
  return (
    <div className="input-study-grid">
      <FormField htmlFor={`${id}-mail`} label="Work email">
        <Input
          id={`${id}-mail`}
          type="email"
          iconLeft={EnvelopeSimpleIcon}
          defaultValue="team@example.com"
        />
      </FormField>
      <FormField htmlFor={`${id}-ref`} label="Reference">
        <Input id={`${id}-ref`} iconRight={ArrowUpRightIcon} defaultValue="Release notes" />
      </FormField>
      <FormField
        htmlFor={`${id}-addr`}
        label="Public address"
        descriptionId={`${id}-host`}
        description="The address starts with https:// and ends in .example."
      >
        <Input
          id={`${id}-addr`}
          aria-describedby={`${id}-host`}
          iconLeft={LinkSimpleIcon}
          prefix="https://"
          suffix=".example"
          defaultValue="field-notes"
          clearable
        />
      </FormField>
      <FormField
        htmlFor={`${id}-draft`}
        label="Reference file"
        status="warning"
        messageId={`${id}-warning`}
        message="The last check found a moved file."
        feedbackIcon={false}
      >
        <Input
          id={`${id}-draft`}
          aria-describedby={`${id}-warning`}
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

export function InputInteraction(): ReactElement {
  const id = useId();
  return (
    <div className="input-study-stack">
      <button type="button" className="input-study-button">
        Start here, then press Tab
      </button>
      <div className="input-study-grid">
        <FormField htmlFor={`${id}-default`} label="Search collections">
          <Input
            id={`${id}-default`}
            type="search"
            defaultValue="Research"
            iconLeft={MagnifyingGlassIcon}
            clearable
          />
        </FormField>
        <FormField htmlFor={`${id}-ghost`} label="Collection name">
          <Input
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
            <Input
              size={size}
              aria-label={`Trailing icon ${size}`}
              defaultValue="Field notes"
              iconRight={ArrowUpRightIcon}
            />
            <Input
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

export function InputFeedback(): ReactElement {
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
                htmlFor={fieldId}
                label={variant === 'default' ? 'Workspace address' : 'Inline address'}
                status={status}
                message={messages[status]}
                messageId={`${fieldId}-message`}
                feedbackIcon={false}
              >
                <Input
                  id={fieldId}
                  aria-describedby={`${fieldId}-message`}
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

export function InputAvailability(): ReactElement {
  return (
    <div className="input-study-grid">
      <Sample title="Editable">
        <Input aria-label="Editable address" defaultValue="north-studio" clearable />
        <Input aria-label="Empty address" placeholder="Add an address…" clearable />
      </Sample>
      <Sample title="Read only">
        <Input
          aria-label="Archived address"
          defaultValue="north-studio"
          readOnly
          status="warning"
          clearable
        />
        <Input
          aria-label="Busy, read-only address"
          defaultValue="north-studio"
          readOnly
          status="danger"
          loading
          clearable
        />
      </Sample>
      <Sample title="Disabled">
        <Input
          aria-label="Managed address"
          defaultValue="north-studio"
          status="danger"
          disabled
          loading
          clearable
        />
        <Input
          aria-label="Managed code"
          variant="ghost"
          defaultValue="COL-014"
          disabled
          clearable
        />
      </Sample>
      <Sample title="Checking">
        <Input
          aria-label="Checking address"
          defaultValue="north-studio"
          loading
          status="warning"
          clearable
        />
        <Input
          aria-label="Checking empty address"
          variant="ghost"
          placeholder="Add an address…"
          loading
          clearable
        />
      </Sample>
    </div>
  );
}

export function InputLive(): ReactElement {
  const id = useId();
  const [value, setValue] = useState('north-studio');
  const [phase, setPhase] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const busy = phase === 'checking';
  const status: FieldStatus =
    phase === 'available' ? 'success' : phase === 'taken' ? 'danger' : 'neutral';
  const result =
    phase === 'available' ? messages.success : phase === 'taken' ? messages.danger : '';
  return (
    <div className="input-study-stack input-study-form">
      <div className="input-study-field">
        <label htmlFor={id}>Workspace address</label>
        <Input
          id={id}
          aria-describedby={`${id}-hint ${id}-result`}
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
            Use letters, numbers and hyphens.
          </Text>
          <Text
            id={`${id}-result`}
            size="caption-l"
            color={status === 'neutral' ? 'muted' : status}
            role="status"
            aria-atomic="true"
          >
            {result}
          </Text>
        </div>
      </div>
      <div className="input-study-actions">
        <button
          type="button"
          className="input-study-button"
          aria-disabled={!value || busy}
          onClick={() => {
            if (value && !busy) {
              setPhase('checking');
            }
          }}
        >
          Start check
        </button>
        <button
          type="button"
          className="input-study-button"
          aria-disabled={!busy}
          onClick={() => {
            if (busy) {
              setPhase('available');
            }
          }}
        >
          Available
        </button>
        <button
          type="button"
          className="input-study-button"
          aria-disabled={!busy}
          onClick={() => {
            if (busy) {
              setPhase('taken');
            }
          }}
        >
          Taken
        </button>
      </div>
    </div>
  );
}

export function InputOverflow(): ReactElement {
  const id = useId();
  return (
    <div className="input-study-grid">
      <FormField
        htmlFor={`${id}-affixes`}
        label="Long affixes"
        descriptionId={`${id}-hint`}
        description="The affixes truncate first. Use the arrow keys to reach the ends of the value."
      >
        <Input
          id={`${id}-affixes`}
          aria-describedby={`${id}-hint`}
          prefix="https://archive.example/"
          suffix="/published/overview"
          defaultValue="collection-with-a-long-title"
          clearable
        />
      </FormField>
      <FormField
        htmlFor={`${id}-url`}
        label="Reference URL · LTR value"
        descriptionId={`${id}-directions`}
        description="The address reads left to right. The label and help follow the surrounding direction."
      >
        <Input
          id={`${id}-url`}
          aria-describedby={`${id}-directions`}
          type="url"
          dir="ltr"
          defaultValue="https://example.com/research/collections/releases"
          clearable
        />
      </FormField>
      <Sample title="Auto width">
        <Input width="auto" aria-label="Short reference code" defaultValue="COL-014" />
      </Sample>
      <Sample title="Full width">
        <Input
          aria-label="Long collection name"
          defaultValue="Working papers and research on public design systems"
        />
      </Sample>
    </div>
  );
}

export function InputSurfaces({ overlay }: { readonly overlay: boolean }): ReactElement {
  const id = useId();
  const fields = (
    <div className="input-study-stack">
      <Input aria-label="Collection name" defaultValue="Research notes" clearable />
      <Input aria-label="New collection name" placeholder="Add a name" />
      <Input
        aria-label="Inline name"
        variant="ghost"
        defaultValue="Research notes"
        placeholder="Name this collection"
      />
      <FormField htmlFor={id} label="Empty inline name">
        <Input id={id} variant="ghost" placeholder="Name this collection" />
      </FormField>
      <Input
        aria-label="Work email"
        type="email"
        dir="ltr"
        status="danger"
        defaultValue="research@"
        clearable
      />
    </div>
  );
  return overlay ? (
    <div className="unica-overlay-surface input-study-overlay" data-surface="overlay">
      {fields}
    </div>
  ) : (
    fields
  );
}

export function InputFormExample({
  id,
  external,
}: {
  readonly id: string;
  readonly external?: boolean | undefined;
}): ReactElement {
  const [submission, setSubmission] = useState('');
  const formId = `${id}-form`;
  const field = (
    <div className="input-study-field">
      <label htmlFor={id}>Workspace name</label>
      <Input
        id={id}
        name="workspace"
        defaultValue="Folio"
        clearable
        required
        aria-describedby={`${id}-hint`}
        form={external ? formId : undefined}
      />
      <Text id={`${id}-hint`} size="caption-l" color="muted">
        Shown to members of your workspace.
      </Text>
    </div>
  );
  return (
    <div className="input-study-stack input-study-form">
      {external && field}
      <form
        id={formId}
        className="input-study-stack"
        onSubmit={(event) => {
          event.preventDefault();
          const submitted = new FormData(event.currentTarget).get('workspace');
          setSubmission(typeof submitted === 'string' ? submitted : '');
        }}
      >
        {!external && field}
        <div className="input-study-actions">
          <button type="submit" className="input-study-button">
            Submit
          </button>
          <button type="reset" className="input-study-button">
            Reset
          </button>
        </div>
      </form>
      <output aria-live="polite">{submission && `Submitted: ${submission}`}</output>
    </div>
  );
}
