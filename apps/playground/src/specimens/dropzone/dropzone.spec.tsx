import { Dropzone, FormField } from '@docouno/unica';
import { intakeProps } from '../file-input/intake-props.js';
import { size, disabled, readOnly, loading, required, choice, toggle } from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
import { previewProps } from '../preview-code.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import {
  DropAvailability,
  DropFeedback,
  DropInteraction,
  SingleImageIntake,
  FileRows,
  DropSurface,
  LiveQueue,
  RowOverflow,
  RowSizes,
} from './dropzone.examples.js';
import { ImageAttachment } from './image-attachment.js';
import imageSource from './image-attachment.tsx?raw';
import { BatchSummary } from './batch-summary.js';
import batchSource from './batch-summary.tsx?raw';

export default defineComponent({
  id: 'dropzone',
  title: 'Dropzone & FileList',
  category: 'Forms',
  status: 'UI',
  summary:
    'Choose or drop local files, inspect transfer progress, and recover a rejected selection.',
  componentName: 'Dropzone',
  form: 'owned',
  props: {
    ...intakeProps,
    size,
    loading,
    required,
    accept: { ...intakeProps.accept, default: '.md,.zip' },
    disabled,
    readOnly,
    status: choice(
      'Semantics',
      'Validation feedback on the intake.',
      ['neutral', 'danger'],
      'neutral',
    ),
    multiple: toggle('Interaction', 'Append accepted files across successive selections.', true),
    description: {
      kind: 'string',
      group: 'Content',
      default: 'Choose local files to inspect their names.',
      description: 'Additional guidance shown alongside the admission rules inside the well.',
      publicType: 'ReactNode',
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: [{ key: 'status', value: 'danger' }],
      reason: 'Disabled intake suppresses validation feedback.',
    },
  ],
  render: withOverlaySurface(
    ({ values: { maxSize, maxFiles, ...values }, ctx }) => (
      <form {...ctx.form} data-file-intake-sample="">
        <FormField
          label="Supporting files"
          controlId={ctx.id}
          disabled={values.disabled}
          required={values.required}
          status={values.status}
          message={values.status === 'danger' && 'Check the attachment requirements.'}
          feedbackIcon={false}
        >
          <Dropzone
            {...values}
            {...ctx.subject}
            name="attachments"
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
    ),
    'border-box',
  ),
  code: (values) => {
    const { maxSize, maxFiles, ...props } = values;
    const attrs = previewProps(props, {
      size: 'm',
      status: 'neutral',
      disabled: false,
      readOnly: false,
      multiple: true,
      loading: false,
      required: false,
      allowPaste: false,
      announceIntake: true,
    });
    return `import { Dropzone, FormField } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function FileIntake() {
  return (
    <FormField label="Supporting files">
      <Dropzone name="attachments"${attrs}${maxSize >= 0 ? ` maxSize={${maxSize}}` : ''}${maxFiles >= 0 ? ` maxFiles={${maxFiles}}` : ''} onValueChange={(files) => console.log(files.map((file) => file.name))} onIntake={(result) => console.log(result)} />
    </FormField>
  );
}`;
  },
  states: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'status',
      title: 'Intake size and validation',
      caption: 'Compare the invitation and outline at every size with neutral or danger feedback.',
    },
    {
      id: 'row-sizes',
      rows: 'size',
      fixed: { multiple: false },
      title: 'Single-file chooser sizes',
      caption:
        'The chooser accepts one file at all three densities. The File rows and image previews case compares attachments at the same sizes.',
    },
  ],
  cases: [
    {
      id: 'single-image',
      title: 'Single image intake',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'A compact intake accepts one PNG or JPEG up to 10 MB. A larger batch or a different file type leaves a local explanation.',
      render: withOverlaySurface(SingleImageIntake, 'border-box'),
    },
    {
      id: 'row-sizes',
      title: 'File rows and image previews',
      kind: 'content',
      mode: 'pinned',
      caption:
        'At each size, compare a document and a partially transferred image. Their names align despite the different leading artwork. Removal buttons show their resting appearance.',
      render: withOverlaySurface(RowSizes, 'border-box'),
    },
    {
      id: 'interaction',
      title: 'Hover, press, focus and drag',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      actions: [
        { id: 'reject', label: 'Reject sample' },
        { id: 'drag', label: 'Start sample drag' },
        { id: 'leave', label: 'End sample drag' },
      ],
      caption:
        'Compare the actual pointer and keyboard cues. Start a sample file drag before or after a rejection.',
      render: withOverlaySurface(DropInteraction, 'border-box'),
    },
    {
      id: 'feedback',
      title: 'Rejection and partial acceptance',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      actions: [
        { id: 'size', label: 'Try a large file' },
        { id: 'count', label: 'Try count limit' },
        { id: 'mixed', label: 'Try mixed batch' },
        { id: 'duplicate', label: 'Try a duplicate' },
        { id: 'folder', label: 'Try a folder' },
      ],
      caption:
        'Try the size, count, type, duplicate and folder rules. Attempt feedback stays beneath the picker and accepted files remain in the list.',
      render: withOverlaySurface(DropFeedback, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Read-only and disabled intake',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Neither unavailable picker adds files. The saved Markdown reference remains downloadable, including with the keyboard.',
      render: withOverlaySurface(DropAvailability, 'border-box'),
    },
    {
      id: 'lifecycle',
      title: 'Selection, transfer and verification',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Transfer at 100% still awaits verification. The rows pin progress, success, pause, rejection and removal. Their actions show the available targets.',
      render: withOverlaySurface(FileRows, 'border-box'),
    },
    {
      id: 'live',
      title: 'Add files and resolve transfers',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Pick or drop Markdown and ZIP files, or try a sample batch. The phase actions simulate transfer and verification without sending files. Retry and remove operate on the chosen row.',
      actions: [
        { id: 'samples', label: 'Add sample files' },
        { id: 'mixed', label: 'Try mixed batch' },
        { id: 'limit', label: 'Try count limit' },
        { id: 'start', label: 'Start transfer' },
        { id: 'progress', label: 'Set 65%' },
        { id: 'finish', label: 'Finish transfer' },
        { id: 'verify', label: 'Verify' },
        { id: 'success', label: 'Confirm success' },
        { id: 'fail', label: 'Fail transfer' },
        { id: 'remove', label: 'Confirm removal' },
      ],
      render: withOverlaySurface(LiveQueue, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Names, recovery and saved files',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Long and mixed-direction filenames retain their extensions. Retry and removal targets are pinned. The saved Markdown attachment can be downloaded.',
      render: withOverlaySurface(RowOverflow, 'border-box'),
    },
    {
      id: 'surfaces',
      title: 'File intake on base and overlay',
      kind: 'surface',
      mode: 'pinned',
      compareSurfaces: true,
      caption:
        'Compare the well and flat file list on each material. The two rows pin a measured transfer and a verified attachment.',
      render: DropSurface,
    },
  ],
  compositions: [
    {
      id: 'image',
      title: 'Replace a selected image',
      mode: 'live',
      reset: true,
      caption:
        'Choose a local PNG or JPEG, then download the selected file. A rejected replacement keeps the previous image. Removing it returns focus to the picker.',
      render: withOverlaySurface(
        ({ ctx }) => (
          <div className="file-demo-arabic">
            <ImageAttachment intakeProps={ctx.subject} />
          </div>
        ),
        'border-box',
      ),
      code: imageSource
        .replace('useRef<HTMLInputElement>', 'useRef')
        .replace('useState<readonly File[]>', 'useState')
        .replace('useState<{ file: File; url: string } | null>', 'useState'),
    },
    {
      id: 'batch',
      title: 'Inspect a file batch',
      mode: 'live',
      reset: true,
      caption:
        'Choose or drop local files to see their combined byte count. Each new batch replaces the previous summary.',
      render: withOverlaySurface(
        ({ ctx }) => <BatchSummary intakeProps={ctx.subject} />,
        'border-box',
      ),
      code: batchSource,
    },
  ],
});
