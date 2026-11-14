import { defineSpecimen } from '../../workbench/types.js';
import { CheckCircleIcon, FileTextIcon } from '@phosphor-icons/react';
import { Badge } from './badge.proto.js';
import type { BadgeStatus } from './badge.proto.js';
import { Card, CardHeader } from '../card/card.proto.js';
import { Text } from '../text/text.proto.js';
import { Title } from '../title/title.proto.js';
import '../card/display.examples.css';

const statuses: readonly BadgeStatus[] = [
  'neutral',
  'accent',
  'info',
  'success',
  'warning',
  'danger',
];

export default defineSpecimen({
  id: 'badge',
  title: 'Badge',
  group: 'Status',
  summary: 'Compact factual status, with optional dot or glyph and theme-owned material.',
  sections: [
    {
      id: 'status',
      title: 'Statuses & sizes',
      kind: 'matrix',
      render: () => (
        <div className="display-example-stack">
          {(['s', 'm', 'l'] as const).map((size) => (
            <div className="display-example-row" key={size}>
              {statuses.map((status) => (
                <Badge key={status} size={size} status={status} dot>
                  {status}
                </Badge>
              ))}
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'content',
      title: 'Glyphs, numbers & wrapping',
      kind: 'states',
      render: () => (
        <div className="display-example-row">
          <Badge status="success" icon={<CheckCircleIcon size="1em" />}>
            Verified
          </Badge>
          <Badge status="neutral">128</Badge>
          <Badge status="info" icon={<FileTextIcon size="1em" />}>
            Runbook
          </Badge>
          <Badge status="warning">
            Pending architecture review for the regional traffic-draining policy
          </Badge>
        </div>
      ),
    },
    {
      id: 'context',
      title: 'Folio · Document header',
      kind: 'context',
      render: () => (
        <Card>
          <CardHeader>
            <div className="display-example-row">
              <Badge status="success" dot>
                Verified · v2.8
              </Badge>
              <Badge status="neutral">Runbook</Badge>
            </div>
            <Text size="caption-l" color="muted">
              Last reviewed today
            </Text>
          </CardHeader>
          <Title as="h3" size="heading-s">
            Zero-Downtime PG Failover
          </Title>
          <Text size="body-s" color="secondary">
            Metadata stays quiet beside the document title.
          </Text>
        </Card>
      ),
    },
  ],
});
