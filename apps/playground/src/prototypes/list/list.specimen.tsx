import { defineSpecimen } from '../../workbench/types.js';

const { LiveRows, OverflowExamples, ProseExamples, SizeExamples, StateExamples } =
  await import('./list.examples.js');

export default defineSpecimen({
  id: 'list',
  title: 'List & ListItem',
  group: 'Data',
  summary: 'Native lists for running text and structured rows with independent actions.',
  sections: [
    {
      id: 'prose',
      title: 'Prose and numbering',
      kind: 'matrix',
      caption: 'Nested markers, continued and reversed numbering, and a markerless text list.',
      render: () => <ProseExamples />,
    },
    {
      id: 'sizes',
      title: 'Row sizes',
      kind: 'matrix',
      render: () => <SizeExamples />,
    },
    {
      id: 'states',
      title: 'Action states',
      kind: 'states',
      caption: 'Main-area states are pinned. Use Tab to focus the Request access button.',
      render: () => <StateExamples />,
    },
    {
      id: 'overflow',
      title: 'Long labels and trailing content',
      kind: 'states',
      render: () => <OverflowExamples />,
    },
    {
      id: 'controls',
      title: 'Independent row actions',
      kind: 'context',
      caption:
        'The trailing slot holds the switch and menu trigger. Tab from the row link to its menu.',
      render: () => <LiveRows />,
    },
    {
      id: 'overlay',
      title: 'Rows on a floating surface',
      kind: 'context',
      surface: 'overlay',
      overlayStage: true,
      render: () => <LiveRows overlay />,
    },
  ],
});
