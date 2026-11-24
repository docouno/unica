import { Box, Card, Container, Grid, GridItem, Text } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { defineComponent } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { LayoutExample } from './layout.examples.js';
import {
  choiceProp,
  responsiveTracksType,
  spacingValues,
  trackOptions,
  viewportNote,
} from './layout.options.js';

const columnOptions = {
  ...trackOptions,
  Default: undefined,
  '1 / 2 / 3 / 4': { mobile: 1, tablet: 2, desktop: 3, wide: 4 },
} as const;

const areaOptions = {
  None: undefined,
  'Workspace map': ['nav body body', 'nav footer .'],
} as const;

const markers = [
  { area: 'nav', label: 'A' },
  { area: 'body', label: 'B' },
  { area: 'footer', label: 'C' },
] as const;

function LabeledCell({ children, area }: { children: string; area?: string }) {
  return (
    <GridItem area={area} className="layout-cell">
      <Text as="span" size="body-s">
        {children}
      </Text>
    </GridItem>
  );
}

function NestedGrid({ ctx }: PreviewProps) {
  return (
    <LayoutExample>
      <Grid {...ctx.subject} columns={{ tablet: 2, wide: 4 }} gap={8}>
        <LabeledCell>Topics</LabeledCell>
        <Grid gap={4} className="layout-outline">
          <LabeledCell>Notes</LabeledCell>
          <LabeledCell>History</LabeledCell>
        </Grid>
        <LabeledCell>People</LabeledCell>
        <LabeledCell>Settings</LabeledCell>
      </Grid>
    </LayoutExample>
  );
}

function WorkspaceMap({ ctx }: PreviewProps) {
  return (
    <LayoutExample>
      <Grid {...ctx.subject} gap={8} areas={areaOptions['Workspace map']}>
        <LabeledCell area="nav">Topics</LabeledCell>
        <LabeledCell area="body">Notes</LabeledCell>
        <LabeledCell area="footer">History</LabeledCell>
        <LabeledCell>Index</LabeledCell>
      </Grid>
    </LayoutExample>
  );
}

const queues = [
  { label: 'Drafts', count: 12 },
  { label: 'In review', count: 4 },
  { label: 'Ready', count: 8 },
];

function ResponsiveOverview({ ctx }: PreviewProps) {
  return (
    <Container size="l">
      <Grid {...ctx.subject} columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap={8}>
        {queues.map(({ label, count }) => (
          <GridItem key={label}>
            <Card size="s">
              <Text size="body-s" color="secondary">
                {label}
              </Text>
              <Text weight="semibold">{count}</Text>
            </Card>
          </GridItem>
        ))}
      </Grid>
    </Container>
  );
}

export default defineComponent({
  id: 'grid',
  title: 'Grid',
  category: 'Layout',
  status: 'UI',
  summary: 'Equal-width columns with optional named areas. ' + viewportNote,
  props: {
    columns: choiceProp(
      columnOptions,
      'Default',
      'One to twelve explicit columns. Omit the count to use the area map width, or one column without a map.',
      responsiveTracksType,
    ),
    gap: choiceProp(spacingValues, '0', 'Space between rows and columns.', 'Responsive<Spacing>'),
    flow: {
      kind: 'enum',
      group: 'Geometry',
      choices: [{ value: 'row' }, { value: 'column' }],
      default: 'row',
      description: 'Place unassigned items by row or by column.',
    },
    areas: choiceProp(
      areaOptions,
      'None',
      'Use one string per row. Named cells form rectangles and dots leave cells open for automatic placement.',
      'readonly string[]',
    ),
  },
  constraints: [
    {
      kind: 'forbidden',
      when: { areas: 'Workspace map' },
      affects: Object.keys(columnOptions)
        .filter((value) => value !== 'Default' && value !== '3')
        .map((value) => ({ key: 'columns', value })),
      reason: 'The workspace map has three tracks. Omit columns to infer the count, or use 3.',
    },
  ],
  render: withOverlaySurface(({ ctx, values }) => (
    <Box className="layout-example" style={{ overflowX: 'auto' }}>
      <Grid
        {...ctx.subject}
        columns={columnOptions[values.columns]}
        gap={values.gap === '0' ? undefined : spacingValues[values.gap]}
        flow={values.flow === 'row' ? undefined : values.flow}
        areas={areaOptions[values.areas]}
      >
        {markers.map(({ area, label }) => (
          <GridItem
            key={area}
            area={values.areas === 'None' ? undefined : area}
            className="layout-outline"
          >
            <Text size="body-s" align="center">
              {label}
            </Text>
          </GridItem>
        ))}
      </Grid>
    </Box>
  )),
  code: ({ areas }, attributes) => {
    const items = markers.map(({ area, label }) => {
      const placement = areas === 'None' ? '' : ` area="${area}"`;
      return `  <GridItem${placement}><Text size="body-s" align="center">${label}</Text></GridItem>`;
    });
    return `<Grid${attributes}>\n${items.join('\n')}\n</Grid>`;
  },
  states: [
    {
      id: 'columns-gap',
      title: 'Equal-width tracks',
      caption:
        'Compare the width of A, B, and C as the number of explicit columns grows. Unoccupied columns still take up space.',
      rows: 'columns',
      fixed: { gap: '0' },
    },
    {
      id: 'gap',
      title: 'Row and column gaps',
      caption: 'The same gap separates A from B horizontally and A from C vertically.',
      rows: 'gap',
      fixed: { columns: '2' },
    },
    {
      id: 'areas-flow',
      title: 'Automatic placement',
      caption:
        'With two explicit columns, row flow places C on a second row. Column flow creates an implicit third column for C.',
      rows: 'flow',
      fixed: { columns: '2', gap: '8' },
    },
  ],
  cases: [
    {
      id: 'responsive-nesting',
      title: 'Sparse breakpoints and nested grids',
      kind: 'behavior',
      mode: 'live',
      caption:
        'The outer grid moves from one to two to four columns at viewport widths of 768 and 1440px. The inner grid keeps Notes and History in one column.',
      render: withOverlaySurface(NestedGrid),
    },
    {
      id: 'workspace-map',
      title: 'Named areas and an open cell',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Topics spans two rows, and Notes spans two columns. The unassigned Index fills the open cell beside History.',
      render: withOverlaySurface(WorkspaceMap),
    },
  ],
  compositions: [
    {
      id: 'overview',
      title: 'Responsive queue overview',
      mode: 'live',
      caption:
        'Queue totals stay in reading order as the overview switches from one column to two at 768px and three at 1024px.',
      render: withOverlaySurface(ResponsiveOverview),
      code: `import '@docouno/unica/styles.css';
import { Card, Container, Grid, GridItem, Text } from '@docouno/unica';

<Container size="l">
  <Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap={8}>
${queues
  .map(
    ({ label, count }) => `    <GridItem>
      <Card size="s">
        <Text size="body-s" color="secondary">${label}</Text>
        <Text weight="semibold">${count}</Text>
      </Card>
    </GridItem>`,
  )
  .join('\n')}
  </Grid>
</Container>`,
    },
  ],
});
