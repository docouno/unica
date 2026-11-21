import { Container, Grid, GridItem } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { LayoutExample } from './layout.examples.js';
import { choiceProp, spacingOptions, trackOptions, viewportNote } from './layout.options.js';

const columnOptions = {
  ...trackOptions,
  Default: undefined,
  '1 / 2 / 3 / 4': { mobile: 1, tablet: 2, desktop: 3, wide: 4 },
} as const;

const areaOptions = {
  None: undefined,
  'Workspace map': ['nav body body', 'nav footer .'],
} as const;

const flowOptions = { row: 'row', column: 'column' } as const;
const labels = [
  { area: 'nav', text: 'Topics' },
  { area: 'body', text: 'Release notes' },
  { area: 'footer', text: 'History' },
] as const;

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
      '1–12 tracks. Use one or the map width by default.',
    ),
    gap: choiceProp(spacingOptions, 'Default', 'Space between tracks. Defaults to 0.'),
    flow: choiceProp(flowOptions, 'row', 'Fill by row by default or switch to column.'),
    areas: choiceProp(
      areaOptions,
      'None',
      'A fixed map with one string per row and dots for empty cells.',
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
  render: ({ ctx, values }) => (
    <LayoutExample>
      <Grid
        {...ctx.subject}
        columns={columnOptions[values.columns]}
        gap={spacingOptions[values.gap]}
        flow={values.flow === 'row' ? undefined : flowOptions[values.flow]}
        areas={areaOptions[values.areas]}
      >
        {labels.map(({ area, text }) => (
          <GridItem
            key={area}
            area={values.areas === 'None' ? undefined : area}
            className="layout-cell"
          >
            <span>{text}</span>
          </GridItem>
        ))}
      </Grid>
    </LayoutExample>
  ),
  code: ({ areas }, attributes) => {
    const items = labels
      .map(({ area, text }) => {
        const placement = areas === 'None' ? '' : ` area="${area}"`;
        return `  <GridItem${placement}><span>${text}</span></GridItem>`;
      })
      .join('\n');
    return `<Grid${attributes}>\n${items}\n</Grid>`;
  },
  matrixViews: [
    {
      id: 'columns-gap',
      title: 'Tracks and spacing',
      rows: 'columns',
      cols: 'gap',
      fixed: { areas: 'None' },
    },
    {
      id: 'areas-flow',
      title: 'Named areas and placement',
      rows: 'areas',
      cols: 'flow',
      fixed: { columns: 'Default', gap: 's' },
    },
  ],
  cases: [
    {
      id: 'responsive-nesting',
      title: 'Sparse breakpoints and nested grids',
      kind: 'behavior',
      mode: 'live',
      caption:
        'The outer grid moves from one to two to four columns at 768 and 1440 px. The inner grid keeps one column.',
      render: ({ ctx }) => (
        <LayoutExample>
          <Grid {...ctx.subject} columns={{ tablet: 2, wide: 4 }} gap="s">
            <GridItem className="layout-cell">
              <span>Topics</span>
            </GridItem>
            <div>
              <Grid gap="xs" className="layout-outline">
                <GridItem className="layout-cell">
                  <span>Notes</span>
                </GridItem>
                <GridItem className="layout-cell">
                  <span>History</span>
                </GridItem>
              </Grid>
            </div>
            <GridItem className="layout-cell">
              <span>People</span>
            </GridItem>
            <GridItem className="layout-cell">
              <span>Settings</span>
            </GridItem>
          </Grid>
        </LayoutExample>
      ),
    },
    {
      id: 'workspace-map',
      title: 'Named areas across rows and columns',
      kind: 'behavior',
      render: ({ ctx }) => (
        <LayoutExample>
          <Grid {...ctx.subject} gap="s" areas={areaOptions['Workspace map']}>
            {labels.map(({ area, text }) => (
              <GridItem key={area} area={area} className="layout-cell">
                <span>{text}</span>
              </GridItem>
            ))}
          </Grid>
        </LayoutExample>
      ),
    },
  ],
  usage: [
    {
      id: 'overview',
      title: 'Responsive overview',
      render: ({ ctx }) => (
        <LayoutExample>
          <Container size="l">
            <Grid {...ctx.subject} columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="s">
              <GridItem className="layout-cell">
                <span>Overview</span>
              </GridItem>
              <GridItem className="layout-cell">
                <span>Queue</span>
              </GridItem>
              <GridItem className="layout-cell">
                <span>Exceptions</span>
              </GridItem>
            </Grid>
          </Container>
        </LayoutExample>
      ),
      code: `import '@docouno/unica/styles.css';
import { Container, Grid, GridItem } from '@docouno/unica';

<Container size="l">
  <Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="s">
    <GridItem><span>Overview</span></GridItem>
    <GridItem><span>Queue</span></GridItem>
    <GridItem><span>Exceptions</span></GridItem>
  </Grid>
</Container>`,
    },
  ],
});
