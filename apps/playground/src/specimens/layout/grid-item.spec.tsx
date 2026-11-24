import { Box, Card, Grid, GridItem, Text } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { LayoutExample } from './layout.examples.js';
import { choiceProp, responsiveTracksType, trackOptions, viewportNote } from './layout.options.js';

const spanOptions = {
  ...trackOptions,
  Auto: undefined,
  'Desktop 6': { desktop: 6 },
} as const;

const placement = ['start start start start start start end end end end end end'];
const tracks = Object.keys(trackOptions);
const namedAreas = ['start', 'end'] as const;
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
    area: {
      kind: 'enum',
      group: 'Geometry',
      publicType: 'string',
      default: 'None',
      choices: [{ value: 'None', omit: true }, { value: 'start' }, { value: 'end' }],
      description: 'A name from the parent area map. This grid defines start and end.',
    },
    span: choiceProp(
      spanOptions,
      'Auto',
      'Occupy 1–12 tracks within the parent grid. Automatic placement uses one track.',
      responsiveTracksType,
    ),
  },
  constraints: namedAreas.map((area) => ({
    kind: 'forbidden',
    when: { area },
    affects: spanTargets,
    reason: 'Choose either a named area or a column span.',
  })),
  render: withOverlaySurface(({ ctx, values }) => {
    const itemProps =
      values.area === 'None' ? { span: spanOptions[values.span] } : { area: values.area };
    return (
      <LayoutExample>
        <Grid columns={12} gap={4} className="layout-track-markers" aria-hidden="true">
          {tracks.map((track) => (
            <Box key={track} />
          ))}
        </Grid>
        <Grid columns={12} gap={4} areas={values.area === 'None' ? undefined : placement}>
          <GridItem {...ctx.subject} {...itemProps}>
            <Text size="caption-l" align="center">
              A
            </Text>
          </GridItem>
        </Grid>
      </LayoutExample>
    );
  }),
  code: ({ area }, attributes) => {
    const map = area === 'None' ? '' : ` areas={${JSON.stringify(placement)}}`;
    return `<Grid columns={12} gap={4}${map}>
  <GridItem${attributes}><Text size="caption-l" align="center">A</Text></GridItem>
</Grid>`;
  },
  states: [
    {
      id: 'spans',
      title: 'Column spans',
      caption:
        'Compare the outline around A to the twelve track marks above it. The six-track responsive span starts at a viewport width of 1024px.',
      rows: 'span',
      fixed: { area: 'None' },
    },
    {
      id: 'areas',
      title: 'Named placement',
      caption:
        'Each named area occupies six tracks. Change the reading direction to see where the start and end of the row fall.',
      rows: 'area',
      fixed: { span: 'Auto' },
    },
  ],
  cases: [
    {
      id: 'responsive-span',
      title: 'An item spans two desktop tracks',
      kind: 'behavior',
      mode: 'live',
      caption:
        'At a viewport width of 1024px, the lead grows from one track to two and moves Details to the third track.',
      render: withOverlaySurface(({ ctx }) => (
        <LayoutExample>
          <Grid columns={3} gap={8}>
            <GridItem {...ctx.subject} span={{ desktop: 2 }} className="layout-cell">
              <Text as="span" size="body-s">
                Lead item
              </Text>
            </GridItem>
            <GridItem className="layout-cell">
              <Text as="span" size="body-s">
                Details
              </Text>
            </GridItem>
          </Grid>
        </LayoutExample>
      )),
    },
  ],
  compositions: [
    {
      id: 'two-column-lead',
      title: 'Featured release and history',
      mode: 'pinned',
      caption:
        'The featured release occupies two of the three columns. Its history summary takes the remaining column.',
      render: withOverlaySurface(({ ctx }) => (
        <Grid columns={3} gap={8}>
          <GridItem {...ctx.subject} span={2}>
            <Card size="s">
              <Text weight="semibold">Featured release</Text>
              <Text size="body-s">An updated navigation menu</Text>
            </Card>
          </GridItem>
          <GridItem>
            <Card size="s" variant="subtle">
              <Text weight="semibold">History</Text>
              <Text size="body-s">3 releases</Text>
            </Card>
          </GridItem>
        </Grid>
      )),
      code: `import '@docouno/unica/styles.css';
import { Card, Grid, GridItem, Text } from '@docouno/unica';

<Grid columns={3} gap={8}>
  <GridItem span={2}>
    <Card size="s">
      <Text weight="semibold">Featured release</Text>
      <Text size="body-s">An updated navigation menu</Text>
    </Card>
  </GridItem>
  <GridItem>
    <Card size="s" variant="subtle">
      <Text weight="semibold">History</Text>
      <Text size="body-s">3 releases</Text>
    </Card>
  </GridItem>
</Grid>`,
    },
  ],
});
