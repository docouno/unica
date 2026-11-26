import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { PreviewContext, PreviewProps } from '../../workbench/types.js';
import {
  focusLinkedFragment,
  followStudyFragment,
  specimenBlockPage,
} from './specimen-fragment.js';
import { useId, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { LockSimpleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import {
  Badge,
  Button,
  Flex,
  Icon,
  Link,
  Stack,
  Text,
  CheckboxCard,
  CheckboxCardGroup,
  RadioCard,
  RadioCardGroup,
  SwitchCard,
  ChoiceCardContent,
  ChoiceCardLabel,
  ChoiceCardDescription,
  CheckboxCardIndicator,
  RadioCardIndicator,
  SwitchCardIndicator,
} from '@docouno/unica';
import type { CheckboxCardProps, RadioCardGroupProps, SwitchCardProps } from '@docouno/unica';
import './choice-card-studies.css';

type CardKind = 'checkbox' | 'radio' | 'switch';
interface StudyProps<Kind extends CardKind = CardKind> {
  readonly kind: Kind;
  readonly ctx: PreviewContext;
}

function StudyGroup({
  kind,
  name,
  defaultValue,
  children,
  required,
  status,
  readOnly,
  ...aria
}: Pick<
  RadioCardGroupProps,
  | 'name'
  | 'defaultValue'
  | 'children'
  | 'required'
  | 'status'
  | 'readOnly'
  | 'aria-label'
  | 'aria-labelledby'
  | 'aria-describedby'
> & { readonly kind: CardKind }): ReactElement {
  const className = 'choice-study-grid';
  if (kind === 'radio') {
    return (
      <RadioCardGroup {...aria} {...{ className, name, defaultValue, required, status, readOnly }}>
        {children}
      </RadioCardGroup>
    );
  }
  if (kind === 'checkbox') {
    return (
      <CheckboxCardGroup {...aria} {...{ className, name, required, status, readOnly }}>
        {children}
      </CheckboxCardGroup>
    );
  }
  return (
    <div {...aria} className={className} role="group">
      {children}
    </div>
  );
}

type StudyCardProps = CheckboxCardProps &
  Pick<SwitchCardProps, 'loading'> & {
    readonly kind: CardKind;
    readonly ctx: PreviewContext;
  };

function StudyCard({
  kind,
  ctx,
  value,
  name,
  defaultChecked,
  readOnly,
  loading,
  ...props
}: StudyCardProps): ReactElement {
  const generated = useId();
  const card =
    kind === 'radio' ? (
      <RadioCard {...props} value={value ?? generated} />
    ) : kind === 'switch' ? (
      <SwitchCard {...props} {...{ value, name, defaultChecked, readOnly, loading }} />
    ) : (
      <CheckboxCard {...props} {...{ value, name, defaultChecked, readOnly }} />
    );
  return (
    <div {...ctx.subject} className="choice-study-subject">
      {card}
    </div>
  );
}

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
    <Stack gap={12}>
      <Text as="span" size="caption-l" color="muted">
        <bdi>{title}</bdi>
      </Text>
      {children}
    </Stack>
  );
}
export function Sizes({ kind, ctx }: StudyProps): ReactElement {
  const name = useId();
  return (
    <Stack gap={24}>
      {(['s', 'm', 'l'] as const).map((size) => (
        <Study
          key={size}
          title={`${size.toUpperCase()} · ${size === 's' ? '12px inset · compact' : size === 'm' ? '16px inset · default' : '24px inset · spacious'}`}
        >
          <StudyGroup kind={kind} aria-label={`${size} choices`} defaultValue="invited">
            <StudyCard
              kind={kind}
              ctx={ctx}
              size={size}
              name={`${name}-${size}`}
              value={kind === 'radio' ? 'workspace' : undefined}
              label={copy[kind].label}
              description={<bdi>{copy[kind].description}</bdi>}
            />
            <StudyCard
              kind={kind}
              ctx={ctx}
              size={size}
              name={`${name}-${size}`}
              value={kind === 'radio' ? 'invited' : undefined}
              label={kind === 'radio' ? 'Invited people' : copy[kind].label}
              description={
                <bdi>
                  {kind === 'radio'
                    ? 'Only people you invite can find and open these pages.'
                    : copy[kind].description}
                </bdi>
              }
              defaultChecked
            />
          </StudyGroup>
        </Study>
      ))}
    </Stack>
  );
}

