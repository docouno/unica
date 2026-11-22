import { Link, Input } from '@docouno/unica';
import { useId, useRef, useState } from 'react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { Button } from '../button/button.proto.js';
import {
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Switch,
  SwitchGroup,
} from '../binary-controls/binary-controls.proto.js';
import type { ControlSize, FieldStatus, FieldVariant } from '@docouno/unica';
import { PopoverContent } from '../popover/popover.proto.js';
import { CheckboxCard } from '../choice-card/choice-card.proto.js';
import { Textarea } from '../textarea/textarea.proto.js';
import {
  FormField,
  FormFieldDescription,
  FormFieldFeedback,
  FormFieldLabel,
} from './form-field.proto.js';
import './form-field.examples.css';

export function Note({ children }: { readonly children: ReactNode }): ReactElement {
  return <p className="ff-example-note">{children}</p>;
}

interface TextFieldProps {
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
}

function TextField({
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
  const id = useId();
  const feedback =
    !disabled && ((message !== undefined && message !== null) || status !== 'neutral');
  return (
    <FormField
      size={size}
      orientation={orientation}
      htmlFor={id}
      label={label}
      description={description}
      message={message}
      descriptionId={description ? `${id}-description` : undefined}
      messageId={feedback ? `${id}-message` : undefined}
      status={status}
      required={required}
      optional={optional}
      disabled={disabled}
      feedbackIcon={false}
    >
      <Input
        {...input}
        id={id}
        size={size}
        status={status}
        required={required}
        disabled={disabled}
        aria-describedby={
          [description ? `${id}-description` : '', feedback ? `${id}-message` : '']
            .filter(Boolean)
            .join(' ') || undefined
        }
      />
    </FormField>
  );
}

export function Layouts(): ReactElement {
  return (
    <div className="ff-example-stack">
      <Note>
        One reading order, two layouts. Horizontal fields share their label column and stack when
        the container becomes narrow.
      </Note>
      {(['s', 'm', 'l'] as const).map((size) => (
        <div className="ff-example-study" key={size}>
          <p className="ff-example-kicker">
            {size.toUpperCase()} ·{' '}
            {size === 's'
              ? 'Compact · 30px'
              : size === 'm'
                ? 'Regular · 40px'
                : 'Comfortable · 48px'}
          </p>
          <div className="ff-example-vertical">
            <TextField
              size={size}
              required
              defaultValue="Design library"
              description="The name people see in shared spaces."
            />
          </div>
          <TextField
            size={size}
            orientation="horizontal"
            required
            defaultValue="Design library"
            description="The name people see in shared spaces."
          />
          <TextField
            size={size}
            orientation="horizontal"
            label="Reference code"
            optional="(optional)"
            placeholder="e.g. DS-024"
            description="A short internal reference for your team."
          />
        </div>
      ))}
      <TextField
        orientation="horizontal"
        label="Inline reference"
        variant="ghost"
        defaultValue="DS-024"
        placeholder="e.g. DS-024"
        description="Ghost belongs in an established editing context, such as a details inspector."
      />
    </div>
  );
}

export function Anatomy(): ReactElement {
  const password = useId();
  const about = useId();
  const custom = useId();
  const [help, setHelp] = useState(false);
  return (
    <div className="ff-example-stack">
      <Note>
        Labels stay visible. Required markers sit beside the label; an optional action has its own
        focus target. Instructions remain below the control when feedback appears.
      </Note>
      <FormField
        label="Access code"
        htmlFor={password}
        required
        labelAction={
          <Link
            href="#code-help"
            onClick={(event) => {
              event.preventDefault();
              setHelp(!help);
            }}
            aria-expanded={help}
            aria-controls={`${password}-help`}
          >
            Where to find it
          </Link>
        }
        description={
          <>
            <p>Use the code from your invitation.</p>
            <ul>
              <li>Eight letters and numbers.</li>
              <li>Codes expire after seven days.</li>
            </ul>
            <p id={`${password}-help`} hidden={!help}>
              Look for “Your access code” in the invitation email.
            </p>
          </>
        }
        descriptionId={`${password}-description`}
        message="This code has expired. Ask the sender for a new invitation."
        messageId={`${password}-message`}
        status="danger"
        feedbackIcon={false}
      >
        <Input
          id={password}
          required
          defaultValue="AC24-OLD"
          status="danger"
          aria-describedby={`${password}-description ${password}-message`}
        />
      </FormField>
      <FormField
        label="Short introduction"
        orientation="horizontal"
        labelAlign="text"
        htmlFor={about}
        optional="(optional)"
        description="A sentence or two helps collaborators recognize you."
        descriptionId={`${about}-description`}
      >
        <Textarea
          id={about}
          rows={3}
          placeholder="What are you working on?"
          aria-describedby={`${about}-description`}
        />
      </FormField>
      <div className="ff-example-parts">
        <FormFieldLabel htmlFor={custom}>
          Public reference <span className="ff-optional">(optional)</span>
        </FormFieldLabel>
        <Input
          id={custom}
          defaultValue="DS-024"
          aria-describedby={`${custom}-description ${custom}-message`}
        />
        <div className="ff-support">
          <FormFieldDescription id={`${custom}-description`}>
            The same text parts can accompany a custom layout.
          </FormFieldDescription>
          <FormFieldFeedback id={`${custom}-message`} status="neutral">
            Visible to collaborators with access.
          </FormFieldFeedback>
        </div>
      </div>
    </div>
  );
}

export function Feedback(): ReactElement {
  const id = useId();
  const messages: Record<FieldStatus, string> = {
    neutral: 'You can change this later.',
    info: 'Only people with the link can find this space.',
    success: 'This address is available.',
    warning: 'Changing this address may break existing links.',
    danger: 'Use lowercase letters, numbers, and hyphens.',
  };
  return (
    <div className="ff-example-stack">
      <Note>
        Keep the label neutral and the instructions persistent. Text fields own their status glyph;
        groups place it beside the message. Statuses are pinned for comparison; editing these
        examples does not run validation. Try the live validation section for correction.
      </Note>
      {(['neutral', 'info', 'success', 'warning', 'danger'] as const).map((status) => (
        <div className="ff-example-study" key={status}>
          <p className="ff-example-kicker">{status}</p>
          <TextField
            status={status}
            label="Space address"
            defaultValue={status === 'danger' ? 'Design Library!' : 'design-library'}
            description="This becomes part of the shared URL."
            message={messages[status]}
          />
          <FormField
            label="Publishing checks"
            target="group"
            labelId={`${id}-${status}-label`}
            description="Checks run before each publication."
            descriptionId={`${id}-${status}-description`}
            status={status}
            messageId={`${id}-${status}-message`}
            message={
              {
                neutral: 'You can change this later.',
                info: 'These checks apply to every document.',
                success: 'All required checks are enabled.',
                warning: 'Some documents may need a manual review.',
                danger: 'Select at least one publishing check.',
              }[status]
            }
          >
            <CheckboxGroup
              aria-labelledby={`${id}-${status}-label`}
              aria-describedby={`${id}-${status}-description ${id}-${status}-message`}
              aria-invalid={status === 'danger' || undefined}
              status={status === 'danger' ? 'danger' : 'neutral'}
            >
              <Checkbox label="Check shared links" defaultChecked={status === 'success'} />
            </CheckboxGroup>
          </FormField>
        </div>
      ))}
      <div className="ff-example-fallbacks">
        <p className="ff-example-kicker">Fallback labels · no custom message</p>
        {(['info', 'success', 'warning', 'danger'] as const).map((status) => (
          <FormFieldFeedback key={status} status={status} />
        ))}
      </div>
    </div>
  );
}

export function Groups(): ReactElement {
  const id = useId();
  return (
    <div className="ff-example-stack">
      <Note>
        A group heading names the set and never toggles its first option. Each option keeps its own
        label; a group rule has one message. Validation is pinned here; use the live validation
        section to try correction.
      </Note>
      {(['s', 'm', 'l'] as const).map((size) => (
        <div className="ff-example-study" key={size}>
          <p className="ff-example-kicker">{size.toUpperCase()} · first-row alignment</p>
          <FormField
            size={size}
            orientation="horizontal"
            target="group"
            label="Send updates"
            labelId={`${id}-${size}-label`}
            description="Choose at least one way to receive updates."
            descriptionId={`${id}-${size}-description`}
            message="Select a delivery method."
            messageId={`${id}-${size}-message`}
            status="danger"
            required
          >
            <CheckboxGroup
              size={size}
              status="danger"
              aria-labelledby={`${id}-${size}-label`}
              aria-describedby={`${id}-${size}-description ${id}-${size}-message`}
              aria-invalid="true"
            >
              <Checkbox label="Email digest" />
              <Checkbox
                label="In-app notifications"
                description="Quiet updates inside your workspace."
              />
            </CheckboxGroup>
          </FormField>
        </div>
      ))}
      <FormField
        orientation="horizontal"
        target="group"
        label="Default access"
        labelId={`${id}-radio-label`}
        description="Applies to newly shared documents."
        descriptionId={`${id}-radio-description`}
      >
        <RadioGroup
          name={`${id}-access`}
          defaultValue="read"
          aria-labelledby={`${id}-radio-label`}
          aria-describedby={`${id}-radio-description`}
        >
          <Radio value="read" label="Can view" />
          <Radio value="edit" label="Can edit" description="Includes publishing changes." />
        </RadioGroup>
      </FormField>
      <FormField
        orientation="horizontal"
        target="group"
        label="Notifications"
        labelId={`${id}-switch-label`}
        description="Each setting takes effect independently."
        descriptionId={`${id}-switch-description`}
      >
        <SwitchGroup
          aria-labelledby={`${id}-switch-label`}
          aria-describedby={`${id}-switch-description`}
        >
          <Switch label="Mentions" defaultChecked />
          <Switch label="Weekly summary" />
        </SwitchGroup>
      </FormField>
      <FormField
        orientation="horizontal"
        target="group"
        label="Include in search"
        labelAlign="start"
        labelId={`${id}-cards-label`}
        description="Select the sources people can discover."
        descriptionId={`${id}-cards-description`}
      >
        <div
          className="ff-example-card-stack"
          role="group"
          aria-labelledby={`${id}-cards-label`}
          aria-describedby={`${id}-cards-description`}
        >
          <CheckboxCard
            label="Published documents"
            description="Reviewed and ready to share."
            defaultChecked
          />
          <CheckboxCard label="Working drafts" description="Still open for feedback." />
        </div>
      </FormField>
    </div>
  );
}

export function Availability(): ReactElement {
  return (
    <div className="ff-example-stack">
      <Note>
        Read-only values stay selectable. Disabled fields keep a readable reason. Checking does not
        lock editing or change the label hierarchy.
      </Note>
      <TextField
        label="Directory name"
        readOnly
        defaultValue="Design library"
        description="Managed by your organization. Contact an administrator to change it."
      />
      <TextField
        label="Verified domain"
        readOnly
        defaultValue="example.com"
        status="success"
        message="Domain ownership verified."
      />
      <TextField
        label="Custom domain"
        disabled
        placeholder="Available on a team plan"
        description="Upgrade your plan to connect a custom domain."
        status="danger"
        message="This stale validation is intentionally suppressed."
      />
      <TextField
        label="Space address"
        loading
        defaultValue="design-library"
        description="Use lowercase letters, numbers, and hyphens."
        message="Checking availability…"
      />
      <TextField
        label="Reserved address"
        loading
        readOnly
        defaultValue="design-library"
        description="The address stays readable while the reservation completes."
        message="Reserving address…"
      />
      <div className="ff-example-study">
        <p className="ff-example-kicker">
          Click to edit or use Tab to compare the keyboard outline
        </p>
        <TextField label="Pointer editing" defaultValue="design-library" />
        <TextField
          label="Keyboard editing"
          status="danger"
          message="Use an address without spaces."
          defaultValue="design library"
        />
      </div>
    </div>
  );
}

export function LiveValidation(): ReactElement {
  const id = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [channels, setChannels] = useState<string[]>([]);
  const [errors, setErrors] = useState({ email: false, channels: false });
  const [saved, setSaved] = useState(false);
  const [reserve, setReserve] = useState(false);
  return (
    <div className="ff-example-stack">
      <Note>
        Try an empty submission, then correct each field. Instructions stay in place. The first
        invalid target receives focus; editing clears its stale result.
      </Note>
      <Checkbox
        size="s"
        checked={reserve}
        onCheckedChange={setReserve}
        label="Reserve one line for each message"
      />
      <form
        className="ff-example-stack"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const next = {
            email: !emailRef.current?.validity.valid,
            channels: channels.length === 0,
          };
          setErrors(next);
          setSaved(!next.email && !next.channels);
          if (next.email) {
            emailRef.current?.focus();
          } else if (next.channels) {
            groupRef.current?.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus();
          }
        }}
        onReset={() => {
          setEmail('');
          setChannels([]);
          setErrors({ email: false, channels: false });
          setSaved(false);
        }}
      >
        <FormField
          label="Delivery email"
          htmlFor={`${id}-email`}
          required
          description="Use an address you can receive messages at."
          descriptionId={`${id}-email-description`}
          message={
            errors.email
              ? email.trim()
                ? 'Enter an email address, such as name@example.com.'
                : 'Enter your delivery email.'
              : undefined
          }
          messageId={errors.email ? `${id}-email-message` : undefined}
          status={errors.email ? 'danger' : 'neutral'}
          feedbackIcon={false}
          reserveMessage={reserve}
        >
          <Input
            ref={emailRef}
            id={`${id}-email`}
            name="email"
            type="email"
            required
            value={email}
            placeholder="name@example.com"
            status={errors.email ? 'danger' : 'neutral'}
            aria-describedby={`${id}-email-description${errors.email ? ` ${id}-email-message` : ''}`}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((current) => ({ ...current, email: false }));
              setSaved(false);
            }}
          />
        </FormField>
        <FormField
          target="group"
          label="Delivery methods"
          labelId={`${id}-channels-label`}
          required
          description="Choose at least one. You can use both."
          descriptionId={`${id}-channels-description`}
          status={errors.channels ? 'danger' : 'neutral'}
          message={errors.channels ? 'Select at least one delivery method.' : undefined}
          messageId={errors.channels ? `${id}-channels-message` : undefined}
          reserveMessage={reserve}
        >
          <div ref={groupRef}>
            <CheckboxGroup
              size="m"
              name={`${id}-channels`}
              value={channels}
              onValueChange={(value) => {
                setChannels(value);
                setErrors((current) => ({ ...current, channels: false }));
                setSaved(false);
              }}
              status={errors.channels ? 'danger' : 'neutral'}
              aria-labelledby={`${id}-channels-label`}
              aria-invalid={errors.channels || undefined}
              aria-describedby={`${id}-channels-description${errors.channels ? ` ${id}-channels-message` : ''}`}
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
        <p className="ff-example-result" role="status">
          {saved ? 'Preferences saved for this preview.' : ''}
        </p>
      </form>
    </div>
  );
}

