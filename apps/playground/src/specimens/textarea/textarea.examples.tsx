import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { FormField, Stack, Text, Textarea } from '@docouno/unica';
import type { TextareaProps } from '@docouno/unica';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { PreviewProps } from '../../workbench/types.js';
import { textareaFeedback } from './textarea.feedback.js';
import { ExportLog } from './export-log.js';
import { ReviewNote } from './review-note.js';
import './textarea.examples.css';

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
  const status = props.status ?? 'neutral';
  const fallback =
    props.wrap?.toLowerCase() === 'off' && status !== 'neutral' ? textareaFeedback[status] : '';
  return (
    <FormField
      controlId={id}
      label={label ? <bdi>{label}</bdi> : undefined}
      className="textarea-demo-field"
      data-width={props.width}
      size={props.size}
      status={status}
      statusLabel={fallback}
      disabled={props.disabled}
      required={props.required}
      description={description ? <bdi>{description}</bdi> : undefined}
      message={message ? <bdi>{message}</bdi> : fallback ? undefined : ''}
      counter={
        counter === undefined ? undefined : (
          <Text
            as="span"
            size="caption-l"
            color={props.disabled || status === 'neutral' ? 'secondary' : status}
          >
            {counter}
          </Text>
        )
      }
    >
      <Textarea dir="auto" {...props} aria-describedby={describedBy} />
    </FormField>
  );
}

const sizes: readonly NonNullable<TextareaProps['size']>[] = ['s', 'm', 'l'];
const variants: readonly NonNullable<TextareaProps['variant']>[] = ['default', 'ghost'];
const paragraph =
  'Keep the first release focused on the essential reading experience. Save advanced editing tools for a later iteration.';
const longText =
  'Start with the reader’s goal.\n\nExplain what changed, why it matters, and what to do next. Keep each paragraph focused on a single idea.\n\nInclude enough context for someone arriving here for the first time. Avoid repeating details that already live in the linked reference.\n\nBefore publishing, check the examples on a narrow screen and ask a colleague to read the summary aloud.';

