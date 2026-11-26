import { useId } from 'react';
import type { ReactElement } from 'react';
import { Stack, Text, Title } from '@docouno/unica';
import {
  ChartBarIcon,
  ClockCounterClockwiseIcon,
  FileTextIcon,
  GearSixIcon,
  ListBulletsIcon,
} from '@phosphor-icons/react';
import { Tabs, TabsPanel, TabsList, TabsTrigger } from '@docouno/unica';
import type { GlyphSource, TabsListProps, TabsProps } from '@docouno/unica';
import type { PreviewContext, PreviewProps } from '../../workbench/types.js';

interface ExampleTab {
  readonly value: string;
  readonly tab?: {
    readonly iconLeft?: GlyphSource;
    readonly count?: number | string;
    readonly countLabel?: string;
    readonly disabled?: boolean;
  };
  readonly panelTitle?: string;
  readonly summary: string;
}

type TabExample = ExampleTab &
  (
    | { readonly label: string }
    | { readonly label?: undefined; readonly icon: GlyphSource; readonly name: string }
  );

interface ExampleProps extends Pick<TabsProps, 'size' | 'orientation' | 'className'> {
  readonly subject: PreviewContext['subject'];
  readonly label: string;
  readonly items: readonly [TabExample, ...TabExample[]];
  readonly selected?: string;
  readonly distribution?: TabsListProps['distribution'];
  readonly fluid?: boolean;
}

function Example({
  subject,
  label,
  items,
  size = 'm',
  orientation = 'horizontal',
  distribution = 'content',
  selected = items[0].value,
  fluid = false,
  className = '',
}: ExampleProps): ReactElement {
  const heading = useId();
  return (
    <Stack
      gap={4}
      className="tabs-example"
      data-fluid={fluid || undefined}
      data-example-disclosure=""
    >
      <Title as="h3" size="body-m" weight="medium" id={heading}>
        <bdi>{label}</bdi>
      </Title>
      <Tabs
        {...subject}
        size={size}
        orientation={orientation}
        defaultValue={selected}
        className={`tabs-example-layout ${className}`}
      >
        <TabsList
          aria-labelledby={heading}
          distribution={distribution}
          className="tabs-example-list"
        >
          {items.map((item) =>
            item.label !== undefined ? (
              <TabsTrigger key={item.value} value={item.value} {...item.tab}>
                {item.label}
              </TabsTrigger>
            ) : (
              <TabsTrigger
                key={item.value}
                value={item.value}
                iconLeft={item.icon}
                aria-label={item.name}
              />
            ),
          )}
        </TabsList>
        <div className="tabs-example-panels">
          {items.map((item) => (
            <TabsPanel key={item.value} value={item.value} className="tabs-example-panel">
              {item.panelTitle && (
                <Title as="h4" size="body-m" weight="semibold">
                  <bdi>{item.panelTitle}</bdi>
                </Title>
              )}
              <Text size="body-s" color="secondary">
                <bdi>{item.summary}</bdi>
              </Text>
            </TabsPanel>
          ))}
        </div>
      </Tabs>
    </Stack>
  );
}

const workspace = [
  { value: 'overview', label: 'Overview', summary: 'Summary and recent updates.' },
  {
    value: 'activity',
    label: 'Activity',
    tab: { iconLeft: ClockCounterClockwiseIcon },
    summary: 'Changes across this workspace.',
  },
  {
    value: 'members',
    label: 'Members',
    tab: { count: 12, countLabel: '12 people' },
    summary: 'Twelve people have access to this workspace.',
  },
] as const;

const slots = [
  ...workspace,
  {
    value: 'reports',
    label: 'Reports',
    tab: { iconLeft: ChartBarIcon, count: 3, countLabel: '3 reports' },
    summary: 'Three reports are ready for review.',
  },
  {
    value: 'settings',
    name: 'Settings',
    icon: GearSixIcon,
    panelTitle: 'Settings',
    summary: 'Workspace defaults and preferences.',
  },
] as const;