export function Anatomy({ kind, ctx }: StudyProps): ReactElement {
  const Indicator = indicators[kind];
  const id = useId();
  const terms = `${kind}-card-terms-${ctx.theme.id}`;
  const page = specimenBlockPage(`${kind}-card`, 'states', 'anatomy', ctx.theme.id);
  const [details, setDetails] = useState(false);
  return (
    <Stack gap={24}>
      <StudyGroup
        kind={kind}
        aria-label={kind === 'radio' ? 'History plan' : undefined}
        defaultValue="standard"
      >
        <StudyCard
          kind={kind}
          ctx={ctx}
          indicatorPlacement="start"
          label={
            kind === 'radio' ? 'Standard' : kind === 'switch' ? 'Daily digest' : 'Offline access'
          }
          metadata={
            <>
              <Badge size="s">{kind === 'switch' ? 'Email' : 'Included'}</Badge>
              <Text as="span" size="caption-l">
                <bdi>{kind === 'switch' ? 'Daily · 09:00' : 'No additional charge'}</bdi>
              </Text>
            </>
          }
          description={
            <bdi>
              {kind === 'switch'
                ? 'Receive one email with the day’s important changes.'
                : kind === 'radio'
                  ? 'Keep 90 days of page history for everyday collaboration.'
                  : 'Keep a local copy of shared pages for travel and unreliable connections.'}
            </bdi>
          }
          name={`${id}-plan`}
          value={kind === 'radio' ? 'standard' : undefined}
          defaultChecked
          secondary={
            <>
              <Button
                type="button"
                size="s"
                variant="ghost"
                tone="neutral"
                aria-expanded={details}
                aria-controls={`${id}-details`}
                onClick={() => setDetails(!details)}
              >
                {details ? 'Hide details' : 'View details'}
              </Button>
              <Link href={`${page}#${terms}`} onClick={followStudyFragment}>
                View terms
              </Link>
            </>
          }
        />
        <StudyCard
          kind={kind}
          ctx={ctx}
          name={`${id}-plan`}
          value={kind === 'radio' ? 'advanced' : undefined}
          indicatorPlacement="end"
          label={
            kind === 'radio' ? 'Advanced' : kind === 'switch' ? 'Weekly summary' : 'Audit archive'
          }
          description={
            <bdi>
              {kind === 'switch'
                ? 'Receive a summary every Monday, including pages awaiting review.'
                : kind === 'radio'
                  ? 'Retain a full year of history and export activity records.'
                  : 'Retain a searchable activity record and download a monthly archive.'}
            </bdi>
          }
          metadata={
            <>
              {kind === 'switch' ? (
                <Text as="span" size="caption-l">
                  <bdi>Mondays · 09:00</bdi>
                </Text>
              ) : (
                <Text as="strong" size="caption-l" color="secondary">
                  <bdi>
                    $8
                    <Text as="span" size="caption-l" weight="regular" color="muted">
                      {' '}
                      / member / month
                    </Text>
                  </bdi>
                </Text>
              )}
              <Badge size="s">{kind === 'switch' ? 'Email' : 'Optional'}</Badge>
            </>
          }
        />
      </StudyGroup>
      <Text
        as="div"
        size="body-s"
        color="muted"
        className="choice-study-note"
        id={`${id}-details`}
        hidden={!details}
      >
        <bdi>
          {kind === 'switch'
            ? 'The digest includes followed pages and mentions. Delivery follows your workspace time zone.'
            : kind === 'radio'
              ? 'History retention applies to new edits. Existing archive exports remain available.'
              : 'Offline copies refresh when you reconnect. Access ends when your workspace session expires.'}
        </bdi>
      </Text>
      <Text
        as="p"
        size="body-s"
        color="muted"
        className="choice-study-note"
        id={terms}
        ref={focusLinkedFragment}
        tabIndex={-1}
      >
        <bdi>
          {kind === 'switch'
            ? 'Delivery policy: summaries contain only pages you can access. Muted pages are excluded.'
            : 'Terms: included features follow the workspace retention policy.'}
        </bdi>
      </Text>
      <StudyGroup kind={kind} aria-label="Access scope" defaultValue="manual">
        <Study title="Label only">
          <StudyCard
            kind={kind}
            ctx={ctx}
            label={
              kind === 'switch'
                ? 'Email notifications'
                : kind === 'radio'
                  ? 'Only me'
                  : 'Include attachments'
            }
          />
        </Study>
        <Study title="Manually placed indicator">
          <StudyCard
            kind={kind}
            ctx={ctx}
            id={`${id}-manual`}
            value="manual"
            aria-labelledby={`${id}-manual-label`}
            aria-describedby={`${id}-manual-description`}
            indicatorPlacement="none"
            name={`${id}-manual`}
            defaultChecked
          >
            <ChoiceCardContent>
              <Flex align="start" justify="space-between" gap={12}>
                <ChoiceCardLabel id={`${id}-manual-label`}>{copy[kind].label}</ChoiceCardLabel>
                <Indicator />
              </Flex>
              <ChoiceCardDescription id={`${id}-manual-description`}>
                <bdi>{copy[kind].description}</bdi>
              </ChoiceCardDescription>
            </ChoiceCardContent>
          </StudyCard>
        </Study>
      </StudyGroup>
    </Stack>
  );
}

