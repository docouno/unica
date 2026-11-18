import { useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { DownloadSimpleIcon, PlusIcon } from '@phosphor-icons/react';
import { AsidePanel } from '../prototypes/app-shell/app-shell.proto.js';
import { Badge } from '../prototypes/badge/badge.proto.js';
import { Button } from '../prototypes/button/button.proto.js';
import { DatePicker, DateRangePicker } from '../prototypes/date-picker/date-picker.proto.js';
import type { DateRange } from '../prototypes/date-picker/date-utils.proto.js';
import { dateObject } from '../prototypes/date-picker/date-utils.proto.js';
import { Card, CardMedia } from '../prototypes/card/card.proto.js';
import { ChipGroup } from '../prototypes/chip/chip.proto.js';
import { Progress } from '../prototypes/progress/progress.proto.js';
import { Link } from '../prototypes/link/link.proto.js';
import { SegmentedControl } from '../prototypes/segmented-control/segmented-control.proto.js';
import { Select } from '../prototypes/select/select.proto.js';
import { Checkbox, Switch } from '../prototypes/binary-controls/binary-controls.proto.js';
import { Table, TableScroll } from '../prototypes/table/table.proto.js';
import { TagGroup } from '../prototypes/tag/tag.proto.js';
import type { TagGroupItem } from '../prototypes/tag/tag.proto.js';
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
} from './folio/folio.shared.js';

const rows = [
  {
    title: 'Zero-Downtime PG Failover',
    tier: 'Tier-0',
    modified: '2026-09-17',
    verifiedOn: '2026-09-17',
    initials: 'DB',
    owner: 'DB team',
  },
  {
    title: 'Edge TLS Certificate Rotation',
    tier: 'Tier-0',
    modified: '2026-09-16',
    verifiedOn: '2026-09-14',
    initials: 'ED',
    owner: 'Edge SRE',
  },
  {
    title: 'Redis Cluster Eviction Policy',
    tier: 'Tier-1',
    modified: '2026-09-15',
    verifiedOn: '2026-09-13',
    initials: 'NW',
    owner: 'Core team',
  },
  {
    title: 'Kafka Partition Rebalance Drill',
    tier: 'Tier-1',
    modified: '2026-09-14',
    verifiedOn: '2026-09-11',
    initials: 'PE',
    owner: 'Platform',
  },
  {
    title: 'Certificate Issuer Recovery',
    tier: 'Tier-1',
    modified: '2026-09-11',
    verifiedOn: '2026-09-10',
    initials: 'SE',
    owner: 'Security',
  },
  {
    title: 'Queue Drain Procedure',
    tier: 'Tier-1',
    modified: '2026-09-22',
    verifiedOn: '2026-09-19',
    initials: 'PE',
    owner: 'Platform',
  },
] as const;

const initialWindow: DateRange = ['2026-09-14', '2026-09-17'];
const emptyWindow: DateRange = ['', ''];

function modifiedLabel(range: DateRange): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatRange(dateObject(range[0]), dateObject(range[1]));
}

