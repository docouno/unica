import { useState } from 'react';
import type { ReactElement } from 'react';
import { DownloadSimpleIcon, PlusIcon } from '@phosphor-icons/react';
import { AsidePanel } from '../prototypes/app-shell/app-shell.proto.js';
import { Badge } from '../prototypes/badge/badge.proto.js';
import { Button } from '../prototypes/button/button.proto.js';
import { DatePicker, DateRangePicker } from '../prototypes/calendar/calendar.proto.js';
import { Card, CardMedia } from '../prototypes/card/card.proto.js';
import { Progress } from '../prototypes/feedback/feedback.proto.js';
import { Link } from '../prototypes/link/link.proto.js';
import { Pagination } from '../prototypes/pagination/pagination.proto.js';
import { SegmentedControl } from '../prototypes/segmented-control/segmented-control.proto.js';
import { Select } from '../prototypes/select/select.proto.js';
import { Checkbox, Switch } from '../prototypes/selection/selection.proto.js';
import { Table, TableScroll } from '../prototypes/table/table.proto.js';
import { Chip } from '../prototypes/tag/tag.proto.js';
import { Text } from '../prototypes/text/text.proto.js';
import { Title } from '../prototypes/title/title.proto.js';
import { defineScene } from '../workbench/types.js';
import { DatabaseTopology, IngressTopology } from './folio/folio.diagrams.js';
import {
  DocumentName,
  FolioScene,
  FolioWorkspace,
  InspectorSection,
  Person,
  SectionHeading,
} from './folio/folio.shared.js';

const rows = [
  {
    title: 'Zero-Downtime PG Failover',
    tier: 'Tier-0',
    date: '17 Sep 2026',
    initials: 'DB',
    owner: 'DB team',
  },
  {
    title: 'Edge TLS Certificate Rotation',
    tier: 'Tier-0',
    date: '16 Sep 2026',
    initials: 'ED',
    owner: 'Edge SRE',
  },
  {
    title: 'Redis Cluster Eviction Policy',
    tier: 'Tier-1',
    date: '15 Sep 2026',
    initials: 'NW',
    owner: 'Core team',
  },
  {
    title: 'Kafka Partition Rebalance Drill',
    tier: 'Tier-1',
    date: '14 Sep 2026',
    initials: 'PE',
    owner: 'Platform',
  },
] as const;

