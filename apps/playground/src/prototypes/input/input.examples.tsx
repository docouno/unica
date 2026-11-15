import { useId, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import {
  ArrowUpRightIcon,
  EnvelopeSimpleIcon,
  LinkSimpleIcon,
  MagnifyingGlassIcon,
} from '@phosphor-icons/react';
import { Button } from '../button/button.proto.js';
import { Text } from '../text/text.proto.js';
import { Input } from './input.proto.js';
import type { FieldStatus } from './input.proto.js';
import './input.examples.css';

function Sample({
  title,
  note,
  children,
}: {
  readonly title: string;
  readonly note?: string | undefined;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="input-demo-sample">
      <Text size="caption-l" color="secondary" weight="medium">
        {title}
      </Text>
      {children}
      {note && (
        <Text size="caption-l" color="muted">
          {note}
        </Text>
      )}
    </div>
  );
}

export function InputRoles(): ReactElement {
  const nameId = useId();
  const referenceId = useId();
  return (
    <div className="input-demo-stack">
      {(['s', 'm', 'l'] as const).map((size) => (
        <div className="input-demo-size-row" key={size}>
          <Text size="caption-l" color="secondary" weight="semibold">
            {size.toUpperCase()} ·{' '}
            {size === 's' ? '30px · Dense editing' : size === 'm' ? '40px · Forms' : '48px · Touch'}
          </Text>
          <div className="input-demo-grid">
            <Sample title="Default · form slot">
              <Input size={size} label="Collection name" defaultValue="Research notes" />
              <Input
                size={size}
                aria-label={`Empty collection name ${size}`}
                placeholder="Name this collection"
              />
            </Sample>
            <Sample title="Ghost · inline editing">
              <Input
                size={size}
                variant="ghost"
                label="Collection name"
                defaultValue="Research notes"
              />
              <Input
                size={size}
                variant="ghost"
                aria-label={`Empty inline collection name ${size}`}
                placeholder="Add a name…"
              />
            </Sample>
          </div>
        </div>
      ))}
      <Text size="caption-l" color="muted">
        Ghost marks an inline editing area with a quiet baseline. Use Default for standalone forms.
      </Text>
      <div className="input-demo-inspector">
        <Text size="caption-l" color="secondary" weight="semibold">
          Editable details
        </Text>
        <div className="input-demo-inspector-row">
          <label htmlFor={nameId}>Name</label>
          <Input id={nameId} variant="ghost" defaultValue="Research notes" clearable />
        </div>
        <div className="input-demo-inspector-row">
          <label htmlFor={referenceId}>Reference</label>
          <Input id={referenceId} variant="ghost" placeholder="Add a reference…" />
        </div>
      </div>
    </div>
  );
}

export function InputAnatomy(): ReactElement {
  return (
    <div className="input-demo-grid">
      <Sample title="Leading icon" note="The icon supports the label; it does not replace it.">
        <Input label="Work email" iconLeft={EnvelopeSimpleIcon} defaultValue="team@example.com" />
      </Sample>
      <Sample
        title="Trailing decoration"
        note="A status or spinner takes this position when feedback appears."
      >
        <Input label="Reference" iconRight={ArrowUpRightIcon} defaultValue="Release notes" />
        <Input
          aria-label="Reference with feedback"
          iconRight={ArrowUpRightIcon}
          defaultValue="Release notes"
          status="info"
          message="Visible to workspace members."
        />
      </Sample>
      <Sample title="Fixed affixes" note="Affixes stay separate from the editable value.">
        <Input
          label="Public address"
          dir="ltr"
          prefix="https://"
          suffix=".example"
          defaultValue="studio"
        />
      </Sample>
      <Sample
        title="Clearable search"
        note="Clear, then type again. The text viewport keeps its width."
      >
        <Input
          label="Search collections"
          type="search"
          iconLeft={MagnifyingGlassIcon}
          defaultValue="Research"
          clearable
        />
        <Input
          aria-label="Empty clearable search"
          type="search"
          iconLeft={MagnifyingGlassIcon}
          placeholder="Search collections…"
          clearable
        />
      </Sample>
      <Sample title="Clear + status" note="The action and feedback have separate slots.">
        <Input
          label="Workspace address"
          prefix="@"
          defaultValue="north-studio"
          clearable
          status="success"
          message="This address is available."
        />
      </Sample>
      <Sample
        title="All slots · pinned checking state"
        note="Clear is unavailable while checking. The existing status stays visible."
      >
        <Input
          label="Reference address"
          iconLeft={LinkSimpleIcon}
          prefix="/"
          suffix=".md"
          defaultValue="guide"
          clearable
          status="warning"
          loading
          message="Checking the updated reference…"
        />
      </Sample>
      {(['s', 'm', 'l'] as const).map((size) => (
        <Sample
          key={size}
          title={`Actions & feedback · ${size.toUpperCase()}`}
          note={size === 'l' ? 'Clear has a 44px target on touch devices.' : undefined}
        >
          <Input
            size={size}
            label="Document name"
            defaultValue="Research"
            clearable
            status="success"
            message="Name saved."
          />
        </Sample>
      ))}
    </div>
  );
}

export function InputInteraction(): ReactElement {
  return (
    <div className="input-demo-stack">
      <div className="input-demo-grid">
        {(['rest', 'hover', 'pointer-focus', 'keyboard-focus'] as const).map((state) => (
          <Sample
            key={state}
            title={`${state === 'rest' ? 'Rest' : state === 'hover' ? 'Pointer hover' : state === 'pointer-focus' ? 'Pointer focus' : 'Keyboard focus'} · pinned`}
            note={
              state === 'pointer-focus'
                ? 'Clicking and typing keep the quiet editing treatment.'
                : undefined
            }
          >
            <Input
              aria-label={`Default ${state} preview`}
              defaultValue="Research notes"
              previewState={state}
            />
            <Input
              aria-label={`Ghost ${state} preview`}
              variant="ghost"
              defaultValue="Research notes"
              previewState={state}
            />
          </Sample>
        ))}
        <Sample
          title="Clear focus · pinned"
          note="Keyboard focus belongs to the action, without a second shell ring."
        >
          <Input
            aria-label="Clear focus preview"
            defaultValue="Research"
            clearable
            previewState="clear-focus"
          />
        </Sample>
        <Sample title="Clear hover · pinned">
          <Input
            aria-label="Clear hover preview"
            defaultValue="Research"
            clearable
            previewState="rest"
            previewClearState="hover"
          />
        </Sample>
        <Sample
          title="Clear press · pinned"
          note="No field translation or value movement on press."
        >
          <Input
            aria-label="Clear press preview"
            defaultValue="Research"
            clearable
            previewState="rest"
            previewClearState="active"
          />
        </Sample>
      </div>
      <div className="input-demo-live-pair">
        <Input
          label="Try keyboard and pointer"
          defaultValue="Edit or clear this value"
          clearable
          description="Tab from the input to Clear. Clearing returns focus to the input. Escape keeps its normal page or overlay meaning."
        />
        <Input
          label="Try inline editing"
          variant="ghost"
          defaultValue="Research notes"
          clearable
          description="Hover and focus change only the baseline. Click to edit quietly, or use Tab to see keyboard focus."
        />
      </div>
      <div className="input-demo-grid">
        {(['s', 'm', 'l'] as const).map((size) => (
          <Sample
            key={size}
            title={`End-slot alignment · ${size.toUpperCase()}`}
            note="Compare the last icon, Clear at rest, and its pinned hover target."
          >
            <Input
              size={size}
              aria-label={`Trailing icon alignment ${size}`}
              iconRight={ArrowUpRightIcon}
              defaultValue="Research notes"
            />
            <Input
              size={size}
              aria-label={`Clear alignment ${size}`}
              clearable
              defaultValue="Research notes"
            />
            <Input
              size={size}
              aria-label={`Clear hover alignment ${size}`}
              clearable
              defaultValue="Research notes"
              previewClearState="hover"
            />
          </Sample>
        ))}
      </div>
    </div>
  );
}

const feedback: readonly {
  readonly status: FieldStatus;
  readonly title: string;
  readonly message: string;
}[] = [
  { status: 'neutral', title: 'Neutral', message: 'Use a short, memorable address.' },
  { status: 'info', title: 'Info', message: 'Only workspace members can open this address.' },
  { status: 'success', title: 'Success', message: 'This address is available.' },
  {
    status: 'warning',
    title: 'Warning',
    message: 'Changing the address will break existing links.',
  },
  { status: 'danger', title: 'Danger', message: 'This address is already in use. Choose another.' },
];

export function InputFeedback(): ReactElement {
  return (
    <div className="input-demo-stack">
      {feedback.map(({ status, title, message }) => (
        <div className="input-demo-grid" key={status}>
          <Input
            label={`${title} · Default`}
            defaultValue="project-notes"
            status={status}
            message={message}
          />
          <Input
            label={`${title} · Ghost`}
            variant="ghost"
            defaultValue="project-notes"
            status={status}
            message={message}
          />
        </div>
      ))}
      <div className="input-demo-grid">
        <Sample title="Keyboard focus + danger · pinned">
          <Input
            label="Work email"
            defaultValue="team@"
            status="danger"
            previewState="keyboard-focus"
            message="Enter a complete email address."
          />
        </Sample>
        <Sample title="Keyboard focus + danger · Ghost · pinned">
          <Input
            label="Work email"
            variant="ghost"
            defaultValue="team@"
            status="danger"
            previewState="keyboard-focus"
            message="Enter a complete email address."
          />
        </Sample>
        <Sample title="Pointer focus + danger · pinned">
          <Input
            label="Work email"
            defaultValue="team@"
            status="danger"
            previewState="pointer-focus"
            message="Enter a complete email address."
          />
        </Sample>
        <Sample title="Pointer focus + danger · Ghost · pinned">
          <Input
            label="Work email"
            variant="ghost"
            defaultValue="team@"
            status="danger"
            previewState="pointer-focus"
            message="Enter a complete email address."
          />
        </Sample>
      </div>
    </div>
  );
}

export function InputAvailability(): ReactElement {
  return (
    <div className="input-demo-grid">
      <Sample title="Editable">
        <Input
          label="Display name"
          defaultValue="Research team"
          clearable
          description="Edit, select, or clear the value."
        />
      </Sample>
      <Sample title="Read-only">
        <Input
          label="Assigned identifier"
          defaultValue="COL-014"
          readOnly
          clearable
          description="Select and copy. This identifier cannot be changed."
        />
      </Sample>
      <Sample title="Read-only + warning">
        <Input
          label="Archived address"
          defaultValue="research-2025"
          readOnly
          status="warning"
          clearable
          message="This collection is archived. Its address is preserved."
        />
      </Sample>
      <Sample title="Disabled">
        <Input
          label="Managed display name"
          defaultValue="Research team"
          disabled
          clearable
          description="Your organization manages this value."
        />
      </Sample>
      <Sample
        title="Disabled overrides feedback"
        note="The status, spinner, and clear action are suppressed."
      >
        <Input
          label="Unavailable address"
          defaultValue="research"
          disabled
          clearable
          loading
          status="danger"
          description="Address editing is unavailable on this plan."
        />
      </Sample>
      <Sample title="Checking · pinned busy state">
        <Input
          label="Workspace address"
          defaultValue="north-studio"
          loading
          clearable
          description="Typing and selection remain available; Clear is temporarily unavailable."
        />
      </Sample>
      <Sample title="Checking a warning · pinned">
        <Input
          label="Reference address"
          defaultValue="old-guide"
          loading
          status="warning"
          clearable
          message="Checking whether this reference has moved…"
        />
      </Sample>
      <Sample title="Read-only + loading · pinned">
        <Input
          label="Reserved address"
          defaultValue="north-studio"
          readOnly
          loading
          clearable
          description="Saving a fixed value. Selection and copying remain available."
        />
      </Sample>
      <Sample title="Ghost · read-only & disabled">
        <Input
          label="Assigned code"
          variant="ghost"
          defaultValue="COL-014"
          readOnly
          clearable
          description="Copy this value without editing it."
        />
        <Input label="Managed code" variant="ghost" defaultValue="COL-014" disabled clearable />
      </Sample>
      <Sample title="Empty disabled field">
        <Input
          label="Account alias"
          placeholder="Not available"
          disabled
          description="Create an account before choosing an alias."
        />
      </Sample>
      <Sample title="Danger + loading · pinned">
        <Input
          label="Unavailable address"
          defaultValue="research"
          loading
          status="danger"
          clearable
          message="Rechecking this address. The previous conflict remains visible."
        />
      </Sample>
    </div>
  );
}

export function InputLive(): ReactElement {
  const [value, setValue] = useState('north-studio');
  const [phase, setPhase] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const busy = phase === 'checking';
  const status: FieldStatus =
    phase === 'available' ? 'success' : phase === 'taken' ? 'danger' : 'neutral';
  const message = busy
    ? 'Checking this address…'
    : phase === 'available'
      ? 'This address is available.'
      : phase === 'taken'
        ? 'This address is already in use. Try another.'
        : undefined;
  return (
    <div className="input-demo-live">
      <Input
        label="Workspace address"
        prefix="@"
        value={value}
        placeholder="Choose an address"
        onChange={(event) => {
          setValue(event.currentTarget.value);
          setPhase('idle');
        }}
        clearLabel="Clear workspace address"
        clearable
        loading={busy}
        status={status}
        description="Letters, numbers, and hyphens. You can change it later."
        message={message}
      />
      <div className="input-demo-controls" aria-label="Simulated availability response">
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          disabled={!value || busy}
          onClick={() => setPhase('checking')}
        >
          Start check
        </Button>
        <Button
          size="s"
          variant="ghost"
          tone="neutral"
          disabled={!busy}
          onClick={() => setPhase('available')}
        >
          Available
        </Button>
        <Button
          size="s"
          variant="ghost"
          tone="neutral"
          disabled={!busy}
          onClick={() => setPhase('taken')}
        >
          Taken
        </Button>
      </div>
      <Text size="caption-l" color="muted">
        Simulated response, without network requests or timers. Start a check, choose a result, then
        edit again. New input clears stale feedback and ends the simulated check.
      </Text>
    </div>
  );
}

export function InputOverflow(): ReactElement {
  const externalId = useId();
  return (
    <div className="input-demo-stack">
      <div className="input-demo-grid">
        <Input
          label="Long collection name"
          defaultValue="Research notes from the spring product discovery interviews"
          clearable
          description="Move the caret to either end to inspect the full native value."
        />
        <Input
          label="Long affixes"
          dir="ltr"
          prefix="workspace.example.com/collections/"
          suffix="/published/overview"
          defaultValue="research"
          clearable
          description={
            <span>
              Address format:{' '}
              <bdi dir="ltr">{'workspace.example.com/collections/{name}/published/overview'}</bdi>
            </span>
          }
        />
        <Input
          label="A long field label that still reads naturally when the available width becomes narrow"
          placeholder="Add a name"
          required
          description="Supporting text wraps within the field width. It never forces the field or its neighbors wider."
          status="danger"
          message="Choose a name that explains what this collection contains so everyone in the workspace can find it."
        />
        <Input
          label="Reference URL · LTR value"
          type="url"
          dir="ltr"
          prefix="https://"
          defaultValue="docs.example.com/research/observations?view=overview"
          clearable
          description="The entire address stays left-to-right; its label and help follow the interface."
        />
        <Sample title="External label">
          <label className="input-demo-external-label" htmlFor={externalId}>
            Contact email
          </label>
          <Input
            id={externalId}
            type="email"
            defaultValue="research@example.com"
            autoComplete="email"
          />
        </Sample>
        <Sample title="Accessible name without a visible label">
          <Input
            type="search"
            aria-label="Search documents"
            iconLeft={MagnifyingGlassIcon}
            placeholder="Search documents…"
            clearable
          />
        </Sample>
      </div>
      <div className="input-demo-widths">
        <Sample title="Auto width · bounded by available space">
          <Input width="auto" aria-label="Short reference code" defaultValue="COL-014" />
        </Sample>
        <Sample title="Full width">
          <Input
            width="full"
            aria-label="Full-width collection name"
            defaultValue="Research notes"
          />
        </Sample>
      </div>
    </div>
  );
}

export function InputSurfaces(): ReactElement {
  return (
    <div className="input-demo-surface-grid">
      <div className="input-demo-surface-stage" data-surface="base">
        <div className="input-demo-surface-plate" data-plate="base">
          <Text size="caption-l" color="secondary" weight="semibold">
            Base surface
          </Text>
          <Input label="Collection name" defaultValue="Research notes" clearable />
          <Input label="Empty field" placeholder="Add a name" />
          <Input label="Inline name" variant="ghost" defaultValue="Research notes" />
          <Input
            label="Work email"
            defaultValue="team@"
            status="danger"
            message="Enter a complete email address."
          />
        </div>
      </div>
      <div className="input-demo-surface-stage" data-surface="base" data-underlay="true">
        <div className="input-demo-surface-plate" data-plate="overlay" data-surface="overlay">
          <Text size="caption-l" color="secondary" weight="semibold">
            Overlay surface
          </Text>
          <Input label="Collection name" defaultValue="Research notes" clearable />
          <Input label="Empty field" placeholder="Add a name" />
          <Input label="Inline name" variant="ghost" defaultValue="Research notes" />
          <Input
            label="Work email"
            defaultValue="team@"
            status="danger"
            message="Enter a complete email address."
          />
        </div>
      </div>
    </div>
  );
}