function CollectionScene(): ReactElement {
  const [tab, setTab] = useState('all');
  const [view, setView] = useState('list');
  const [sort, setSort] = useState('verified');
  const [selected, setSelected] = useState<readonly string[]>([rows[0].title, rows[1].title]);
  const [scope, setScope] = useState(true);
  const [dateWindow, setDateWindow] = useState<DateRange>(initialWindow);
  const [verificationBaseline, setVerificationBaseline] = useState('');
  const [notice, setNotice] = useState('');
  const resetRef = useRef<HTMLAnchorElement>(null);
  const filters: TagGroupItem[] = [];
  if (scope) {
    filters.push({ id: 'scope', label: 'scope: prod', removeLabel: 'Remove scope: prod filter' });
  }
  const hasWindow = Boolean(dateWindow[0] && dateWindow[1]);
  if (hasWindow) {
    filters.push({
      id: 'date',
      label: modifiedLabel(dateWindow),
      removeLabel: 'Remove modified date filter',
    });
  }
  if (verificationBaseline) {
    filters.push({
      id: 'verification',
      label: `Verified since ${modifiedLabel([verificationBaseline, verificationBaseline])}`,
      removeLabel: 'Remove verification date filter',
    });
  }
  const visibleRows = rows
    .filter(
      (row) =>
        tab !== 'drafts' &&
        (tab !== 'tier0' || row.tier === 'Tier-0') &&
        (!verificationBaseline || row.verifiedOn >= verificationBaseline) &&
        (!hasWindow || (row.modified >= dateWindow[0] && row.modified <= dateWindow[1])),
    )
    .sort((first, second) =>
      sort === 'name'
        ? first.title.localeCompare(second.title)
        : second.verifiedOn.localeCompare(first.verifiedOn),
    );
  const visibleSelected = visibleRows.filter((row) => selected.includes(row.title)).length;
  const toggle = (title: string): void =>
    setSelected((current) =>
      current.includes(title) ? current.filter((item) => item !== title) : [...current, title],
    );
  return (
    <FolioScene className="folio-collection">
      <FolioWorkspace
        activeNavigation="runbooks"
        expandedNavigation={['architecture', 'runbooks']}
        crumbs={['Platform Eng', 'Runbooks']}
        minHeight={960}
        actions={
          <div className="folio-row">
            <SegmentedControl
              aria-label="Collection layout"
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
              <DatePicker
                size="s"
                label="Verified on or after"
                value={verificationBaseline}
                onValueChange={setVerificationBaseline}
                clearable
              />
            </InspectorSection>
            <InspectorSection title="Drill readiness">
              <Progress value={84} label="Q3 drill coverage" />
            </InspectorSection>
            <InspectorSection title="Activity filters">
              <DateRangePicker
                size="s"
                label="Last modified"
                panelTitle="Modified date range"
                value={dateWindow}
                onValueChange={setDateWindow}
                clearable
              />
            </InspectorSection>
          </AsidePanel>
        }
      >
        <div className="folio-content folio-content-collection">
          <div className="folio-collection-intro">
            <div className="folio-row folio-between folio-wrap">
              <div className="folio-row">
                <Title as="h1" size="heading-l">
                  Runbooks & Playbooks
                </Title>
                <Badge size="s" status="success">
                  28 verified
                </Badge>
              </div>
              <Select
                className="folio-sort-control"
                size="s"
                aria-label="Sort runbooks"
                value={sort}
                onChange={(event) => setSort(event.currentTarget.value)}
                options={[
                  { value: 'verified', label: 'Sort: Recently verified' },
                  { value: 'name', label: 'Sort: Name' },
                ]}
              />
            </div>
            <div className="folio-row folio-wrap">
              <ChipGroup
                className="folio-collection-facets"
                label="Runbook filter"
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
              <TagGroup
                size="s"
                label="Applied document filters"
                items={filters}
                onRemove={(id) => {
                  if (id === 'scope') {
                    setScope(false);
                  } else if (id === 'date') {
                    setDateWindow(emptyWindow);
                  } else {
                    setVerificationBaseline('');
                  }
                }}
                emptyMessage="No filters applied"
                emptyFocusRef={resetRef}
              />
              <Link
                ref={resetRef}
                href="#reset"
                onClick={(event) => {
                  event.preventDefault();
                  setScope(true);
                  setDateWindow(emptyWindow);
                  setVerificationBaseline('');
                  setTab('all');
                }}
              >
                Reset
              </Link>
            </div>
          </div>
          <section className="folio-stack">
            <div className="folio-row folio-between">
              <Title
                as="h2"
                size="body-m"
                color="muted"
                className="folio-topology-heading folio-eyebrow"
              >
                Pinned topology playbooks
              </Title>
              <Text size="caption-l" color="muted">
                2 critical schematics
              </Text>
            </div>
            <div className="folio-grid-2">
              <Card className="folio-topology-card">
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
            <Text size="caption-l" color="muted" role="status">
              {visibleRows.length} matching {visibleRows.length === 1 ? 'runbook' : 'runbooks'}
            </Text>
            {visibleRows.length > 0 &&
              (view === 'list' ? (
                <TableScroll>
                  <Table>
                    <thead>
                      <tr>
                        <th>
                          <Checkbox
                            size="s"
                            aria-label="Select all runbooks"
                            checked={visibleSelected === visibleRows.length}
                            indeterminate={
                              visibleSelected > 0 && visibleSelected < visibleRows.length
                            }
                            onChange={() => {
                              const visible = visibleRows.map((row) => row.title);
                              setSelected((current) => {
                                const other = current.filter(
                                  (title) => !visibleRows.some((row) => row.title === title),
                                );
                                return visibleSelected === visibleRows.length
                                  ? other
                                  : [...other, ...visible];
                              });
                            }}
                          />
                        </th>
                        <th>Runbook</th>
                        <th>Tier</th>
                        <th>Last modified</th>
                        <th>Last verified</th>
                        <th>Owner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row) => (
                        <tr
                          key={row.title}
                          data-selected={selected.includes(row.title) || undefined}
                        >
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
                          <td>{modifiedLabel([row.modified, row.modified])}</td>
                          <td>{modifiedLabel([row.verifiedOn, row.verifiedOn])}</td>
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
                      <Badge size="s" status="neutral">
                        {row.tier}
                      </Badge>
                      <Text size="caption-l" color="muted">
                        Modified {modifiedLabel([row.modified, row.modified])}
                      </Text>
                      <Text size="caption-l" color="muted">
                        Verified {modifiedLabel([row.verifiedOn, row.verifiedOn])}
                      </Text>
                      <Person initials={row.initials} name={row.owner} />
                    </Card>
                  ))}
                </div>
              ))}
            {visibleRows.length === 0 && (
              <Card variant="subtle">
                <Text size="body-s">No runbooks match these filters.</Text>
              </Card>
            )}
            <div className="folio-row folio-between folio-wrap">
              <Text size="caption-l" color="muted">
                {visibleSelected} selected · Platform Eng
              </Text>
              <Badge status="success" size="s">
                99.4% SLA
              </Badge>
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
  render: () => <CollectionScene />,
});
