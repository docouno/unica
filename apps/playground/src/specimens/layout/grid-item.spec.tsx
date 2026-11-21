import { Grid, GridItem } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { LayoutExample } from './layout.examples.js';
import { choiceProp, trackOptions, viewportNote } from './layout.options.js';

const areaOptions = { None: undefined, start: 'start', end: 'end' } as const;
const spanOptions = {
  ...trackOptions,
  Auto: undefined,
  'Desktop 6': { desktop: 6 },
} as const;

const placement = ['start start start start start start end end end end end end'];
const tracks = Object.keys(trackOptions);
const spanTargets = Object.keys(spanOptions)
  .filter((value) => value !== 'Auto')
  .map((value) => ({ key: 'span', value }));

export default defineComponent({
  id: 'grid-item',
  title: 'GridItem',
  category: 'Layout',
  status: 'UI',
  summary: 'Span columns or occupy one named area in a parent Grid. ' + viewportNote,
  props: {
    area: choiceProp(
      areaOptions,
      'None',
      'Use a name from the parent map. This example offers start and end.',
    ),
    span: choiceProp(spanOptions, 'Auto', 'Span 1–12 available columns. Defaults to one track.'),
  },
  constraints: ['start', 'end'].map((area) => ({
    kind: 'forbidden',
    when: { area },
    affects: spanTargets,
    reason: 'Choose either a named area or a column span.',
  })),
  render: ({ ctx, values }) => {
    const itemProps =
      values.area === 'None'
        ? { span: spanOptions[values.span] }
        : { area: areaOptions[values.area] };
    return (
      <LayoutExample>
        <Grid columns={12} gap="xs" className="layout-track-markers">
          {tracks.map((track) => (
            <div key={track} aria-hidden="true" />
          ))}
        </Grid>
        <Grid columns={12} gap="xs" areas={values.area === 'None' ? undefined : placement}>
          <GridItem {...ctx.subject} {...itemProps}>
            <div
              aria-hidden="true"
              style={{ minBlockSize: '2rem', background: 'var(--bg-surface-raised)' }}
            />
          </GridItem>
        </Grid>
      </LayoutExample>
    );
  },
  code: ({ area }, attributes) => {
    const map = area === 'None' ? '' : ` areas={${JSON.stringify(placement)}}`;
    return `<Grid columns={12} gap="xs"${map}>
  <GridItem${attributes}>
    <div aria-hidden="true" style={{ minBlockSize: '2rem', background: 'var(--bg-surface-raised)' }} />
  </GridItem>
</Grid>`;
  },
  matrixViews: [
    { id: 'spans', title: 'Column spans', rows: 'span', fixed: { area: 'None' } },
    { id: 'areas', title: 'Named placement', rows: 'area', fixed: { span: 'Auto' } },
  ],
  cases: [
    {
      id: 'responsive-span',
      title: 'An item spans two desktop tracks',
      kind: 'behavior',
      mode: 'live',
      caption: 'At 1024 px browser width, the lead item grows from one track to two.',
      render: ({ ctx }) => (
        <LayoutExample>
          <Grid columns={3} gap="s">
            <GridItem {...ctx.subject} span={{ desktop: 2 }} className="layout-cell">
              <span>Lead item</span>
            </GridItem>
            <GridItem className="layout-cell">
              <span>Details</span>
            </GridItem>
          </Grid>
        </LayoutExample>
      ),
    },
  ],
  usage: [
    {
      id: 'two-column-lead',
      title: 'Lead item across two columns',
      render: ({ ctx }) => (
        <LayoutExample>
          <Grid columns={3} gap="s">
            <GridItem {...ctx.subject} span={2} className="layout-cell">
              <span>Featured release</span>
            </GridItem>
            <GridItem className="layout-cell">
              <span>History</span>
            </GridItem>
          </Grid>
        </LayoutExample>
      ),
      code: `import '@docouno/unica/styles.css';
import { Grid, GridItem } from '@docouno/unica';

<Grid columns={3} gap="s">
  <GridItem span={2}><span>Featured release</span></GridItem>
  <GridItem><span>History</span></GridItem>
</Grid>`,
    },
  ],
});
