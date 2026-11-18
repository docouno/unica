import { defineSpecimen } from '../../workbench/types.js';
import {
  BuildQueue,
  DensityExamples,
  EditorExamples,
  ReferenceIndex,
  RelationsDrawer,
  ResultExamples,
} from './table.examples.js';

export default defineSpecimen({
  id: 'table',
  title: 'Table',
  group: 'Data',
  summary: 'Compare records in a native table, from short references to sortable registries.',
  sections: [
    {
      id: 'density',
      title: 'Density & alignment',
      kind: 'matrix',
      render: () => <DensityExamples />,
    },
    {
      id: 'editors',
      title: 'Inline fields',
      kind: 'matrix',
      render: () => <EditorExamples />,
    },
    {
      id: 'queue',
      title: 'Sort, select & scroll',
      kind: 'states',
      caption: 'Cycle a sort heading, select builds, or open the actions menu from a row.',
      render: () => <BuildQueue />,
    },
    {
      id: 'results',
      title: 'Loading, empty & error',
      kind: 'states',
      caption: 'The preview control pins application-owned result states.',
      render: () => <ResultExamples />,
    },
    {
      id: 'drawer',
      title: 'Sticky header in a drawer',
      kind: 'context',
      caption:
        'Scroll the linked documents to see the header cover moving rows against the overlay.',
      overlayStage: true,
      surface: 'overlay',
      render: () => <RelationsDrawer />,
    },
    {
      id: 'reference',
      title: 'Reference & pagination',
      kind: 'context',
      render: () => <ReferenceIndex />,
    },
  ],
});
