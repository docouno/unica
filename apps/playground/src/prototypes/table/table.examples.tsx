import { useId, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import {
  CopyIcon,
  DotsThreeIcon,
  GitBranchIcon,
  LockSimpleIcon,
  PushPinIcon,
  ArrowCounterClockwiseIcon,
} from '@phosphor-icons/react';
import { Alert, AlertDescription, AlertTitle } from '../alert/alert.proto.js';
import { Badge } from '../badge/badge.proto.js';
import { Checkbox } from '../binary-controls/binary-controls.proto.js';
import { Button, IconButton } from '../button/button.proto.js';
import { Card } from '../card/card.proto.js';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../dialog/dialog.proto.js';
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '../empty/empty.proto.js';
import { Input } from '../input/input.proto.js';
import { Link } from '../link/link.proto.js';
import { ContextMenu } from '../menu/context-menu.proto.js';
import { Menu } from '../menu/menu.live.js';
import { Pagination } from '../pagination/pagination.proto.js';
import { Select } from '../select/select-control.proto.js';
import { SkeletonText } from '../skeleton/skeleton.proto.js';
import { Text } from '../text/text.proto.js';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableColumnHeader,
  TableFooter,
  TableHeader,
  TableRow,
  TableRowHeader,
  TableScroll,
} from './table.proto.js';
import type { TableSize, TableSortDirection } from './table.proto.js';
import './table.examples.css';

const sizes = ['s', 'm', 'l'] as const;
const densityNames = { s: 'Compact', m: 'Standard', l: 'Comfortable' };

function BudgetTable({ size }: { readonly size: TableSize }): ReactElement {
  const captionId = useId();
  return (
    <TableScroll aria-labelledby={captionId}>
      <Table size={size} className="table-example-budgets">
        <TableCaption id={captionId}>
          {densityNames[size]} <span>{size.toUpperCase()}</span>
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableColumnHeader>Service</TableColumnHeader>
            <TableColumnHeader align="center">Region</TableColumnHeader>
            <TableColumnHeader align="end">Requests</TableColumnHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableRowHeader>Gateway</TableRowHeader>
            <TableCell align="center">
              <bdi>eu-west</bdi>
            </TableCell>
            <TableCell align="end">
              <bdi>24,800</bdi>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableRowHeader>Object store</TableRowHeader>
            <TableCell align="center">
              <bdi>us-east</bdi>
            </TableCell>
            <TableCell align="end">
              <bdi>1,260</bdi>
            </TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableRowHeader colSpan={2}>Total</TableRowHeader>
            <TableCell align="end">
              <bdi>26,060</bdi>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableScroll>
  );
}

export function DensityExamples(): ReactElement {
  return (
    <div className="table-example-stack">
      {sizes.map((size) => (
        <BudgetTable key={size} size={size} />
      ))}
    </div>
  );
}

const routes = [
  { id: 'queue', path: '/queue', policy: 'inherit' },
  { id: 'events', path: '/events', policy: 'allow' },
  { id: 'system', path: '/up', policy: 'inherit', locked: true },
];
const policies = [
  { value: 'inherit', label: 'Inherit' },
  { value: 'allow', label: 'Allow' },
  { value: 'deny', label: 'Deny' },
];

function copyValue(value: string, onNotice: (message: string) => void): void {
  if (!navigator.clipboard) {
    onNotice(value);
    return;
  }
  void navigator.clipboard.writeText(value).then(
    () => onNotice(`Copied ${value}.`),
    () => onNotice(value),
  );
}

function RouteRow({
  route,
  size,
  onNotice,
}: {
  readonly route: (typeof routes)[number];
  readonly size: TableSize;
  readonly onNotice: (message: string) => void;
}): ReactElement {
  const [path, setPath] = useState(route.path);
  const [policy, setPolicy] = useState<string | null>(route.policy);
  return (
    <TableRow>
      <TableCell control="field">
        <Input
          aria-label={`Path for ${route.id}`}
          variant="ghost"
          size={size}
          dir="ltr"
          value={path}
          onChange={(event) => setPath(event.currentTarget.value)}
          readOnly={route.locked}
          iconRight={route.locked ? LockSimpleIcon : undefined}
        />
      </TableCell>
      <TableCell control="field">
        <Select
          aria-label={`Policy for ${route.id}`}
          variant="ghost"
          size={size}
          options={policies}
          value={policy}
          onValueChange={setPolicy}
          disabled={route.locked}
        />
      </TableCell>
      <TableCell control="action" align="center">
        <Menu
          label={`Actions for ${route.id}`}
          align="end"
          size="s"
          items={[
            {
              id: 'copy',
              label: 'Copy path',
              icon: CopyIcon,
              run: () => copyValue(path, onNotice),
            },
            {
              id: 'reset',
              label: 'Restore defaults',
              icon: ArrowCounterClockwiseIcon,
              disabled: route.locked || (path === route.path && policy === route.policy),
              run: () => {
                setPath(route.path);
                setPolicy(route.policy);
                onNotice(`Defaults restored for ${route.id}.`);
              },
            },
          ]}
          trigger={(props) => (
            <IconButton
              {...props}
              aria-label={`Actions for ${route.id}`}
              icon={DotsThreeIcon}
              size={size}
              variant="ghost"
            />
          )}
        />
      </TableCell>
    </TableRow>
  );
}

