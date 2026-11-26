import type { CSSProperties } from 'react';
import type { TabsListProps } from '@docouno/unica';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import { previewProps } from '../preview-code.js';

export const distributions = {
  content: 'content',
  equal: 'equal',
  responsive: { mobile: 'equal', tablet: 'content' },
} as const satisfies Record<string, TabsListProps['distribution']>;

export const tabsProps = {
  size: {
    kind: 'enum',
    group: 'Geometry',
    default: 'm',
    description: 'Set the height, padding and label size of each tab.',
    choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
  },
  orientation: {
    kind: 'enum',
    group: 'Geometry',
    default: 'horizontal',
    description: 'Set the list direction, arrow keys and edge of the selection marker.',
    choices: [{ value: 'horizontal' }, { value: 'vertical' }],
  },
  distribution: {
    kind: 'slot',
    group: 'Geometry',
    label: 'TabsList distribution',
    publicType: 'Responsive<TabsDistribution>',
    default: 'content',
    description:
      'TabsList sizes horizontal tabs to their content or gives them equal widths. The responsive example uses equal widths below 768px and content widths from 768px of list space.',
    choices: [
      { value: 'content', code: '"content"' },
      { value: 'equal', code: '"equal"' },
      {
        value: 'responsive',
        label: 'Equal → content',
        code: "{ mobile: 'equal', tablet: 'content' }",
      },
    ],
  },
  activationMode: {
    kind: 'enum',
    group: 'Interaction',
    default: 'automatic',
    description: 'Select with the arrow keys, or move focus and commit with Enter or Space.',
    choices: [{ value: 'automatic' }, { value: 'manual' }],
  },
  value: {
    kind: 'enum',
    group: 'Interaction',
    publicType: 'string',
    default: 'overview',
    description:
      'Set the controlled example’s selection. Each preview accepts subsequent tab changes independently.',
    choices: [
      { value: 'overview', label: 'Info' },
      { value: 'review', label: 'Q&A' },
    ],
  },
  mountStrategy: {
    kind: 'enum',
    group: 'Interaction',
    default: 'eager',
    description:
      'Mount all panels, retain panels after their first visit, or reset their content on exit.',
    choices: [{ value: 'eager' }, { value: 'lazy' }, { value: 'unmount' }],
  },
  onValueChange: {
    kind: 'action',
    group: 'Interaction',
    publicType: '(value: string) => void',
    description: 'Receive a proposed value when the user activates another tab.',
    code: 'setView',
  },
  count: {
    kind: 'enum',
    group: 'Content',
    label: 'Q&A tab count',
    publicType: 'number | string',
    default: 'none',
    description:
      'The Q&A tab shows how many questions await review. TabsTrigger accepts a number or a display string. Zero stays visible and countLabel gives the exact quantity when the badge reads 99+.',
    choices: [
      { value: 'none', label: 'No badge', omit: true },
      { value: '0', label: '0 questions', code: '0' },
      { value: '3', label: '3 questions', code: '3' },
      { value: '99+', label: '99+ (104 questions)', code: '"99+"' },
    ],
  },
} as const satisfies PropSchema;

export type TabsValues = ComponentValues<typeof tabsProps>;

export const reviewCounts = {
  none: { props: {}, panel: 'Questions about the latest changes.' },
  '0': { props: { count: 0, countLabel: '0 questions' }, panel: 'No questions to review.' },
  '3': { props: { count: 3, countLabel: '3 questions' }, panel: 'Three questions to review.' },
  '99+': {
    props: { count: '99+', countLabel: '104 questions' },
    panel: '104 questions to review.',
  },
} as const;

export const overviewPanel = 'Project settings and activity.';

export function panelLayout(orientation: TabsValues['orientation']): CSSProperties {
  return {
    display: 'grid',
    inlineSize: '100%',
    gap: 'var(--space-8)',
    alignItems: 'start',
    ...(orientation === 'vertical'
      ? {
          maxInlineSize: '36rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 12rem), 1fr))',
        }
      : { gridTemplateColumns: 'minmax(0, 1fr)' }),
  };
}

export function tabsCode(values: TabsValues): string {
  const { size, orientation, activationMode, mountStrategy } = values;
  const root = previewProps(
    { size, orientation, activationMode, mountStrategy },
    { size: 'm', orientation: 'horizontal', activationMode: 'automatic', mountStrategy: 'eager' },
  );
  const distribution =
    values.distribution === 'content'
      ? ''
      : ` distribution={${JSON.stringify(distributions[values.distribution])}}`;
  const review = reviewCounts[values.count];
  return `import '@docouno/unica/styles.css';
import { Tabs, TabsList, TabsPanel, TabsTrigger, Text } from '@docouno/unica';
import { useState } from 'react';

export function ProjectViews() {
  const [view, setView] = useState(${JSON.stringify(values.value)});
  return (
    <Tabs value={view} onValueChange={setView}${root} style={${JSON.stringify(panelLayout(orientation))}}>
      <TabsList aria-label="Project views"${distribution}>
        <TabsTrigger value="overview">Info</TabsTrigger>
        <TabsTrigger value="review"${previewProps(review.props)}>Q&A</TabsTrigger>
      </TabsList>
      <TabsPanel value="overview">
        <Text size="body-s" color="secondary"><bdi>${overviewPanel}</bdi></Text>
      </TabsPanel>
      <TabsPanel value="review">
        <Text size="body-s" color="secondary"><bdi>${review.panel}</bdi></Text>
      </TabsPanel>
    </Tabs>
  );
}`;
}
