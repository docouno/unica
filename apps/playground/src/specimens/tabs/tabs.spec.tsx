import { FormField } from '../../prototypes/form-field/form-field.proto.js';
import { useId } from 'react';
import type { ReactElement } from 'react';
import {
  ChartBarIcon,
  ClockCounterClockwiseIcon,
  FileTextIcon,
  GearSixIcon,
  ListBulletsIcon,
  UsersIcon,
} from '@phosphor-icons/react';
import { defineComponent } from '../../workbench/types.js';
import { Card, Input, Text } from '@docouno/unica';
import { PopoverContent } from '../../prototypes/popover/popover.proto.js';
import { Tabs, TabsContent, TabsList, TabsTab } from '../../prototypes/tabs/tabs.proto.js';
import type { TabsListProps, TabsProps, TabsTabProps } from '../../prototypes/tabs/tabs.proto.js';
import '../../prototypes/tabs/tabs.examples.css';

interface ExampleTab extends TabsTabProps {
  readonly summary: string;
  readonly panelTitle?: string;
}

interface ExampleProps {
  readonly label: string;
  readonly items: readonly ExampleTab[];
  readonly size?: TabsProps['size'];
  readonly orientation?: TabsProps['orientation'];
  readonly distribution?: TabsListProps['distribution'];
  readonly activationMode?: TabsProps['activationMode'];
  readonly selected?: string;
  readonly className?: string;
}

