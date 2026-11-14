import { defineSpecimen } from '../../workbench/types.js';
import { Accordion, Collapsible } from './accordion.proto.js';
import { Card } from '../card/card.proto.js';
import { Text } from '../text/text.proto.js';
import { Code } from '../code/code.proto.js';
import '../card/display.examples.css';

export default defineSpecimen({
  id: 'accordion',
  title: 'Accordion & Collapsible',
  group: 'Structure',
  summary: 'Native disclosure keeps details close without adding another surface.',
  sections: [
    {
      id: 'disclosures',
      title: 'Closed & open content',
      kind: 'matrix',
      render: () => (
        <Accordion>
          <Collapsible title="Workspace defaults">
            <Text size="body-s">Default preferences apply to new members.</Text>
          </Collapsible>
          <Collapsible title="Review policy" defaultOpen>
            <Text size="body-s">Require two reviewers for verified operational documents.</Text>
          </Collapsible>
        </Accordion>
      ),
    },
    {
      id: 'wrapping',
      title: 'Long headings & technical content',
      kind: 'states',
      render: () => (
        <Collapsible
          title="Advanced connection-draining settings for regional ingress failover"
          defaultOpen
        >
          <Text size="body-s">
            The timeout for <Code>x-envoy-drain</Code> must remain below the upstream idle budget.
          </Text>
        </Collapsible>
      ),
    },
    {
      id: 'context',
      title: 'Folio · Governance settings',
      kind: 'context',
      render: () => (
        <Card>
          <Accordion>
            <Collapsible title="Approval and verification" defaultOpen>
              <Text size="body-s" color="secondary">
                Changes to verified documents require a fresh review before publication.
              </Text>
            </Collapsible>
            <Collapsible title="Retention and audit trail">
              <Text size="body-s" color="secondary">
                Keep an immutable revision history for the workspace.
              </Text>
            </Collapsible>
            <Collapsible title="Advanced workspace defaults">
              <Text size="body-s" color="secondary">
                Manage inherited defaults for new collections.
              </Text>
            </Collapsible>
          </Accordion>
        </Card>
      ),
    },
  ],
});
