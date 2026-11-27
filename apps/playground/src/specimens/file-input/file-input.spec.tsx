import { FileInput, FormField } from '@docouno/unica';
import { intakeProps } from './intake-props.js';
import {
  FileAvailability,
  FileFeedback,
  FileInteraction,
  FileLive,
  FileOverflow,
  FileRoles,
  FileSurfaces,
  MultipleField,
} from './file-input.examples.js';
import {
  size,
  variant,
  status,
  disabled,
  readOnly,
  loading,
  clearable,
  toggle,
  required,
} from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { previewProps, previewText } from '../preview-code.js';
import { AttachmentSubmission } from './attachment-submission.js';
import submissionSource from './attachment-submission.tsx?raw';
import { TextAttachment } from './text-attachment.js';
import textSource from './text-attachment.tsx?raw';

const messages = {
  neutral: '',
  info: 'You can replace the attachment before submitting.',
  success: 'The attachment check passed.',
  warning: 'Review the attachment before submitting.',
  danger: 'An attachment is missing or needs replacement.',
};

export default defineComponent({
  id: 'file-input',
  title: 'FileInput',
  category: 'Forms',
  status: 'UI',
  summary: 'Choose, replace, and remove local attachments in a compact form field.',
  componentName: 'FileInput',
  form: 'owned',
  props: {
    ...intakeProps,
    size,
    variant,
    status: {
      ...status,
      description: 'Field feedback tone. This example supplies a pinned message for each tone.',
    },
    disabled,
    readOnly,
    loading,
    required,
    showSize: toggle('Content', 'Display the selected size next to the filename or count.'),
    clearable: { ...clearable, default: true },
    multiple: toggle('Interaction', 'Append accepted files across successive selections.'),
  },
  constraints: [
    {
      kind: 'ignored',
      when: { multiple: true },
      affects: ['clearable'],
      reason: 'Individual removal in multiple selection belongs to a separate file list.',
    },
    {
      kind: 'precedence',
      when: { disabled: true },
      affects: ['readOnly', 'loading', 'status'],
      reason: 'Disabled intake is unavailable and suppresses validation and pending feedback.',
    },
    {
      kind: 'ignored',
      when: { readOnly: true },
      affects: ['loading', 'required', 'clearable'],
      reason:
        'The read-only view keeps the existing files available without mutation or required validation.',
    },
  ],
  render: withOverlaySurface(({ values: { maxSize, maxFiles, ...values }, ctx }) => {
    const message = messages[values.status];
    return (
      <form {...ctx.form} data-file-intake-sample="" className="file-demo-field file-demo-arabic">
        <FormField
          label="Attach evidence"
          controlId={ctx.id}
          target={values.readOnly && !values.disabled ? 'group' : 'control'}
          status={values.status}
          disabled={values.disabled}
          required={values.required}
          message={message && <bdi>{message}</bdi>}
          feedbackIcon={false}
        >
          <FileInput
            {...values}
            {...ctx.subject}
            name="attachment"
            maxSize={maxSize < 0 ? undefined : maxSize}
            maxFiles={maxFiles < 0 ? undefined : maxFiles}
            onValueChange={(files) => ctx.action('onValueChange')(files.map((file) => file.name))}
            onIntake={(result) =>
              ctx.action('onIntake')({
                source: result.source,
                accepted: result.accepted.map((file) => file.name),
                rejected: result.rejected.map(({ name, code }) => ({ name, code })),
              })
            }
          />
        </FormField>
      </form>
    );
  }, 'border-box'),
  code: (values) => {
    const { status, maxSize, maxFiles, ...props } = values;
    const attrs = previewProps(props, {
      size: 'm',
      variant: 'default',
      disabled: false,
      readOnly: false,
      loading: false,
      required: false,
      clearable: true,
      multiple: false,
      allowPaste: false,
      announceIntake: true,
      showSize: false,
    });
    const message = messages[status];
    return `import { FileInput, FormField } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function EvidenceAttachment() {
  return (
    <FormField label="Attach evidence"${props.readOnly && !props.disabled ? ' target="group"' : ''}${status === 'neutral' ? '' : ` status="${status}"`}${message ? ` message={<bdi>${previewText(message)}</bdi>}` : ''}>
      <FileInput name="attachment"${attrs}${maxSize >= 0 ? ` maxSize={${maxSize}}` : ''}${maxFiles >= 0 ? ` maxFiles={${maxFiles}}` : ''} onValueChange={(files) => console.log(files.map((file) => file.name))} onIntake={(result) => console.log(result)} />
    </FormField>
  );
}`;
  },
  states: [
    {
      id: 'roles',
      rows: 'size',
      cols: 'variant',
      title: 'Picker role and size',
      caption:
        'Compare the default form button and the quieter inline button at all three densities.',
    },
  ],
  cases: [
    {
      id: 'role-selection',
      title: 'Empty and selected pickers',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Compare the same picker before and after a selection in each role and size. The selected filenames are saved examples.',
      render: withOverlaySurface(FileRoles, 'border-box'),
    },
    {
      id: 'interaction',
      title: 'Hover, press, focus and drop',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      actions: [
        { id: 'drag', label: 'Start sample drag' },
        { id: 'leave', label: 'End sample drag' },
      ],
      caption:
        'Tab to Choose file and Remove, or hold the pointer to compare the roles. The frame actions send sample drag events to the middle pair.',
      render: withOverlaySurface(FileInteraction, 'border-box'),
    },
    {
      id: 'feedback',
      title: 'Validation and checking',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Compare local selection, information, verification, warning, rejection, and a pending check. Each message belongs to its picker.',
      render: withOverlaySurface(FileFeedback, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Read-only and disabled attachments',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'A read-only filename can be focused and copied. Disabled pickers prevent changes and suppress status color.',
      render: withOverlaySurface(FileAvailability, 'border-box'),
    },
    {
      id: 'multiple',
      title: 'Add files across selections',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Add files in several batches. This application keeps the earlier files, totals their sizes, and removes individual rows.',
      render: withOverlaySurface(MultipleField, 'border-box'),
    },
    {
      id: 'live',
      title: 'Select, reject, replace and clear',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      actions: [
        { id: 'sample', label: 'Choose sample' },
        { id: 'reject', label: 'Try rejected file' },
      ],
      caption:
        'Choose one PDF or Markdown file up to 2 MB. Rejection explains the correction and preserves the last accepted reference.',
      render: withOverlaySurface(FileLive, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Long names and direction',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Long and mixed-direction filenames keep their extensions, and the removal action moves with the name. The last picker has an accessible name without a visible label.',
      render: withOverlaySurface(FileOverflow, 'border-box'),
    },
    {
      id: 'surfaces',
      title: 'Field and inline surface roles',
      kind: 'surface',
      mode: 'pinned',
      compareSurfaces: true,
      caption: 'Compare the same selected attachment fields on base and overlay materials.',
      render: FileSurfaces,
    },
  ],
  compositions: [
    {
      id: 'submission',
      title: 'Inspect a submitted attachment',
      mode: 'live',
      reset: true,
      caption:
        'Choose or drop a file, then inspect the exact filename and byte count submitted by the form. Remove it and submit again to see an empty attachment.',
      render: withOverlaySurface(
        ({ ctx }) => (
          <div className="file-demo-field file-demo-arabic">
            <AttachmentSubmission fieldProps={ctx.subject} />
          </div>
        ),
        'border-box',
      ),
      code: submissionSource,
    },
    {
      id: 'text-preview',
      title: 'Read a local text attachment',
      mode: 'live',
      reset: true,
      caption:
        'Preview a short UTF-8 text file in its own writing direction. An invalid replacement keeps the previous file and its text.',
      render: withOverlaySurface(
        ({ ctx }) => (
          <div className="file-demo-field file-demo-arabic">
            <TextAttachment fieldProps={ctx.subject} />
          </div>
        ),
        'border-box',
      ),
      code: textSource,
    },
  ],
});