function RouteTable({ size }: { readonly size: TableSize }): ReactElement {
  const captionId = useId();
  const [notice, setNotice] = useState('');
  return (
    <div className="table-example-route-case">
      <TableScroll aria-labelledby={captionId}>
        <Table size={size} className="table-example-routes">
          <TableCaption id={captionId}>
            Route policies <span>{size.toUpperCase()}</span>
          </TableCaption>
          <colgroup>
            <col />
            <col className="table-example-policy-column" />
            <col className="table-example-actions-column" />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableColumnHeader>Route</TableColumnHeader>
              <TableColumnHeader>Policy</TableColumnHeader>
              <TableColumnHeader aria-label="Actions" className="table-example-action-heading" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.map((route) => (
              <RouteRow key={route.id} route={route} size={size} onNotice={setNotice} />
            ))}
          </TableBody>
        </Table>
      </TableScroll>
      <Text
        className="table-example-route-notice"
        size="caption-l"
        color="muted"
        role="status"
        dir="auto"
      >
        {notice}
      </Text>
    </div>
  );
}

export function EditorExamples(): ReactElement {
  return (
    <div className="table-example-stack">
      {sizes.map((size) => (
        <RouteTable key={size} size={size} />
      ))}
    </div>
  );
}

const builds = [
  { name: 'Gateway', version: 'v2.18.4', status: 'Passed', duration: 52.4 },
  { name: 'Index worker', version: 'v4.6.2', status: 'Review', duration: 49.8 },
  { name: 'Event relay', version: 'v1.32.0', status: 'Passed', duration: 31.6 },
  { name: 'Search API', version: 'v3.2.1', status: 'Failed', duration: 41.2 },
  { name: 'Billing export', version: 'v2.11.0', status: 'Passed', duration: 44.0 },
  { name: 'Image worker', version: 'v1.12.0', status: 'Passed', duration: 27.8 },
  { name: 'Reporting API', version: 'v3.0.7', status: 'Review', duration: 8.0, locked: true },
  { name: 'Auth broker', version: 'v7.2.0', status: 'Passed', duration: 38.1 },
] as const;

type Build = (typeof builds)[number];
type SortKey = 'name' | 'duration';
interface Sort {
  readonly key: SortKey;
  readonly direction: Exclude<TableSortDirection, 'none'>;
}

