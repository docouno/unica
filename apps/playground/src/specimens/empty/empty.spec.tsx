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
} from './empty.examples.js';
import { EmptySearchExample, EmptyRecoveryExample } from './empty.behavior.examples.js';
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
    label: 'EmptyTitle.children',
    publicType: 'ReactNode',
    group: 'Heading',
    default: 'No saved pages',
    demo: true,
    description: 'A short heading. Blank content omits the heading.',
  },
  as: {
    kind: 'enum',
    label: 'EmptyTitle.as',
    group: 'EmptyTitle',
    default: 'h3',
    choices: [
      { value: 'h1' },
      { value: 'h2' },
      { value: 'h3' },
      { value: 'h4' },
      { value: 'h5' },
      { value: 'h6' },
    ],
    description: 'Choose the native heading level to fit the page outline.',
  },
  icon: {
    kind: 'slot',
    label: 'EmptyMedia.icon',
    publicType: 'GlyphSource',
    group: 'EmptyMedia',
    default: 'document',
    description: 'Supply a decorative glyph for the medallion.',
    choices: [
      { value: 'none', label: 'No icon' },
      { value: 'document', label: 'Document icon' },
    ],
  },
  color: {
    kind: 'enum',
    label: 'EmptyMedia.color',
    group: 'EmptyMedia',
    default: 'muted',
    description: 'Choose a semantic foreground for the medallion.',
    choices: [
      { value: 'muted' },
      { value: 'accent' },
      { value: 'info' },
      { value: 'success' },
      { value: 'warning' },
      { value: 'danger' },
    ],
  },
  children: {
    kind: 'slot',
    label: 'EmptyMedia.children',
    publicType: 'ReactNode',
    group: 'EmptyMedia',
    default: 'none',
    description: 'Pass a custom illustration to take the place of the medallion.',
    choices: [
      { value: 'none', label: 'No illustration' },
      { value: 'landscape', label: 'Landscape illustration' },
    ],
  },
  description: {
    kind: 'string',
    label: 'EmptyDescription.children',
    publicType: 'ReactNode',
    group: 'Content',
    default: 'Save a page to keep it close at hand.',
    demo: true,
    description: 'Explain why the region is empty or what someone can do next.',
  },
  actionLabel: {
    kind: 'string',
    label: 'EmptyActions.children',
    publicType: 'ReactNode',
    group: 'Content',
    default: 'Browse pages',
    demo: true,
    description:
      'Supply a button or link with a clear label. Clear the example label to omit the action.',
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
  status: 'UI',
  summary: 'Explain why a resolved view is empty and offer a next step when one is available.',
  componentName: 'Empty',
  props,
  constraints: [
    {
      kind: 'precedence',
      when: { children: 'landscape' },
      affects: [{ key: 'icon', value: 'document' }],
      reason: 'An illustration replaces the icon and medallion.',
    },
    {
      kind: 'ignored',
      when: { icon: 'none' },
      affects: ['color'],
      reason: 'The color applies to the medallion around an icon.',
    },
    {
      kind: 'ignored',
      when: { children: 'landscape', icon: 'document' },
      affects: ['color'],
      reason: 'The color applies to the medallion around an icon.',
    },
  ],
  code: emptyCode,
  render: withOverlaySurface(EmptyPlayground, 'border-box'),
  states: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'icon',
      fixed: { children: 'none' },
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
      code: routesSource,
      render: withOverlaySurface(
        ({ ctx }) => (
          <EmptyRoutes
            emptyProps={ctx.subject}
            workspaceHref="/?item=02-workspace-overview"
            illustrationSrc="/assets/empty-landscape.svg"
          />
        ),
        'border-box',
      ),
    },
  ],
});
