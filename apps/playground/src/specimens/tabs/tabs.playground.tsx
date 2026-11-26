import { Text } from '@docouno/unica';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { Tabs, TabsPanel, TabsList, TabsTrigger } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { distributions, overviewPanel, panelLayout, reviewCounts } from './tabs-code.js';
import type { TabsValues } from './tabs-code.js';

interface PlaygroundProps extends PreviewProps {
  readonly values: TabsValues;
}

export function TabsPlayground({ values, ctx }: PlaygroundProps): ReactElement {
  const [selection, setSelection] = useState<{ input: string; value: string }>({
    input: values.value,
    value: values.value,
  });
  if (selection.input !== values.value) {
    setSelection({ input: values.value, value: values.value });
  }
  const review = reviewCounts[values.count];

  return (
    <Tabs
      {...ctx.subject}
      data-tabs-playground=""
      value={selection.value}
      onValueChange={(next) => {
        setSelection({ input: values.value, value: next });
        ctx.action('onValueChange')(next);
      }}
      size={values.size}
      orientation={values.orientation}
      activationMode={values.activationMode}
      mountStrategy={values.mountStrategy}
      style={panelLayout(values.orientation)}
    >
      <TabsList aria-label="Project views" distribution={distributions[values.distribution]}>
        <TabsTrigger value="overview">Info</TabsTrigger>
        <TabsTrigger value="review" {...review.props}>
          Q&A
        </TabsTrigger>
      </TabsList>
      <TabsPanel value="overview">
        <Text size="body-s" color="secondary">
          <bdi>{overviewPanel}</bdi>
        </Text>
      </TabsPanel>
      <TabsPanel value="review">
        <Text size="body-s" color="secondary">
          <bdi>{review.panel}</bdi>
        </Text>
      </TabsPanel>
    </Tabs>
  );
}