export function SlotExamples({ ctx }: PreviewProps): ReactElement {
  const layout = ctx.story?.controls.layout ?? 'medium-content';
  const allSlots = layout === 'medium-content';
  const size = layout === 'small-content' ? 's' : layout === 'large-content' ? 'l' : 'm';
  return (
    <Example
      key={allSlots ? 'all-slots' : 'workspace'}
      subject={ctx.subject}
      label="Workspace sections"
      items={allSlots ? slots : workspace}
      size={size}
      distribution={layout === 'medium-equal' ? 'equal' : 'content'}
    />
  );
}

const details = {
  value: 'details',
  label: 'Details',
  tab: { iconLeft: FileTextIcon },
  panelTitle: 'Document properties',
  summary: 'Markdown · Platform team · Updated today.',
} as const;

const outline = {
  value: 'outline',
  label: 'Outline',
  tab: { iconLeft: ListBulletsIcon },
  panelTitle: 'Document outline',
  summary: 'Purpose · Prerequisites · Rollback.',
} as const;

const history = {
  value: 'revisions',
  label: 'History',
  panelTitle: 'Saved revisions',
  summary: 'v8 today · v7 on Tuesday.',
} as const;

const railWithCount = [
  details,
  outline,
  { ...history, tab: { count: 8, countLabel: '8 revisions' } },
] as const;

export function VerticalExamples({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={16}>
      <Example
        subject={ctx.subject}
        label="Small · Compact rail"
        size="s"
        orientation="vertical"
        items={[details, outline, history]}
        className="tabs-example-side"
      />
      <Example
        subject={ctx.subject}
        label="Medium · Side panel"
        orientation="vertical"
        items={railWithCount}
        selected="outline"
        className="tabs-example-side tabs-example-side-medium"
      />
      <Example
        subject={ctx.subject}
        label="Large · Responsive panel"
        size="l"
        orientation="vertical"
        items={railWithCount}
        selected="revisions"
        className="tabs-example-side tabs-example-side-wide"
      />
    </Stack>
  );
}

export function InteractionExamples({ ctx }: PreviewProps): ReactElement {
  return (
    <Example
      subject={ctx.subject}
      label="Document views"
      size="s"
      items={[
        { value: 'overview', label: 'Overview', summary: 'The document is ready for review.' },
        { value: 'notes', label: 'Notes', summary: 'The reviewers left two notes.' },
        {
          value: 'files',
          label: 'Files',
          summary: 'Two source files are attached.',
        },
        {
          value: 'history',
          label: 'History',
          summary: 'The last revision was saved today.',
        },
        {
          value: 'audit',
          label: 'Audit',
          tab: { disabled: true, count: 0, countLabel: '0 audit events' },
          summary: 'Audit is unavailable.',
        },
      ]}
    />
  );
}

const overflow = [
  ...workspace,
  {
    value: 'guests',
    label: 'Guests',
    tab: { disabled: true },
    summary: 'Guest access is unavailable.',
  },
  {
    value: 'review',
    label: 'Verification history for externally managed environments',
    tab: { count: '99+', countLabel: '104 pending reviews' },
    summary: 'Verification history for externally managed environments · 104 pending reviews.',
  },
  {
    value: 'archive',
    label: 'Archive',
    tab: { count: 0, countLabel: '0 archived items' },
    summary: 'No archived items.',
  },
] as const;

export function OverflowExamples({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={16}>
      <Example
        subject={ctx.subject}
        label="Content · Workspace sections"
        size="s"
        items={overflow}
      />
      <Example
        subject={ctx.subject}
        label="Equal · Selected long label"
        distribution="equal"
        items={overflow}
        selected="review"
      />
      <Example
        subject={ctx.subject}
        label="Responsive · Workspace sections"
        distribution={{ mobile: 'equal', tablet: 'content' }}
        items={[
          workspace[0],
          { value: 'activity', label: 'Activity', summary: workspace[1].summary },
          { value: 'members', label: 'Members', summary: workspace[2].summary },
        ]}
        fluid
      />
    </Stack>
  );
}
