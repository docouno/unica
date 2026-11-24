import { Box, Stack, Text, Title } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { LayoutExample } from './layout.examples.js';
import { choiceProp, spacingOptions, viewportNote } from './layout.options.js';

const elements = [
  'div',
  'span',
  'section',
  'article',
  'aside',
  'main',
  'header',
  'footer',
  'nav',
] as const;

const displayOptions = {
  Native: undefined,
  block: 'block',
  inline: 'inline',
  'inline-block': 'inline-block',
  'flow-root': 'flow-root',
  none: 'none',
  'Tablet block': { tablet: 'block' },
} as const;

const spacing = (description: string) => ({
  ...choiceProp(spacingOptions, 'Default', description, 'Geometry'),
  publicType: 'Responsive<Spacing>',
});

export default defineComponent({
  id: 'box',
  title: 'Box',
  category: 'Layout',
  status: 'UI',
  summary: 'Logical padding and margins on a native element. ' + viewportNote,
  props: {
    as: {
      kind: 'enum',
      group: 'Host',
      default: 'div',
      choices: elements.map((value) => ({ value })),
      description: 'Native root element. The default is div.',
    },
    hidden: {
      kind: 'boolean',
      group: 'Availability',
      default: false,
      description: 'Native boolean hidden attribute.',
    },
    display: {
      ...choiceProp(
        displayOptions,
        'Native',
        'Display mode. Omit it to follow the native tag.',
        'Geometry',
      ),
      publicType: "Responsive<'block' | 'inline' | 'inline-block' | 'flow-root' | 'none'>",
    },
    padding: spacing('Inside spacing on all sides.'),
    paddingInline: spacing('Inside spacing on the inline axis.'),
    paddingBlock: spacing('Inside spacing on the block axis.'),
    paddingInlineStart: spacing('Inside spacing at inline start.'),
    paddingInlineEnd: spacing('Inside spacing at inline end.'),
    paddingBlockStart: spacing('Inside spacing at block start.'),
    paddingBlockEnd: spacing('Inside spacing at block end.'),
    margin: spacing('Outside spacing on all sides.'),
    marginInline: spacing('Outside spacing on the inline axis.'),
    marginBlock: spacing('Outside spacing on the block axis.'),
    marginInlineStart: spacing('Outside spacing at inline start.'),
    marginInlineEnd: spacing('Outside spacing at inline end.'),
    marginBlockStart: spacing('Outside spacing at block start.'),
    marginBlockEnd: spacing('Outside spacing at block end.'),
  },
  constraints: [
    {
      kind: 'forbidden',
      when: { as: 'main' },
      affects: ['as'],
      reason: 'The Workbench already has a main landmark. See the standalone page in Compositions.',
    },
    {
      kind: 'ignored',
      when: { hidden: true },
      affects: ['display'],
      reason: 'The native hidden attribute takes the element out of the layout.',
    },
    {
      kind: 'precedence',
      when: { paddingInlineStart: '0' },
      affects: [{ key: 'paddingInline', value: '16' }],
      reason: 'Inline-start padding takes priority over the inline axis at that edge.',
    },
  ],
  render: ({ ctx, values }) => (
    <LayoutExample>
      <div>
        Start{' '}
        <Box
          {...ctx.subject}
          as={values.as}
          display={displayOptions[values.display]}
          hidden={values.hidden}
          padding={spacingOptions[values.padding]}
          paddingInline={spacingOptions[values.paddingInline]}
          paddingBlock={spacingOptions[values.paddingBlock]}
          paddingInlineStart={spacingOptions[values.paddingInlineStart]}
          paddingInlineEnd={spacingOptions[values.paddingInlineEnd]}
          paddingBlockStart={spacingOptions[values.paddingBlockStart]}
          paddingBlockEnd={spacingOptions[values.paddingBlockEnd]}
          margin={spacingOptions[values.margin]}
          marginInline={spacingOptions[values.marginInline]}
          marginBlock={spacingOptions[values.marginBlock]}
          marginInlineStart={spacingOptions[values.marginInlineStart]}
          marginInlineEnd={spacingOptions[values.marginInlineEnd]}
          marginBlockStart={spacingOptions[values.marginBlockStart]}
          marginBlockEnd={spacingOptions[values.marginBlockEnd]}
        >
          <Text as="span" size="body-s" className="layout-demo-tile">
            Content
          </Text>
        </Box>{' '}
        End
      </div>
    </LayoutExample>
  ),
  code: (_, attributes) => `<div>
  Start{' '}
  <Box${attributes}><Text as="span" size="body-s">Content</Text></Box>{' '}
  End
</div>`,
  states: [
    {
      id: 'display',
      title: 'Display in text flow',
      caption:
        'An inline span shares a line with Start and End. Tablet block moves it onto its own line at a viewport width of 768px.',
      rows: 'display',
      fixed: { as: 'span', paddingInline: '8' },
    },
    {
      id: 'inline-padding',
      title: 'Inline padding',
      caption:
        'The border of the content tile stays the same size as the space inside the box grows.',
      rows: 'paddingInline',
      fixed: { display: 'inline-block' },
    },
  ],
  cases: [
    {
      id: 'logical-spacing',
      title: 'Side, axis, and general spacing',
      kind: 'content',
      mode: 'pinned',
      caption: 'Block padding stays at 16. Inline padding uses 8 except for 0 at inline start.',
      render: ({ ctx }) => (
        <LayoutExample>
          <Box {...ctx.subject} padding={16} paddingInline={8} paddingInlineStart={0}>
            <Box className="layout-outline">Nested Box</Box>
          </Box>
        </LayoutExample>
      ),
    },
  ],
  compositions: [
    {
      id: 'checklist',
      title: 'Checklist section',
      mode: 'pinned',
      caption: 'One padding value gives the heading and its instructions the same inset.',
      render: ({ ctx }) => (
        <Box {...ctx.subject} as="section" padding={24} aria-labelledby={ctx.id}>
          <Stack gap={8}>
            <Title id={ctx.id} as="h3" size="heading-s">
              Release checklist
            </Title>
            <Text size="body-s">Review the changes and confirm a release date.</Text>
          </Stack>
        </Box>
      ),
      code: `<Box as="section" padding={24} aria-labelledby="release-checklist">
  <Stack gap={8}>
    <Title id="release-checklist" as="h3" size="heading-s">Release checklist</Title>
    <Text size="body-s">Review the changes and confirm a release date.</Text>
  </Stack>
</Box>`,
    },
    {
      id: 'standalone-page',
      title: 'Standalone page landmark',
      mode: 'pinned',
      caption:
        'Use main for the page root. The preview uses a named section inside the existing main landmark.',
      render: ({ ctx }) => (
        <Box
          {...ctx.subject}
          as="section"
          padding={{ mobile: 16, desktop: 32 }}
          aria-labelledby={ctx.id}
        >
          <Stack gap={8}>
            <Text size="caption-l" color="muted">
              Release notes
            </Text>
            <Title id={ctx.id} as="h2" size="heading-m">
              What changed
            </Title>
            <Text size="body-s">A record of changes in each release.</Text>
          </Stack>
        </Box>
      ),
      code: `<Box as="main" padding={{ mobile: 16, desktop: 32 }} aria-labelledby="release-title">
  <Stack gap={8}>
    <Text size="caption-l" color="muted">Release notes</Text>
    <Title id="release-title" as="h1" size="heading-m">What changed</Title>
    <Text size="body-s">A record of changes in each release.</Text>
  </Stack>
</Box>`,
    },
  ],
});
