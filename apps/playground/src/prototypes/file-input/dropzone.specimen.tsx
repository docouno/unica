import { defineSpecimen } from '../../workbench/types.js';
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
} = await import('./file-input.examples.js');

export default defineSpecimen({
  id: 'dropzone',
  title: 'Dropzone & FileList',
  group: 'Forms',
  summary:
    'A calm place to add files, with an honest account of selection, transfer, verification, and recovery.',
  sections: [
    {
      id: 'sizes',
      title: 'Dropzone sizes',
      kind: 'matrix',
      caption:
        'At each size, a centered invitation sits above a quieter line of file requirements.',
      render: () => <DropSizes />,
    },
    {
      id: 'interaction',
      title: 'Hover, press, focus & drag',
      kind: 'states',
      caption:
        'Pinned states. Drag uses one neutral invitation, then validation happens after drop. The whole well is one picker target.',
      render: () => <DropInteraction />,
    },
    {
      id: 'feedback',
      title: 'Rejection & partial acceptance',
      kind: 'states',
      caption:
        'Pinned feedback examples. Errors explain the rejected attempt without removing accepted files. Count overflow rejects the incoming batch as a whole.',
      render: () => <DropFeedback />,
    },
    {
      id: 'availability',
      title: 'Read-only & disabled',
      kind: 'states',
      caption:
        'Unavailable intake stays visible with a reason. Existing attachments remain independently inspectable.',
      render: () => <DropAvailability />,
    },
    {
      id: 'row-sizes',
      title: 'File rows & image previews',
      kind: 'matrix',
      caption:
        'S/M/L rows. Plain file glyphs and optional thumbnails share a leading column when mixed.',
      render: () => <RowSizes />,
    },
    {
      id: 'lifecycle',
      title: 'Selection to confirmed outcome',
      kind: 'states',
      caption:
        'Pinned phases; actions are visual samples. Measured transfer, unknown activity, processing, pause, failure, and removal remain distinct. Try real transitions in the live study.',
      render: () => <FileRows />,
    },
    {
      id: 'live',
      title: 'Live intake & phase study',
      kind: 'context',
      caption:
        'Pick or drop Markdown and ZIP files, try mixed batches, remove or retry. Preview controls explicitly supply phases and removal confirmation; nothing is sent.',
      render: () => <LiveQueue />,
    },
    {
      id: 'overflow',
      title: 'Names, recovery & saved files',
      kind: 'states',
      caption:
        'Long filenames and reasons wrap; actions stay reachable. Read-only, disabled, and downloadable saved attachments retain their own meaning. Actions here are pinned samples.',
      render: () => <RowOverflow />,
    },
    {
      id: 'surfaces',
      title: 'Base & overlay materials',
      kind: 'context',
      caption: 'Static material plates. The same flat list sits directly on each surface.',
      render: () => <FileSurfaces />,
    },
  ],
});