function CollectionScene(): ReactElement {
  const [tab, setTab] = useState('all');
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState<readonly string[]>([rows[0].title, rows[1].title]);
  const [scope, setScope] = useState(true);
  const [windowFilter, setWindowFilter] = useState(true);
  const [notice, setNotice] = useState('');
  const visibleRows =
    tab === 'tier0' ? rows.filter((row) => row.tier === 'Tier-0') : tab === 'drafts' ? [] : rows;
  const toggle = (title: string): void =>
    setSelected((current) =>
      current.includes(title) ? current.filter((item) => item !== title) : [...current, title],
    );
  return (
    <FolioScene>
      <FolioWorkspace
        crumbs={['Platform Eng', 'Runbooks']}
        minHeight={960}
        actions={
          <div className="folio-row">
            <SegmentedControl
              size="s"
              value={view}
              onValueChange={setView}
              items={[
                { value: 'list', label: 'List' },
                { value: 'cards', label: 'Cards' },
              ]}
            />
            <Button
              size="s"
              variant="secondary"
              tone="neutral"
              iconLeft={DownloadSimpleIcon}
              onClick={() => setNotice('CSV export includes the currently selected runbooks.')}
            >
              Export CSV
            </Button>
            <Button
              size="s"
              iconLeft={PlusIcon}
              onClick={() => setNotice('New runbook draft created in this collection.')}
            >
              New runbook
            </Button>
          </div>
        }
        rightAside={
          <AsidePanel title="Collection scope" side="right" width={360}>
            <InspectorSection title="Verification gates">
              <Switch size="s" defaultChecked label="Verified only" />
              <Switch size="s" label="Include RFCs" />
              <div className="folio-stack">
                <Text size="caption-l" color="muted">
                  Audit baseline date
                </Text>
                <DatePicker size="s" defaultValue="2026-09-01" />
              </div>
            </InspectorSection>
            <InspectorSection title="Drill readiness">
              <Progress value={84} label="Q3 drill coverage" />
            </InspectorSection>
            <InspectorSection title="Modified date window">
              <Text size="caption-l" color="secondary">
                Filter by drill window
              </Text>
              <DateRangePicker size="s" defaultValue={['2026-09-14', '2026-09-17']} defaultOpen />
            </InspectorSection>
          </AsidePanel>
        }
      >
        <div className="folio-content folio-content-collection">
          <div className="folio-row folio-between folio-wrap">
            <div className="folio-row">
              <Title as="h1" size="heading-m">
                Runbooks & Playbooks
              </Title>
              <Badge status="success">28 verified</Badge>
            </div>
            <Select
              size="s"
              aria-label="Sort runbooks"
              options={[
                { value: 'verified', label: 'Sort: Recently verified' },
                { value: 'name', label: 'Sort: Name' },
              ]}
            />
          </div>
          <div className="folio-stack">
            <SegmentedControl
              size="s"
              value={tab}
              onValueChange={setTab}
              items={[
                { value: 'all', label: 'All (42)' },
                { value: 'tier0', label: 'Tier-0 (14)' },
                { value: 'verified', label: 'Verified (28)' },
                { value: 'drafts', label: 'Drafts (4)' },
              ]}
            />
            <div className="folio-row folio-wrap">
              {scope && <Chip onRemove={() => setScope(false)}>scope: prod</Chip>}
              {windowFilter && <Chip onRemove={() => setWindowFilter(false)}>14–17 Sep</Chip>}
              <Link
                href="#reset"
                onClick={(event) => {
                  event.preventDefault();
                  setScope(true);
                  setWindowFilter(true);
                  setTab('all');
                }}
              >
                Reset
              </Link>
            </div>
          </div>
          <section className="folio-stack">
            <SectionHeading
              action={
                <Text size="caption-l" color="muted">
                  2 critical schematics
                </Text>
              }
            >
              Pinned topology playbooks
            </SectionHeading>
            <div className="folio-grid-2">
              <Card className="folio-topology-card">
                <div className="folio-row folio-between">
                  <Text size="caption-m" weight="semibold" color="muted">
                    POSTGRES · TIER-0
                  </Text>
                  <Badge status="success" size="s">
                    RTO &lt; 30s
                  </Badge>
                </div>
                <CardMedia>
                  <DatabaseTopology />
                </CardMedia>
                <Title as="h3" size="body-m">
                  Zero-Downtime PG Failover
                </Title>
                <Text size="caption-l" color="secondary">
                  Primary VIP fencing, WAL drain, and standby promotion.
                </Text>
                <div className="folio-row folio-between">
                  <Person name="DB team" />
                  <Badge status="success" size="s">
                    Verified
                  </Badge>
                </div>
              </Card>
              <Card className="folio-topology-card">
                <div className="folio-row folio-between">
                  <Text size="caption-m" weight="semibold" color="muted">
                    INGRESS · GLOBAL
                  </Text>
                  <Badge status="info" size="s">
                    0% drop
                  </Badge>
                </div>
                <CardMedia>
                  <IngressTopology />
                </CardMedia>
                <Title as="h3" size="body-m">
                  Regional Edge Traffic Drain
                </Title>
                <Text size="caption-l" color="secondary">
                  Envoy healthcheck shedding across active ingress POPs.
                </Text>
                <div className="folio-row folio-between">
                  <Person initials="ED" name="Edge SRE" />
                  <Badge status="accent" size="s">
                    Automated
                  </Badge>
                </div>
              </Card>
            </div>
          </section>
          <section className="folio-stack">
            <Text size="caption-l" color="muted">
              Filtered to {visibleRows.length} operational runbooks modified between 14 Sep and 17
              Sep 2026
            </Text>
            {view === 'list' ? (
              <TableScroll>
                <Table>
                  <thead>
                    <tr>
                      <th>
                        <Checkbox
                          size="s"
                          aria-label="Select all runbooks"
                          checked={selected.length === rows.length}
                          onChange={() =>
                            setSelected(
                              selected.length === rows.length ? [] : rows.map((row) => row.title),
                            )
                          }
                        />
                      </th>
                      <th>Runbook</th>
                      <th>Tier</th>
                      <th>Last drill</th>
                      <th>Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => (
                      <tr key={row.title} data-selected={selected.includes(row.title) || undefined}>
                        <td>
                          <Checkbox
                            size="s"
                            aria-label={`Select ${row.title}`}
                            checked={selected.includes(row.title)}
                            onChange={() => toggle(row.title)}
                          />
                        </td>
                        <td>
                          <DocumentName>{row.title}</DocumentName>
                        </td>
                        <td>
                          <Badge size="s" status={row.tier === 'Tier-0' ? 'warning' : 'neutral'}>
                            {row.tier}
                          </Badge>
                        </td>
                        <td>{row.date}</td>
                        <td>
                          <Person initials={row.initials} name={row.owner} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableScroll>
            ) : (
              <div className="folio-grid-2">
                {visibleRows.map((row) => (
                  <Card key={row.title}>
                    <DocumentName>{row.title}</DocumentName>
                    <Badge status="neutral">{row.tier}</Badge>
                    <Person initials={row.initials} name={row.owner} />
                  </Card>
                ))}
              </div>
            )}
            {visibleRows.length === 0 && (
              <Card variant="subtle">
                <Text size="body-s">No drafts match this drill window.</Text>
              </Card>
            )}
            <div className="folio-row folio-between folio-wrap">
              <Text size="caption-l" color="muted">
                {selected.length} selected · 28 verified runbooks in Platform Eng
              </Text>
              <Badge status="success" size="s">
                99.4% SLA
              </Badge>
            </div>
            <div className="folio-row folio-between folio-wrap">
              <Text size="caption-l" color="muted">
                Showing 1–{visibleRows.length} of 28 runbooks
              </Text>
              <Pagination pageCount={5} />
            </div>
          </section>
          {notice && (
            <div className="folio-notice" role="status">
              {notice}
            </div>
          )}
        </div>
      </FolioWorkspace>
    </FolioScene>
  );
}

export default defineScene({
  id: '03-document-collection',
  title: '03 · Document Collection & Date Filter',
  group: 'Folio',
  defaultViewport: 1440,
  render: CollectionScene,
});
