import { defineSpecimen } from '../../workbench/types.js';
import { Text } from '../text/text.proto.js';
import { Title } from '../title/title.proto.js';
import { Badge } from '../badge/badge.proto.js';
import { Button } from '../button/button.proto.js';
import { Card, CardFooter, CardHeader, CardMedia } from './card.proto.js';
import './display.examples.css';

export default defineSpecimen({
  id: 'card',
  title: 'Card',
  group: 'Surfaces',
  summary: 'One bounded surface, a quieter sibling, and shared content anatomy.',
  sections: [
    {
      id: 'hierarchy',
      title: 'Surface hierarchy & sizes',
      kind: 'matrix',
      render: () => (
        <div className="display-example-grid">
          {(['s', 'm', 'l'] as const).map((size) => (
            <Card key={size} size={size}>
              <Title as="h3" size="heading-s">
                Runbooks
              </Title>
              <Text size="body-s" color="muted">
                A {size.toUpperCase()} surface for related information.
              </Text>
            </Card>
          ))}
          <Card variant="subtle">
            <Title as="h3" size="heading-s">
              Supporting context
            </Title>
            <Text size="body-s" color="muted">
              Quiet content retains the same anatomy.
            </Text>
          </Card>
        </div>
      ),
    },
    {
      id: 'content',
      title: 'Long content & media',
      kind: 'states',
      render: () => (
        <div className="display-example-grid">
          <Card>
            <CardMedia>
              <img src="/assets/skeleton-report-landscape.svg" alt="Report layout preview" />
            </CardMedia>
            <Title as="h3" size="heading-s">
              A detailed incident report with a title that can wrap naturally
            </Title>
            <Text size="body-s" color="secondary">
              Media and headings stay within the same concentric surface at narrow widths.
            </Text>
          </Card>
          <Card variant="subtle">
            <Text size="body-s">
              networking/edge/production/zero-downtime-postgresql-failover-verification
            </Text>
          </Card>
        </div>
      ),
    },
    {
      id: 'context',
      title: 'Folio · Pinned runbook',
      kind: 'context',
      render: () => (
        <Card className="display-example-measure">
          <CardHeader>
            <Badge status="success" dot>
              Verified
            </Badge>
            <Text size="caption-l" color="muted">
              Updated 2 hours ago
            </Text>
          </CardHeader>
          <Title as="h3" size="heading-s">
            Zero-Downtime PG Failover
          </Title>
          <Text size="body-s" color="secondary">
            A safe, repeatable sequence for planned primary rotation.
          </Text>
          <CardFooter>
            <Text size="caption-l" color="muted">
              Platform Engineering
            </Text>
            <Button size="s" variant="secondary" tone="neutral">
              Open runbook
            </Button>
          </CardFooter>
        </Card>
      ),
    },
  ],
});
