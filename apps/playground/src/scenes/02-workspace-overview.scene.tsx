import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  ArrowRightIcon,
  ClockIcon,
  FileTextIcon,
  GitBranchIcon,
  PushPinIcon,
} from '@phosphor-icons/react';
import { Avatar } from '../prototypes/avatar/avatar.proto.js';
import { Badge } from '../prototypes/badge/badge.proto.js';
import { Button } from '../prototypes/button/button.proto.js';
import { Card } from '../prototypes/card/card.proto.js';
import { Alert, Toast } from '../prototypes/feedback/feedback.proto.js';
import { Icon } from '../prototypes/icon/icon.proto.js';
import { Tooltip } from '../prototypes/menu/menu.proto.js';
import { Link } from '../prototypes/link/link.proto.js';
import { SegmentedControl } from '../prototypes/segmented-control/segmented-control.proto.js';
import { Text } from '../prototypes/text/text.proto.js';
import { Title } from '../prototypes/title/title.proto.js';
import { defineScene } from '../workbench/types.js';
import {
  FolioScene,
  FolioWorkspace,
  PageIntro,
  Person,
  SectionHeading,
  TeamMembers,
} from './folio/folio.shared.js';

const documents = [
  {
    category: 'Runbooks',
    status: 'Verified',
    tone: 'success',
    title: 'Zero-Downtime PG Failover',
    description: 'VIP fencing, synchronous WAL drain, and pg_rewind promotion steps.',
    owner: 'Database reliability',
    initials: 'DB',
    time: '14m ago',
  },
  {
    category: 'Architecture',
    status: 'Accepted',
    tone: 'info',
    title: 'ADR-014 Traffic Draining',
    description: 'Envoy regional healthcheck shedding and zero-drop connection migration.',
    owner: 'Core networking',
    initials: 'NW',
    time: '2h ago',
  },
  {
    category: 'Runbooks',
    status: 'Automated',
    tone: 'accent',
    title: 'Edge TLS Certificate Rotation',
    description: 'ACME DNS-01 challenge validation and dual-certificate rollout checks.',
    owner: 'Edge reliability',
    initials: 'ED',
    time: 'Yesterday',
  },
] as const;
const activity = [
  {
    title: 'Zero-Downtime PG Failover',
    category: 'Runbooks',
    owner: 'Database reliability',
    initials: 'DB',
    verb: 'updated',
    diff: '+42 −6',
    time: '14m ago',
  },
  {
    title: 'ADR-014 Traffic Draining',
    category: 'Architecture',
    owner: 'Core networking',
    initials: 'NW',
    verb: 'published',
    diff: '+168',
    time: '2h ago',
  },
  {
    title: 'Service Mesh v3',
    category: 'Architecture',
    owner: 'Platform engineering',
    initials: 'PE',
    verb: 'reviewed',
    diff: '+19 −14',
    time: '5h ago',
  },
  {
    title: 'Edge TLS Certificate Rotation',
    category: 'Runbooks',
    owner: 'Edge reliability',
    initials: 'ED',
    verb: 'updated',
    diff: '+31 −4',
    time: 'Yesterday',
  },
  {
    title: 'Queue Lease Postmortem',
    category: 'Incidents',
    owner: 'Database reliability',
    initials: 'DB',
    verb: 'created',
    diff: '+215',
    time: '2d ago',
  },
] as const;

