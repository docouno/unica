import { defineComponent } from '../../workbench/types.js';
import {
  BudgetTable,
  BuildQueue,
  EditorExamples,
  ReferenceIndex,
  RelationsDrawer,
  ResultExamples,
} from '../../prototypes/table/table.examples.js';

const densityNames = { s: 'Compact', m: 'Standard', l: 'Comfortable' };

export default defineComponent({
  id: 'table',
  title: 'Table',
  category: 'Data',
  status: 'Proto',
  summary: 'Compare records in a native table, from short references to sortable registries.',
  props: {
    size: {
      kind: 'enum',
      group: 'Table',
      description: 'The vertical density of the header and body rows.',
      default: 'm',
      choices: [
        { value: 's', label: densityNames.s },
        { value: 'm', label: densityNames.m },
        { value: 'l', label: densityNames.l },
      ],
    },
    striped: {
      kind: 'boolean',
      group: 'Table',
      description: 'Shade alternating body rows.',
      default: false,
    },
    align: {
      kind: 'enum',
      group: 'Request count column',
      description: 'Use the same alignment on the column heading and its cells.',
      default: 'end',
      choices: [{ value: 'start' }, { value: 'center' }, { value: 'end' }],
    },
    selected: {
      kind: 'boolean',
      group: 'Gateway row',
      description: 'Pin the selected visual state on the Gateway row.',
      default: false,
    },
  },
  render: ({ ctx, values }) => (
    <BudgetTable
      size={values.size}
      striped={values.striped}
      amountAlign={values.align}
      selected={values.selected}
      subjectAttributes={ctx.subject}
    />
  ),
  code: ({ size, striped, align, selected }) => `<TableScroll aria-labelledby="budget-caption">
  <Table${size !== 'm' ? ` size="${size}"` : ''}${striped ? ' striped' : ''}>
    <TableCaption id="budget-caption">${densityNames[size]} ${size.toUpperCase()}</TableCaption>
    <TableHeader>
      <TableRow>
        <TableColumnHeader>Service</TableColumnHeader>
        <TableColumnHeader align="center">Region</TableColumnHeader>
        <TableColumnHeader align="${align}">Requests</TableColumnHeader>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow${selected ? ' selected' : ''}>
        <TableRowHeader>Gateway</TableRowHeader>
        <TableCell align="center"><bdi>eu-west</bdi></TableCell>
        <TableCell align="${align}"><bdi>24,800</bdi></TableCell>
      </TableRow>
      <TableRow>
        <TableRowHeader>Object store</TableRowHeader>
        <TableCell align="center"><bdi>us-east</bdi></TableCell>
        <TableCell align="${align}"><bdi>1,260</bdi></TableCell>
      </TableRow>
    </TableBody>
    <TableFooter>
      <TableRow>
        <TableRowHeader colSpan={2}>Total</TableRowHeader>
        <TableCell align="${align}"><bdi>26,060</bdi></TableCell>
      </TableRow>
    </TableFooter>
  </Table>
</TableScroll>`,
  matrixViews: [
    {
      id: 'density',
      title: 'Density & alignment',
      rows: 'size',
    },
  ],
  cases: [
    {
      id: 'editors',
      title: 'Editable rows',
      caption: 'Edit a route or policy, then restore that row from its actions menu.',
      kind: 'behavior',
      mode: 'live',
      render: ({ ctx }) => <EditorExamples subjectAttributes={ctx.subject} />,
    },
    {
      id: 'queue',
      title: 'Sort, select & scroll',
      caption: 'Cycle a sort heading, select builds, or open the actions menu from a row.',
      kind: 'behavior',
      mode: 'live',
      render: () => <BuildQueue />,
    },
    {
      id: 'results',
      title: 'Loading, empty & error',
      caption: 'The preview control pins application-owned result states.',
      kind: 'behavior',
      mode: 'pinned',
      render: () => <ResultExamples />,
    },
    {
      id: 'drawer',
      title: 'Sticky header in a drawer',
      caption:
        'Scroll the linked documents to see the header cover moving rows against the overlay.',
      overlayStage: true,
      surface: 'overlay',
      kind: 'behavior',
      mode: 'live',
      render: () => <RelationsDrawer />,
    },
  ],
  usage: [
    {
      id: 'reference',
      title: 'Reference & pagination',
      mode: 'live',
      code: `<>
  <TableScroll aria-labelledby="references">
    <Table size="s">
      <TableCaption id="references">Recovery references</TableCaption>
      <TableHeader>
        <TableRow>
          <TableColumnHeader>Document</TableColumnHeader>
          <TableColumnHeader>Kind</TableColumnHeader>
          <TableColumnHeader align="end">Revised</TableColumnHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        {references.map(({ name, kind, revised }) => (
          <TableRow key={name}>
            <TableRowHeader>{name}</TableRowHeader>
            <TableCell>{kind}</TableCell>
            <TableCell align="end"><bdi>{revised}</bdi></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableScroll>
  <Pagination
    label="Recovery references pages"
    format="compact"
    page={page}
    pageCount={2}
    size="s"
    onPageChange={setPage}
  />
</>`,
      render: () => <ReferenceIndex />,
    },
  ],
});
