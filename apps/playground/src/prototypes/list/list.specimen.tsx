import { defineSpecimen } from '../../workbench/types.js';
import { CheckCircleIcon, FileTextIcon } from '@phosphor-icons/react';
import { List, ListItem } from './list.proto.js';
import { Card } from '../card/card.proto.js';
import { Badge } from '../badge/badge.proto.js';
import { Avatar } from '../avatar/avatar.proto.js';
import '../card/display.examples.css';

export default defineSpecimen({
  id: 'list',
  title: 'List & ListItem',
  group: 'Data',
  summary: 'A text column, an optional leading object, and independent trailing content.',
  sections: [
    {
      id: 'anatomy',
      title: 'List anatomy',
      kind: 'matrix',
      render: () => (
        <List>
          <ListItem title="Plain item" />
          <ListItem
            title="Document with supporting context"
            description="Platform Engineering · Updated today"
            leading={<FileTextIcon size="1em" />}
          />
          <ListItem
            title="Verification complete"
            description="All replication checks passed."
            leading={<CheckCircleIcon size="1em" />}
            trailing={<Badge status="success">Verified</Badge>}
          />
        </List>
      ),
    },
    {
      id: 'wrapping',
      title: 'Long copy & independent trailing slot',
      kind: 'states',
      render: () => (
        <List>
          <ListItem
            title="A regional ingress handoff procedure with an unusually detailed title"
            description="The description reflows beneath the title while the factual trailing status retains its own capacity."
            leading={<Avatar initials="PE" size="s" />}
            trailing={<Badge status="warning">Review</Badge>}
          />
        </List>
      ),
    },
    {
      id: 'context',
      title: 'Folio · Recent activity',
      kind: 'context',
      render: () => (
        <Card>
          <List>
            <ListItem
              title="Updated Zero-Downtime PG Failover"
              description="Platform Engineering · 12 minutes ago"
              leading={<Avatar initials="PE" tone="accent" size="s" />}
            />
            <ListItem
              title="Approved ADR-014 Traffic Draining"
              description="Networking team · 38 minutes ago"
              leading={<Avatar initials="NW" tone="success" size="s" />}
            />
            <ListItem
              title="Linked Redis Eviction Policy"
              description="Reliability team · 1 hour ago"
              leading={<Avatar initials="RE" tone="info" size="s" />}
            />
          </List>
        </Card>
      ),
    },
  ],
});