function Example({
  label,
  items,
  size = 'm',
  orientation = 'horizontal',
  distribution = 'content',
  activationMode = 'automatic',
  selected,
  className = '',
}: ExampleProps): ReactElement {
  const heading = useId();
  return (
    <div className="tabs-example">
      <Text id={heading} size="caption-l" weight="medium" color="secondary">
        {label}
      </Text>
      <Tabs
        size={size}
        orientation={orientation}
        activationMode={activationMode}
        defaultValue={selected ?? items[0]?.value ?? ''}
        className={`tabs-example-layout ${className}`}
      >
        <TabsList aria-labelledby={heading} distribution={distribution}>
          {items.map(({ summary, panelTitle, ...item }) => {
            void summary;
            void panelTitle;
            return <TabsTab key={item.value} {...item} />;
          })}
        </TabsList>
        <div className="tabs-example-panels">
          {items.map((item) => (
            <TabsContent key={item.value} value={item.value} className="tabs-example-panel">
              {item.panelTitle && (
                <Text size="body-s" weight="semibold">
                  {item.panelTitle}
                </Text>
              )}
              <Text size="body-s" color="secondary">
                <bdi>{item.summary}</bdi>
              </Text>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}

const workspace = [
  { value: 'overview', children: 'Overview', summary: 'Summary and recent updates.' },
  {
    value: 'activity',
    children: 'Activity',
    iconLeft: ClockCounterClockwiseIcon,
    summary: 'Changes across this workspace.',
  },
  {
    value: 'members',
    children: 'Members',
    count: 12,
    countLabel: '12 people',
    summary: 'Manage people and access.',
  },
] as const satisfies readonly ExampleTab[];

const slots: readonly ExampleTab[] = [
  ...workspace,
  {
    value: 'reports',
    children: 'Reports',
    iconLeft: ChartBarIcon,
    count: 3,
    countLabel: '3 reports',
    summary: 'Review the latest reports.',
  },
  {
    value: 'settings',
    'aria-label': 'Settings',
    iconLeft: GearSixIcon,
    summary: 'Workspace defaults and preferences.',
  },
];

const responsive = workspace.map(({ value, children, summary }) => ({ value, children, summary }));

const compactVertical = [
  {
    value: 'details',
    children: 'Details',
    iconLeft: FileTextIcon,
    panelTitle: 'Document properties',
    summary: 'Markdown · Platform team · Updated today.',
  },
  {
    value: 'outline',
    children: 'Outline',
    iconLeft: ListBulletsIcon,
    panelTitle: 'Document outline',
    summary: 'Purpose · Prerequisites · Rollback.',
  },
  {
    value: 'revisions',
    children: 'History',
    panelTitle: 'Saved revisions',
    summary: 'v8 today · v7 on Tuesday.',
  },
] as const satisfies readonly ExampleTab[];

const vertical = [
  compactVertical[0],
  compactVertical[1],
  { ...compactVertical[2], count: 8, countLabel: '8 revisions' },
] as const satisfies readonly ExampleTab[];

const interactions: readonly ExampleTab[] = [
  { ...workspace[0], summary: 'Use Tab and the arrow keys to see keyboard focus.' },
  { value: 'rest', children: 'Rest', summary: 'An available tab at rest.' },
  { value: 'hover', children: 'Hover', previewState: 'hover', summary: 'Pointer over a peer.' },
  { value: 'press', children: 'Held', previewState: 'press', summary: 'Peer under held press.' },
  {
    value: 'audit',
    children: 'Audit',
    disabled: true,
    count: 0,
    countLabel: '0 audit events',
    summary: 'Audit is unavailable.',
  },
];

const overflow: readonly ExampleTab[] = [
  ...workspace,
  {
    value: 'external',
    children: 'Guests',
    disabled: true,
    summary: 'Guest access is unavailable.',
  },
  {
    value: 'review',
    children: 'Verification history for externally managed environments',
    count: '99+',
    countLabel: '104 pending reviews',
    summary: 'Verification history for externally managed environments · 104 pending reviews.',
  },
  { value: 'archive', children: 'Archive', count: 0, summary: 'No archived items.' },
];

function HorizontalExamples(): ReactElement {
  return (
    <div className="tabs-examples">
      <Example label="Small · Content" size="s" items={workspace} />
      <Example label="Medium · Equal" size="m" distribution="equal" items={workspace} />
      <Example label="Large · Content" size="l" items={workspace} />
    </div>
  );
}

function VerticalExamples(): ReactElement {
  return (
    <div className="tabs-examples">
      <Text size="caption-l" color="secondary">
        <bdi>Each layout sets its list width and places the active panel.</bdi>
      </Text>
      <Example
        label="Small · Compact rail"
        size="s"
        orientation="vertical"
        items={compactVertical}
        className="tabs-example-side"
      />
      <Example
        label="Medium · Side panel"
        size="m"
        orientation="vertical"
        items={vertical}
        selected="outline"
        className="tabs-example-side tabs-example-side-medium"
      />
      <Example
        label="Large · Responsive panel"
        size="l"
        orientation="vertical"
        items={vertical}
        selected="revisions"
        className="tabs-example-side tabs-example-side-wide"
      />
    </div>
  );
}

function OverflowExamples(): ReactElement {
  return (
    <div className="tabs-examples">
      <Example label="Content · Scroll to the last tab" size="s" items={overflow} />
      <Example
        label="Equal · Selected long label"
        size="m"
        distribution="equal"
        items={overflow}
        selected="review"
      />
      <Example
        label="Responsive · Equal below 768 px, content from 768 px"
        size="m"
        distribution={{ mobile: 'equal', tablet: 'content' }}
        items={responsive}
        className="tabs-example-fluid"
      />
    </div>
  );
}

function ManualExample(): ReactElement {
  const heading = useId();
  return (
    <Card className="tabs-manual-card">
      <Text id={heading} size="body-s" weight="medium">
        Report settings
      </Text>
      <Tabs defaultValue="overview" activationMode="manual" className="tabs-example-layout">
        <TabsList aria-labelledby={heading}>
          <TabsTab value="overview" iconLeft={FileTextIcon}>
            Overview
          </TabsTab>
          <TabsTab value="people" iconLeft={UsersIcon}>
            Recipients
          </TabsTab>
          <TabsTab value="audit" disabled>
            Audit
          </TabsTab>
        </TabsList>
        <div className="tabs-example-panels">
          <TabsContent value="overview">
            <FormField htmlFor={`${heading}-report`} label="Report name">
              <Input id={`${heading}-report`} defaultValue="Weekly summary" />
            </FormField>
          </TabsContent>
          <TabsContent value="people">
            <Text size="body-s" color="secondary">
              <bdi>Weekly reports are sent to the workspace owners.</bdi>
            </Text>
          </TabsContent>
          <TabsContent value="audit">
            <Text size="body-s" color="secondary">
              <bdi>Audit is unavailable.</bdi>
            </Text>
          </TabsContent>
        </div>
      </Tabs>
      <Text size="caption-l" color="muted">
        <bdi>Arrow keys move focus. Enter or Space switches panels.</bdi>
      </Text>
    </Card>
  );
}

function OverlayExample(): ReactElement {
  const heading = useId();
  return (
    <div className="tabs-overlay-stage">
      <PopoverContent className="tabs-overlay-example" aria-labelledby={heading}>
        <Text id={heading} size="body-m" weight="medium">
          Snapshot
        </Text>
        <Tabs size="s" defaultValue="activity" className="tabs-example-layout">
          <TabsList aria-label="Snapshot panels">
            <TabsTab value="activity" count={8} countLabel="8 events">
              Activity
            </TabsTab>
            <TabsTab value="details">Details</TabsTab>
          </TabsList>
          <div className="tabs-example-panels">
            <TabsContent value="activity">
              <Text size="body-s" color="secondary">
                <bdi>Eight events since the last snapshot.</bdi>
              </Text>
            </TabsContent>
            <TabsContent value="details">
              <Text size="body-s" color="secondary">
                <bdi>Created today at 09:41.</bdi>
              </Text>
            </TabsContent>
          </div>
        </Tabs>
      </PopoverContent>
    </div>
  );
}

export default defineComponent({
  id: 'tabs',
  title: 'Tabs',
  category: 'Navigation',
  status: 'Proto',
  summary: 'Switch between peer panels within one view.',
  props: {
    size: {
      kind: 'enum',
      group: 'Layout',
      default: 'm',
      description: 'Tab and list density.',
      choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    orientation: {
      kind: 'enum',
      group: 'Layout',
      default: 'horizontal',
      description: 'List orientation and arrow navigation.',
      choices: [{ value: 'horizontal' }, { value: 'vertical' }],
    },
    activationMode: {
      kind: 'enum',
      group: 'Behavior',
      default: 'automatic',
      description: 'Select on focus or wait for explicit activation.',
      choices: [{ value: 'automatic' }, { value: 'manual' }],
    },
    distribution: {
      kind: 'enum',
      group: 'TabsList',
      default: 'content',
      description: 'Size items to their text or use equal tracks.',
      choices: [{ value: 'content' }, { value: 'equal' }],
    },
    count: {
      kind: 'boolean',
      group: 'Example',
      default: false,
      description: 'Add a count to the review tab.',
      demo: true,
    },
    onValueChange: {
      kind: 'action',
      group: 'Events',
      description: 'Reports the selected tab value.',
      code: 'handleValueChange',
    },
  },
  code: (
    values,
  ) => `<Tabs defaultValue="overview"${values.size === 'm' ? '' : ` size="${values.size}"`}${values.orientation === 'horizontal' ? '' : ' orientation="vertical"'}${values.activationMode === 'automatic' ? '' : ' activationMode="manual"'} onValueChange={handleValueChange}>
  <TabsList aria-label="Project views"${values.distribution === 'content' ? '' : ' distribution="equal"'}>
    <TabsTab value="overview">Overview</TabsTab>
    <TabsTab value="review"${values.count ? ' count={3}' : ''}>Review</TabsTab>
  </TabsList>
  <TabsContent value="overview">Project settings and activity.</TabsContent>
  <TabsContent value="review">Three comments are ready to review.</TabsContent>
</Tabs>`,
  render: ({ values, ctx }) => (
    <Tabs
      {...ctx.subject}
      defaultValue="overview"
      size={values.size}
      orientation={values.orientation}
      activationMode={values.activationMode}
      onValueChange={ctx.action('onValueChange')}
    >
      <TabsList aria-label="Project views" distribution={values.distribution}>
        <TabsTab value="overview">Overview</TabsTab>
        <TabsTab value="review" {...(values.count ? { count: 3 } : {})}>
          Review
        </TabsTab>
      </TabsList>
      <TabsContent value="overview">Project settings and activity.</TabsContent>
      <TabsContent value="review">Three comments are ready to review.</TabsContent>
    </Tabs>
  ),
  matrixViews: [
    {
      id: 'choices',
      title: 'Horizontal',
      rows: 'size',
      cols: 'distribution',
      fixed: { orientation: 'horizontal' },
      reference: () => <HorizontalExamples />,
    },
    {
      id: 'vertical',
      title: 'Vertical',
      rows: 'size',
      cols: 'activationMode',
      fixed: { orientation: 'vertical' },
      reference: () => <VerticalExamples />,
    },
    {
      id: 'slots',
      title: 'Icons and counts',
      rows: 'count',
      reference: () => <Example label="Workspace sections" items={slots} />,
    },
  ],
  cases: [
    {
      id: 'states',
      title: 'Selection and feedback',
      kind: 'behavior',
      render: () => <Example label="Pinned pointer states" size="s" items={interactions} />,
    },
    {
      id: 'overflow',
      title: 'Overflow and distribution',
      kind: 'content',
      render: () => <OverflowExamples />,
    },
    {
      id: 'manual',
      title: 'Manual activation',
      kind: 'behavior',
      render: () => <ManualExample />,
    },
    {
      id: 'overlay',
      title: 'On a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <OverlayExample />,
    },
  ],
  usage: [
    {
      id: 'views',
      title: 'Switch between related views',
      code: `<Tabs defaultValue="activity">
  <TabsList aria-label="Document views">
    <TabsTab value="activity">Activity</TabsTab>
    <TabsTab value="details">Details</TabsTab>
  </TabsList>
  <TabsContent value="activity">No new activity.</TabsContent>
  <TabsContent value="details">Visible to members of this workspace.</TabsContent>
</Tabs>`,
      render: () => (
        <Tabs defaultValue="activity">
          <TabsList aria-label="Document views">
            <TabsTab value="activity">Activity</TabsTab>
            <TabsTab value="details">Details</TabsTab>
          </TabsList>
          <TabsContent value="activity">No new activity.</TabsContent>
          <TabsContent value="details">Visible to members of this workspace.</TabsContent>
        </Tabs>
      ),
    },
  ],
});
