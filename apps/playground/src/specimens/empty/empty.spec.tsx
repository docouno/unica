import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import {
  EmptyActivity,
  EmptyCollections,
  EmptyIllustrations,
  EmptyOverflow,
  EmptyOverlay,
  EmptyPlacement,
  EmptyUnavailable,
} from '../../prototypes/empty/empty.examples.js';
import {
  EmptySearchExample,
  EmptyRecoveryExample,
} from '../../prototypes/empty/empty.behavior.examples.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { emptyCode } from './empty-code.js';
import { EmptyPlayground } from './empty-playground.js';
import { EmptyRoutes } from './empty-routes.examples.js';
import routesSource from './empty-routes.examples.tsx?raw';

const props = {
  size: {
    kind: 'enum',
    group: 'Geometry',
    default: 'm',
    description: 'Scale the heading, media and spacing between slots.',
    choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
  },
  align: {
    kind: 'enum',
    group: 'Geometry',
    default: 'center',
    description:
      'Align the text, media and action row along the logical start edge or in the center.',
    choices: [{ value: 'start' }, { value: 'center' }],
  },
  heading: {
    kind: 'string',
    group: 'Content',
    default: 'No saved pages',
    demo: true,
    description:
      'Text supplied to EmptyTitle. An empty heading leaves the surrounding slots in place.',
  },
  media: {
    kind: 'slot',
    group: 'Content',
    default: 'icon',
    demo: true,
    description: 'Place a decorative document glyph in EmptyMedia or omit the slot.',
    choices: [
      { value: 'none', label: 'No media' },
      { value: 'icon', label: 'Document icon' },
    ],
  },
  onBrowse: {
    kind: 'action',
    group: 'Interaction',
    demo: true,
    code: 'handleBrowse',
    description: 'Record activation of the example’s Browse pages link to the document collection.',
  },
} as const satisfies PropSchema;

export type EmptyValues = ComponentValues<typeof props>;

export default defineComponent({
  id: 'empty',
  title: 'Empty',
  category: 'Feedback & Status',
  status: 'Proto',
  summary: 'Explain why a resolved view is empty and offer a next step when one is available.',
  componentName: 'Empty',
  props,
  code: emptyCode,
  render: withOverlaySurface(EmptyPlayground, 'border-box'),
  states: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'media',
      title: 'Size and optional media',
      caption: 'Compare the three scales with a document glyph and with the media slot omitted.',
    },
    {
      id: 'placement',
      rows: 'align',
      cols: 'size',
      title: 'Alignment at each size',
      caption:
        'The heading, description and action share the center or the logical start edge at each size.',
    },
  ],
  cases: [
    {
      id: 'hosts',
      title: 'Card and table placement',
      kind: 'content',
      mode: 'pinned',
      caption:
        'The export card supplies its own heading and inset. The history table keeps its column headers and shows a single sentence across both columns.',
      render: withOverlaySurface(EmptyPlacement, 'border-box'),
    },
    {
      id: 'reasons',
      title: 'Empty collections',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Shared items arrive from someone else. A first collection gives its owner a creation action.',
      render: withOverlaySurface(EmptyCollections, 'border-box'),
    },
    {
      id: 'activity',
      title: 'Activity states',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Paused notifications offer a way to resume. A cleared queue explains when the next request will appear.',
      render: withOverlaySurface(EmptyActivity, 'border-box'),
    },
    {
      id: 'unavailable',
      title: 'Access and loading failures',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Compare a request for access with a retry after a failed load. The wording identifies who can resolve each problem.',
      render: withOverlaySurface(EmptyUnavailable, 'border-box'),
    },
    {
      id: 'media',
      title: 'Custom illustrations',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Landscape and portrait artwork keeps its aspect ratio within the size allotted to each illustration. Decorative images have empty alternatives.',
      render: withOverlaySurface(EmptyIllustrations, 'border-box'),
    },
    {
      id: 'search',
      title: 'Live search results',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Type “incident” to find a runbook. Submit a query with no matches to focus its empty heading, then clear the search to return to the input.',
      render: withOverlaySurface(EmptySearchExample, 'border-box'),
    },
    {
      id: 'retry',
      title: 'Retry',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'The first retry fails. The second loads two reports. If the retry button still has focus, the reports heading receives it.',
      render: withOverlaySurface(EmptyRecoveryExample, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Long copy and action wrapping',
      kind: 'content',
      mode: 'pinned',
      caption:
        'The deployment identifier can break across lines. The actions wrap in reading order when the row runs out of space.',
      render: withOverlaySurface(EmptyOverflow, 'border-box'),
    },
    {
      id: 'overlay',
      title: 'Floating notification panel',
      kind: 'surface',
      mode: 'pinned',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'The compact message aligns with the logical start of the panel. The panel supplies the inset and material around the message.',
      render: EmptyOverlay,
    },
  ],
  compositions: [
    {
      id: 'routes',
      title: 'Full-page recovery',
      mode: 'live',
      reset: true,
      caption:
        'Both pages link back to the workspace. Reload page recovers the failed view and moves keyboard focus to its content.',
      code: routesSource.replaceAll('../../prototypes/', './prototypes/'),
      render: withOverlaySurface(
        ({ ctx }) => <EmptyRoutes emptyProps={ctx.subject} />,
        'border-box',
      ),
    },
  ],
});
