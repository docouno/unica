import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { ArchivePages } from './pagination-archive.examples.js';
import { paginationCode } from './pagination-code.js';
import {
  PaginationCollectionCase,
  PaginationCollectionComposition,
} from './pagination-collection.js';
import collectionSource from './pagination-collection.example.tsx?raw';
import { PaginationPlayground } from './pagination-playground.js';
import {
  Boundaries,
  Compact,
  NumberedWindow,
  PointerStates,
} from './pagination-studies.examples.js';

const props = {
  size: {
    kind: 'enum',
    group: 'Geometry',
    default: 'm',
    description: 'Size the page controls and their labels.',
    choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
  },
  format: {
    kind: 'enum',
    group: 'Geometry',
    default: 'auto',
    description: 'Show numbers when they fit or keep a compact position between the two arrows.',
    choices: [
      { value: 'auto', label: 'Automatic', omit: true },
      { value: 'pages', label: 'Numbered' },
      { value: 'compact', label: 'Compact' },
    ],
  },
  pageCount: {
    kind: 'number',
    group: 'Content',
    default: 12,
    description:
      'The total number of pages. Navigation appears for whole, safe counts of two or more.',
    examples: [1, 3, 12, 24],
  },
  defaultPage: {
    kind: 'number',
    group: 'Interaction',
    default: 1,
    description:
      'Set the starting page of an uncontrolled collection. Its page stays within the total.',
    examples: [1, 2, 12, 24],
  },
  page: {
    kind: 'enum',
    group: 'Interaction',
    default: 'uncontrolled',
    publicType: 'number',
    description:
      'A controlled value keeps the chosen page until its owner accepts a request. The collection footer accepts changes.',
    choices: [
      { value: 'uncontrolled', label: 'Uncontrolled', omit: true },
      { value: '1', code: '1' },
      { value: '4', code: '4' },
      { value: '12', code: '12' },
    ],
  },
  onPageChange: {
    kind: 'action',
    group: 'Interaction',
    publicType: '(page: number) => void',
    description: 'Receive a different page number requested by an available button.',
    code: 'handlePageChange',
  },
  label: {
    kind: 'string',
    group: 'Semantics',
    default: 'Pagination',
    description: 'Name the navigation landmark. A blank field uses the default name.',
    examples: ['Pagination', 'Document pages'],
  },
} as const satisfies PropSchema;

const windows = [
  { value: 'seven', label: 'Seven pages · all visible', count: 7, page: 4 },
  { value: 'eight', label: 'Eight pages · final run', count: 8, page: 5 },
  { value: 'start', label: '24 pages · start', count: 24, page: 1 },
  { value: 'middle', label: '24 pages · middle', count: 24, page: 12 },
  { value: 'end', label: '24 pages · end', count: 24, page: 24 },
  { value: 'long', label: '12,840 pages · five-digit slots', count: 12840, page: 999 },
] as const;

export type PaginationValues = ComponentValues<typeof props>;

export default defineComponent({
  id: 'pagination',
  title: 'Pagination',
  category: 'Navigation',
  status: 'Proto',
  componentName: 'Pagination',
  summary: 'Move through a collection with known page numbers and a stable navigation row.',
  props,
  code: paginationCode,
  render: withOverlaySurface(PaginationPlayground, 'border-box'),
  states: [
    {
      id: 'sizes',
      title: 'Control sizes',
      rows: 'size',
      cols: 'format',
      fixed: { pageCount: 3, defaultPage: 2 },
      caption:
        'Compare the numbered and compact controls at 30, 40, and 48 pixels. Touch targets are at least 44 pixels.',
    },
    {
      id: 'ranges',
      title: 'Numbered windows',
      rows: 'pageCount',
      cols: 'defaultPage',
      fixed: { size: 's', format: 'pages' },
      caption:
        'Compare starting positions across result sets. A single page needs no navigation. Starting beyond the range selects the last page.',
    },
  ],
  cases: [
    {
      id: 'states',
      title: 'Pointer and focus states',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Page 1 shows hover, page 2 combines current and focus, page 3 is pressed and page 4 shows focus on its own.',
      render: withOverlaySurface(PointerStates),
    },
    {
      id: 'boundaries',
      title: 'Keyboard focus at the boundaries',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Activate Next or Previous with Enter or Space. At either end the numbered row focuses the current page. The compact row focuses the remaining arrow.',
      reset: true,
      render: withOverlaySurface(Boundaries),
    },
    {
      id: 'compact',
      title: 'Compact in narrow columns',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Both rows switch to compact in a column up to 272px wide. Step through 24 pages or advance from 999 to 1000 in the large controls. The arrows hold their positions as the label grows.',
      reset: true,
      render: withOverlaySurface(Compact),
    },
    {
      id: 'windows',
      title: 'Numbered window edges',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Compare seven pages with the final run starting at page 5 of 8. Step through the start, middle and end of a 24-page collection, or cross 1000 in equal-width number slots.',
      controls: {
        window: {
          kind: 'enum',
          label: 'Starting window',
          default: 'seven',
          choices: windows,
        },
      },
      reset: true,
      render: withOverlaySurface(({ ctx }) => {
        const selected =
          windows.find((option) => option.value === ctx.story?.controls.window) ?? windows[0];
        return (
          <NumberedWindow
            key={selected.value}
            ctx={ctx}
            pageCount={selected.count}
            page={selected.page}
            size={selected.value === 'long' ? 'm' : 's'}
          />
        );
      }),
    },
    {
      id: 'links',
      title: 'Addressable pages',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Open a dated field note. Each page has an address you can bookmark or open in another tab.',
      render: ArchivePages,
    },
    {
      id: 'overlay',
      title: 'Inside a floating surface',
      kind: 'surface',
      mode: 'live',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'Page through the related documents on the floating surface. The result range follows the list.',
      render: PaginationCollectionCase,
    },
  ],
  compositions: [
    {
      id: 'context',
      title: 'Collection footer',
      mode: 'live',
      caption:
        'Step through the related documents. Pinned documents fit on one page, and the filtered collection has no results.',
      render: PaginationCollectionComposition,
      code: collectionSource.replaceAll('../../prototypes/', './prototypes/'),
    },
  ],
});
