import { defineComponent } from '../../workbench/types.js';
import { toggle } from '../control-props.js';
import { ExampleSurface } from '../shared/example-surface.js';
import { BuildQueue, EditorExamples, RelationsDrawer, ResultExamples } from './table.examples.js';
import { ReferenceIndex } from './recovery-references.js';
import referenceSource from './recovery-references.tsx?raw';
import { RequestCounts } from './request-counts.js';
import requestSource from './request-counts.tsx?raw';

const densityNames = { s: 'Compact', m: 'Standard', l: 'Comfortable' };
const requests = requestSource
  .replace('../../prototypes/', './prototypes/')
  .replace('export function RequestCounts', 'function RequestCounts');

export default defineComponent({
  id: 'table',
  title: 'Table',
  category: 'Data',
  status: 'Proto',
  summary: 'Compare records in a native table, from short references to sortable registries.',
  props: {
    size: {
      kind: 'enum',
      group: 'Geometry',
      description: 'Vertical density of the table header and body rows.',
      default: 'm',
      choices: [
        { value: 's', label: densityNames.s },
        { value: 'm', label: densityNames.m },
        { value: 'l', label: densityNames.l },
      ],
    },
    striped: toggle('Geometry', 'Shade alternating visible body rows.'),
    align: {
      kind: 'enum',
      group: 'Geometry',
      description:
        'Alignment on TableColumnHeader and TableCell. This example aligns the request counts and their heading at the logical end by default.',
      default: 'end',
      choices: [{ value: 'start' }, { value: 'center' }, { value: 'end' }],
    },
    selected: toggle(
      'Interaction',
      'TableRow selection paint. This example pins the Gateway row. The Build queue study connects the paint to a working checkbox.',
    ),
  },
  render: ({ ctx, values }) => (
    <ExampleSurface surface={ctx.surface}>
      <RequestCounts
        subject={ctx.subject}
        tableProps={{ size: values.size, striped: values.striped }}
        amountProps={{ align: values.align }}
        selected={values.selected}
      />
    </ExampleSurface>
  ),
  code: ({ size, striped, align, selected }) => `${requests}

export function ServiceRequests() {
  return <RequestCounts tableProps={${JSON.stringify({ size, striped })}} amountProps={${JSON.stringify({ align })}} selected={${selected}} />;
}`,
  states: [
    {
      id: 'density',
      title: 'Density & alignment',
      group: 'size',
      caption:
        'Compare the same service counts at compact, standard and comfortable densities. Region names are centered, and request counts line up with the total. Scroll the table locally if a narrow viewport cannot fit all three columns. Touch layouts can raise the minimum row height.',
    },
  ],
  cases: [
    {
      id: 'editors',
      title: 'Editable rows',
      caption:
        'Edit a route or policy at any density. Copy its path or restore the row from its actions menu. The system route keeps its read-only path and locked policy.',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      render: EditorExamples,
    },
    {
      id: 'queue',
      title: 'Sort, select & scroll',
      caption:
        'Cycle Service or Time through ascending, descending and source order. Select eligible builds individually or together. The row menu can pin a build or copy its version; scroll within the queue to reach every row and action.',
      kind: 'behavior',
      mode: 'live',
      controls: { striped: { kind: 'boolean', label: 'Stripe rows', default: true } },
      reset: true,
      render: ({ ctx }) => (
        <BuildQueue
          subject={ctx.subject}
          surface={ctx.surface}
          striped={ctx.story?.controls.striped === true}
        />
      ),
    },
    {
      id: 'results',
      title: 'Loading, empty & error',
      caption:
        'Compare three simulated branch-check responses under the same columns. Retry switches all previews from a failed request to the loading state for inspection.',
      kind: 'behavior',
      mode: 'live',
      controls: {
        result: {
          kind: 'enum',
          label: 'Preview result',
          default: 'empty',
          choices: [
            { value: 'empty', label: 'No matches' },
            { value: 'loading', label: 'Loading' },
            { value: 'error', label: 'Request failed' },
          ],
        },
      },
      render: ResultExamples,
    },
    {
      id: 'drawer',
      title: 'Sticky header in a drawer',
      caption:
        'Scroll the linked documents under the fixed header. Close the drawer and reopen it from the same workspace.',
      overlayStage: true,
      surface: 'overlay',
      kind: 'surface',
      mode: 'live',
      reset: true,
      render: RelationsDrawer,
    },
  ],
  compositions: [
    {
      id: 'reference',
      title: 'Reference & pagination',
      mode: 'live',
      reset: true,
      caption:
        'Use the pagination below the table to browse six recovery documents. Open the failover runbook from its row. The standalone example includes a local excerpt and accepts a link to the full document.',
      code: referenceSource.replaceAll('../../prototypes/', './prototypes/'),
      render: ({ ctx }) => (
        <div style={{ inlineSize: 'min(100%, 47rem)' }}>
          <ExampleSurface surface={ctx.surface}>
            <ReferenceIndex subject={ctx.subject} documentHref="?item=04-document-reader" />
          </ExampleSurface>
        </div>
      ),
    },
  ],
});
