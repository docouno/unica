import { useId, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { LockSimpleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { Badge } from '../badge/badge.proto.js';
import { Button } from '../button/button.proto.js';
import { Link } from '../link/link.proto.js';
import { PopoverContent } from '../popover/popover.proto.js';
import {
  CheckboxCard,
  RadioCard,
  SwitchCard,
  ChoiceCardContent,
  ChoiceCardLabel,
  ChoiceCardDescription,
  CheckboxCardIndicator,
  RadioCardIndicator,
  SwitchCardIndicator,
} from './choice-card.proto.js';
import './choice-card.examples.css';

export type CardKind = 'checkbox' | 'radio' | 'switch';
const cards = { checkbox: CheckboxCard, radio: RadioCard, switch: SwitchCard };
const indicators = {
  checkbox: CheckboxCardIndicator,
  radio: RadioCardIndicator,
  switch: SwitchCardIndicator,
};
const copy = {
  checkbox: {
    label: 'Version history',
    description: 'Keep a complete record of edits and restore earlier versions.',
  },
  radio: {
    label: 'Team workspace',
    description: 'Everyone in the workspace can find and read shared pages.',
  },
  switch: {
    label: 'Review reminders',
    description: 'Notify the page owner seven days before a review is due.',
  },
};

export function Study({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="choice-study">
      <span className="choice-study-caption">{title}</span>
      {children}
    </div>
  );
}
export function Sizes({ kind }: { readonly kind: CardKind }): ReactElement {
  const Card = cards[kind];
  const name = useId();
  return (
    <div className="choice-study-stack">
      {(['s', 'm', 'l'] as const).map((size) => (
        <Study
          key={size}
          title={`${size.toUpperCase()} · ${size === 's' ? '12px inset · compact' : size === 'm' ? '16px inset · default' : '24px inset · spacious'}`}
        >
          <div
            className="choice-study-grid"
            role={kind === 'radio' ? 'radiogroup' : 'group'}
            aria-label={`${size} choices`}
          >
            <Card
              size={size}
              name={`${name}-${size}`}
              label={copy[kind].label}
              description={copy[kind].description}
            />
            <Card
              size={size}
              name={`${name}-${size}`}
              label={kind === 'radio' ? 'Invited people' : copy[kind].label}
              description={
                kind === 'radio'
                  ? 'Only people you invite can find and open these pages.'
                  : copy[kind].description
              }
              defaultChecked
            />
          </div>
        </Study>
      ))}
    </div>
  );
}

export function Anatomy({ kind }: { readonly kind: CardKind }): ReactElement {
  const Card = cards[kind];
  const Indicator = indicators[kind];
  const id = useId();
  const [details, setDetails] = useState(false);
  return (
    <div className="choice-study-stack">
      <div className="choice-study-grid">
        <Card
          label={
            kind === 'radio' ? 'Standard' : kind === 'switch' ? 'Daily digest' : 'Offline access'
          }
          metadata={
            <>
              <Badge size="s">{kind === 'switch' ? 'Email' : 'Included'}</Badge>
              <span>{kind === 'switch' ? 'Daily · 09:00' : 'No additional charge'}</span>
            </>
          }
          description={
            kind === 'switch'
              ? 'Receive one email with the day’s important changes.'
              : kind === 'radio'
                ? 'Keep 90 days of page history for everyday collaboration.'
                : 'Keep a local copy of shared pages for travel and unreliable connections.'
          }
          name={`${id}-plan`}
          defaultChecked
          secondary={
            <>
              <Button
                size="s"
                variant="ghost"
                tone="neutral"
                aria-expanded={details}
                aria-controls={`${id}-details`}
                onClick={() => setDetails(!details)}
              >
                {details ? 'Hide details' : 'View details'}
              </Button>
              <Link href={`#${id}-terms`}>View terms</Link>
            </>
          }
        />
        <Card
          name={`${id}-plan`}
          indicatorPlacement="end"
          label={
            kind === 'radio' ? 'Advanced' : kind === 'switch' ? 'Weekly summary' : 'Audit archive'
          }
          description={
            kind === 'switch'
              ? 'Receive a summary every Monday, including pages awaiting review.'
              : kind === 'radio'
                ? 'Retain a full year of history and export activity records.'
                : 'Retain a searchable activity record and download a monthly archive.'
          }
          metadata={
            <>
              {kind === 'switch' ? (
                <span>Mondays · 09:00</span>
              ) : (
                <strong>
                  <bdi>
                    $8<span className="choice-study-unit"> / member / month</span>
                  </bdi>
                </strong>
              )}
              <Badge size="s">{kind === 'switch' ? 'Email' : 'Optional'}</Badge>
            </>
          }
        />
      </div>
      <div className="choice-study-note" id={`${id}-details`} hidden={!details}>
        {kind === 'switch'
          ? 'The digest includes followed pages and mentions. Delivery follows your workspace time zone.'
          : kind === 'radio'
            ? 'History retention applies to new edits. Existing archive exports remain available.'
            : 'Offline copies refresh when you reconnect. Access ends when your workspace session expires.'}
      </div>
      <p className="choice-study-note" id={`${id}-terms`} tabIndex={-1}>
        {kind === 'switch'
          ? 'Delivery policy: summaries contain only pages you can access. Muted pages are excluded.'
          : 'Terms: included features follow the workspace retention policy.'}
      </p>
      <div className="choice-study-grid">
        <Study title="Label only · same first-line alignment">
          <Card
            label={
              kind === 'switch'
                ? 'Email notifications'
                : kind === 'radio'
                  ? 'Only me'
                  : 'Include attachments'
            }
          />
        </Study>
        <Study title="Custom marker · automatic marker omitted">
          <Card
            id={`${id}-manual`}
            aria-describedby={`${id}-manual-description`}
            indicatorPlacement="none"
            name={`${id}-manual`}
            defaultChecked
          >
            <ChoiceCardContent>
              <div className="choice-study-label-row">
                <ChoiceCardLabel>{copy[kind].label}</ChoiceCardLabel>
                <Indicator />
              </div>
              <ChoiceCardDescription id={`${id}-manual-help`}>
                The visible {kind === 'switch' ? 'thumb' : kind === 'radio' ? 'dot' : 'check'}{' '}
                always accompanies the selected surface.
              </ChoiceCardDescription>
            </ChoiceCardContent>
          </Card>
        </Study>
      </div>
    </div>
  );
}

export function Interaction({ kind }: { readonly kind: CardKind }): ReactElement {
  const Card = cards[kind];
  const id = useId();
  return (
    <div className="choice-study-stack">
      {(['rest', 'hover', 'active', 'focus'] as const).map((state) => (
        <Study
          key={state}
          title={
            state === 'active'
              ? 'Held press · stationary geometry'
              : state === 'focus'
                ? 'Keyboard focus · one outer contour'
                : state === 'hover'
                  ? 'Hover · primary target only'
                  : 'Rest'
          }
        >
          <div className="choice-study-grid">
            <Card
              name={`${id}-${state}`}
              label={kind === 'switch' ? 'Daily digest' : 'Standard access'}
              description="A short explanation of this choice."
              previewState={state}
            />
            <Card
              name={`${id}-${state}`}
              label={kind === 'switch' ? 'Daily digest' : 'Extended access'}
              description="A short explanation of this choice."
              defaultChecked
              previewState={state}
            />
          </div>
        </Study>
      ))}
      <Study title="Focus + hover / focus + press · contours stay independent">
        <div className="choice-study-grid">
          <Card label="Hovered selection" defaultChecked previewState="hover" previewFocus />
          <Card label="Pressed selection" defaultChecked previewState="active" previewFocus />
        </div>
      </Study>
    </div>
  );
}

export function Availability({ kind }: { readonly kind: CardKind }): ReactElement {
  const Card = cards[kind];
  const id = useId();
  return (
    <div className="choice-study-stack">
      <Study title="Read-only · value remains readable and focusable">
        <div
          className="choice-study-grid"
          role={kind === 'radio' ? 'radiogroup' : 'group'}
          aria-label="Organization policy"
          aria-readonly={kind === 'radio' ? true : undefined}
        >
          <Card
            name={`${id}-policy`}
            label={kind === 'radio' ? 'Workspace members' : 'External sharing'}
            description={
              kind === 'radio'
                ? 'Workspace policy requires invite-only access.'
                : 'Managed by your organization.'
            }
            metadata={
              <>
                <LockSimpleIcon size={14} aria-hidden="true" />
                Policy controlled
              </>
            }
            readOnly
          />
          <Card
            name={`${id}-policy`}
            label={kind === 'radio' ? 'Invited people' : 'Activity history'}
            description={
              kind === 'radio'
                ? 'Only invited people can open these pages.'
                : 'Required by your organization.'
            }
            secondary={<Link href={`#${id}-availability-help`}>View policy</Link>}
            metadata={
              <>
                <LockSimpleIcon size={14} aria-hidden="true" />
                Policy controlled
              </>
            }
            defaultChecked
            readOnly
          />
        </div>
      </Study>
      <Study title="Disabled · reason stays readable, value shape stays visible">
        <div
          className="choice-study-grid"
          role={kind === 'radio' ? 'radiogroup' : 'group'}
          aria-label="Availability of access policies"
        >
          <Card
            name={`${id}-disabled`}
            label={kind === 'radio' ? 'Public link' : 'External guests'}
            description={
              kind === 'radio'
                ? 'Verify the workspace before enabling public sharing.'
                : 'Verify the workspace before inviting guests.'
            }
            secondary={<Link href={`#${id}-availability-help`}>Verification requirements</Link>}
            disabled
          />
          <Card
            name={`${id}-disabled`}
            label={kind === 'radio' ? 'Legacy team access' : 'Legacy archive'}
            description="This selected option is no longer available. Choose an alternative."
            defaultChecked
            disabled
          />
          {kind === 'radio' && (
            <RadioCard
              name={`${id}-disabled`}
              label="Invited people"
              description="Choose this available policy to replace legacy access."
            />
          )}
        </div>
      </Study>
      <p id={`${id}-availability-help`} className="choice-study-note" tabIndex={-1}>
        An administrator must verify the workspace and approve its sharing policy. You can read this
        guidance while the option is unavailable.
      </p>
    </div>
  );
}

export function Validation({ kind }: { readonly kind: 'checkbox' | 'radio' }): ReactElement {
  const Card = cards[kind];
  const id = useId();
  const [values, setValues] = useState<string[]>([]);
  const [attempted, setAttempted] = useState(false);
  const invalid = attempted && values.length === 0;
  return (
    <div className="choice-study-stack">
      <div className="choice-study-field">
        <span className="choice-study-legend" id={`${id}-title`}>
          {kind === 'radio' ? 'Choose a retention policy' : 'Include in the export'}
        </span>
        <span className="choice-study-note" id={`${id}-help`}>
          {kind === 'radio' ? 'Choose one option to continue.' : 'Choose at least one format.'}
        </span>
        <div
          className="choice-study-grid"
          role={kind === 'radio' ? 'radiogroup' : 'group'}
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-help${invalid ? ` ${id}-error` : ''}`}
        >
          {['standard', 'extended'].map((value, index) => (
            <Card
              key={value}
              name={id}
              value={value}
              checked={values.includes(value)}
              onChange={(event) =>
                setValues(
                  kind === 'radio'
                    ? [value]
                    : event.currentTarget.checked
                      ? [...values, value]
                      : values.filter((item) => item !== value),
                )
              }
              label={
                kind === 'radio'
                  ? index
                    ? 'Extended · 365 days'
                    : 'Standard · 90 days'
                  : index
                    ? 'PDF documents'
                    : 'Markdown files'
              }
              description={
                index
                  ? 'Keep a complete copy for long-term reference.'
                  : 'A compact format for everyday work.'
              }
              status={invalid ? 'danger' : 'neutral'}
              aria-describedby={invalid ? `${id}-error` : undefined}
            />
          ))}
        </div>
        <div className="choice-study-feedback" aria-live="polite">
          {invalid && (
            <span className="choice-study-error" id={`${id}-error`}>
              <WarningCircleIcon size={16} aria-hidden="true" />
              {kind === 'radio'
                ? 'Choose a policy to continue.'
                : 'Select at least one export format.'}
            </span>
          )}
        </div>
        <Button size="s" variant="secondary" tone="neutral" onClick={() => setAttempted(true)}>
          Check selection
        </Button>
      </div>
      <Study title="Selected + invalid + focus / disabled overrides invalid">
        <div className="choice-study-grid">
          <Card
            label="Selected option needs attention"
            description="This choice conflicts with the current retention policy."
            status="danger"
            defaultChecked
            previewFocus
          />
          <Card
            label="Unavailable option"
            description="Enable the workspace archive first."
            status="danger"
            disabled
          />
        </div>
      </Study>
    </div>
  );
}

export function Overflow({ kind }: { readonly kind: CardKind }): ReactElement {
  const id = useId();
  const Card = cards[kind];
  return (
    <div className="choice-study-stack">
      {kind === 'radio' && (
        <span className="choice-study-legend" id={`${id}-question`}>
          Which retention policy should apply?
        </span>
      )}
      <div
        className="choice-study-grid"
        role={kind === 'radio' ? 'radiogroup' : 'group'}
        aria-labelledby={kind === 'radio' ? `${id}-question` : undefined}
        aria-label={kind === 'radio' ? undefined : 'Long content studies'}
      >
        <Card
          name={id}
          label={
            kind === 'radio'
              ? 'Retain complete page history for every collection in this workspace'
              : 'Notify the primary owner before the quarterly verification period expires'
          }
          description={
            kind === 'radio'
              ? 'Keep every revision, including archived collections, until an administrator explicitly changes this policy.'
              : 'Keep every reviewer informed without sending duplicate reminders when several pages share the same owner and review schedule.'
          }
          metadata={
            <>
              <Badge size="s">Workspace policy</Badge>
              <span>Applies to 128 collections</span>
            </>
          }
          secondary={
            <Link href={`#${id}-guidance`}>Read the retention and notification policy</Link>
          }
        />
        <Card
          name={id}
          label="team_archive_export_2027_release_candidate_with_all_attachments"
          description="A deliberately unbroken identifier wraps without hiding the option or squeezing its indicator."
          metadata={<Badge size="s">Organization-wide permission</Badge>}
          defaultChecked
          indicatorPlacement="end"
        />
      </div>
      <p id={`${id}-guidance`} tabIndex={-1} className="choice-study-note">
        Use a short stable title when possible. Essential content wraps, including identifiers;
        metadata and actions form new lines before crowding the indicator.
      </p>
    </div>
  );
}

export function Overlay({ kind }: { readonly kind: CardKind }): ReactElement {
  const Card = cards[kind];
  const id = useId();
  return (
    <PopoverContent size="l" role="group" aria-label="Choice cards in a floating surface">
      <div className="choice-study-stack">
        <div className="choice-study-field">
          <span className="choice-study-legend" id={`${id}-question`}>
            {kind === 'radio'
              ? 'Who can open this page?'
              : kind === 'checkbox'
                ? 'Include in the shared archive'
                : 'Notification settings'}
          </span>
          <span className="choice-study-note">
            {kind === 'switch'
              ? 'Each change applies immediately.'
              : 'Changes apply when you save.'}
          </span>
        </div>
        <div
          className="choice-study-grid"
          role={kind === 'radio' ? 'radiogroup' : 'group'}
          aria-labelledby={`${id}-question`}
        >
          <Card
            name={id}
            label={
              kind === 'radio'
                ? 'Workspace members'
                : kind === 'checkbox'
                  ? 'Page content'
                  : 'Email notifications'
            }
            description={
              kind === 'radio'
                ? 'Anyone in this workspace can read the page.'
                : 'Keep the team informed about meaningful changes.'
            }
            defaultChecked
          />
          <Card
            name={id}
            label={
              kind === 'radio'
                ? 'Invited people'
                : kind === 'checkbox'
                  ? 'Attachments'
                  : 'Weekly summary'
            }
            description={
              kind === 'radio'
                ? 'Only the people you invite can open the page.'
                : 'A separate option, with its own availability and value.'
            }
          />
        </div>
        {kind !== 'radio' && (
          <Card
            label="Policy controlled"
            description="Managed by your organization. Ask an administrator to change it."
            name={`${id}-policy`}
            defaultChecked
            readOnly
          />
        )}
      </div>
    </PopoverContent>
  );
}

export function SwitchPending(): ReactElement {
  return (
    <div className="choice-study-stack">
      {(['s', 'm', 'l'] as const).map((size) => (
        <Study
          key={size}
          title={`${size.toUpperCase()} · pending off / pending on · committed position retained`}
        >
          <div className="choice-study-grid">
            <SwitchCard
              size={size}
              label="Email notifications"
              description="Turning notifications on…"
              loading
            />
            <SwitchCard
              size={size}
              label="Email notifications"
              description="Turning notifications off…"
              defaultChecked
              loading
            />
          </div>
        </Study>
      ))}
      <Study title="Read-only + pending / disabled suppresses pending">
        <div className="choice-study-grid">
          <SwitchCard
            label="Organization policy"
            description="Synchronizing the managed setting…"
            defaultChecked
            readOnly
            loading
          />
          <SwitchCard
            label="Unavailable integration"
            description="Reconnect the integration to change this setting."
            defaultChecked
            disabled
            loading
          />
        </div>
      </Study>
    </div>
  );
}

export function SwitchRequest(): ReactElement {
  const [enabled, setEnabled] = useState(false);
  const [requested, setRequested] = useState<boolean | null>(null);
  const [result, setResult] = useState<'idle' | 'saved' | 'failed'>('idle');
  const id = useId();
  const pending = requested !== null;
  return (
    <div className="choice-study-stack">
      <SwitchCard
        label="Review reminders"
        description="Notify the page owner seven days before a review is due."
        checked={enabled}
        loading={pending}
        aria-describedby={`${id}-status`}
        onChange={(event) => {
          setRequested(event.currentTarget.checked);
          setResult('idle');
        }}
        secondary={<Link href={`#${id}-schedule`}>View reminder schedule</Link>}
      />
      <div className="choice-study-feedback" id={`${id}-status`} role="status">
        {pending ? (
          `Turning reminders ${requested ? 'on' : 'off'}…`
        ) : result === 'failed' ? (
          <span className="choice-study-error">
            <WarningCircleIcon size={16} aria-hidden="true" />
            Couldn’t save. Reminders are still {enabled ? 'on' : 'off'}. Toggle to retry.
          </span>
        ) : result === 'saved' ? (
          `Saved. Reminders are ${enabled ? 'on' : 'off'}.`
        ) : (
          'Toggle the card, then resolve the preview request below.'
        )}
      </div>
      <div className="choice-study-actions" aria-label="Preview request outcome">
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          disabled={!pending}
          onClick={() => {
            if (requested !== null) {
              setEnabled(requested);
            }
            setRequested(null);
            setResult('saved');
          }}
        >
          Succeed
        </Button>
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          disabled={!pending}
          onClick={() => {
            setRequested(null);
            setResult('failed');
          }}
        >
          Fail
        </Button>
      </div>
      <p className="choice-study-note" id={`${id}-schedule`} tabIndex={-1}>
        Reminders arrive seven days before the due date. Request outcomes are explicit preview
        controls; no network request is sent.
      </p>
    </div>
  );
}

export function SharedAnatomy(): ReactElement {
  const name = useId();
  return (
    <div className="choice-study-stack">
      {(['s', 'm', 'l'] as const).map((size) => (
        <Study title={`${size.toUpperCase()} · shared first-line rhythm`} key={size}>
          <div className="choice-study-grid">
            <RadioCard
              size={size}
              name={`${name}-${size}`}
              label="Workspace access"
              description="People in this workspace can read shared pages."
              defaultChecked
            />
            <SwitchCard
              size={size}
              label="Activity notifications"
              description="Notify members when shared pages change."
              defaultChecked
            />
          </div>
        </Study>
      ))}
    </div>
  );
}
