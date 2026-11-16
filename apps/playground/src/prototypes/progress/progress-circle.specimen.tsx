import { defineSpecimen } from '../../workbench/types.js';

const { default: Study } = await import('./progress-circle.examples.js');

export default defineSpecimen({
  id: 'progress-circle',
  title: 'ProgressCircle',
  group: 'Status',
  summary:
    'The Spinner silhouette adapted to a measured amount. The same small icon slot, with no new visual pattern.',
  sections: (
    [
      { id: 'scale', title: 'Spinner → measured amount · one silhouette', kind: 'matrix' },
      { id: 'boundaries', title: 'From empty to full', kind: 'states' },
      { id: 'context', title: 'File transfers & pipeline stages', kind: 'context' },
      { id: 'handoff', title: 'From waiting to measured work', kind: 'states' },
      {
        id: 'overlay',
        title: 'Compact work on a floating surface',
        kind: 'context',
        surface: 'overlay',
        overlayStage: true,
      },
    ] as const
  ).map((section) => ({ ...section, render: () => <Study section={section.id} /> })),
});