export function BuildQueue(): ReactElement {
  const captionId = useId();
  const [sort, setSort] = useState<Sort | null>({ key: 'duration', direction: 'descending' });
  const [selected, setSelected] = useState<readonly string[]>(['Gateway', 'Index worker']);
  const [striped, setStriped] = useState(true);
  const [pinned, setPinned] = useState<readonly string[]>([]);
  const [notice, setNotice] = useState('');
  const eligible = builds.filter((build) => !('locked' in build));
  const allSelected = selected.length === eligible.length;
  const rows = sort
    ? [...builds].sort((a, b) => {
        const order = sort.key === 'name' ? a.name.localeCompare(b.name) : a.duration - b.duration;
        return sort.direction === 'ascending' ? order : -order;
      })
    : builds;

  function sortBy(key: SortKey): void {
    setSort((current) => {
      if (current?.key !== key) {
        return { key, direction: 'ascending' };
      }
      return current.direction === 'ascending' ? { key, direction: 'descending' } : null;
    });
  }

  function toggleBuild(build: Build): void {
    setSelected((current) =>
      current.includes(build.name)
        ? current.filter((name) => name !== build.name)
        : [...current, build.name],
    );
  }

  return (
    <div className="table-example-stack">
      <Card className="table-example-card">
        <TableScroll className="table-example-bounded" aria-labelledby={captionId}>
          <Table stickyHeader striped={striped} className="table-example-queue">
            <TableCaption id={captionId}>Build queue</TableCaption>
            <TableHeader>
              <TableRow>
                <TableCell align="center" className="table-example-choice">
                  <Checkbox
                    size="s"
                    aria-label="Select all available builds"
                    checked={allSelected}
                    indeterminate={selected.length > 0 && !allSelected}
                    onChange={() =>
                      setSelected(allSelected ? [] : eligible.map(({ name }) => name))
                    }
                  />
                </TableCell>
                <TableColumnHeader
                  sortDirection={sort?.key === 'name' ? sort.direction : 'none'}
                  onSort={() => sortBy('name')}
                >
                  Service
                </TableColumnHeader>
                <TableColumnHeader>Result</TableColumnHeader>
                <TableColumnHeader
                  align="end"
                  sortDirection={sort?.key === 'duration' ? sort.direction : 'none'}
                  onSort={() => sortBy('duration')}
                >
                  Time (s)
                </TableColumnHeader>
                <TableColumnHeader aria-label="Actions" className="table-example-actions" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((build) => {
                const isPinned = pinned.includes(build.name);
                const isSelected = selected.includes(build.name);
                return (
                  <ContextMenu<HTMLTableRowElement>
                    key={build.name}
                    label={`${build.name} actions`}
                    items={[
                      {
                        id: 'pin',
                        label: isPinned ? 'Unpin build' : 'Pin build',
                        icon: PushPinIcon,
                        run: () => {
                          setPinned((current) =>
                            isPinned
                              ? current.filter((name) => name !== build.name)
                              : [...current, build.name],
                          );
                          setNotice(`${build.name} ${isPinned ? 'unpinned' : 'pinned'}.`);
                        },
                      },
                      {
                        id: 'copy',
                        label: 'Copy version',
                        icon: CopyIcon,
                        run: () => copyValue(build.version, setNotice),
                      },
                    ]}
                    trigger={(props) => (
                      <IconButton
                        {...props}
                        aria-label={`${build.name} actions`}
                        icon={DotsThreeIcon}
                        size="m"
                        variant="ghost"
                      />
                    )}
                    target={(bindings, trigger, panel) => (
                      <TableRow {...bindings} selected={isSelected}>
                        <TableCell align="center" className="table-example-choice">
                          <Checkbox
                            size="s"
                            aria-label={`Select ${build.name}`}
                            checked={isSelected}
                            disabled={'locked' in build}
                            onChange={() => toggleBuild(build)}
                          />
                        </TableCell>
                        <TableRowHeader>
                          <span className="table-example-entity">
                            <span>{build.name}</span>
                            {isPinned && (
                              <PushPinIcon aria-label="Pinned" role="img" weight="fill" />
                            )}
                          </span>
                          <span className="table-example-secondary">
                            <bdi>{build.version}</bdi>
                          </span>
                        </TableRowHeader>
                        <TableCell>
                          <Badge
                            size="s"
                            status={
                              build.status === 'Passed'
                                ? 'success'
                                : build.status === 'Review'
                                  ? 'warning'
                                  : 'danger'
                            }
                            dot
                          >
                            {build.status}
                          </Badge>
                        </TableCell>
                        <TableCell align="end">
                          <bdi>{build.duration.toFixed(1)}</bdi>
                        </TableCell>
                        <TableCell
                          align="center"
                          control="action"
                          className="table-example-actions"
                        >
                          {trigger}
                          {panel}
                        </TableCell>
                      </TableRow>
                    )}
                  />
                );
              })}
            </TableBody>
          </Table>
        </TableScroll>
        <div className="table-example-tools">
          <Text size="caption-l" color="muted" role="status" dir="auto">
            {selected.length} of {eligible.length} builds selected
          </Text>
          <Checkbox
            size="s"
            label="Stripe rows"
            checked={striped}
            onChange={() => setStriped(!striped)}
          />
        </div>
        {notice && (
          <Text size="caption-l" role="status">
            {notice}
          </Text>
        )}
      </Card>
    </div>
  );
}

const relations = [
  ['Gateway endpoint inventory', 'Reference', '18 Oct'],
  ['Redis failover procedure', 'Runbook', '16 Oct'],
  ['Production access review', 'Policy', '12 Oct'],
  ['Event retention policy', 'Policy', '08 Oct'],
  ['Service ownership registry', 'Reference', '03 Oct'],
  ['Tenant migration', 'Runbook', '01 Oct'],
] as const;

