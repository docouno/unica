import { useId, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Textarea, VisuallyHidden } from '@docouno/unica';
import type { TextareaProps } from '@docouno/unica';
import { Button } from '../../prototypes/button/button.proto.js';
import type { PreviewContext } from '../../workbench/types.js';
import { textareaFeedback } from './textarea.feedback.js';
import './textarea.examples.css';

interface ExampleProps {
  readonly subject: PreviewContext['subject'];
}

type LabeledTextareaProps = TextareaProps & {
  readonly label?: string;
  readonly description?: string;
  readonly message?: string;
  readonly counter?: ReactNode;
};

export function LabeledTextarea({
  id,
  label,
  description,
  message,
  counter,
  'aria-describedby': describedBy,
  ...props
}: LabeledTextareaProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const status = props.status ?? 'neutral';
  const statusFeedback =
    props.wrap?.toLowerCase() === 'off' && status !== 'neutral' && !props.disabled
      ? textareaFeedback[status]
      : undefined;
  const Icon = statusFeedback?.Icon;
  const feedback = message ?? statusFeedback?.label;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const messageId = feedback ? `${inputId}-message` : undefined;
  const counterId = counter ? `${inputId}-counter` : undefined;
  const descriptionIds = [
    ...new Set(
      [describedBy, descriptionId, messageId, counterId].flatMap((ids) =>
        ids ? ids.trim().split(/\s+/) : [],
      ),
    ),
  ].join(' ');

  return (
    <div className="textarea-demo-field" data-width={props.width}>
      {label && (
        <label className="textarea-demo-label" htmlFor={inputId}>
          {label}
          {props.required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      <Textarea {...props} id={inputId} aria-describedby={descriptionIds || undefined} />
      {(description || feedback || counter) && (
        <div className="textarea-demo-support">
          {description && (
            <p className="textarea-demo-copy" id={descriptionId}>
              {description}
            </p>
          )}
          {(feedback || counter) && (
            <div className="textarea-demo-footer">
              {feedback && (
                <p
                  className="textarea-demo-feedback"
                  id={messageId}
                  data-status={props.disabled ? 'neutral' : status}
                >
                  {Icon && <Icon aria-hidden="true" size="1em" />}
                  <span>{feedback}</span>
                </p>
              )}
              {counter && (
                <span className="textarea-demo-counter" id={counterId}>
                  {counter}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const sizes: readonly NonNullable<TextareaProps['size']>[] = ['s', 'm', 'l'];
const variants: readonly NonNullable<TextareaProps['variant']>[] = ['default', 'ghost'];
const paragraph =
  'Keep the first release focused on the essential reading experience. Save advanced editing tools for a later iteration.';
const longText =
  'Start with the reader’s goal.\n\nExplain what changed, why it matters, and what to do next. Keep each paragraph focused on a single idea.\n\nInclude enough context for someone arriving here for the first time. Avoid repeating details that already live in the linked reference.\n\nBefore publishing, check the examples on a narrow screen and ask a colleague to read the summary aloud.';

function TextareaRoles({ subject }: ExampleProps): ReactElement {
  return (
    <div className="textarea-demo-stack">
      {sizes.map((size) => (
        <div className="textarea-demo-grid" key={size}>
          {variants.map((variant) => (
            <LabeledTextarea
              key={variant}
              {...(size === 'm' && variant === 'default' ? subject : undefined)}
              size={size}
              variant={variant}
              label={`${size.toUpperCase()} · ${variant === 'default' ? 'Default' : 'Ghost'}`}
              rows={2}
              defaultValue={size === 'm' ? 'A clear note for the next reader.' : undefined}
              placeholder="Add a short description…"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function TextareaInteraction({ subject }: ExampleProps): ReactElement {
  return (
    <div className="textarea-demo-grid">
      {variants.map((variant) => (
        <LabeledTextarea
          key={variant}
          {...(variant === 'default' ? subject : undefined)}
          variant={variant}
          rows={2}
          label={variant === 'default' ? 'Default' : 'Ghost'}
          defaultValue="A clear starting point for the next conversation."
          resize="none"
        />
      ))}
    </div>
  );
}

const feedback: readonly {
  status: NonNullable<TextareaProps['status']>;
  label: string;
  message: string;
}[] = [
  {
    status: 'info',
    label: 'Shared note',
    message: 'Everyone with access to this page can read your note.',
  },
  {
    status: 'success',
    label: 'Summary checked',
    message: 'The summary includes the context readers need.',
  },
  {
    status: 'warning',
    label: 'Sensitive detail',
    message: 'Remove personal details before sharing publicly.',
  },
  {
    status: 'danger',
    label: 'Missing next step',
    message: 'Describe what the reader should do next.',
  },
];

function TextareaFeedback(): ReactElement {
  return (
    <div className="textarea-demo-grid">
      {feedback.map(({ status, label, message }) => (
        <LabeledTextarea
          key={status}
          status={status}
          label={label}
          message={message}
          defaultValue="Keep the release focused. Give readers one clear next step."
          rows={3}
        />
      ))}
      <LabeledTextarea
        label="Default · error"
        status="danger"
        message="Add a concrete next step."
        defaultValue="The plan needs another review."
        rows={2}
      />
      <LabeledTextarea
        label="Ghost · warning"
        variant="ghost"
        status="warning"
        message="Check the recipient before sharing."
        defaultValue="Include the support team in the next review."
        rows={2}
      />
      <LabeledTextarea
        label="Ghost · error"
        variant="ghost"
        status="danger"
        message="Add context before saving."
        placeholder="Explain the change…"
        rows={2}
      />
      <LabeledTextarea
        label="Error · concise feedback"
        status="danger"
        message="Keep the next step specific."
        defaultValue="Follow up later."
        rows={2}
      />
    </div>
  );
}

function TextareaAvailability(): ReactElement {
  return (
    <div className="textarea-demo-grid">
      <LabeledTextarea
        label="Read-only reference"
        readOnly
        defaultValue={longText}
        rows={3}
        description="Managed by the document owner. Select, copy, scroll, or enlarge to read."
      />
      <LabeledTextarea
        label="Read-only · short reference"
        readOnly
        defaultValue={paragraph}
        rows={3}
      />
      <LabeledTextarea
        label="Read-only · warning"
        readOnly
        status="warning"
        defaultValue={paragraph}
        message="This archived summary may be out of date."
        rows={3}
      />
      <LabeledTextarea
        label="Ghost · read-only"
        variant="ghost"
        readOnly
        defaultValue={paragraph}
        rows={3}
        description="The published description stays available for copying."
      />
      <LabeledTextarea
        label="Disabled · filled"
        disabled
        defaultValue={paragraph}
        rows={3}
        message="Editing becomes available after you join the project."
      />
      <LabeledTextarea
        label="Ghost · disabled"
        variant="ghost"
        disabled
        placeholder="No note available"
        rows={3}
        description="Notes are unavailable for this item."
      />
      <LabeledTextarea
        label="Disabled · status suppressed"
        disabled
        status="danger"
        defaultValue="A previous draft is retained."
        message="This section is unavailable while the request is closed."
        rows={2}
      />
      <LabeledTextarea
        label="Read-only · autosize"
        readOnly
        autosize
        minRows={2}
        maxRows={4}
        defaultValue={longText}
        description="Content growth remains active; editing does not."
      />
    </div>
  );
}

function TextareaHeights(): ReactElement {
  return (
    <div className="textarea-demo-grid">
      <LabeledTextarea
        label="Manual height"
        rows={3}
        defaultValue={longText}
        description="Drag the native corner to make room. Typing keeps your chosen height."
      />
      <LabeledTextarea
        label="Fixed height"
        resize="none"
        rows={3}
        defaultValue={longText}
        description="Three rows, then scroll. No resize grip."
      />
      <LabeledTextarea
        label="Autosize · empty"
        autosize
        minRows={2}
        maxRows={5}
        placeholder="Start a note…"
        description="Type or paste: grows from two to five rows, then scrolls."
      />
      <LabeledTextarea
        label="Autosize · between limits"
        autosize
        minRows={2}
        maxRows={5}
        defaultValue={'First point.\nSecond point.\nA final thought.'}
        description="Delete text to see the field shrink without animation."
      />
      <LabeledTextarea
        label="Autosize · at the limit"
        autosize
        minRows={2}
        maxRows={5}
        defaultValue={'One\nTwo\nThree\nFour\nFive'}
        description="Five lines fit without scrolling."
      />
      <LabeledTextarea
        label="Autosize · overflow & status"
        autosize
        minRows={2}
        maxRows={5}
        defaultValue={longText}
        status="warning"
        message="Review the final paragraph before publishing."
      />
      <LabeledTextarea
        label="Ghost · growing note"
        variant="ghost"
        autosize
        minRows={2}
        maxRows={5}
        defaultValue={paragraph}
        description="The baseline follows the content height."
      />
      <LabeledTextarea
        label="Autosize · open-ended"
        autosize
        minRows={2}
        defaultValue={'A short opening.\n\nRoom for a second thought.'}
        description="No height cap. Use in a page with room to grow, not a compact dialog."
      />
      <p className="textarea-demo-note textarea-demo-wide">
        Autosize uses native content sizing. Where unavailable, the field stays at its minimum row
        count and scrolls.
      </p>
    </div>
  );
}

function TextareaFooter(): ReactElement {
  return (
    <div className="textarea-demo-grid">
      <LabeledTextarea
        label="Description and feedback"
        required
        defaultValue="Share the change with the support team."
        description="Visible in the activity feed."
        status="warning"
        message="Add a link to the updated guide so readers can find it."
        counter={<bdi>8 / 40 words</bdi>}
        rows={2}
      />
      <LabeledTextarea
        label="Counter without a message"
        defaultValue="A concise summary."
        rows={2}
        counter={<bdi>18 / 240 characters</bdi>}
      />
      <LabeledTextarea
        label="Helpful context, no counter"
        defaultValue={paragraph}
        rows={3}
        description="Describe the result and who it is for. There is no length limit."
      />
    </div>
  );
}

function TextareaLive({ subject }: ExampleProps): ReactElement {
  const initial = 'A little context helps the next person pick up where you left off.';
  const [value, setValue] = useState(initial);
  const [checked, setChecked] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState('');
  const [hardValue, setHardValue] = useState('');
  const length = Array.from(
    new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(value),
  ).length;
  const over = length > 160;
  const warning = !over && length >= 144;
  const status: NonNullable<TextareaProps['status']> = over
    ? 'danger'
    : warning
      ? 'warning'
      : checked
        ? value.trim()
          ? 'success'
          : 'danger'
        : 'neutral';
  const message = over
    ? `Remove ${length - 160} characters before saving. Your full draft is kept.`
    : warning
      ? length === 160
        ? 'At the suggested length. The full note is retained.'
        : 'Almost at the suggested length. Keep the key idea.'
      : checked
        ? value.trim()
          ? 'The note is ready to share.'
          : 'Write a note before saving.'
        : 'Enter adds a new line. Escape keeps your draft.';
  return (
    <div className="textarea-demo-grid">
      <form
        className="textarea-demo-stack"
        aria-busy={busy || undefined}
        onSubmit={(event) => {
          event.preventDefault();
          const draft = new FormData(event.currentTarget).get('note');
          setSubmitted(typeof draft === 'string' ? draft : '');
        }}
        onReset={() => {
          setValue(initial);
          setChecked(false);
          setSubmitted('');
          setAnnouncement('');
        }}
      >
        <LabeledTextarea
          {...subject}
          label="Soft limit · live draft"
          autosize
          minRows={3}
          maxRows={6}
          name="note"
          value={value}
          onChange={(event) => {
            setValue(event.currentTarget.value);
            setChecked(false);
          }}
          status={status}
          description="Aim for 160 characters. Pasting a longer draft is allowed."
          message={message}
          counter={
            <bdi className={over ? 'textarea-demo-over-limit' : undefined}>
              {length} / 160 characters
            </bdi>
          }
        />
        <div className="textarea-demo-actions">
          <Button
            size="s"
            variant="secondary"
            tone="neutral"
            onClick={() => {
              setChecked(true);
              setAnnouncement(
                over
                  ? message
                  : value.trim()
                    ? 'The note is ready to share.'
                    : 'Write a note before saving.',
              );
            }}
          >
            Check note
          </Button>
          <Button
            size="s"
            variant="ghost"
            tone="neutral"
            onClick={() => {
              setValue(longText);
              setChecked(false);
            }}
          >
            Load long draft
          </Button>
          <Button size="s" type="submit" loading={busy}>
            Submit draft
          </Button>
          <Button size="s" variant="secondary" tone="neutral" type="reset">
            Reset draft
          </Button>
          <label>
            <input
              type="checkbox"
              checked={busy}
              onChange={(event) => setBusy(event.currentTarget.checked)}
            />{' '}
            Show saving state
          </label>
        </div>
        <VisuallyHidden role="status">{announcement}</VisuallyHidden>
        {submitted && <p className="textarea-demo-note">Submitted draft: {submitted}</p>}
      </form>
      <div className="textarea-demo-stack">
        <LabeledTextarea
          label="Native limit · short note"
          value={hardValue}
          maxLength={80}
          rows={3}
          onChange={(event) => setHardValue(event.currentTarget.value)}
          description="Native maximum: 80 UTF-16 units. Try a family emoji 👨‍👩‍👧 in both fields and compare the counters."
          counter={<bdi>{hardValue.length} / 80 units</bdi>}
        />
      </div>
    </div>
  );
}

function TextareaOverflow({ subject }: ExampleProps): ReactElement {
  return (
    <div className="textarea-demo-grid">
      <LabeledTextarea
        label="A longer label that explains what readers should understand before they continue"
        defaultValue={longText}
        status="danger"
        rows={3}
        description="Keep supporting details readable even when the available space is narrow."
        message="Explain the final step and include the full reference: docs.example.org/guides/reviewing-a-long-running-project-with-multiple-contributors"
        counter={<bdi>72 / 60 words</bdi>}
      />
      <LabeledTextarea
        label="Long uninterrupted reference"
        rows={3}
        defaultValue="https://docs.example.org/reference/averylongunbrokenidentifierthatmustremainreadablewithoutstretchingthelayoutorcoveringthestatusicon"
        status="info"
        message="Long tokens wrap inside the text viewport."
      />
      <LabeledTextarea
        {...subject}
        label="Preserved log lines"
        wrap="off"
        dir="ltr"
        status="info"
        rows={3}
        defaultValue={
          '09:41:02  Export completed with all source links preserved and every attachment checked successfully.\n09:41:03  Archive checksum verified.\n09:41:04  Ready for download.'
        }
        message="Log lines keep their full width. Feedback stays below the scrolling viewport."
      />
      <LabeledTextarea
        label="Explicit RTL field"
        dir="rtl"
        rows={3}
        status="info"
        defaultValue={'Review note 42\nPlease add the next step.'}
        message="The status, native rail, and resize corner follow the field direction."
        counter={<bdi>2 lines</bdi>}
      />
      <LabeledTextarea
        label="Auto width · bounded field"
        width="auto"
        defaultValue={paragraph}
        description="A 28rem reference width, capped by its container."
        rows={3}
      />
      <LabeledTextarea
        aria-label="Additional note"
        placeholder="Add a note…"
        rows={3}
        description="No visible label in this isolated naming example; the control has an explicit accessible name."
      />
    </div>
  );
}

export type TextareaExampleName =
  | 'roles'
  | 'interaction'
  | 'feedback'
  | 'availability'
  | 'height'
  | 'footer'
  | 'live'
  | 'overflow'
  | 'surfaces';

const examples: Record<TextareaExampleName, (props: ExampleProps) => ReactElement> = {
  roles: TextareaRoles,
  interaction: TextareaInteraction,
  feedback: TextareaFeedback,
  availability: TextareaAvailability,
  height: TextareaHeights,
  footer: TextareaFooter,
  live: TextareaLive,
  overflow: TextareaOverflow,
  surfaces: TextareaSurfaces,
};

export function TextareaExamples({
  section,
  subject,
}: ExampleProps & { readonly section: TextareaExampleName }): ReactElement {
  const Example = examples[section];
  return <Example subject={subject} />;
}

function TextareaSurfaces(): ReactElement {
  return (
    <div className="textarea-demo-grid">
      {(['base', 'overlay'] as const).map((surface) => (
        <div
          className="textarea-demo-stage"
          data-surface="base"
          data-underlay={surface === 'overlay' || undefined}
          key={surface}
        >
          <div className="textarea-demo-plate" data-surface={surface} data-plate={surface}>
            <p className="textarea-demo-eyebrow">
              {surface === 'base' ? 'Page surface' : 'Floating surface'}
            </p>
            <LabeledTextarea
              label="Summary"
              defaultValue="Give every reader a clear next step."
              rows={3}
              description="A quiet field with room for thought."
            />
            <LabeledTextarea
              label="Inline note"
              variant="ghost"
              defaultValue="Keep the context close."
              rows={2}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
