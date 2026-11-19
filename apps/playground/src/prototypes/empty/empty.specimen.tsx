import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import type { EmptyExampleSection } from './empty.examples.js';

const { default: EmptyExamples } = await import('./empty.examples.js');

function example(section: EmptyExampleSection, note?: string): ReactElement {
  return <EmptyExamples section={section} note={note} />;
}

export default defineSpecimen({
  id: 'empty',
  title: 'Empty',
  group: 'Feedback',
  summary: 'Explain why a resolved view is empty and offer the next step when there is one.',
  sections: [
    { id: 'sizes', title: 'Sizes', kind: 'matrix', render: () => example('sizes') },
    {
      id: 'reasons',
      title: 'Empty collections',
      kind: 'states',
      render: () => example('reasons', 'Static examples.'),
    },
    {
      id: 'activity',
      title: 'Activity states',
      kind: 'states',
      render: () => example('activity', 'Static examples.'),
    },
    {
      id: 'unavailable',
      title: 'Access and loading failures',
      kind: 'states',
      render: () => example('unavailable', 'Fixed examples. Retry shows the live recovery path.'),
    },
    {
      id: 'placement',
      title: 'Alignment and optional slots',
      kind: 'context',
      render: () =>
        example('placement', 'Fixed examples of a card and a description-only table row.'),
    },
    { id: 'media', title: 'Custom illustrations', kind: 'matrix', render: () => example('media') },
    {
      id: 'routes',
      title: 'Full-page recovery',
      kind: 'context',
      render: () => example('routes', 'Fixed examples for a missing page and a failed load.'),
    },
    {
      id: 'search',
      title: 'Live search results',
      kind: 'states',
      render: () =>
        example('search', 'Try typing “incident” or submitting a search with no matches.'),
    },
    {
      id: 'retry',
      title: 'Retry',
      kind: 'states',
      render: () => example('retry', 'The first retry fails. The second shows the loaded reports.'),
    },
    {
      id: 'overflow',
      title: 'Long copy and action wrapping',
      kind: 'states',
      render: () =>
        example('overflow', 'Fixed example. Use 360px, 120% text, and RTL to inspect wrapping.'),
    },
    {
      id: 'overlay',
      title: 'Floating panel preview',
      kind: 'context',
      surface: 'overlay',
      overlayStage: true,
      render: () => example('overlay'),
    },
  ],
});
