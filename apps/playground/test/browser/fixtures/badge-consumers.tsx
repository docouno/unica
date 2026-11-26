import { Alert, Tag } from '@docouno/unica';
import { useState } from 'react';
import { Tabs, TabsPanel, TabsList, TabsTrigger } from '@docouno/unica';

export default function BadgeConsumersFixture() {
  const [showTabs, setShowTabs] = useState(false);
  return (
    <>
      <Alert role="none" status="warning" data-testid="alert">
        Review the publication date.
      </Alert>
      <Tag status="accent" onRemove={() => {}} removeLabel="Remove Draft" data-testid="tag">
        Draft
      </Tag>
      <button type="button" onClick={() => setShowTabs(true)}>
        Show tabs
      </button>
      {showTabs && (
        <Tabs defaultValue="updates" style={{ width: 240 }}>
          <TabsList aria-label="Document sections">
            <TabsTrigger value="updates" count={0} countLabel="0 updates">
              Updates
            </TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="review" count="99+" countLabel="104 pending reviews">
              Review
            </TabsTrigger>
          </TabsList>
          <TabsPanel value="updates">Latest updates</TabsPanel>
          <TabsPanel value="notifications">Latest notifications</TabsPanel>
          <TabsPanel value="review">Pending reviews</TabsPanel>
        </Tabs>
      )}
    </>
  );
}
