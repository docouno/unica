import {
  Button,
  Checkbox,
  CheckboxGroup,
  Divider,
  Input,
  Link,
  Text,
  Textarea,
} from '@docouno/unica';
import type { ControlSize, FieldStatus, FieldVariant } from '@docouno/unica';
import { useId, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import type { PreviewProps, PreviewContext } from '../../workbench/types.js';
import { FormField, FormFieldDescription, FormFieldFeedback, FormFieldLabel } from '@docouno/unica';
import {
  specimenBlockPage,
  focusLinkedFragment,
  followStudyFragment,
} from '../shared/specimen-fragment.js';
import { FieldBinding } from '../../field-binding.js';
import { joinIds } from '../../field-support.js';
import './form-field.examples.css';

interface TextFieldProps {
  readonly subject: PreviewContext['subject'];
  readonly size?: ControlSize;
  readonly orientation?: 'vertical' | 'horizontal';
  readonly status?: FieldStatus;
  readonly variant?: FieldVariant;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
  readonly defaultValue?: string;
  readonly required?: boolean;
  readonly optional?: ReactNode;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly loading?: boolean;
  readonly placeholder?: string;
  readonly dir?: 'ltr' | 'rtl';
  readonly type?: 'email';
}

function TextField({
  subject,
  size = 'm',
  orientation = 'vertical',
  status = 'neutral',
  label = 'Display name',
  description,
  message,
  required,
  optional,
  disabled,
  ...input
}: TextFieldProps): ReactElement {
  return (
    <FormField
      {...subject}
      size={size}
      orientation={orientation}
      label={label}
      description={description}
      message={typeof message === 'string' && message ? <bdi>{message}</bdi> : message}
      status={status}
      required={required}
      optional={optional}
      disabled={disabled}
    >
      <Input {...input} />
    </FormField>
  );
}

export function Layouts({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="ff-example-stack">
      {(['s', 'm', 'l'] as const).map((size) => (
        <div className="ff-example-study" key={size}>
          <Text size="caption-l" weight="medium" color="secondary">
            {size.toUpperCase()} ·{' '}
            {size === 's'
              ? 'Compact · 30px'
              : size === 'm'
                ? 'Regular · 40px'
                : 'Comfortable · 48px'}
          </Text>
          <div className="ff-example-vertical">
            <TextField
              subject={ctx.subject}
              size={size}
              required
              defaultValue="Design library"
              description={<bdi>The name people see in shared spaces.</bdi>}
            />
          </div>
          <TextField
            subject={ctx.subject}
            size={size}
            orientation="horizontal"
            required
            defaultValue="Design library"
            description={<bdi>The name people see in shared spaces.</bdi>}
          />
          <TextField
            subject={ctx.subject}
            size={size}
            orientation="horizontal"
            label="Reference code"
            optional="(optional)"
            placeholder="e.g. DS-024"
            description={<bdi>A short internal reference for your team.</bdi>}
          />
          <Divider className="ff-example-divider" />
        </div>
      ))}
      <TextField
        subject={ctx.subject}
        orientation="horizontal"
        label="Inline reference"
        variant="ghost"
        defaultValue="DS-024"
        placeholder="e.g. DS-024"
        description={<bdi>Use the short code from the project directory.</bdi>}
      />
    </div>
  );
}

export function Anatomy({ ctx }: PreviewProps): ReactElement {
  const password = useId();
  const about = useId();
  const custom = useId();
  const [help, setHelp] = useState(false);
  return (
    <div className="ff-example-stack">
      <FormField
        {...ctx.subject}
        label="Access code"
        controlId={password}
        required
        labelAction={
          <Button
            size="s"
            variant="ghost"
            tone="neutral"
            onClick={() => setHelp(!help)}
            aria-expanded={help}
            aria-controls={`${password}-help`}
          >
            <bdi>Where to find it</bdi>
          </Button>
        }
        description={
          <>
            <p>
              <bdi>Use the code from your invitation.</bdi>
            </p>
            <ul>
              <li>
                <bdi>Eight letters and numbers.</bdi>
              </li>
              <li>
                <bdi>Codes expire after seven days.</bdi>
              </li>
            </ul>
            <p id={`${password}-help`} hidden={!help}>
              <bdi>Look for “Your access code” in the invitation email.</bdi>
            </p>
          </>
        }
        message={<bdi>This code has expired. Ask the sender for a new invitation.</bdi>}
        status="danger"
      >
        <Input id={password} required defaultValue="AC24-OLD" status="danger" />
      </FormField>
      <FormField
        {...ctx.subject}
        label="Short introduction"
        orientation="horizontal"
        labelAlign="text"
        controlId={about}
        optional="(optional)"
        description={<bdi>A sentence or two helps collaborators recognize you.</bdi>}
      >
        <Textarea id={about} rows={3} placeholder="What are you working on?" />
      </FormField>
      <div className="ff-example-parts">
        <FormFieldLabel {...ctx.subject} htmlFor={custom} optional="(optional)">
          Public reference
        </FormFieldLabel>
        <Input
          id={custom}
          defaultValue="DS-024"
          aria-describedby={`${custom}-description ${custom}-message`}
        />
        <div className="ff-example-support">
          <FormFieldDescription id={`${custom}-description`}>
            <bdi>Use the short code assigned to the project.</bdi>
          </FormFieldDescription>
          <FormFieldFeedback id={`${custom}-message`} status="neutral">
            <bdi>Visible to collaborators with access.</bdi>
          </FormFieldFeedback>
        </div>
      </div>
    </div>
  );
}

export function Feedback({ ctx }: PreviewProps): ReactElement {
  const messages: Record<FieldStatus, string> = {
    neutral: 'You can change this later.',
    info: 'Only people with the link can find this space.',
    success: 'This address is available.',
    warning: 'Changing this address may break existing links.',
    danger: 'Use lowercase letters, numbers, and hyphens.',
  };
  return (
    <div className="ff-example-stack">
      {(['neutral', 'info', 'success', 'warning', 'danger'] as const).map((status) => (
        <div className="ff-example-study" key={status}>
          <Text size="caption-l" weight="medium" color="secondary">
            {status}
          </Text>
          <TextField
            subject={ctx.subject}
            status={status}
            label="Space address"
            defaultValue={status === 'danger' ? 'Design Library!' : 'design-library'}
            description={<bdi>This becomes part of the shared URL.</bdi>}
            message={messages[status]}
          />
          <FormField
            {...ctx.subject}
            label="Publishing checks"
            target="group"

            description={<bdi>Checks run before each publication.</bdi>}
            status={status}
            message={
              <bdi>
                {
                  {
                    neutral: 'You can change this later.',
                    info: 'These checks apply to every document.',
                    success: 'All required checks are enabled.',
                    warning: 'Some documents may need a manual review.',
                    danger: 'Select at least one publishing check.',
                  }[status]
                }
              </bdi>
            }
          >
            <CheckboxGroup>
              <Checkbox label="Check shared links" defaultChecked={status === 'success'} />
            </CheckboxGroup>
          </FormField>
          <Divider className="ff-example-divider" />
        </div>
      ))}
      <div className="ff-example-fallbacks">
        <Text size="caption-l" weight="medium" color="secondary">
          Fallback labels · no custom message
        </Text>
        {(['info', 'success', 'warning', 'danger'] as const).map((status) => (
          <FormFieldFeedback {...ctx.subject} key={status} status={status} />
        ))}
      </div>
    </div>
  );
}

export function Availability({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="ff-example-stack">
      <TextField
        subject={ctx.subject}
        label="Directory name"
        readOnly
        defaultValue="Design library"
        description={
          <bdi>Managed by your organization. Contact an administrator to change it.</bdi>
        }
      />
      <TextField
        subject={ctx.subject}
        label="Verified domain"
        readOnly
        defaultValue="example.com"
        status="success"
        message={<bdi>Domain ownership verified.</bdi>}
      />
      <TextField
        subject={ctx.subject}
        label="Custom domain"
        disabled
        placeholder="Available on a team plan"
        description={<bdi>Upgrade your plan to connect a custom domain.</bdi>}
        status="danger"
        message={<bdi>This stale validation is intentionally suppressed.</bdi>}
      />
      <TextField
        subject={ctx.subject}
        label="Space address"
        loading
        defaultValue="design-library"
        description={<bdi>Use lowercase letters, numbers, and hyphens.</bdi>}
        message={<bdi>Checking availability…</bdi>}
      />
      <TextField
        subject={ctx.subject}
        label="Reserved address"
        loading
        readOnly
        defaultValue="design-library"
        description={<bdi>The address stays readable while the reservation completes.</bdi>}
        message={<bdi>Reserving address…</bdi>}
      />
      <div className="ff-example-study">
        <TextField subject={ctx.subject} label="Pointer editing" defaultValue="design-library" />
        <TextField
          subject={ctx.subject}
          label="Keyboard editing"
          status="danger"
          message={<bdi>Use an address without spaces.</bdi>}
          defaultValue="design library"
        />
      </div>
    </div>
  );
}

export function LiveValidation({ ctx }: PreviewProps): ReactElement {
  const id = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const lastValidation = useRef(0);
  const [errors, setErrors] = useState({ email: '', channels: false });
  const [saved, setSaved] = useState(false);
  const reserve = ctx.story?.controls.reserve === true;
  return (
    <div className="ff-example-stack">
      <form
        className="ff-example-stack"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          lastValidation.current += 1;
          const validity = emailRef.current?.validity;
          const next = {
            email: validity?.valid
              ? ''
              : validity?.typeMismatch
                ? 'Enter an email address, such as name@example.com.'
                : 'Enter your delivery email.',
            channels: !new FormData(event.currentTarget).has(`${id}-channels`),
          };
          setErrors(next);
          setSaved(!next.email && !next.channels);
          if (next.email) {
            emailRef.current?.focus();
          } else if (next.channels) {
            groupRef.current?.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus();
          }
        }}
        onReset={(event) => {
          const reset = event.nativeEvent;
          const validation = lastValidation.current;
          // A document-level listener can still cancel the native reset.
          setTimeout(() => {
            if (
              reset.isTrusted &&
              !reset.defaultPrevented &&
              lastValidation.current === validation
            ) {
              setErrors({ email: '', channels: false });
              setSaved(false);
            }
          }, 0);
        }}
      >
        <FormField
          {...ctx.subject}
          label="Delivery email"
          controlId={`${id}-email`}
          required
          description={<bdi>Use an address you can receive messages at.</bdi>}
          message={errors.email ? <bdi>{errors.email}</bdi> : undefined}
          status={errors.email ? 'danger' : 'neutral'}
          reserveMessage={reserve}
        >
          <Input
            ref={emailRef}
            id={`${id}-email`}
            name="email"
            type="email"
            dir="ltr"
            required
            placeholder="name@example.com"
            onChange={() => {
              setErrors((current) => ({ ...current, email: '' }));
              setSaved(false);
            }}
          />
        </FormField>
        <FormField
          {...ctx.subject}
          target="group"
          label="Delivery methods"
          labelId={`${id}-channels-label`}
          required
          description={<bdi>Choose at least one. You can use both.</bdi>}
          status={errors.channels ? 'danger' : 'neutral'}
          message={errors.channels ? <bdi>Select at least one delivery method.</bdi> : undefined}
          reserveMessage={reserve}
        >
          <div ref={groupRef}>
            <CheckboxGroup
              size="m"
              name={`${id}-channels`}
              onValueChange={() => {
                setErrors((current) => ({ ...current, channels: false }));
                setSaved(false);
              }}
            >
              <Checkbox value="email" label="Email digest" />
              <Checkbox value="in-app" label="In-app notifications" />
            </CheckboxGroup>
          </div>
        </FormField>
        <div className="ff-example-actions">
          <Button type="submit">Save preferences</Button>
          <Button type="reset" variant="secondary" tone="neutral">
            Reset
          </Button>
        </div>
        <Text size="caption-l" color="secondary" className="ff-example-result" role="status">
          <bdi>{saved ? 'Preferences saved for this preview.' : ''}</bdi>
        </Text>
      </form>
    </div>
  );
}

