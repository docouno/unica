import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import {
  BreadcrumbAnatomy,
  BreadcrumbLinkStates,
  BreadcrumbWrapping,
} from './breadcrumb-cases.examples.js';
import { breadcrumbDestinations } from './breadcrumb-destinations.js';
import { BreadcrumbOverlayExample } from './breadcrumb-overlay.example.js';
import overlaySource from './breadcrumb-overlay.example.tsx?raw';
import { BreadcrumbPlayground } from './breadcrumb-playground.js';
import { breadcrumbCode } from './breadcrumb-code.js';

const props = {
  size: {
    kind: 'enum',
    group: 'Geometry',
    default: 'm',
    description: 'Set the type scale, separator gap, and root icon size.',
    choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
  },
  underline: {
    kind: 'enum',
    group: 'Interaction',
    default: 'always',
    description:
      'Choose when ancestor links show a line. A linked current page keeps its underline.',
    choices: [{ value: 'always' }, { value: 'hover' }, { value: 'none' }],
  },
  separator: {
    kind: 'slot',
    group: 'Content',
    default: 'slash',
    publicType: 'ReactNode',
    description:
      'Separate segments with a decorative node, or pass null to leave space between them.',
    choices: [
      { value: 'slash', label: 'Slash', code: '"/"' },
      {
        value: 'chevron',
        label: 'Chevron',
        code: '<Icon usage="slot" icon={CaretRightIcon} directional />',
      },
      { value: 'none', label: 'Spacing only', code: 'null' },
    ],
  },
  page: {
    kind: 'string',
    group: 'Content',
    demo: true,
    label: 'Current page',
    default: 'Service recovery',
    examples: ['Service recovery', 'Guide', ''],
    description: 'Label of the current location. Clear it to show the ancestors alone.',
  },
  current: {
    kind: 'enum',
    group: 'Content',
    demo: true,
    label: 'Current item',
    default: 'page',
    choices: [
      { value: 'page', label: 'Static page' },
      { value: 'permalink', label: 'Permalink' },
      { value: 'disabled', label: 'Unavailable permalink' },
    ],
    description: 'Choose a static label, an available current link, or an unavailable one.',
  },
} as const satisfies PropSchema;

export type BreadcrumbValues = ComponentValues<typeof props>;

export default defineComponent({
  id: 'breadcrumb',
  title: 'Breadcrumb',
  category: 'Navigation',
  status: 'UI',
  componentName: 'Breadcrumb',
  summary: 'Show the path from a workspace to the current page, with links to its ancestors.',
  props,
  code: breadcrumbCode,
  render: withOverlaySurface(BreadcrumbPlayground, 'border-box'),
  constraints: [
    {
      kind: 'ignored',
      when: { page: '' },
      affects: ['current'],
      reason: 'Without a current label, the trail shows only its ancestors.',
    },
  ],
  states: [
    {
      id: 'sizes',
      title: 'Sizes and separators',
      rows: 'size',
      cols: 'separator',
      fixed: { page: 'Guide', current: 'page', underline: 'always' },
      caption: 'Compare type, spacing, and separators along the same path in each size.',
    },
    {
      id: 'underlines',
      title: 'Link underlines',
      rows: 'underline',
      fixed: { size: 'm', separator: 'slash', page: 'Guide' },
      caption: 'Hover or focus an ancestor link to compare the three underline policies.',
    },
    {
      id: 'current',
      title: 'Current location',
      rows: 'current',
      cols: 'underline',
      fixed: { page: 'Guide', size: 'm', separator: 'slash' },
      caption:
        'Compare the current page, permalink, and unavailable permalink in each underline mode.',
    },
  ],
  cases: [
    {
      id: 'anatomy',
      title: 'Path anatomy',
      kind: 'content',
      mode: 'live',
      caption:
        'Compare an icon root, an unlinked group, spacing between items, a single current page, and a current permalink beside plain ancestor links.',
      render: withOverlaySurface(BreadcrumbAnatomy, 'border-box'),
    },
    {
      id: 'states',
      title: 'Link states',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Hover, press, or Tab through the live links. Compare the available current permalink with an unavailable ancestor and an unavailable current permalink.',
      render: withOverlaySurface(BreadcrumbLinkStates, 'border-box'),
    },
    {
      id: 'wrapping',
      title: 'Narrow and long paths',
      kind: 'content',
      mode: 'live',
      caption:
        'Follow a deep path at up to 320 pixels. The separator stays with its item while a long identifier and current permalink wrap.',
      render: withOverlaySurface(BreadcrumbWrapping, 'border-box'),
    },
  ],
  compositions: [
    {
      id: 'overlay',
      title: 'Ancestor trail above a panel title',
      mode: 'live',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'The two ancestors remain links. The heading names the current document once on the floating surface.',
      render: ({ ctx }) => (
        <BreadcrumbOverlayExample
          workspaceHref={breadcrumbDestinations.workspace}
          runbooksHref={breadcrumbDestinations.runbooks}
          subject={ctx.subject}
        />
      ),
      code: overlaySource,
    },
  ],
});