export function Overflow(): ReactElement {
  const id = useId();
  const [help, setHelp] = useState(false);
  return (
    <div className="ff-example-stack">
      <Note>
        Long labels and supporting text wrap without ellipsis. Structured addresses keep their own
        left-to-right direction inside a right-to-left interface.
      </Note>
      <FormField
        label="Invitation access code"
        htmlFor={`${id}-code`}
        labelAction={
          <Link
            href="#invitation-code-help"
            onClick={(event) => {
              event.preventDefault();
              setHelp(!help);
            }}
            aria-expanded={help}
            aria-controls={`${id}-code-help`}
          >
            Where can I find my invitation access code?
          </Link>
        }
        description={
          <>
            <p>Enter the code from your invitation email.</p>
            <p id={`${id}-code-help`} hidden={!help}>
              Look below the invitation link, or ask the sender for a new code.
            </p>
          </>
        }
        descriptionId={`${id}-code-description`}
      >
        <Input
          id={`${id}-code`}
          defaultValue="AC24-LIVE"
          aria-describedby={`${id}-code-description`}
        />
      </FormField>
      <TextField
        orientation="horizontal"
        label="A longer descriptive label for the public documentation address"
        required
        defaultValue="documentation-and-reference-library"
        description={
          <>
            Use an address that describes the collection.{' '}
            <Link href="https://example.com/help/addresses" target="_blank">
              Address guidelines
            </Link>
          </>
        }
        status="danger"
        message="This address is already used. Add a short team or project name to make it unique."
      />
      <div dir="rtl">
        <TextField
          orientation="horizontal"
          label="Workspace address · RTL"
          required
          dir="ltr"
          defaultValue="https://example.com/design-library"
          description="The address reads left to right within this right-to-left layout."
        />
      </div>
      <FormField
        orientation="horizontal"
        target="group"
        label="Review window"
        labelAlign="start"
        labelId={`${id}-label`}
        description="Use local time. The end must be later than the start."
        descriptionId={`${id}-description`}
        status="danger"
        message="Choose an end time later than 09:00."
        messageId={`${id}-message`}
        feedbackIcon={false}
      >
        <div
          className="ff-example-pair"
          role="group"
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-description`}
        >
          <FormField label="Start" htmlFor={`${id}-start`}>
            <input
              className="ff-example-time"
              id={`${id}-start`}
              type="time"
              defaultValue="09:00"
            />
          </FormField>
          <FormField label="End" htmlFor={`${id}-end`}>
            <input
              className="ff-example-time"
              id={`${id}-end`}
              type="time"
              defaultValue="08:30"
              aria-invalid="true"
              aria-describedby={`${id}-message`}
            />
          </FormField>
        </div>
      </FormField>
      <div className="ff-example-narrow">
        <TextField
          orientation="horizontal"
          label="Address inside a narrow container"
          defaultValue="design-library"
          description="A narrow card stacks its label even on a wide screen."
        />
      </div>
      <FormField
        label="Source identifier"
        htmlFor={`${id}-long`}
        description="references/design-system/component-specifications/field-layout-and-validation-guidelines-without-any-short-name"
        descriptionId={`${id}-long-description`}
      >
        <Input
          id={`${id}-long`}
          defaultValue="references/design-system/component-specifications/form-field"
          aria-describedby={`${id}-long-description`}
        />
      </FormField>
    </div>
  );
}

export function Overlay(): ReactElement {
  const id = useId();
  const [danger, setDanger] = useState(true);
  return (
    <PopoverContent
      className="ff-example-overlay"
      role="group"
      aria-labelledby={`${id}-title`}
      style={{ '--popover-width': '38rem' } as CSSProperties}
    >
      <p className="ff-example-title" id={`${id}-title`}>
        Sharing defaults
      </p>
      <Note>
        Labels and messages stay on the floating surface. Only the outer panel owns material and
        shadow.
      </Note>
      <TextField
        label="Reply-to email"
        defaultValue="team@"
        description="Replies to shared updates go to this address."
        status={danger ? 'danger' : 'neutral'}
        message={danger ? 'Enter the full address, such as team@example.com.' : undefined}
      />
      <FormField
        target="group"
        label="Available to"
        labelId={`${id}-label`}
        description="Choose who can discover shared updates."
        descriptionId={`${id}-description`}
      >
        <CheckboxGroup aria-labelledby={`${id}-label`} aria-describedby={`${id}-description`}>
          <Checkbox label="Workspace members" defaultChecked />
          <Checkbox label="Invited guests" />
        </CheckboxGroup>
      </FormField>
      <Button variant="secondary" tone="neutral" onClick={() => setDanger(!danger)}>
        {danger ? 'Hide validation feedback' : 'Show validation feedback'}
      </Button>
    </PopoverContent>
  );
}
