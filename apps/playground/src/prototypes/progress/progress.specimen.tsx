import { defineSpecimen } from '../../workbench/types.js';

const { default: Study } = await import('./progress.examples.js');

export default defineSpecimen({
  id: 'progress',
  title: 'Progress',
  group: 'Status',
  summary:
    'Measured work, unknown phases, and honest completion. Material changes with the theme; the meaning of the data stays the same.',
  sections: (
    [
      {
        id: 'scale',
        title: 'Three weights · one measured range',
        kind: 'matrix',
      },
      {
        id: 'boundaries',
        title: 'Zero, a first byte & a finished phase',
        kind: 'states',
      },
      {
        id: 'waiting',
        title: 'Preparing & transferring · the same accent',
        kind: 'states',
      },
      {
        id: 'statuses',
        title: 'Semantic color needs context',
        kind: 'matrix',
      },
      {
        id: 'labels',
        title: 'Labels, units & compact placement',
        kind: 'states',
      },
      { id: 'motion', title: 'Active light & a quiet finish', kind: 'states' },
      {
        id: 'phases',
        title: 'A phase is not an outcome',
        kind: 'states',
      },
      {
        id: 'overlay',
        title: 'Unknown & measured work on a floating surface',
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
