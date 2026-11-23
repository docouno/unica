import { useState } from 'react';
import type { ReactElement } from 'react';
import { ArrowRightIcon, FileTextIcon, PushPinIcon } from '@phosphor-icons/react';
import { Avatar } from '../prototypes/avatar/avatar.proto.js';
import { Button } from '@docouno/unica';
import { ToastCard } from '../prototypes/toast/toast.proto.js';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  Icon,
  Link,
  Text,
  Title,
} from '@docouno/unica';
import { List, ListItem } from '../prototypes/list/list.proto.js';
import { SegmentedControl } from '@docouno/unica';
import { Breadcrumb, BreadcrumbPage } from '../prototypes/breadcrumb/breadcrumb.proto.js';
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
        preferencesShortcutHint={{ label: 'Preferences & shortcuts', shortcut: '⌘,' }}
        breadcrumb={
          <Breadcrumb size="s">
            <span>Platform Eng</span>
            <BreadcrumbPage>Overview</BreadcrumbPage>
          </Breadcrumb>
        }
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
            <Badge size="s" status="success" dot>
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
                      <Icon usage="slot" icon={FileTextIcon} size="s" />
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
                    <Text size="body-xs" color="secondary">
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
                    aria-label="Recent activity filter"
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
              <Card>
                <List size="m" markers={false} dividers aria-label="Recent activity">
                  {activity
                    .filter(
                      (row) =>
                        filter === 'all' ||
                        (filter === 'created' ? row.verb === 'created' : row.verb === 'updated'),
                    )
                    .map((row) => (
                      <ListItem
                        key={row.title}
                        leading={<Avatar fallback={row.initials} alt="" size="xs" />}
                        title={
                          <>
                            {row.title}{' '}
                            <Text as="span" size="caption-l" color="muted">
                              in {row.category}
                            </Text>
                          </>
                        }
                        description={`${row.owner} ${row.verb} revision`}
                        trailing={
                          <div className="folio-activity-meta">
                            <bdi className="folio-revision-diff">{row.diff}</bdi>
                            <Text size="caption-m" color="muted">
                              {row.time}
                            </Text>
                          </div>
                        }
                      />
                    ))}
                </List>
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
                    <Icon usage="slot" icon={PushPinIcon} size="s" />
                    <div>
                      <Text size="body-s" weight="medium">
                        {item.title}
                      </Text>
                      <Text size="caption-l" color="muted">
                        {item.category}
                      </Text>
                    </div>
                    <Icon usage="slot" icon={ArrowRightIcon} size="s" directional />
                  </div>
                ))}
              </Card>
              <Alert role="none" status="info">
                <AlertTitle>Scheduled DR game-day</AlertTitle>
                <AlertDescription>
                  Quarterly failover game-day runs Thu 17 Sep at 10:00 UTC. Verify replica lag
                  thresholds beforehand.
                </AlertDescription>
              </Alert>
            </section>
          </div>
        </div>
      </FolioWorkspace>
      {toast && (
        <div className="folio-toast-dock">
          <ToastCard
            status="success"
            title={created ? 'New document ready' : 'Synced 3 runbooks'}
            onDismiss={() => setToast(false)}
            action={{ label: 'View', onClick: () => setToast(false) }}
          >
            {created
              ? 'Your draft is ready in Architecture.'
              : 'Core Infrastructure repository indexed 2m ago.'}
          </ToastCard>
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
  uses: [
    'alert',
    'app-shell',
    'avatar',
    'badge',
    'breadcrumb',
    'button',
    'card',
    'icon',
    'indicator',
    'input',
    'kbd',
    'link',
    'list',
    'segmented-control',
    'text',
    'title',
    'toast',
    'tooltip',
  ],
  render: OverviewScene,
});
