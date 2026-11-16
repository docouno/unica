import { defineSpecimen } from '../../workbench/types.js';

const { default: Study } = await import('./spinner.examples.js');

export default defineSpecimen({
  id: 'spinner',
  title: 'Spinner',
  group: 'Status',
  summary:
    'Compact activity for work with an unknown duration. The surrounding text tells you what is happening.',
  sections: (
    [
      {
        id: 'scale',
        title: 'One footprint · four sizes',
        kind: 'matrix',
      },
      {
        id: 'tones',
        title: 'A quiet default · a deliberate accent',
        kind: 'matrix',
      },
      {
        id: 'motion',
        title: 'Motion & a readable still frame',
        kind: 'states',
      },
      {
        id: 'lifecycle',
        title: 'Short waits & completion',
        kind: 'states',
      },
      {
        id: 'placement',
        title: 'Inline & reserved control slots',
        kind: 'context',
      },
      {
        id: 'overlay',
        title: 'Waiting on a floating surface',
        kind: 'context',
        surface: 'overlay',
        overlayStage: true,
      },
    ] as const
  ).map((section) => ({
    ...section,
    render: () => <Study section={section.id} />,
  })),
});
