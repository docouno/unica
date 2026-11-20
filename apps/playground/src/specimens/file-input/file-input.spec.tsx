import { useState } from 'react';
import { FileInput } from '../../prototypes/file-input/file-input.proto.js';
import {
  size,
  variant,
  status,
  disabled,
  readOnly,
  loading,
  clearable,
  toggle,
  eventProp,
} from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
const {
  FileAvailability,
  FileFeedback,
  FileInteraction,
  FileLive,
  FileOverflow,
  FileRoles,
  FileSurfaces,
  MultipleField,
} = await import('../../prototypes/file-input/file-input.examples.js');

export default defineComponent({
  id: 'file-input',
  title: 'FileInput',
  category: 'Forms',
  status: 'Proto',
  summary: 'A compact picker for local files, with the current selection beside it.',
  componentName: 'FileInput',
  form: 'owned',
  props: {
    size,
    variant,
    status,
    disabled,
    readOnly,
    loading,
    clearable: { ...clearable, default: true },
    multiple: toggle('Selection', 'Choose several attachments in one operation.'),
    accept: {
      kind: 'string',
      group: 'Selection',
      default: '.pdf,.txt',
      description: 'File types suggested by the native chooser.',
    },
    onFilesChange: eventProp('Reports the names of selected attachments.', 'handleFilesChange'),
  },
  constraints: [
    {
      kind: 'ignored',
      when: { multiple: true },
      affects: ['clearable'],
      reason: 'The single-file clear button is unavailable for multiple selection.',
    },
  ],
  render: function FilePreview({ values, ctx }) {
    const [revision, setRevision] = useState(0);
    return (
      <form {...ctx.form} onReset={() => setRevision((current) => current + 1)}>
        <FileInput
          {...values}
          {...ctx.subject}
          key={revision}
          id={ctx.id}
          name="attachment"
          label="Attach evidence"
          description="Choose a file to include it in form data. Dropping files previews the selection."
          onFilesChange={(files) => ctx.action('onFilesChange')(files.map((file) => file.name))}
        />
      </form>
    );
  },
  code: ({ accept }, attributes) => {
    const filter = accept === '.pdf,.txt' ? ' accept=".pdf,.txt"' : '';
    return `<FileInput label="Attach evidence" name="attachment"${filter}${attributes} />`;
  },
  matrixViews: [
    {
      id: 'roles',
      rows: 'size',
      cols: 'variant',
      title: 'Roles & sizes',
      caption:
        'Secondary and ghost buttons at S/M/L. The picker keeps its label when a file is selected.',
      reference: () => <FileRoles />,
    },
  ],
  cases: [
    {
      id: 'interaction',
      title: 'Hover, press, focus & drop',
      caption:
        'Compare the two button roles, then try Choose file and Remove. A keyboard focus outline surrounds the button.',
      kind: 'behavior',
      render: () => <FileInteraction />,
    },
    {
      id: 'feedback',
      title: 'Validation & checking',
      caption:
        'Selection is not upload success. Feedback stays local and explains the next action. Checking blocks replacement until the result.',
      kind: 'behavior',
      render: () => <FileFeedback />,
    },
    {
      id: 'availability',
      title: 'Read-only & disabled',
      caption:
        'Read-only keeps filenames readable and selectable. Disabled removes interaction and suppresses status paint.',
      kind: 'behavior',
      render: () => <FileAvailability />,
    },
    {
      id: 'multiple',
      title: 'Multiple selection',
      caption:
        'A compact count in the picker, with a separate file list. Choose real local files; no transfer takes place.',
      kind: 'behavior',
      render: () => <MultipleField />,
    },
    {
      id: 'live',
      title: 'Select, reject, replace & clear',
      caption:
        'A local selection study: valid replacement, rejected attempts, and removal. A rejected choice preserves the previous reference.',
      kind: 'behavior',
      render: () => <FileLive />,
    },
    {
      id: 'overflow',
      title: 'Long names & direction',
      caption: 'Names wrap instead of hiding their extension. Try 360px, 120% text, and RTL.',
      kind: 'content',
      render: () => <FileOverflow />,
    },
    {
      id: 'surfaces',
      title: 'Base & overlay materials',
      caption: 'Static material plates, with identical fields and no dialog behavior.',
      kind: 'surface',
      render: () => <FileSurfaces compact />,
    },
  ],
});
