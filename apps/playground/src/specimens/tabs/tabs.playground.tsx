import { Text } from '@docouno/unica';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { Tabs, TabsContent, TabsList, TabsTab } from '../../prototypes/tabs/tabs.proto.js';
import type { PreviewProps } from '../../workbench/types.js';
import { distributions, overviewPanel, panelLayout, reviewCounts } from './tabs-code.js';
import type { TabsValues } from './tabs-code.js';

interface PlaygroundProps extends PreviewProps {
  readonly values: TabsValues;
}

function ProjectViews({ values, ctx }: PlaygroundProps): ReactElement {
  const [view, setView] = useState<string>(values.value);
  const review = reviewCounts[values.count];

  return (
    <Tabs
      {...ctx.subject}
      data-tabs-playground=""
      value={view}
      onValueChange={(next) => {
        setView(next);
        ctx.action('onValueChange')(next);
      }}
      size={values.size}
      orientation={values.orientation}
      activationMode={values.activationMode}
      style={panelLayout(values.orientation)}
    >
      <TabsList aria-label="Project views" distribution={distributions[values.distribution]}>
        <TabsTab value="overview">Info</TabsTab>
        <TabsTab value="review" {...review.props}>
          Q&A
        </TabsTab>
      </TabsList>
      <TabsContent value="overview">
        <Text size="body-s" color="secondary">
          <bdi>{overviewPanel}</bdi>
        </Text>
      </TabsContent>
      <TabsContent value="review">
        <Text size="body-s" color="secondary">
          <bdi>{review.panel}</bdi>
        </Text>
      </TabsContent>
    </Tabs>
  );
}

export function TabsPlayground(props: PlaygroundProps): ReactElement {
  return <ProjectViews key={props.values.value} {...props} />;
}
