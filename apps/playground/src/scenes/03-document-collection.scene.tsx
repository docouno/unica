import { useRef, useState } from 'react';
import type { ComponentProps, ReactElement } from 'react';
import {
  CopyIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  PencilSimpleIcon,
  PlusIcon,
} from '@phosphor-icons/react';
import { AsidePanel } from '../prototypes/app-shell/app-shell.proto.js';
import { Badge } from '@docouno/unica';
import { Button, IconButton } from '../prototypes/button/button.proto.js';
import { DatePicker, DateRangePicker } from '../prototypes/date-picker/date-picker.proto.js';
import { dateLabel, dateObject } from '../prototypes/date-picker/date-utils.proto.js';
import type { DateRange } from '../prototypes/date-picker/date-utils.proto.js';
import { Card, CardMedia } from '../prototypes/card/card.proto.js';
import { ChipGroup } from '../prototypes/chip/chip.proto.js';
import { Progress } from '@docouno/unica';
import { Link } from '../prototypes/link/link.proto.js';
import { ContextMenu } from '../prototypes/menu/context-menu.proto.js';
import type { MenuEntry } from '../prototypes/menu/menu.entries.js';
import { Pagination } from '../prototypes/pagination/pagination.proto.js';
import { SegmentedControl } from '../prototypes/segmented-control/segmented-control.proto.js';
import { Select } from '../prototypes/select/select.proto.js';
import { Checkbox, Switch } from '../prototypes/binary-controls/binary-controls.proto.js';
import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableHeader,
  TableRow,
  TableRowHeader,
  TableScroll,
} from '../prototypes/table/table.proto.js';
import { TagGroup } from '../prototypes/tag/tag.proto.js';
import type { TagGroupItem } from '../prototypes/tag/tag.proto.js';
import { Text, Title } from '@docouno/unica';
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbPage,
} from '../prototypes/breadcrumb/breadcrumb.proto.js';
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
    title: 'Regional Ingress Failback',
    tier: 'Tier-0',
    modified: '2026-09-17',
    verifiedOn: '2026-09-11',
    initials: 'ED',
    owner: 'Edge SRE',
  },
  {
    title: 'Restore the Artifact Registry',
    tier: 'Tier-1',
    modified: '2026-09-16',
    verifiedOn: '2026-09-10',
    initials: 'PE',
    owner: 'Platform',
  },
  {
    title: 'Rotate the Secrets Signing Key',
    tier: 'Tier-0',
    modified: '2026-09-22',
    verifiedOn: '2026-09-19',
    initials: 'SE',
    owner: 'Security',
  },
  {
    title: 'Replay the Billing Event Stream',
    tier: 'Tier-1',
    modified: '2026-09-11',
    verifiedOn: '2026-09-10',
    initials: 'NW',
    owner: 'Core team',
  },
  {
    title: 'Restore a Database Snapshot',
    tier: 'Tier-0',
    modified: '2026-09-17',
    verifiedOn: '',
    initials: 'DB',
    owner: 'DB team',
  },
  {
    title: 'Drain the CI Worker Pool',
    tier: 'Tier-1',
    modified: '2026-09-16',
    verifiedOn: '',
    initials: 'PE',
    owner: 'Platform',
  },
  {
    title: 'Recover a Stalled Release',
    tier: 'Tier-1',
    modified: '2026-09-15',
    verifiedOn: '',
    initials: 'PE',
    owner: 'Platform',
  },
  {
    title: 'Quarantine a Compromised Runner',
    tier: 'Tier-1',
    modified: '2026-09-14',
    verifiedOn: '',
    initials: 'SE',
    owner: 'Security',
  },
] as const;

const tierZeroRows = rows.filter((row) => row.tier === 'Tier-0');
const verifiedRows = rows.filter((row) => row.verifiedOn);
const pageSize = 4;
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

function RunbookMenu<T extends HTMLElement>({
  title,
  onAction,
  target,
}: {
  readonly title: string;
  readonly onAction: (message: string) => void;
  readonly target: ComponentProps<typeof ContextMenu<T>>['target'];
}): ReactElement {
  const items: readonly MenuEntry[] = [
    {
      id: 'rename',
      label: 'Rename',
      icon: PencilSimpleIcon,
      run: () => onAction(`Rename requested for ${title}.`),
    },
    {
      id: 'copy',
      label: 'Copy runbook link',
      icon: CopyIcon,
      run: () => onAction(`Link selected for ${title}.`),
    },
    {
      id: 'export',
      label: 'Export Markdown',
      icon: DownloadSimpleIcon,
      run: () => onAction(`Markdown export requested for ${title}.`),
    },
  ];
  return (
    <ContextMenu<T>
      label={`${title} actions`}
      items={items}
      size="s"
      align="end"
      trigger={(props) => (
        <IconButton
          {...props}
          size="s"
          variant="ghost"
          icon={DotsThreeIcon}
          className="folio-runbook-menu-button"
          aria-label={`Actions for ${title}`}
        />
      )}
      target={target}
    />
  );
}

