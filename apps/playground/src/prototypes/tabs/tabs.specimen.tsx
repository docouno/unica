import { useState } from 'react';
import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import { Tabs } from './tabs.proto.js';
import { Card } from '../card/card.proto.js';
import { Text } from '../text/text.proto.js';
import '../card/display.examples.css';

function InspectorExample(): ReactElement {
  const [value, setValue] = useState('outline');
  return (
    <Card>
      <Tabs
        aria-label="Document inspector"
        items={[
          { value: 'outline', label: 'Outline' },
          { value: 'properties', label: 'Properties' },
          { value: 'history', label: 'History', count: 8 },
        ]}
        value={value}
        onValueChange={setValue}
      />
      <Text size="body-s" color="secondary">
        {value === 'outline'
          ? 'Context and safety invariants · Procedure · Rollback criteria'
          : value === 'properties'
            ? 'Owner: Platform Engineering · Status: Verified · Revision: v2.8'
            : 'Last verified today · Eight saved revisions'}
      </Text>
    </Card>
  );
}

export default defineSpecimen({
  id: 'tabs',
  title: 'Tabs',
  group: 'Navigation',
  summary: 'Underlined section choices with local selection and restrained counts.',
  sections: [
    {
      id: 'choices',
      title: 'Section choices',
      kind: 'matrix',
      render: () => (
        <Tabs
          items={[
            { value: 'write', label: 'Write' },
            { value: 'diff', label: 'Diff (+38 −4)' },
            { value: 'split', label: 'Split' },
          ]}
        />
      ),
    },
    {
      id: 'states',
      title: 'Long labels & unavailable choices',
      kind: 'states',
      render: () => (
        <Tabs
          items={[
            { value: 'overview', label: 'Workspace overview' },
            { value: 'verification', label: 'Verification and review history', count: 128 },
            { value: 'audit', label: 'Audit log', disabled: true },
          ]}
        />
      ),
    },
    { id: 'context', title: 'Folio · Reader inspector', kind: 'context', render: InspectorExample },
  ],
});
