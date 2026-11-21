import { Box } from '@docouno/unica';
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

const spacing = (group: 'Padding' | 'Margin', description: string) =>
  choiceProp(spacingOptions, 'Default', description, group);

function ChecklistContents() {
  return (
    <>
      <h1>Release checklist</h1>
      <p>Review the checklist before publishing.</p>
    </>
  );
}

export default defineComponent({
  id: 'box',
  title: 'Box',
  category: 'Layout',
  status: 'UI',
  summary: 'Logical padding and margins on a native element. ' + viewportNote,
  props: {
    as: {
      kind: 'enum',
      group: 'Element',
      default: 'div',
      choices: elements.map((value) => ({ value })),
      description: 'Native root element. The default is div.',
    },
    display: choiceProp(displayOptions, 'Native', 'Display mode. Default follows the native tag.'),
    hidden: {
      kind: 'boolean',
      group: 'Element',
      default: false,
      description: 'Native boolean hidden attribute.',
    },
    padding: spacing('Padding', 'Inside spacing on all sides.'),
    paddingInline: spacing('Padding', 'Inside spacing on the inline axis.'),
    paddingBlock: spacing('Padding', 'Inside spacing on the block axis.'),
    paddingInlineStart: spacing('Padding', 'Inside spacing at inline start.'),
    paddingInlineEnd: spacing('Padding', 'Inside spacing at inline end.'),
    paddingBlockStart: spacing('Padding', 'Inside spacing at block start.'),
    paddingBlockEnd: spacing('Padding', 'Inside spacing at block end.'),
    margin: spacing('Margin', 'Outside spacing on all sides.'),
    marginInline: spacing('Margin', 'Outside spacing on the inline axis.'),
    marginBlock: spacing('Margin', 'Outside spacing on the block axis.'),
    marginInlineStart: spacing('Margin', 'Outside spacing at inline start.'),
    marginInlineEnd: spacing('Margin', 'Outside spacing at inline end.'),
    marginBlockStart: spacing('Margin', 'Outside spacing at block start.'),
    marginBlockEnd: spacing('Margin', 'Outside spacing at block end.'),
  },
  constraints: [
    {
      kind: 'forbidden',
      when: { as: 'main' },
      affects: ['as'],
      reason: 'The Workbench already has a main landmark. See Usage for a standalone page.',
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
      affects: [{ key: 'paddingInline', value: 'm' }],
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
          <span className="layout-demo-tile">Box content</span>
        </Box>{' '}
        End
      </div>
    </LayoutExample>
  ),
  code: (_, attributes) => `<div>
  Start{' '}
  <Box${attributes}><span>Box content</span></Box>{' '}
  End
</div>`,
  matrixViews: [
    {
      id: 'display',
      title: 'Inline flow and logical padding',
      rows: 'display',
      cols: 'paddingInline',
    },
  ],
  cases: [
    {
      id: 'logical-spacing',
      title: 'Side, axis, and general spacing',
      kind: 'behavior',
      caption: 'Block padding stays at m. Inline padding uses s except for 0 at inline start.',
      render: ({ ctx }) => (
        <LayoutExample>
          <Box {...ctx.subject} padding="m" paddingInline="s" paddingInlineStart={0}>
            <Box className="layout-outline">Nested Box</Box>
          </Box>
        </LayoutExample>
      ),
    },
  ],
  usage: [
    {
      id: 'checklist',
      title: 'Checklist section',
      render: ({ ctx }) => (
        <Box {...ctx.subject} as="section" padding="l">
          <ChecklistContents />
        </Box>
      ),
      code: `import '@docouno/unica/styles.css';
import { Box } from '@docouno/unica';

<Box as="section" padding="l">
  <h1>Release checklist</h1>
  <p>Review the checklist before publishing.</p>
</Box>`,
    },
    {
      id: 'standalone-page',
      title: 'Standalone page landmark',
      caption: 'This example uses a section in Workbench. Use main at the page root.',
      render: ({ ctx }) => (
        <Box {...ctx.subject} as="section" padding="l">
          <ChecklistContents />
        </Box>
      ),
      code: `import '@docouno/unica/styles.css';
import { Box } from '@docouno/unica';

<Box as="main" padding="l">
  <h1>Release checklist</h1>
  <p>Review the checklist before publishing.</p>
</Box>`,
    },
  ],
});
