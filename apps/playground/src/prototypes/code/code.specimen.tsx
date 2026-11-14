import { defineSpecimen } from '../../workbench/types.js';
import { Code, CodeBlock, Blockquote } from './code.proto.js';
import { Card } from '../card/card.proto.js';
import { Text } from '../text/text.proto.js';
import { Title } from '../title/title.proto.js';
import '../card/display.examples.css';

export default defineSpecimen({
  id: 'code',
  title: 'Code & Blockquote',
  group: 'Typography',
  summary: 'Inline identifiers, readable technical excerpts, and attributed context.',
  sections: [
    {
      id: 'formats',
      title: 'Inline & fenced code',
      kind: 'matrix',
      render: () => (
        <div className="display-example-stack">
          <Text size="body-s">
            Update <Code>x-envoy-drain</Code> before rotating the upstream.
          </Text>
          <CodeBlock language="shell">
            {
              'kubectl rollout status deployment/edge-gateway\npsql -c "SELECT pg_is_in_recovery();"'
            }
          </CodeBlock>
        </div>
      ),
    },
    {
      id: 'overflow',
      title: 'Long commands & quotations',
      kind: 'states',
      render: () => (
        <div className="display-example-measure">
          <CodeBlock language="configuration">
            {
              'connection_draining_timeout_seconds: 45\nupstream_cluster: platform-production-postgresql-primary-eu-central-1'
            }
          </CodeBlock>
          <Blockquote cite="Core Networking Charter · §2.4">
            <p>
              Never shed regional ingress faster than downstream connection pools can re-establish
              TLS sessions.
            </p>
          </Blockquote>
        </div>
      ),
    },
    {
      id: 'context',
      title: 'Folio · Runbook procedure',
      kind: 'context',
      render: () => (
        <Card>
          <Title as="h3" size="heading-s">
            Validate the new primary
          </Title>
          <Text size="body-s" color="secondary">
            Confirm <Code>pg_is_in_recovery()</Code> returns false before reopening writes.
          </Text>
          <CodeBlock language="sql">
            {'SELECT application_name, state, sync_state\nFROM pg_stat_replication;'}
          </CodeBlock>
          <Blockquote cite="Operational policy">
            A completed command is evidence only after its postcondition has been verified.
          </Blockquote>
        </Card>
      ),
    },
  ],
});
