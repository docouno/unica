import { Container, Stack, Text, Title } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { choiceProp, spacingValues, viewportNote } from './layout.options.js';
import './layout.examples.css';

const sizeOptions = {
  s: 's',
  m: 'm',
  l: 'l',
  'Mobile s · Desktop m · Wide l': { mobile: 's', desktop: 'm', wide: 'l' },
} as const;

export default defineComponent({
  id: 'container',
  title: 'Container',
  category: 'Layout',
  status: 'UI',
  summary: 'A fluid content column with a maximum width and logical gutters. ' + viewportNote,
  props: {
    size: {
      ...choiceProp(
        sizeOptions,
        'm',
        'Maximum widths are 720, 960 and 1280px for s, m and l.',
        'Geometry',
      ),
      publicType: "Responsive<'s' | 'm' | 'l'>",
    },
    gutter: {
      ...choiceProp(
        spacingValues,
        '16',
        'Space inside both inline edges of the column.',
        'Geometry',
      ),
      publicType: 'Responsive<Spacing>',
    },
    centered: {
      kind: 'boolean',
      group: 'Geometry',
      default: true,
      description: 'Center the column when space is available. False aligns it to inline start.',
    },
  },
  render: ({ ctx, values }) => (
    <div className="layout-example layout-container-frame">
      <Container
        {...ctx.subject}
        size={values.size === 'm' ? undefined : sizeOptions[values.size]}
        gutter={values.gutter === '16' ? undefined : spacingValues[values.gutter]}
        centered={values.centered}
      >
        <Text as="span" size="body-s" className="layout-demo-tile">
          Document content
        </Text>
      </Container>
    </div>
  ),
  code: (_, attributes) => `<Container${attributes}>
  <Text as="span" size="body-s">Document content</Text>
</Container>`,
  states: [
    {
      id: 'size-alignment',
      title: 'Centered widths',
      caption: 'Use a 1440 px artboard in one theme to compare the width limits.',
      group: 'size',
      fixed: { centered: true },
    },
    {
      id: 'inline-start-widths',
      title: 'Widths at inline start',
      caption: 'Use a 1440 px artboard in one theme to see the free space at inline end.',
      group: 'size',
      fixed: { centered: false },
    },
  ],
  cases: [
    {
      id: 'rtl-alignment',
      title: 'Inline start in RTL',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Both columns fill a narrow frame. When more than 720px is available, the first stays against the right edge and the second has equal margins.',
      render: ({ ctx }) => (
        <div className="layout-cases" dir="rtl">
          <div className="layout-example layout-container-frame">
            <Container {...ctx.subject} size="s" centered={false}>
              <Text as="span" size="body-s" className="layout-demo-tile">
                Inline start
              </Text>
            </Container>
          </div>
          <div className="layout-example layout-container-frame">
            <Container size="s" className="layout-outline">
              <Text as="span" size="body-s" className="layout-demo-tile">
                Centered
              </Text>
            </Container>
          </div>
        </div>
      ),
    },
    {
      id: 'narrow-gutter',
      title: 'Fluid width with a fixed gutter',
      kind: 'content',
      mode: 'pinned',
      caption:
        'The two 16px gutters fit inside the column, even when its frame narrows below 360px.',
      width: 360,
      render: ({ ctx }) => (
        <div className="layout-example layout-container-frame">
          <Container {...ctx.subject} size="l" gutter={16}>
            <Text as="span" size="body-s" className="layout-demo-tile">
              Document content
            </Text>
          </Container>
        </div>
      ),
    },
  ],
  compositions: [
    {
      id: 'document',
      title: 'A bounded document column',
      mode: 'pinned',
      caption:
        'The reading column stops at 720px. Its inline gutter grows from 8px to 24px at the tablet viewport breakpoint.',
      render: ({ ctx }) => (
        <div className="layout-example layout-container-frame">
          <Container {...ctx.subject} size="s" gutter={{ mobile: 8, tablet: 24 }}>
            <Stack gap={8}>
              <Title as="h3" size="heading-s">
                Release notes
              </Title>
              <Text size="body-s">Review changes to the publishing workflow.</Text>
            </Stack>
          </Container>
        </div>
      ),
      code: `<Container size="s" gutter={{ mobile: 8, tablet: 24 }}>
  <Stack gap={8}>
    <Title as="h3" size="heading-s">Release notes</Title>
    <Text size="body-s">Review changes to the publishing workflow.</Text>
  </Stack>
</Container>`,
    },
  ],
});
