import { useState } from 'react';
import { Alert } from '../../../src/prototypes/alert/alert.proto.js';
import { Tag } from '../../../src/prototypes/tag/tag.proto.js';
import { Tabs, TabsContent, TabsList, TabsTab } from '../../../src/prototypes/tabs/tabs.proto.js';

export default function BadgeConsumersFixture() {
  const [showTabs, setShowTabs] = useState(false);
  return (
    <>
      <Alert status="warning" data-testid="alert">
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
            <TabsTab value="updates" count={0} countLabel="0 updates">
              Updates
            </TabsTab>
            <TabsTab value="notifications">Notifications</TabsTab>
            <TabsTab value="review" count="99+" countLabel="104 pending reviews">
              Review
            </TabsTab>
          </TabsList>
          <TabsContent value="updates">Latest updates</TabsContent>
          <TabsContent value="notifications">Latest notifications</TabsContent>
          <TabsContent value="review">Pending reviews</TabsContent>
        </Tabs>
      )}
    </>
  );
}
