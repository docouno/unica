import { Dropzone } from '../../prototypes/file-input/file-input.proto.js';
import { size, disabled, readOnly, choice, toggle, eventProp } from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
const {
  DropAvailability,
  DropFeedback,
  DropInteraction,
  DropSizes,
  FileRows,
  FileSurfaces,
  LiveQueue,
  RowOverflow,
  RowSizes,
} = await import('../../prototypes/file-input/file-input.examples.js');

export default defineComponent({
  id: 'dropzone',
  title: 'Dropzone & FileList',
  category: 'Forms',
  status: 'Proto',
  summary:
    'A calm place to add files, with an honest account of selection, transfer, verification, and recovery.',
  componentName: 'Dropzone',
  props: {
    size,
    disabled,
    readOnly,
    status: choice('Field', 'Feedback tone of the drop area.', ['neutral', 'danger'], 'neutral'),
    multiple: toggle('Selection', 'Allow several files per drop.', true),
    title: {
      kind: 'string',
      group: 'Content',
      default: 'Add project files',
      description: 'Instruction above the file requirements.',
    },
    onFilesChange: eventProp('Reports the names of files dropped or chosen.', 'handleFilesChange'),
  },
  render: ({ values, ctx }) => (
    <Dropzone
      {...values}
      {...ctx.subject}
      onFilesChange={(files) => ctx.action('onFilesChange')(files.map((file) => file.name))}
    />
  ),
  code: ({ title }, attributes) => {
    const prompt = title === 'Add project files' ? ' title="Add project files"' : '';
    return `<Dropzone${prompt}${attributes} />`;
  },
  matrixViews: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'status',
      title: 'Dropzone sizes',
      caption:
        'At each size, a centered invitation sits above a quieter line of file requirements.',
      reference: () => <DropSizes />,
    },
    {
      id: 'row-sizes',
      rows: 'size',
      title: 'File rows & image previews',
      caption:
        'S/M/L rows. Plain file glyphs and optional thumbnails share a leading column when mixed.',
      reference: () => <RowSizes />,
    },
  ],
  cases: [
    {
      id: 'interaction',
      title: 'Hover, press, focus & drag',
      caption:
        'Pinned states. Drag uses one neutral invitation, then validation happens after drop. The whole well is one picker target.',
      kind: 'behavior',
      render: () => <DropInteraction />,
    },
    {
      id: 'feedback',
      title: 'Rejection & partial acceptance',
      caption:
        'Pinned feedback examples. Errors explain the rejected attempt without removing accepted files. Count overflow rejects the incoming batch as a whole.',
      kind: 'behavior',
      render: () => <DropFeedback />,
    },
    {
      id: 'availability',
      title: 'Read-only & disabled',
      caption:
        'Unavailable intake stays visible with a reason. Existing attachments remain independently inspectable.',
      kind: 'behavior',
      render: () => <DropAvailability />,
    },
    {
      id: 'lifecycle',
      title: 'Selection to confirmed outcome',
      caption:
        'Pinned phases; actions are visual samples. Measured transfer, unknown activity, processing, pause, failure, and removal remain distinct. Try real transitions in the live study.',
      kind: 'behavior',
      render: () => <FileRows />,
    },
    {
      id: 'live',
      title: 'Live intake & phase study',
      caption:
        'Pick or drop Markdown and ZIP files, try mixed batches, remove or retry. Preview controls explicitly supply phases and removal confirmation; nothing is sent.',
      kind: 'behavior',
      render: () => <LiveQueue />,
    },
    {
      id: 'overflow',
      title: 'Names, recovery & saved files',
      caption:
        'Long filenames and reasons wrap; actions stay reachable. Read-only, disabled, and downloadable saved attachments retain their own meaning. Actions here are pinned samples.',
      kind: 'content',
      render: () => <RowOverflow />,
    },
    {
      id: 'surfaces',
      title: 'Base & overlay materials',
      caption: 'Static material plates. The same flat list sits directly on each surface.',
      kind: 'surface',
      render: () => <FileSurfaces />,
    },
  ],
});