export function Interaction({ kind, ctx }: StudyProps): ReactElement {
  return (
    <StudyGroup kind={kind} aria-label="Access and feedback" defaultValue="extended">
      <StudyCard
        kind={kind}
        ctx={ctx}
        value="standard"
        label={kind === 'switch' ? 'Daily digest' : 'Standard access'}
        description={<bdi>Access includes shared pages and comments.</bdi>}
      />
      <StudyCard
        kind={kind}
        ctx={ctx}
        value="extended"
        label={kind === 'switch' ? 'Weekly summary' : 'Extended access'}
        description={<bdi>Access also includes archived workspaces.</bdi>}
        defaultChecked
      />
    </StudyGroup>
  );
}

export function Availability({ kind, ctx }: StudyProps): ReactElement {
  const id = useId();
  const target = `${kind}-card-availability-help-${ctx.theme.id}`;
  const page = specimenBlockPage(`${kind}-card`, 'states', 'availability', ctx.theme.id);
  return (
    <Stack gap={24}>
      <Study title="Read-only policy">
        <StudyGroup
          kind={kind}
          aria-label="Organization policy"
          defaultValue="policy"
          readOnly={kind === 'radio'}
        >
          <StudyCard
            kind={kind}
            ctx={ctx}
            name={`${id}-policy`}
            label={kind === 'radio' ? 'Workspace members' : 'External sharing'}
            description={
              <bdi>
                {kind === 'radio'
                  ? 'Workspace policy requires invite-only access.'
                  : 'Managed by your organization.'}
              </bdi>
            }
            metadata={
              <>
                <LockSimpleIcon size={14} aria-hidden="true" />
                Policy controlled
              </>
            }
            readOnly
          />
          <StudyCard
            kind={kind}
            ctx={ctx}
            name={`${id}-policy`}
            value="policy"
            label={kind === 'radio' ? 'Invited people' : 'Activity history'}
            description={
              <bdi>
                {kind === 'radio'
                  ? 'Only invited people can open these pages.'
                  : 'Required by your organization.'}
              </bdi>
            }
            secondary={
              <Link href={`${page}#${target}`} onClick={followStudyFragment}>
                View policy
              </Link>
            }
            metadata={
              <>
                <LockSimpleIcon size={14} aria-hidden="true" />
                Policy controlled
              </>
            }
            defaultChecked
            readOnly
          />
        </StudyGroup>
      </Study>
      <Study title="Unavailable options">
        <StudyGroup kind={kind} aria-label="Availability of access policies" defaultValue="legacy">
          <StudyCard
            kind={kind}
            ctx={ctx}
            name={`${id}-disabled`}
            label={kind === 'radio' ? 'Public link' : 'External guests'}
            description={
              <bdi>
                {kind === 'radio'
                  ? 'Verify the workspace before enabling public sharing.'
                  : 'Verify the workspace before inviting guests.'}
              </bdi>
            }
            secondary={
              <Link href={`${page}#${target}`} onClick={followStudyFragment}>
                Verification requirements
              </Link>
            }
            disabled
          />
          <StudyCard
            kind={kind}
            ctx={ctx}
            name={`${id}-disabled`}
            value="legacy"
            label={kind === 'radio' ? 'Legacy team access' : 'Legacy archive'}
            description={
              <bdi>This selected option is no longer available. Choose an alternative.</bdi>
            }
            defaultChecked
            disabled
          />
          {kind === 'radio' && (
            <StudyCard
              kind="radio"
              ctx={ctx}
              value="invited"
              label="Invited people"
              description={<bdi>Choose this available policy to replace legacy access.</bdi>}
            />
          )}
        </StudyGroup>
      </Study>
      <Text
        as="p"
        size="body-s"
        color="muted"
        id={target}
        ref={focusLinkedFragment}
        className="choice-study-note"
        tabIndex={-1}
      >
        <bdi>
          An administrator must verify the workspace and approve its sharing policy. You can read
          this guidance while the option is unavailable.
        </bdi>
      </Text>
    </Stack>
  );
}

