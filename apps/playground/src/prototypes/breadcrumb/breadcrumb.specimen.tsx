import { defineSpecimen } from '../../workbench/types.js';
import { Breadcrumb } from './breadcrumb.proto.js';
import { Card, CardAction, CardHeader } from '../card/card.proto.js';
import { Badge } from '../badge/badge.proto.js';
import { Title } from '../title/title.proto.js';
import '../card/display.examples.css';

export default defineSpecimen({
  id: 'breadcrumb',
  title: 'Breadcrumb',
  group: 'Navigation',
  summary: 'Quiet route hierarchy with a distinct current document and natural wrapping.',
  sections: [
    {
      id: 'depth',
      title: 'Route depth',
      kind: 'matrix',
      render: () => (
        <div className="display-example-stack">
          <Breadcrumb items={['Platform Engineering']} />
          <Breadcrumb items={['Platform Engineering', 'Architecture']} />
          <Breadcrumb
            items={['Platform Engineering', 'Architecture', 'ADR-014 Traffic Draining']}
          />
        </div>
      ),
    },
    {
      id: 'wrapping',
      title: 'Deep paths & links',
      kind: 'states',
      render: () => (
        <div className="display-example-measure">
          <Breadcrumb
            items={[
              { label: 'Workspace', href: '?item=02-workspace-overview' },
              { label: 'Platform Engineering', href: '?item=03-document-collection' },
              'Architecture Decisions',
              'Regional connection draining and deterministic ingress evacuation',
            ]}
          />
        </div>
      ),
    },
    {
      id: 'context',
      title: 'Folio · Reader header',
      kind: 'context',
      render: () => (
        <Card>
          <CardHeader>
            <Breadcrumb items={['Platform Eng', 'Runbooks', 'Zero-Downtime PG Failover']} />
            <CardAction>
              {' '}
              <Badge status="success" dot>
                Verified
              </Badge>
            </CardAction>
          </CardHeader>
          <Title as="h3" size="heading-s">
            Zero-Downtime PG Failover
          </Title>
        </Card>
      ),
    },
  ],
});