function OverviewScene(): ReactElement {
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(true);
  const [created, setCreated] = useState(false);
  return (
    <FolioScene>
      <FolioWorkspace
        activeRail="overview"
        crumbs={['Platform Eng', 'Overview']}
        minHeight={1060}
        actions={
          <div className="folio-row">
            <TeamMembers />
            <Button
              size="s"
              onClick={() => {
                setCreated(true);
                setToast(true);
              }}
            >
              New document
            </Button>
          </div>
        }
      >
        <div className="folio-content folio-content-overview">
          <PageIntro
            title="Platform Engineering"
            description="Architecture decisions, production runbooks, and service topology owned by Core Infrastructure."
            meta={
              <div className="folio-metric-strip">
                <span>142 published docs</span>
                <span>28 Tier-0 runbooks</span>
                <span>98.6% link health</span>
              </div>
            }
          >
            <Badge status="success" dot>
              Synced 2m ago
            </Badge>
          </PageIntro>
          <section className="folio-stack">
            <SectionHeading action={<Link href="#documents">Browse all documents →</Link>}>
              Continue reading & editing
            </SectionHeading>
            <div className="folio-grid-3">
              {documents.map((document) => (
                <Card key={document.title} className="folio-document-card">
                  <div className="folio-row folio-between">
                    <div className="folio-row">
                      <Icon icon={FileTextIcon} size="s" />
                      <Text size="caption-l" color="muted">
                        {document.category}
                      </Text>
                    </div>
                    <Badge size="s" status={document.tone}>
                      {document.status}
                    </Badge>
                  </div>
                  <div className="folio-document-copy">
                    <Title as="h3" size="body-m" className="folio-document-title">
                      {document.title}
                    </Title>
                    <Text className="folio-document-description" size="body-s" color="secondary">
                      {document.description}
                    </Text>
                  </div>
                  <div className="folio-row folio-between">
                    <Person initials={document.initials} name={document.owner} size="xs" />
                    <Text size="caption-m" color="muted">
                      {document.time}
                    </Text>
                  </div>
                </Card>
              ))}
            </div>
          </section>
          <div className="folio-overview-columns">
            <section className="folio-stack">
              <SectionHeading
                action={
                  <SegmentedControl
                    size="s"
                    value={filter}
                    onValueChange={setFilter}
                    items={[
                      { value: 'all', label: 'All' },
                      { value: 'edited', label: 'Edited' },
                      { value: 'created', label: 'Created' },
                    ]}
                  />
                }
              >
                Recent activity
              </SectionHeading>
              <Card className="folio-activity-card">
                {activity
                  .filter(
                    (row) =>
                      filter === 'all' ||
                      (filter === 'created' ? row.verb === 'created' : row.verb === 'updated'),
                  )
                  .map((row) => (
                    <div className="folio-activity-row" key={row.title}>
                      <Avatar initials={row.initials} size="xs" />
                      <div>
                        <Text size="body-s" weight="medium">
                          {row.title}{' '}
                          <Text as="span" size="caption-l" color="muted">
                            in {row.category}
                          </Text>
                        </Text>
                        <Text size="caption-l" color="muted">
                          {row.owner} {row.verb} revision
                        </Text>
                      </div>
                      <div className="folio-activity-meta">
                        <span className="folio-revision-diff">{row.diff}</span>
                        <Text size="caption-m" color="muted">
                          {row.time}
                        </Text>
                      </div>
                    </div>
                  ))}
              </Card>
            </section>
            <section className="folio-stack">
              <SectionHeading>Pinned documents</SectionHeading>
              <Card className="folio-activity-card">
                {[
                  { title: 'Zero-Downtime PG Failover', category: 'Runbooks · Tier-0' },
                  { title: 'ADR-014 Traffic Draining', category: 'Architecture · Accepted' },
                  { title: 'On-Call Escalation Matrix', category: 'Onboarding · Core Infra' },
                ].map((item) => (
                  <div className="folio-activity-row" key={item.title}>
                    <Icon icon={PushPinIcon} size="s" />
                    <div>
                      <Text size="body-s" weight="medium">
                        {item.title}
                      </Text>
                      <Text size="caption-l" color="muted">
                        {item.category}
                      </Text>
                    </div>
                    <Icon icon={ArrowRightIcon} size="s" />
                  </div>
                ))}
              </Card>
              <Alert status="info" title="Scheduled DR game-day">
                Quarterly failover game-day runs Thu 17 Sep at 10:00 UTC. Verify replica lag
                thresholds beforehand.
              </Alert>
            </section>
          </div>
        </div>
      </FolioWorkspace>
      <Tooltip className="folio-preferences-hint" shortcut="⌘,">
        Preferences & shortcuts
      </Tooltip>
      {toast && (
        <div className="folio-toast-dock">
          <Toast
            status="success"
            title={created ? 'New document ready' : 'Synced 3 runbooks'}
            onDismiss={() => setToast(false)}
            icon={<Icon icon={created ? GitBranchIcon : ClockIcon} size="m" />}
          >
            {created
              ? 'Your draft is ready in Architecture.'
              : 'Core Infrastructure repository indexed 2m ago.'}{' '}
            <Link
              href="#activity"
              onClick={(event) => {
                event.preventDefault();
                setToast(false);
              }}
            >
              View
            </Link>
          </Toast>
        </div>
      )}
    </FolioScene>
  );
}

export default defineScene({
  id: '02-workspace-overview',
  title: '02 · Workspace Overview',
  group: 'Folio',
  defaultViewport: 1440,
  render: OverviewScene,
});