export function Validation({ kind, ctx }: StudyProps<'checkbox' | 'radio'>): ReactElement {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const options =
    kind === 'radio'
      ? [
          { value: 'standard', label: 'Standard · 90 days' },
          { value: 'extended', label: 'Extended · 365 days' },
        ]
      : [
          { value: 'markdown', label: 'Markdown files' },
          { value: 'pdf', label: 'PDF documents' },
        ];
  const [hasSelection, setHasSelection] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [confirmed, setConfirmed] = useState('');
  const invalid = attempted && !hasSelection;
  useStoryAction(ctx, (action) => {
    if (action === 'check-selection') {
      formRef.current?.requestSubmit();
    }
  });
  return (
    <Stack gap={24}>
      <form
        ref={formRef}
        className="choice-study-field"
        onInvalid={(event) => {
          if (ctx.comparing) {
            // A shared action validates every artboard. Keep the frame toolbar in view.
            event.preventDefault();
          }
          setAttempted(true);
          setConfirmed('');
        }}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget).getAll(id);
          const labels = options
            .filter((option) => data.includes(option.value))
            .map((option) => option.label);
          setHasSelection(labels.length > 0);
          setConfirmed(`Confirmed: ${labels.join(', ')}.`);
        }}
      >
        <Text
          as="span"
          size="body-m"
          weight="semibold"

          id={`${id}-title`}
        >
          <bdi>{kind === 'radio' ? 'Choose a retention policy' : 'Include in the export'}</bdi>
        </Text>
        <Text as="span" size="body-s" color="muted" className="choice-study-note" id={`${id}-help`}>
          <bdi>
            {kind === 'radio' ? 'Choose one option to continue.' : 'Choose at least one format.'}
          </bdi>
        </Text>
        <StudyGroup
          kind={kind}
          name={id}
          aria-labelledby={`${id}-title`}
          required
          status={invalid ? 'danger' : 'neutral'}
          aria-describedby={`${id}-help${invalid ? ` ${id}-error` : ''}`}
        >
          {options.map(({ value, label }, index) => (
            <StudyCard
              kind={kind}
              ctx={ctx}
              key={value}
              name={id}
              value={value}
              onChange={(event) => {
                setConfirmed('');
                const form = event.currentTarget.form;
                setHasSelection(form !== null && new FormData(form).has(id));
              }}
              label={label}
              description={
                <bdi>
                  {kind === 'radio'
                    ? index
                      ? 'Keep a full year of revision history.'
                      : 'Keep the last 90 days of edits.'
                    : index
                      ? 'Keep a complete copy for long-term reference.'
                      : 'A compact format for everyday work.'}
                </bdi>
              }
            />
          ))}
        </StudyGroup>
        <Text
          as="div"
          size="body-s"
          color="muted"
          className="choice-study-feedback"
          aria-live="polite"
        >
          {invalid && (
            <span className="choice-study-error" id={`${id}-error`}>
              <WarningCircleIcon size={16} aria-hidden="true" />
              <bdi>
                {kind === 'radio'
                  ? 'Choose a policy to continue.'
                  : 'Select at least one export format.'}
              </bdi>
            </span>
          )}
          {confirmed && <bdi>{confirmed}</bdi>}
        </Text>
      </form>
      <Study title="Selected with an error / unavailable option">
        <StudyGroup kind={kind} aria-label="Retention conflicts" defaultValue="conflict">
          <StudyCard
            kind={kind}
            ctx={ctx}
            value="conflict"
            label="Selected option needs attention"
            description={<bdi>This choice conflicts with the current retention policy.</bdi>}
            status="danger"
            defaultChecked
          />
          <StudyCard
            kind={kind}
            ctx={ctx}
            label="Unavailable option"
            description={<bdi>Enable the workspace archive first.</bdi>}
            status="danger"
            disabled
          />
        </StudyGroup>
      </Study>
    </Stack>
  );
}