export function TextareaRoles({ ctx: { subject } }: PreviewProps): ReactElement {
  return (
    <div className="textarea-demo-stack">
      {sizes.map((size) => (
        <div className="textarea-demo-grid" key={size}>
          {variants.map((variant) => (
            <LabeledTextarea
              key={variant}
              {...subject}
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

export function TextareaInteraction({ ctx: { subject } }: PreviewProps): ReactElement {
  return (
    <div className="textarea-demo-grid">
      {variants.map((variant) => (
        <LabeledTextarea
          key={variant}
          {...subject}
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
  sample: string;
  label: string;
  message: string;
}[] = [
  {
    status: 'info',
    label: 'Shared note',
    sample: 'The maintenance window starts Friday at 09:00.',
    message: 'Everyone with access to this page can read your note.',
  },
  {
    status: 'success',
    label: 'Summary checked',
    sample: 'Open the updated guide and send the review link to the support team.',
    message: 'The summary includes the context readers need.',
  },
  {
    status: 'warning',
    label: 'Sensitive detail',
    sample: 'Contact the reviewer through their personal address before publication.',
    message: 'Remove personal details before sharing publicly.',
  },
  {
    status: 'danger',
    label: 'Missing next step',
    sample: 'The data export is complete.',
    message: 'Describe what the reader should do next.',
  },
];

export function TextareaFeedback({ ctx: { subject } }: PreviewProps): ReactElement {
  return (
    <div className="textarea-demo-grid">
      {feedback.map(({ status, label, message, sample }) => (
        <LabeledTextarea
          {...subject}
          key={status}
          status={status}
          label={label}
          message={message}
          defaultValue={sample}
          rows={3}
        />
      ))}
      <LabeledTextarea
        {...subject}
        label="Default · error"
        status="danger"
        message="Add a concrete next step."
        defaultValue="The plan needs another review."
        rows={2}
      />
      <LabeledTextarea
        {...subject}
        label="Ghost · warning"
        variant="ghost"
        status="warning"
        message="Check the recipient before sharing."
        defaultValue="Include the support team in the next review."
        rows={2}
      />
      <LabeledTextarea
        {...subject}
        label="Ghost · error"
        variant="ghost"
        status="danger"
        message="Add context before saving."
        placeholder="Explain the change…"
        rows={2}
      />
      <LabeledTextarea
        {...subject}
        label="Error · concise feedback"
        status="danger"
        message="Keep the next step specific."
        defaultValue="Follow up later."
        rows={2}
      />
    </div>
  );
}

export function TextareaAvailability({ ctx: { subject } }: PreviewProps): ReactElement {
  return (
    <div className="textarea-demo-grid">
      <LabeledTextarea
        {...subject}
        label="Read-only reference"
        readOnly
        defaultValue={longText}
        rows={3}
        description="Managed by the document owner."
      />
      <LabeledTextarea
        {...subject}
        label="Read-only · short reference"
        readOnly
        defaultValue={paragraph}
        rows={3}
      />
      <LabeledTextarea
        {...subject}
        label="Read-only · warning"
        readOnly
        status="warning"
        defaultValue={paragraph}
        message="This archived summary may be out of date."
        rows={3}
      />
      <LabeledTextarea
        {...subject}
        label="Ghost · read-only"
        variant="ghost"
        readOnly
        defaultValue={paragraph}
        rows={3}
        description="Published with the latest release."
      />
      <LabeledTextarea
        {...subject}
        label="Disabled · filled"
        disabled
        defaultValue={paragraph}
        rows={3}
        description="Editing becomes available after you join the project."
      />
      <LabeledTextarea
        {...subject}
        label="Ghost · disabled"
        variant="ghost"
        disabled
        placeholder="No note available"
        rows={3}
        description="Notes are unavailable for this item."
      />
      <LabeledTextarea
        {...subject}
        label="Disabled · status suppressed"
        disabled
        status="danger"
        defaultValue="A previous draft is retained."
        description="This section is unavailable while the request is closed."
        rows={2}
      />
      <LabeledTextarea
        {...subject}
        label="Read-only · autosize"
        readOnly
        autosize
        minRows={2}
        maxRows={4}
        defaultValue={longText}
        description="Latest revision from the release archive."
      />
    </div>
  );
}

export function TextareaHeights({ ctx: { subject } }: PreviewProps): ReactElement {
  return (
    <div className="textarea-demo-grid">
      <LabeledTextarea {...subject} label="Manual height" rows={3} defaultValue={longText} />
      <LabeledTextarea
        {...subject}
        label="Fixed height"
        resize="none"
        rows={3}
        defaultValue={longText}
      />
      <LabeledTextarea
        {...subject}
        label="Autosize · empty"
        autosize
        minRows={2}
        maxRows={5}
        placeholder="Start a note…"
      />
      <LabeledTextarea
        {...subject}
        label="Autosize · between limits"
        autosize
        minRows={2}
        maxRows={5}
        defaultValue={'First point.\nSecond point.\nA final thought.'}
      />
      <LabeledTextarea
        {...subject}
        label="Autosize · at the limit"
        autosize
        minRows={2}
        maxRows={5}
        defaultValue={'One\nTwo\nThree\nFour\nFive'}
      />
      <LabeledTextarea
        {...subject}
        label="Autosize · overflow & status"
        autosize
        minRows={2}
        maxRows={5}
        defaultValue={longText}
        status="warning"
        message="Review the final paragraph before publishing."
      />
      <LabeledTextarea
        {...subject}
        label="Ghost · growing note"
        variant="ghost"
        autosize
        minRows={2}
        maxRows={5}
        defaultValue={paragraph}
      />
      <LabeledTextarea
        {...subject}
        label="Autosize · open-ended"
        autosize
        minRows={2}
        defaultValue={'A short opening.\n\nRoom for a second thought.'}
      />
    </div>
  );
}

const wordCount = (text: string): number => text.trim().split(/\s+/u).filter(Boolean).length;

export function TextareaFooter({ ctx: { subject } }: PreviewProps): ReactElement {
  const [summary, setSummary] = useState('Share the change with the support team.');
  const [short, setShort] = useState('A concise summary.');
  const hasGuide = /https?:\/\/\S+/iu.test(summary);
  return (
    <div className="textarea-demo-grid">
      <LabeledTextarea
        {...subject}
        label="Description and feedback"
        required
        value={summary}
        onChange={(event) => setSummary(event.currentTarget.value)}
        description="Visible in the activity feed."
        status={hasGuide ? 'success' : 'warning'}
        message={
          hasGuide
            ? 'A guide link is included.'
            : 'Add a link to the updated guide so readers can find it.'
        }
        counter={<bdi>{wordCount(summary)} / 40 words</bdi>}
        rows={2}
      />
      <LabeledTextarea
        {...subject}
        label="Counter without a message"
        value={short}
        rows={2}
        onChange={(event) => setShort(event.currentTarget.value)}
        counter={
          <bdi>
            {
              Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(short))
                .length
            }{' '}
            / 240 characters
          </bdi>
        }
      />
      <LabeledTextarea
        {...subject}
        label="Helpful context, no counter"
        defaultValue={paragraph}
        rows={3}
        description="Describe the result and who it is for. There is no length limit."
      />
    </div>
  );
}

export function TextareaLive({ ctx }: PreviewProps): ReactElement {
  const [load, setLoad] = useState(0);
  const [hardValue, setHardValue] = useState('');
  useStoryAction(ctx, (action) => {
    if (action === 'load-long') {
      setLoad((previous) => previous + 1);
    }
  });
  return (
    <div className="textarea-demo-grid">
      <ReviewNote
        loadedDraft={load ? { sequence: load, text: longText } : undefined}
        label="Soft limit · live draft"
        busy={ctx.story?.controls.busy === true}
        fieldProps={ctx.subject}
      />
      <LabeledTextarea
        label="Native limit · short note"
        value={hardValue}
        maxLength={80}
        rows={3}
        onChange={(event) => setHardValue(event.currentTarget.value)}
        description="The native limit is 80 UTF-16 units. A family emoji can use several units."
        counter={<bdi>{hardValue.length} / 80 units</bdi>}
      />
    </div>
  );
}

export function TextareaOverflow({ ctx: { subject } }: PreviewProps): ReactElement {
  const [summary, setSummary] = useState(longText);
  const [rtl, setRtl] = useState('تقرير البحث 42\nتم التحقق من الملف');
  const words = wordCount(summary);
  const lines = rtl.split('\n').length;
  return (
    <div className="textarea-demo-grid">
      <LabeledTextarea
        label="A longer label that explains what readers should understand before they continue"
        value={summary}
        onChange={(event) => setSummary(event.currentTarget.value)}
        status={words > 60 ? 'danger' : 'neutral'}
        rows={3}
        description="Published alongside the review request."
        message={
          words > 60
            ? 'Shorten the note to 60 words. See docs.example.org/guides/reviewing-a-long-running-project-with-multiple-contributors'
            : 'The note fits the 60-word limit.'
        }
        counter={<bdi>{words} / 60 words</bdi>}
      />
      <LabeledTextarea
        label="Long uninterrupted reference"
        rows={3}
        defaultValue="https://docs.example.org/reference/averylongunbrokenidentifierthatmustremainreadablewithoutstretchingthelayoutorcoveringthestatusicon"
        status="info"
        message="Source document for this release."
      />
      <ExportLog fieldProps={subject} />
      <LabeledTextarea
        label="Explicit RTL field"
        className="textarea-demo-arabic"
        lang="ar"
        dir="rtl"
        rows={3}
        status="info"
        value={rtl}
        onChange={(event) => setRtl(event.currentTarget.value)}
        message="Included in the right-to-left edition."
        counter={
          <bdi>
            {lines} {lines === 1 ? 'line' : 'lines'}
          </bdi>
        }
      />
      <LabeledTextarea
        label="Auto width · bounded field"
        width="auto"
        defaultValue={paragraph}
        description="Appears in the review sidebar."
        rows={3}
      />
      <LabeledTextarea
        aria-label="Additional note"
        placeholder="Add a note…"
        rows={3}
        description="Add any context your reviewer should see."
      />
    </div>
  );
}

export function TextareaSurfaces({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack
      gap={16}
      data-surface={ctx.surface}
      data-plate={ctx.surface}
      className={
        ctx.surface === 'overlay'
          ? 'textarea-demo-plate unica-overlay-surface'
          : 'textarea-demo-plate'
      }
    >
      <LabeledTextarea
        {...ctx.subject}
        label="Summary"
        defaultValue="Give every reader a clear next step."
        rows={3}
        description="Shown in the release overview."
      />
      <LabeledTextarea
        {...ctx.subject}
        label="Inline note"
        variant="ghost"
        defaultValue="Keep the context close."
        rows={2}
      />
    </Stack>
  );
}
