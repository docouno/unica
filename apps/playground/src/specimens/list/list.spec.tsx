import { List, ListItem } from '../../prototypes/list/list.proto.js';
import { defineComponent } from '../../workbench/types.js';

const { LiveRows, OverflowExamples, ProseExamples, SizeExamples, StateExamples } =
  await import('../../prototypes/list/list.examples.js');

export default defineComponent({
  id: 'list',
  title: 'List & ListItem',
  category: 'Data',
  status: 'Proto',
  summary: 'Native lists for running text and structured rows with independent actions.',
  props: {
    size: {
      kind: 'enum',
      group: 'Layout',
      default: 'm',
      description: 'Vertical density of list entries.',
      choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    markers: {
      kind: 'boolean',
      group: 'Layout',
      default: false,
      description: 'Keep the native list marker visible.',
    },
    dividers: {
      kind: 'boolean',
      group: 'Layout',
      default: false,
      description: 'Draw a rule between adjacent items.',
    },
    onOpen: {
      kind: 'action',
      group: 'Events',
      description: 'Report the selected list command.',
      code: 'handleOpen',
    },
  },
  code: (
    values,
  ) => `<List size="${values.size}"${values.markers ? '' : ' markers={false}'}${values.dividers ? ' dividers' : ''}>
  <ListItem title="Launch plan" action={{ onClick: handleOpen }} />
  <ListItem title="Review notes" action={{ onClick: handleOpen }} />
</List>`,
  render: ({ values, ctx }) => (
    <List {...ctx.subject} size={values.size} markers={values.markers} dividers={values.dividers}>
      <ListItem
        title="Launch plan"
        action={{ onClick: () => ctx.action('onOpen')('Launch plan') }}
      />
      <ListItem
        title="Review notes"
        action={{ onClick: () => ctx.action('onOpen')('Review notes') }}
      />
    </List>
  ),
  matrixViews: [
    {
      id: 'sizes',
      title: 'Row sizes',
      rows: 'size',
      cols: 'dividers',
      reference: () => <SizeExamples />,
    },
  ],
  cases: [
    {
      id: 'states',
      title: 'Action states',
      caption: 'Main-area states are pinned. Use Tab to focus the Request access button.',
      kind: 'behavior',
      render: () => <StateExamples />,
    },
    {
      id: 'overflow',
      title: 'Long labels and trailing content',
      kind: 'content',
      render: () => <OverflowExamples />,
    },
    {
      id: 'controls',
      title: 'Independent row actions',
      caption:
        'The trailing slot holds the switch and menu trigger. Tab from the row link to its menu.',
      kind: 'behavior',
      render: () => <LiveRows />,
    },
    {
      id: 'overlay',
      title: 'Rows on a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <LiveRows overlay />,
    },
  ],
  usage: [
    {
      id: 'prose',
      title: 'Prose and numbering',
      caption: 'Nested markers, continued and reversed numbering, and a markerless text list.',
      code: `<List as="ol" start={12} aria-label="Final checks">
  <ListItem>Run one export using the new credential.</ListItem>
  <ListItem>Disable the old key after the export succeeds.</ListItem>
  <ListItem>Leave a note for the next on-call maintainer.</ListItem>
</List>`,
      render: () => <ProseExamples />,
    },
  ],
});