export function Overflow({ ctx }: PreviewProps): ReactElement {
  const id = useId();
  const addressHelp = `form-field-${ctx.theme.id}-address-guidelines`;
  const addressPage = specimenBlockPage('form-field', 'states', 'overflow', ctx.theme.id);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('08:30');
  const invalidEnd = Boolean(start && end && end <= start);
  const groupIssue = Boolean(ctx.story?.controls.groupIssue && start && end && !invalidEnd);
  const [help, setHelp] = useState(false);
  return (
    <div className="ff-example-stack">
      <FormField
        {...ctx.subject}
        label="Invitation access code"
        controlId={`${id}-code`}
        labelAction={
          <Button
            size="s"
            variant="ghost"
            tone="neutral"
            onClick={() => setHelp(!help)}
            aria-expanded={help}
            aria-controls={`${id}-code-help`}
          >
            <bdi>Where can I find my invitation access code?</bdi>
          </Button>
        }
        description={
          <>
            <p>
              <bdi>Enter the code from your invitation email.</bdi>
            </p>
            <p id={`${id}-code-help`} hidden={!help}>
              <bdi>Look below the invitation link, or ask the sender for a new code.</bdi>
            </p>
          </>
        }
      >
        <Input id={`${id}-code`} defaultValue="AC24-LIVE" />
      </FormField>
      <TextField
        subject={ctx.subject}
        orientation="horizontal"
        label="A longer descriptive label for the public documentation address"
        required
        defaultValue="documentation-and-reference-library"
        description={
          <>
            <bdi>Use an address that describes the collection.</bdi>{' '}
            <Link href={`${addressPage}#${addressHelp}`} onClick={followStudyFragment}>
              Address guidelines
            </Link>
          </>
        }
        status="danger"
        message={
          <bdi>
            This address is already used. Add a short team or project name to make it unique.
          </bdi>
        }
      />
      <Text
        as="p"
        size="body-s"
        color="secondary"
        id={addressHelp}
        tabIndex={-1}
        ref={focusLinkedFragment}
      >
        <bdi>
          Use lowercase letters, numbers, and hyphens. Add a short team name if the address is
          already in use.
        </bdi>
      </Text>
      <div dir="rtl">
        <TextField
          subject={ctx.subject}
          orientation="horizontal"
          label="Workspace address"
          required
          dir="ltr"
          defaultValue="https://example.com/design-library"
          description={<bdi>Share this address with workspace members.</bdi>}
        />
      </div>
      <FormField
        {...ctx.subject}
        orientation="horizontal"
        target="group"
        label="Review window"
        feedbackIcon={groupIssue}
        labelAlign="start"
        labelId={`${id}-label`}
        description={
          <bdi>
            Use local time. Either boundary is optional. When both are set, the end must be later
            than the start.
          </bdi>
        }
        status={invalidEnd || groupIssue ? 'danger' : 'neutral'}
        message={
          groupIssue ? (
            <bdi>This window overlaps another review.</bdi>
          ) : invalidEnd ? (
            <bdi>Choose an end time later than {start}.</bdi>
          ) : undefined
        }
      >
        <FieldBinding>
          {(field) => (
            <div
              className="ff-example-pair"
              role="group"
              aria-labelledby={field?.labelId}
              aria-describedby={joinIds(field?.descriptionId, groupIssue && field?.messageId)}
              aria-invalid={groupIssue || undefined}
            >
              <FormField {...ctx.subject} label="Start" controlId={`${id}-start`}>
                <input
                  className="ff-example-time"
                  id={`${id}-start`}
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.currentTarget.value)}
                />
              </FormField>
              <FormField {...ctx.subject} label="End" controlId={`${id}-end`}>
                <input
                  className="ff-example-time"
                  id={`${id}-end`}
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.currentTarget.value)}
                  aria-invalid={invalidEnd || undefined}
                  aria-describedby={invalidEnd ? field?.messageId : undefined}
                />
              </FormField>
            </div>
          )}
        </FieldBinding>
      </FormField>
      <div className="ff-example-narrow">
        <TextField
          subject={ctx.subject}
          orientation="horizontal"
          label="Collection address"
          defaultValue="design-library"
          description={<bdi>Used in public links to this collection.</bdi>}
        />
      </div>
      <FormField
        {...ctx.subject}
        label="Source identifier"
        controlId={`${id}-long`}
        description={
          <bdi>
            references/design-system/component-specifications/field-layout-and-validation-guidelines-without-any-short-name
          </bdi>
        }
      >
        <Input
          id={`${id}-long`}
          defaultValue="references/design-system/component-specifications/form-field"
        />
      </FormField>
    </div>
  );
}

export function Overlay({ ctx }: PreviewProps): ReactElement {
  const id = useId();
  const danger = ctx.story?.controls.feedback !== false;
  return (
    <div
      className={`ff-example-overlay${ctx.surface === 'overlay' ? ' unica-overlay-surface' : ''}`}
      data-surface={ctx.surface}
      role="group"
      aria-labelledby={`${id}-title`}
    >
      <Text weight="semibold" color="primary" id={`${id}-title`}>
        Sharing defaults
      </Text>
      <TextField
        subject={ctx.subject}
        label="Reply-to email"
        type="email"
        dir="ltr"
        defaultValue="team@"
        description={<bdi>Replies to shared updates go to this address.</bdi>}
        status={danger ? 'danger' : 'neutral'}
        message={danger ? 'Enter the full address, such as team@example.com.' : undefined}
      />
      <FormField
        {...ctx.subject}
        target="group"
        label="Available to"
        labelId={`${id}-label`}
        description={<bdi>Choose who can discover shared updates.</bdi>}
      >
        <CheckboxGroup>
          <Checkbox label="Workspace members" defaultChecked />
          <Checkbox label="Invited guests" />
        </CheckboxGroup>
      </FormField>
    </div>
  );
}