export function Overflow({ kind, ctx }: StudyProps): ReactElement {
  const id = useId();
  const target = `${kind}-card-guidance-${ctx.theme.id}`;
  const page = specimenBlockPage(`${kind}-card`, 'states', 'overflow', ctx.theme.id);
  return (
    <Stack gap={24}>
      {kind === 'radio' && (
        <Text
          as="span"
          size="body-m"
          weight="semibold"

          id={`${id}-question`}
        >
          <bdi>Which retention policy should apply?</bdi>
        </Text>
      )}
      <StudyGroup
        kind={kind}
        defaultValue="release-snapshots"
        aria-labelledby={kind === 'radio' ? `${id}-question` : undefined}
        aria-label={kind === 'radio' ? undefined : 'Long content studies'}
      >
        <StudyCard
          kind={kind}
          ctx={ctx}
          name={id}
          value={kind === 'radio' ? 'full-history' : undefined}
          label={
            kind === 'radio'
              ? 'Retain complete page history for every collection in this workspace'
              : 'Notify the primary owner before the quarterly verification period expires'
          }
          description={
            <bdi>
              {kind === 'radio'
                ? 'Keep every revision, including archived collections, until an administrator explicitly changes this policy.'
                : 'Keep every reviewer informed without sending duplicate reminders when several pages share the same owner and review schedule.'}
            </bdi>
          }
          metadata={
            <>
              <Badge size="s">Workspace policy</Badge>
              <Text as="span" size="caption-l">
                Applies to 128 collections
              </Text>
            </>
          }
          secondary={
            <Link href={`${page}#${target}`} onClick={followStudyFragment}>
              {kind === 'radio'
                ? 'Compare retention rules'
                : 'Read the retention and notification policy'}
            </Link>
          }
        />
        <StudyCard
          kind={kind}
          ctx={ctx}
          name={id}
          value={kind === 'radio' ? 'release-snapshots' : undefined}
          label={
            <bdi>
              {kind === 'radio'
                ? 'retain_signed_release_snapshots_and_attachments_for_seven_years'
                : 'team_archive_export_2027_release_candidate_with_all_attachments'}
            </bdi>
          }
          description={
            <bdi>
              {kind === 'radio'
                ? 'Keep only signed releases and their attachments for seven years.'
                : 'Include the signed release archive and its attachments.'}
            </bdi>
          }
          metadata={
            <Text as="span" size="caption-l" color="secondary">
              <bdi>
                {kind === 'radio' ? 'Release snapshots only' : 'Organization-wide permission'}
              </bdi>
            </Text>
          }
          defaultChecked
          indicatorPlacement="end"
        />
      </StudyGroup>
      <Text
        as="p"
        size="body-s"
        color="muted"
        id={target}
        ref={focusLinkedFragment}
        tabIndex={-1}
        className="choice-study-note"
      >
        <bdi>
          {kind === 'radio'
            ? 'Full history keeps every edit indefinitely. The snapshot policy keeps one copy per signed release for seven years.'
            : 'Archive owners keep one copy per release. Review reminders go only to people who can access the collection.'}
        </bdi>
      </Text>
    </Stack>
  );
}

export function Overlay({ kind, ctx }: StudyProps): ReactElement {
  const id = useId();
  return (
    <div
      className="unica-overlay-surface choice-study-surface"
      data-surface="overlay"
      role="group"
      aria-label="Choice cards in a floating surface"
    >
      <Stack gap={24}>
        <div className="choice-study-field">
          <Text
            as="span"
            size="body-m"
            weight="semibold"

            id={`${id}-question`}
          >
            <bdi>
              {kind === 'radio'
                ? 'Who can open this page?'
                : kind === 'checkbox'
                  ? 'Include in the shared archive'
                  : 'Notification settings'}
            </bdi>
          </Text>
          <Text as="span" size="body-s" color="muted" className="choice-study-note">
            <bdi>
              {kind === 'switch'
                ? 'Each change applies immediately.'
                : kind === 'radio'
                  ? 'Choose one access policy.'
                  : 'Choose the files to include.'}
            </bdi>
          </Text>
        </div>
        <StudyGroup kind={kind} aria-labelledby={`${id}-question`} defaultValue="primary">
          <StudyCard
            kind={kind}
            ctx={ctx}
            name={id}
            value="primary"
            label={
              kind === 'radio'
                ? 'Workspace members'
                : kind === 'checkbox'
                  ? 'Page content'
                  : 'Email notifications'
            }
            description={
              <bdi>
                {kind === 'radio'
                  ? 'Anyone in this workspace can read the page.'
                  : kind === 'checkbox'
                    ? 'Include the text of every shared page.'
                    : 'Receive updates when shared pages change.'}
              </bdi>
            }
            defaultChecked
          />
          <StudyCard
            kind={kind}
            ctx={ctx}
            name={id}
            label={
              kind === 'radio'
                ? 'Invited people'
                : kind === 'checkbox'
                  ? 'Attachments'
                  : 'Weekly summary'
            }
            description={
              <bdi>
                {kind === 'radio'
                  ? 'Only the people you invite can open the page.'
                  : kind === 'checkbox'
                    ? 'Include the files attached to these pages.'
                    : 'Receive one summary of the week’s changes.'}
              </bdi>
            }
          />
        </StudyGroup>
        {kind !== 'radio' && (
          <StudyCard
            kind={kind}
            ctx={ctx}
            label="Policy controlled"
            description={
              <bdi>Managed by your organization. Ask an administrator to change it.</bdi>
            }
            name={`${id}-policy`}
            defaultChecked
            readOnly
          />
        )}
      </Stack>
    </div>
  );
}

