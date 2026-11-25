import { defineComponent } from '../../workbench/types.js';
import { choice, eventProp, toggle } from '../control-props.js';
import { DocumentList } from './document-list.js';
import documentSource from './document-list.tsx?raw';
import proseSource from './credential-notes.tsx?raw';
import {
  LiveRows,
  OverflowExamples,
  ProseExamples,
  SizeExamples,
  StateExamples,
} from './list.examples.js';

const documents = documentSource
  .replace('../../prototypes/', './prototypes/')
  .replace('export function DocumentList', 'function DocumentList');

export default defineComponent({
  id: 'list',
  title: 'List & ListItem',
  category: 'Data',
  status: 'Proto',
  summary: 'Native lists for running text and structured rows with independent actions.',
  props: {
    size: choice(
      'Geometry',
      'Vertical density of each row. This example uses M. Omit size to inherit the surrounding typography.',
      ['s', 'm', 'l'],
      'm',
    ),
    markers: toggle(
      'Geometry',
      'Show native list markers. This example hides them for record rows. List shows markers by default.',
    ),
    dividers: toggle('Geometry', 'Draw a rule between adjacent visible items.'),
    onOpen: {
      ...eventProp(
        'The sample row command selects the document and reports its title. Attach onClick to ListItem.action.',
        '(title) => console.log(title)',
      ),
      demo: true,
    },
  },
  code: (values) => `${documents}

export function ProjectDocuments() {
  return <DocumentList listProps={${JSON.stringify({ size: values.size, markers: values.markers, dividers: values.dividers })}} />;
}`,
  render: ({ values, ctx }) => (
    <DocumentList
      subject={ctx.subject}
      surface={ctx.surface}
      listProps={{ size: values.size, markers: values.markers, dividers: values.dividers }}
      onOpen={ctx.action('onOpen')}
    />
  ),
  states: [
    {
      id: 'sizes',
      title: 'Row sizes',
      rows: 'size',
      group: 'dividers',
      caption:
        'Compare S, M and L commands in each divider group. Activate a row to read its document. Row anatomy shows how icons, avatars and trailing facts align at the same sizes.',
    },
  ],
  cases: [
    {
      id: 'anatomy',
      title: 'Row anatomy',
      mode: 'pinned',
      kind: 'content',
      caption:
        'Compare six static records at compact, standard and spacious sizes. A reserved leading column aligns text with adjacent media, and the trailing fact wraps below when space is limited.',
      render: SizeExamples,
    },
    {
      id: 'states',
      title: 'Action states',
      mode: 'live',
      kind: 'behavior',
      reset: true,
      caption:
        'Hover, press and current-link focus are pinned for comparison. Follow the links to their local details or activate Verify connection for a sample result. Tab to Request access beside the unavailable archive.',
      render: StateExamples,
    },
    {
      id: 'overflow',
      title: 'Long labels and trailing content',
      mode: 'live',
      kind: 'content',
      reset: true,
      caption:
        'Open the retention review for its summary or assign Platform operations with the separate trailing button. The full destination identifier wraps within the available width.',
      render: OverflowExamples,
    },
    {
      id: 'controls',
      title: 'Independent row actions',
      mode: 'live',
      kind: 'behavior',
      reset: true,
      caption:
        'Toggle export notifications. Tab from Credential handoff to its actions to get the local link or pin the notes. Verify connection shows the sample result in its own row.',
      render: ({ ctx }) => <LiveRows subject={ctx.subject} surface={ctx.surface} />,
    },
    {
      id: 'overlay',
      title: 'Rows on a floating surface',
      surface: 'overlay',
      overlayStage: true,
      mode: 'live',
      kind: 'surface',
      reset: true,
      caption:
        'Compare the same configuration list on a floating surface and a base card. Each owner keeps its own notifications, pinned notes and verification result.',
      render: ({ ctx }) => <LiveRows subject={ctx.subject} surface={ctx.surface} />,
    },
  ],
  compositions: [
    {
      id: 'prose',
      title: 'Prose and numbering',
      mode: 'live',
      caption:
        'Follow the handoff notes link within this credential guide. Compare nested bullets, checks numbered 12–14, a reversed audit sequence with an ordinal override, and a markerless list.',
      code: proseSource.replace('../../prototypes/', './prototypes/'),
      render: ProseExamples,
    },
  ],
});
