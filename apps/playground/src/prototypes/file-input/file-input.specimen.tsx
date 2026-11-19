import { defineSpecimen } from '../../workbench/types.js';
const {
  FileAvailability,
  FileFeedback,
  FileInteraction,
  FileLive,
  FileOverflow,
  FileRoles,
  FileSurfaces,
  MultipleField,
} = await import('./file-input.examples.js');

export default defineSpecimen({
  id: 'file-input',
  title: 'FileInput',
  group: 'Forms',
  summary: 'A compact picker for local files, with the current selection beside it.',
  sections: [
    {
      id: 'roles',
      title: 'Roles & sizes',
      kind: 'matrix',
      caption:
        'Secondary and ghost buttons at S/M/L. The picker keeps its label when a file is selected.',
      render: () => <FileRoles />,
    },
    {
      id: 'interaction',
      title: 'Hover, press, focus & drop',
      kind: 'states',
      caption:
        'Compare the two button roles, then try Choose file and Remove. A keyboard focus outline surrounds the button.',
      render: () => <FileInteraction />,
    },
    {
      id: 'feedback',
      title: 'Validation & checking',
      kind: 'states',
      caption:
        'Selection is not upload success. Feedback stays local and explains the next action. Checking blocks replacement until the result.',
      render: () => <FileFeedback />,
    },
    {
      id: 'availability',
      title: 'Read-only & disabled',
      kind: 'states',
      caption:
        'Read-only keeps filenames readable and selectable. Disabled removes interaction and suppresses status paint.',
      render: () => <FileAvailability />,
    },
    {
      id: 'multiple',
      title: 'Multiple selection',
      kind: 'context',
      caption:
        'A compact count in the picker, with a separate file list. Choose real local files; no transfer takes place.',
      render: () => <MultipleField />,
    },
    {
      id: 'live',
      title: 'Select, reject, replace & clear',
      kind: 'context',
      caption:
        'A local selection study: valid replacement, rejected attempts, and removal. A rejected choice preserves the previous reference.',
      render: () => <FileLive />,
    },
    {
      id: 'overflow',
      title: 'Long names & direction',
      kind: 'states',
      caption: 'Names wrap instead of hiding their extension. Try 360px, 120% text, and RTL.',
      render: () => <FileOverflow />,
    },
    {
      id: 'surfaces',
      title: 'Base & overlay materials',
      kind: 'context',
      caption: 'Static material plates, with identical fields and no dialog behavior.',
      render: () => <FileSurfaces compact />,
    },
  ],
});