export function RelationsDrawer(): ReactElement {
  const [open, setOpen] = useState(true);
  const titleId = useId();
  return (
    <div className="table-example-drawer-stage">
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger hidden={open} variant="secondary" tone="neutral">
          Show relations
        </DrawerTrigger>
        <DrawerContent
          className="table-example-drawer"
          side={{ narrow: 'bottom', wide: 'end' }}
          swipeToClose={false}
        >
          <DrawerHeader closeLabel="Close document relations">
            <DrawerTitle>Document relations</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <TableScroll className="table-example-relations-scroll" aria-labelledby={titleId}>
              <Table size="s" stickyHeader striped className="table-example-relations">
                <TableCaption id={titleId} className="table-example-visually-hidden">
                  Linked documents
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableColumnHeader>Document</TableColumnHeader>
                    <TableColumnHeader>Kind</TableColumnHeader>
                    <TableColumnHeader align="end">Revised</TableColumnHeader>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relations.map(([name, kind, date]) => (
                    <TableRow key={name}>
                      <TableRowHeader>{name}</TableRowHeader>
                      <TableCell>{kind}</TableCell>
                      <TableCell align="end">
                        <bdi className="table-example-token">{date}</bdi>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScroll>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

const policiesByPage = [
  [
    ['Zero-Downtime PG Failover', 'Runbook', '18 Oct'],
    ['regionalFailoverVerificationChecklist', 'Runbook', '12 Oct'],
    ['Post-recovery write audit', 'Checklist', '03 Oct'],
  ],
  [
    ['Volume snapshots', 'Reference', '27 Sep'],
    ['Validate read replicas', 'Checklist', '20 Sep'],
    ['Restore point retention', 'Policy', '19 Sep'],
  ],
] as const;

export function ReferenceIndex(): ReactElement {
  const captionId = useId();
  const [page, setPage] = useState(1);
  return (
    <div className="table-example-stack">
      <TableScroll aria-labelledby={captionId}>
        <Table size="s" className="table-example-index">
          <TableCaption id={captionId}>Recovery references</TableCaption>
          <TableHeader>
            <TableRow>
              <TableColumnHeader>Document</TableColumnHeader>
              <TableColumnHeader>Kind</TableColumnHeader>
              <TableColumnHeader align="end">Revised</TableColumnHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(policiesByPage[page - 1] ?? []).map(([name, kind, date]) => (
              <TableRow key={name}>
                <TableRowHeader>
                  {name === 'Zero-Downtime PG Failover' ? (
                    <Link href="?item=04-document-reader">Zero-Downtime PG Failover</Link>
                  ) : (
                    <bdi>{name}</bdi>
                  )}
                </TableRowHeader>
                <TableCell>{kind}</TableCell>
                <TableCell align="end">
                  <bdi className="table-example-token">{date}</bdi>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScroll>
      <div className="table-example-tools">
        <Text size="caption-l" color="muted" role="status" dir="auto">
          {page === 1 ? '1–3 of 6 documents' : '4–6 of 6 documents'}
        </Text>
        <Pagination
          label="Recovery references pages"
          format="compact"
          page={page}
          pageCount={2}
          size="s"
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

type ResultState = 'loading' | 'empty' | 'error';

export function ResultExamples(): ReactElement {
  const [state, setState] = useState<ResultState>('empty');
  const previewControl = useRef<HTMLButtonElement>(null);
  const captionId = useId();
  return (
    <div className="table-example-stack">
      <Select
        size="s"
        width="auto"
        aria-label="Preview result"
        ref={previewControl}
        value={state}
        onValueChange={(value) => {
          if (value === 'empty' || value === 'loading' || value === 'error') {
            setState(value);
          }
        }}
        options={[
          { value: 'empty', label: 'No matches' },
          { value: 'loading', label: 'Loading' },
          { value: 'error', label: 'Request failed' },
        ]}
      />
      <TableScroll aria-labelledby={captionId}>
        <Table className="table-example-results" aria-busy={state === 'loading' || undefined}>
          <TableCaption id={captionId}>Branch checks</TableCaption>
          <TableHeader>
            <TableRow>
              <TableColumnHeader>Branch</TableColumnHeader>
              <TableColumnHeader align="end">Open checks</TableColumnHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state === 'loading' ? (
              ['75%', '60%', '80%'].map((width) => (
                <TableRow key={width} aria-hidden="true">
                  <TableCell>
                    <SkeletonText size="body-s" lines={1} width={width} />
                  </TableCell>
                  <TableCell>
                    <SkeletonText
                      className="table-example-number-placeholder"
                      size="body-s"
                      lines={1}
                      width="3ch"
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="table-example-feedback">
                  {state === 'empty' ? (
                    <Empty size="s">
                      <EmptyMedia icon={GitBranchIcon} />
                      <EmptyTitle>No branches match</EmptyTitle>
                      <EmptyDescription>
                        There are no open checks under the current filter.
                      </EmptyDescription>
                    </Empty>
                  ) : (
                    <Alert status="danger" size="s">
                      <AlertTitle>Branch checks could not load</AlertTitle>
                      <AlertDescription>Retry to refresh the current results.</AlertDescription>
                      <Button
                        size="s"
                        variant="secondary"
                        tone="neutral"
                        onClick={() => {
                          setState('loading');
                          previewControl.current?.focus();
                        }}
                      >
                        Retry
                      </Button>
                    </Alert>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableScroll>
      {state === 'loading' && (
        <span className="table-example-visually-hidden" role="status">
          Loading branch checks
        </span>
      )}
    </div>
  );
}