export function SwitchPending({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={24}>
      {(['s', 'm', 'l'] as const).map((size) => (
        <Study key={size} title={`${size.toUpperCase()} · pending change`}>
          <div className="choice-study-grid">
            <StudyCard
              kind="switch"
              ctx={ctx}
              size={size}
              label="Email notifications"
              description={<bdi>Turning notifications on…</bdi>}
              loading
            />
            <StudyCard
              kind="switch"
              ctx={ctx}
              size={size}
              label="Email notifications"
              description={<bdi>Turning notifications off…</bdi>}
              defaultChecked
              loading
            />
          </div>
        </Study>
      ))}
      <Study title="Managed and unavailable settings">
        <div className="choice-study-grid">
          <StudyCard
            kind="switch"
            ctx={ctx}
            label="Organization policy"
            description={<bdi>Synchronizing the managed setting…</bdi>}
            defaultChecked
            readOnly
            loading
          />
          <StudyCard
            kind="switch"
            ctx={ctx}
            label="Unavailable integration"
            description={<bdi>Reconnect the integration to change this setting.</bdi>}
            defaultChecked
            disabled
            loading
          />
        </div>
      </Study>
    </Stack>
  );
}

export function SwitchRequest({ ctx }: PreviewProps): ReactElement {
  const [enabled, setEnabled] = useState(false);
  const [requested, setRequested] = useState<boolean | null>(null);
  const [result, setResult] = useState<'idle' | 'saved' | 'failed'>('idle');
  const id = useId();
  const scheduleId = `switch-card-reminder-schedule-${ctx.theme.id}`;
  const page = specimenBlockPage('switch-card', 'states', 'request', ctx.theme.id);

  useStoryAction(ctx, (action) => {
    if (requested === null) {
      return;
    }
    if (action === 'succeed') {
      setEnabled(requested);
      setResult('saved');
    } else if (action === 'fail') {
      setResult('failed');
    } else {
      return;
    }
    setRequested(null);
  });
  const position = enabled ? 'on' : 'off';
  const feedback =
    requested !== null
      ? `Turning reminders ${requested ? 'on' : 'off'}…`
      : result === 'failed'
        ? `Couldn’t save. Reminders are still ${position}. Toggle to retry.`
        : result === 'saved'
          ? `Saved. Reminders are ${position}.`
          : '';
  return (
    <Stack gap={12} style={{ inlineSize: 'min(100%, 28rem)' }}>
      <StudyCard
        kind="switch"
        ctx={ctx}
        label="Review reminders"
        description={<bdi>Notify the page owner seven days before a review is due.</bdi>}
        checked={enabled}
        loading={requested !== null}
        aria-describedby={id}
        onCheckedChange={(next) => {
          setRequested(next);
          setResult('idle');
        }}
        secondary={
          <Link href={`${page}#${scheduleId}`} onClick={followStudyFragment}>
            View reminder schedule
          </Link>
        }
      />
      <Flex gap={8} align="start" id={id} role="status">
        {result === 'failed' && <Icon icon={WarningCircleIcon} size="s" color="danger" />}
        <Text size="body-s" color={result === 'failed' ? 'danger' : 'secondary'}>
          <bdi>{feedback}</bdi>
        </Text>
      </Flex>
      <Text
        as="p"
        size="body-s"
        color="secondary"
        id={scheduleId}
        ref={focusLinkedFragment}
        tabIndex={-1}
      >
        <bdi>
          Reminders arrive seven days before the due date. Delivery follows your workspace time
          zone.
        </bdi>
      </Text>
    </Stack>
  );
}