function CollectionScene(): ReactElement {
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState<readonly string[]>([rows[0].title, rows[1].title]);
  const [scope, setScope] = useState(true);
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [dateWindow, setDateWindow] = useState<DateRange>(initialWindow);
  const [verificationBaseline, setVerificationBaseline] = useState('');
  const [sort, setSort] = useState('verified');
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
      label: `Verified since ${dateLabel(verificationBaseline)}`,
      removeLabel: 'Remove verification date filter',
    });
  }
  const filteredRows = rows
    .filter(
      (row) =>
        tab !== 'drafts' &&
        (tab !== 'tier0' || row.tier === 'Tier-0') &&
        (!(verifiedOnly || tab === 'verified') || row.verifiedOn) &&
        (!verificationBaseline || row.verifiedOn >= verificationBaseline) &&
        (!hasWindow || (row.modified >= dateWindow[0] && row.modified <= dateWindow[1])),
    )
    .sort((first, second) =>
      sort === 'name'
        ? first.title.localeCompare(second.title)
        : second.verifiedOn.localeCompare(first.verifiedOn),
    );
  const pageStart = (page - 1) * pageSize;
  const visibleRows = filteredRows.slice(pageStart, pageStart + pageSize);
  const resultSummary =
    visibleRows.length === 0
      ? 'Showing 0 runbooks'
      : visibleRows.length === 1
        ? `Showing runbook ${pageStart + 1} of ${filteredRows.length}`
        : `Showing ${pageStart + 1}–${pageStart + visibleRows.length} of ${filteredRows.length} runbooks`;
  const pageTitles: readonly string[] = visibleRows.map((row) => row.title);
  const selectedOnPage = pageTitles.filter((title) => selected.includes(title)).length;
  function changeTab(value: string): void {
    setTab(value);
    setPage(1);
  }
  const toggle = (title: string): void =>
    setSelected((current) =>
      current.includes(title) ? current.filter((item) => item !== title) : [...current, title],
    );
  return (
    <FolioScene className="folio-collection">
      <FolioWorkspace
        activeNavigation="runbooks"
        expandedNavigation={['architecture', 'runbooks']}
        breadcrumb={
          <Breadcrumb size="s">
            <BreadcrumbLink href="?item=02-workspace-overview">Platform Eng</BreadcrumbLink>
            <BreadcrumbPage>Runbooks</BreadcrumbPage>
          </Breadcrumb>
        }
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
              <Switch
                size="s"
                checked={verifiedOnly}
                label="Verified only"
                onChange={(event) => {
                  setVerifiedOnly(event.currentTarget.checked);
                  setPage(1);
                }}
              />
              <Switch size="s" label="Include RFCs" />
              <DatePicker
                size="s"
                label="Verified on or after"
                value={verificationBaseline}
                onValueChange={(value) => {
                  setVerificationBaseline(value);
                  setPage(1);
                }}
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
                onValueChange={(value) => {
                  setDateWindow(value);
                  setPage(1);
                }}
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
                  {verifiedRows.length} verified
                </Badge>
              </div>
              <Select
                className="folio-sort-control"
                size="s"
                aria-label="Sort runbooks"
                value={sort}
                onValueChange={(value) => {
                  setSort(value ?? 'verified');
                  setPage(1);
                }}
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
                onValueChange={changeTab}
                items={[
                  { value: 'all', label: `All (${rows.length})` },
                  { value: 'tier0', label: `Tier-0 (${tierZeroRows.length})` },
                  { value: 'verified', label: `Verified (${verifiedRows.length})` },
                  { value: 'drafts', label: 'Drafts (0)' },
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
                    setPage(1);
                  } else {
                    setVerificationBaseline('');
                    setPage(1);
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
                  setVerifiedOnly(true);
                  setDateWindow(emptyWindow);
                  setVerificationBaseline('');
                  changeTab('all');
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
          <section className="folio-stack folio-collection-results">
            {visibleRows.length === 0 ? (
              <Card variant="subtle">
                <Text size="body-s">No runbooks match the current filters.</Text>
              </Card>
            ) : view === 'list' ? (
              <TableScroll aria-label="Runbook directory">
                <Table aria-label="Runbook directory">
                  <TableHeader>
                    <TableRow>
                      <TableCell align="center">
                        <Checkbox
                          size="s"
                          aria-label="Select all runbooks on this page"
                          checked={selectedOnPage === pageTitles.length}
                          indeterminate={selectedOnPage > 0 && selectedOnPage < pageTitles.length}
                          onChange={() =>
                            setSelected((current) =>
                              selectedOnPage === pageTitles.length
                                ? current.filter((title) => !pageTitles.includes(title))
                                : [...new Set([...current, ...pageTitles])],
                            )
                          }
                        />
                      </TableCell>
                      <TableColumnHeader>Runbook</TableColumnHeader>
                      <TableColumnHeader>Tier</TableColumnHeader>
                      <TableColumnHeader>Last modified</TableColumnHeader>
                      <TableColumnHeader>Last verified</TableColumnHeader>
                      <TableColumnHeader>Owner</TableColumnHeader>
                      <TableColumnHeader aria-label="Actions" className="folio-runbook-menu-cell" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleRows.map((row) => (
                      <RunbookMenu<HTMLTableRowElement>
                        key={row.title}
                        title={row.title}
                        onAction={setNotice}
                        target={(bindings, trigger, panel) => (
                          <TableRow {...bindings} selected={selected.includes(row.title)}>
                            <TableCell align="center">
                              <Checkbox
                                size="s"
                                aria-label={`Select ${row.title}`}
                                checked={selected.includes(row.title)}
                                onChange={() => toggle(row.title)}
                              />
                            </TableCell>
                            <TableRowHeader>
                              <DocumentName>{row.title}</DocumentName>
                            </TableRowHeader>
                            <TableCell>
                              <Badge
                                size="s"
                                status={row.tier === 'Tier-0' ? 'warning' : 'neutral'}
                              >
                                {row.tier}
                              </Badge>
                            </TableCell>
                            <TableCell>{dateLabel(row.modified)}</TableCell>
                            <TableCell>
                              {row.verifiedOn ? dateLabel(row.verifiedOn) : '—'}
                            </TableCell>
                            <TableCell>
                              <Person initials={row.initials} name={row.owner} />
                            </TableCell>
                            <TableCell
                              align="center"
                              control="action"
                              className="folio-runbook-menu-cell"
                            >
                              {trigger}
                              {panel}
                            </TableCell>
                          </TableRow>
                        )}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableScroll>
            ) : (
              <div className="folio-grid-2">
                {visibleRows.map((row) => (
                  <RunbookMenu<HTMLDivElement>
                    key={row.title}
                    title={row.title}
                    onAction={setNotice}
                    target={(bindings, trigger, panel) => (
                      <Card {...bindings} className="folio-runbook-menu-card">
                        <div className="folio-row folio-between">
                          <DocumentName>{row.title}</DocumentName>
                          {trigger}
                        </div>
                        <Badge size="s" status="neutral">
                          {row.tier}
                        </Badge>
                        <Text size="caption-l" color="muted">
                          Modified {dateLabel(row.modified)}
                        </Text>
                        <Text size="caption-l" color="muted">
                          {row.verifiedOn ? `Verified ${dateLabel(row.verifiedOn)}` : 'Unverified'}
                        </Text>
                        <Person initials={row.initials} name={row.owner} />
                        {panel}
                      </Card>
                    )}
                  />
                ))}
              </div>
            )}
            <div className="folio-row folio-between folio-wrap">
              <Text size="caption-l" color="muted">
                <bdi>
                  {selected.length} selected · {verifiedRows.length} verified runbooks in Platform
                  Eng
                </bdi>
              </Text>
              <Badge status="success" size="s">
                99.4% SLA
              </Badge>
            </div>
            <div className="folio-collection-footer">
              <Text size="caption-l" color="muted" role="status">
                <bdi>{resultSummary}</bdi>
              </Text>
              <Pagination
                size="s"
                label="Runbook pages"
                pageCount={Math.ceil(filteredRows.length / pageSize)}
                page={page}
                onPageChange={setPage}
              />
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
  uses: [
    'app-shell',
    'avatar',
    'badge',
    'breadcrumb',
    'button',
    'card',
    'checkbox',
    'chip',
    'context-menu',
    'date-picker',
    'date-range-picker',
    'icon',
    'kbd',
    'link',
    'pagination',
    'progress',
    'segmented-control',
    'select',
    'switch',
    'table',
    'tag',
    'text',
    'title',
  ],
  render: CollectionScene,
});
