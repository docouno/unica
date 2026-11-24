import { Box, Text } from '@docouno/unica';
import {
  AppShell,
  AsidePanel,
  GlobalSearch,
  Header,
  LeftRail,
  TopRail,
} from '../../prototypes/app-shell/app-shell.proto.js';
import { defineComponent } from '../../workbench/types.js';
import {
  DrawerLayouts,
  ExampleNavigation,
  InspectorRows,
  WorkspaceTopology,
  NavigationStates,
  Documents,
  ResponsiveShell,
  Properties,
  SaveStates,
  SaveStateGallery,
  LayoutExamples,
} from './app-shell.examples.js';

export default defineComponent({
  id: 'app-shell',
  title: 'AppShell & navigation',
  category: 'Layout',
  status: 'Proto',
  componentName: 'AppShell',
  summary: 'Workspace chrome, document navigation, inspectors and in-canvas actions.',
  props: {
    topRail: {
      kind: 'slot',
      group: 'Content',
      default: 'none',
      description: 'Global search and identity along the top edge.',
      choices: [
        { value: 'none', label: 'Empty' },
        { value: 'search', label: 'Search', code: '<TopRail><GlobalSearch /></TopRail>' },
      ],
    },
    leftRail: {
      kind: 'slot',
      group: 'Content',
      default: 'none',
      description: 'Workspace destinations along the leading edge.',
      choices: [
        { value: 'none', label: 'Empty' },
        { value: 'rail', label: 'Destinations', code: '<LeftRail />' },
      ],
    },
    leftAside: {
      kind: 'slot',
      group: 'Content',
      default: 'none',
      description: 'Document navigation beside the canvas.',
      choices: [
        { value: 'none', label: 'Empty' },
        { value: 'documents', label: 'Documents', code: '<ExampleNavigation />' },
      ],
    },
    rightAside: {
      kind: 'slot',
      group: 'Content',
      default: 'none',
      description: 'Document properties on the trailing side.',
      choices: [
        { value: 'none', label: 'Empty' },
        {
          value: 'properties',
          label: 'Properties',
          code: '<AsidePanel side="right" title="Inspector"><InspectorRows /></AsidePanel>',
        },
      ],
    },
    defaultNavigationCollapsed: {
      kind: 'boolean',
      group: 'Interaction',
      default: false,
      description: 'Start with the navigation dock hidden.',
    },
    defaultInspectorCollapsed: {
      kind: 'boolean',
      group: 'Interaction',
      default: false,
      description: 'Start with the inspector dock hidden.',
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { leftAside: 'none' },
      affects: ['defaultNavigationCollapsed'],
      reason: 'Only a supplied navigation panel can collapse.',
    },
    {
      kind: 'ignored',
      when: { rightAside: 'none' },
      affects: ['defaultInspectorCollapsed'],
      reason: 'Only a supplied inspector panel can collapse.',
    },
  ],
  render: ({ ctx, values }) => (
    <AppShell
      key={`${values.defaultNavigationCollapsed}-${values.defaultInspectorCollapsed}`}
      canvasAs="section"
      {...ctx.subject}
      minHeight={320}
      header={<Header>Research library</Header>}
      topRail={
        values.topRail === 'search' ? (
          <TopRail>
            <GlobalSearch />
          </TopRail>
        ) : undefined
      }
      leftRail={
        values.leftRail === 'rail' ? <LeftRail showBrand={values.topRail === 'none'} /> : undefined
      }
      leftAside={values.leftAside === 'documents' ? <ExampleNavigation /> : undefined}
      rightAside={
        values.rightAside === 'properties' ? (
          <AsidePanel side="right" title="Inspector">
            <InspectorRows />
          </AsidePanel>
        ) : undefined
      }
      defaultNavigationCollapsed={values.defaultNavigationCollapsed}
      defaultInspectorCollapsed={values.defaultInspectorCollapsed}
    >
      <Box padding={16}>
        <Text>Interview notes and findings</Text>
      </Box>
    </AppShell>
  ),
  code: ({
    topRail,
    leftRail,
    leftAside,
    rightAside,
    defaultNavigationCollapsed,
    defaultInspectorCollapsed,
  }) => {
    const slots = [
      topRail === 'search' ? ' topRail={<TopRail><GlobalSearch /></TopRail>}' : '',
      leftRail === 'rail'
        ? topRail === 'none'
          ? ' leftRail={<LeftRail showBrand />}'
          : ' leftRail={<LeftRail />}'
        : '',
      leftAside === 'documents' ? ' leftAside={<ExampleNavigation />}' : '',
      rightAside === 'properties'
        ? ' rightAside={<AsidePanel side="right" title="Inspector"><InspectorRows /></AsidePanel>}'
        : '',
      defaultNavigationCollapsed ? ' defaultNavigationCollapsed' : '',
      defaultInspectorCollapsed ? ' defaultInspectorCollapsed' : '',
    ].join('');
    return `<AppShell canvasAs="section" minHeight={320} header={<Header>Research library</Header>}${slots}>
  <Box padding={16}><Text>Interview notes and findings</Text></Box>
</AppShell>`;
  },
  states: [
    {
      id: 'rails',
      title: 'Top and side rails',
      rows: 'leftRail',
      cols: 'topRail',
      fixed: {
        leftAside: 'none',
        rightAside: 'none',
        defaultNavigationCollapsed: false,
        defaultInspectorCollapsed: false,
      },
    },
    {
      id: 'asides',
      title: 'Navigation and inspector',
      caption:
        'These cells show compact panel entry points. Responsive shell shows both desktop docks.',
      rows: 'leftAside',
      cols: 'rightAside',
      fixed: {
        topRail: 'none',
        leftRail: 'none',
        defaultNavigationCollapsed: false,
        defaultInspectorCollapsed: false,
      },
    },
  ],
  cases: [
    {
      id: 'navigation',
      title: 'Rail, NavList and TreeView',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Select a destination or open a branch. In the tree, arrows move focus and Enter selects.',
      render: NavigationStates,
    },
    {
      id: 'documents',
      title: 'Open documents',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Switch documents, close a clean or dirty item, and use the full list when the strip overflows.',
      render: Documents,
    },
    {
      id: 'responsive',
      title: 'Responsive shell',
      kind: 'behavior',
      mode: 'live',
      caption:
        'At 1280px, hide Inspector from inside its header and reopen it from the workspace header. Navigation stays at the start of the workspace header. At 768px, the labeled buttons open sheets.',
      render: ResponsiveShell,
    },
    {
      id: 'drawer-layouts',
      title: 'Open navigation and inspector',
      kind: 'surface',
      mode: 'pinned',
      caption:
        'Both logical edges shown at compact width. Open the corresponding panel in Responsive shell to try it.',
      render: DrawerLayouts,
    },
    {
      id: 'properties',
      title: 'Settings and property rows',
      kind: 'content',
      mode: 'live',
      caption:
        'Compare an editable setting, a managed value and a validation message with the compact inspector rows.',
      render: Properties,
    },
    {
      id: 'save',
      title: 'Save, discard and retry',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Edit the workspace name and save or discard the draft. A failed save keeps the draft available for retry.',
      controls: { fail: { kind: 'boolean', label: 'Simulate a save failure', default: false } },
      reset: true,
      render: SaveStates,
    },
    {
      id: 'save-states',
      title: 'Save bar states',
      kind: 'content',
      mode: 'pinned',
      caption: 'Compare the message, available actions and progress feedback for each save state.',
      render: SaveStateGallery,
    },
    {
      id: 'layout',
      title: 'Layout primitives',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Resize the browser to see responsive track and spacing steps. Use the frame width to check content fit.',
      render: LayoutExamples,
    },
  ],
  compositions: [
    {
      id: 'topologies',
      title: 'Composable workspace topologies',
      mode: 'live',
      caption:
        'Switch layouts to see which regions reserve space for the canvas. At compact widths, open Navigation or Inspector to inspect the same content.',
      controls: {
        layout: {
          kind: 'enum',
          label: 'Layout',
          default: 'l-shaped',
          choices: [
            { value: 'l-shaped', label: 'Top rail, side rail and navigation' },
            { value: 'classic', label: 'Side rail, navigation and inspector' },
            { value: 'asides', label: 'Navigation and inspector' },
            { value: 'rail', label: 'Side rail only' },
            { value: 'standalone', label: 'Standalone canvas' },
          ],
        },
      },
      render: WorkspaceTopology,
      code: `function Workspace({ layout = 'l-shaped' }) {
  const hasNavigation = ['l-shaped', 'classic', 'asides'].includes(layout);
  const hasInspector = ['classic', 'asides'].includes(layout);
  return (
    <AppShell
      canvasAs="section"
      minHeight={320}
      topRail={layout === 'l-shaped' && <TopRail><GlobalSearch placeholder="Search library…" /></TopRail>}
      leftRail={['l-shaped', 'classic', 'rail'].includes(layout) && <LeftRail showBrand={layout !== 'l-shaped'} />}
      leftAside={hasNavigation && <AsidePanel title="Library"><Text size="body-s">Research notes</Text></AsidePanel>}
      rightAside={hasInspector && <AsidePanel side="right" title="Inspector"><Text size="body-s">Shared with the team</Text></AsidePanel>}
      header={<Header>Research library</Header>}
      subbar={layout === 'l-shaped' && <Subbar><Text size="caption-l" color="muted">Document view</Text></Subbar>}
    >
      <Box padding={16}><Text>Interview notes and findings</Text></Box>
    </AppShell>
  );
}`,
    },
  ],
});
