import {
  Alert,
  AlertActions,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  Checkbox,
  ContextMenu,
  ContextMenuTrigger,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
  Flex,
  IconButton,
  Input,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  Select,
  SelectContent,
  SelectTrigger,
  SkeletonText,
  Stack,
  Text,
  VisuallyHidden,
} from '@docouno/unica';
import { useId, useRef, useState } from 'react';
import { OverlayExampleFrame } from '../../examples/OverlayExampleFrame.js';
import type { PreviewProps, Surface } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';
import type { ReactElement } from 'react';
import {
  CopyIcon,
  DotsThreeIcon,
  GitBranchIcon,
  LockSimpleIcon,
  PushPinIcon,
  ArrowCounterClockwiseIcon,
} from '@phosphor-icons/react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableColumnHeader,
  TableHeader,
  TableRow,
  TableRowHeader,
  TableScroll,
} from '../../prototypes/table/table.proto.js';
import type { TableSize, TableSortDirection } from '../../prototypes/table/table.proto.js';
import './table.examples.css';

const sizes = ['s', 'm', 'l'] as const;
type TableAttributes = Readonly<Record<`data-${string}`, string>>;

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

function useRowActionNotice() {
  const [notice, setNotice] = useState('');
  const latest = useRef(0);
  function report(message: string): void {
    latest.current++;
    setNotice(message);
  }
  function copy(value: string): void {
    const request = ++latest.current;
    function finish(copied: boolean): void {
      if (request === latest.current) {
        setNotice(
          copied
            ? `Copied ${value}.`
            : `Could not copy. Select and copy this value manually: ${value}`,
        );
      }
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(value).then(
        () => finish(true),
        () => finish(false),
      );
    } else {
      finish(false);
    }
  }
  return { notice, report, copy };
}

function RouteRow({
  route,
  size,
  onNotice,
  onCopy,
}: {
  readonly route: (typeof routes)[number];
  readonly size: TableSize;
  readonly onNotice: (message: string) => void;
  readonly onCopy: (value: string) => void;
}): ReactElement {
  const [path, setPath] = useState(route.path);
  const [policy, setPolicy] = useState<string | null>(route.policy);
  return (
    <TableRow>
      <TableCell control="field">
        <Input
          className="table-route-editor"
          aria-label={`Path for ${route.id}`}
          variant="ghost"
          placeholder="/runbooks/document-name"
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
          width="full"
          size={size}
          options={policies}
          value={policy}
          onValueChange={setPolicy}
          disabled={route.locked}
        >
          <SelectTrigger className="table-policy-trigger" />
          <SelectContent />
        </Select>
      </TableCell>
      <TableCell control="action" align="center">
        <Menu size="s">
          <MenuTrigger asChild>
            <IconButton
              className="table-cell-action-proto"
              aria-label={`Actions for ${route.id}`}
              icon={DotsThreeIcon}
              size={size}
              variant="ghost"
            />
          </MenuTrigger>
          <MenuContent align="end">
            <MenuItem icon={CopyIcon} disabled={path.length === 0} onClick={() => onCopy(path)}>
              Copy path
            </MenuItem>
            <MenuItem
              icon={ArrowCounterClockwiseIcon}
              disabled={route.locked || (path === route.path && policy === route.policy)}
              onClick={() => {
                setPath(route.path);
                setPolicy(route.policy);
                onNotice(`Defaults restored for ${route.id}.`);
              }}
            >
              Restore defaults
            </MenuItem>
          </MenuContent>
        </Menu>
      </TableCell>
    </TableRow>
  );
}

function RouteTable({
  size,
  subjectAttributes,
}: {
  readonly size: TableSize;
  readonly subjectAttributes: TableAttributes | undefined;
}): ReactElement {
  const captionId = useId();
  const { notice, report, copy } = useRowActionNotice();
  return (
    <Stack gap={4}>
      <TableScroll aria-labelledby={captionId}>
        <Table {...subjectAttributes} size={size} className="table-example-routes">
          <TableCaption id={captionId}>
            <bdi>
              Route policies{' '}
              <Text as="span" size="caption-l" color="muted">
                {size.toUpperCase()}
              </Text>
            </bdi>
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
              <RouteRow key={route.id} route={route} size={size} onNotice={report} onCopy={copy} />
            ))}
          </TableBody>
        </Table>
      </TableScroll>
      <Text className="table-example-route-notice" size="caption-l" color="muted" role="status">
        <bdi>{notice}</bdi>
      </Text>
    </Stack>
  );
}

export function EditorExamples({ ctx }: PreviewProps): ReactElement {
  return (
    <div style={{ inlineSize: 'min(100%, 34rem)' }}>
      <ExampleSurface surface={ctx.surface} gap={24}>
        {sizes.map((size) => (
          <RouteTable key={size} size={size} subjectAttributes={ctx.subject} />
        ))}
      </ExampleSurface>
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

export function BuildQueue({
  striped = true,
  subject,
  surface = 'base',
}: {
  readonly striped?: boolean;
  readonly subject?: TableAttributes;
  readonly surface?: Surface;
} = {}): ReactElement {
  const captionId = useId();
  const [sort, setSort] = useState<Sort | null>({ key: 'duration', direction: 'descending' });
  const [selected, setSelected] = useState<readonly string[]>(['Gateway', 'Index worker']);
  const [pinned, setPinned] = useState<readonly string[]>([]);
  const { notice, report, copy } = useRowActionNotice();
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

  const contents = (
    <>
      <TableScroll className="table-example-bounded" aria-labelledby={captionId}>
        <Table {...subject} stickyHeader striped={striped} className="table-example-queue">
          <TableCaption id={captionId}>Build queue</TableCaption>
          <TableHeader>
            <TableRow>
              <TableColumnHeader
                aria-label="Select builds"
                align="center"
                className="table-example-choice"
              >
                <Checkbox
                  size="s"
                  aria-label="Select all available builds"
                  checked={allSelected}
                  indeterminate={selected.length > 0 && !allSelected}
                  onChange={() => setSelected(allSelected ? [] : eligible.map(({ name }) => name))}
                />
              </TableColumnHeader>
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
                <ContextMenu key={build.name}>
                  <ContextMenuTrigger>
                    <TableRow selected={isSelected}>
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
                        <Flex align="center" gap={8}>
                          <span>{build.name}</span>
                          {isPinned && <PushPinIcon aria-label="Pinned" role="img" weight="fill" />}
                        </Flex>
                        <Text
                          as="span"
                          size="caption-l"
                          color="muted"
                          style={{ display: 'block', fontWeight: 400 }}
                        >
                          <bdi>{build.version}</bdi>
                        </Text>
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
                      <TableCell align="center" control="action" className="table-example-actions">
                        <MenuTrigger asChild>
                          <IconButton
                            className="table-cell-action-proto"
                            aria-label={`${build.name} actions`}
                            icon={DotsThreeIcon}
                            size="m"
                            variant="ghost"
                          />
                        </MenuTrigger>
                        <MenuContent>
                          <MenuItem
                            icon={PushPinIcon}
                            onClick={() => {
                              setPinned((current) =>
                                isPinned
                                  ? current.filter((name) => name !== build.name)
                                  : [...current, build.name],
                              );
                              report(`${build.name} ${isPinned ? 'unpinned' : 'pinned'}.`);
                            }}
                          >
                            {isPinned ? 'Unpin build' : 'Pin build'}
                          </MenuItem>
                          <MenuItem icon={CopyIcon} onClick={() => copy(build.version)}>
                            Copy version
                          </MenuItem>
                        </MenuContent>
                      </TableCell>
                    </TableRow>
                  </ContextMenuTrigger>
                </ContextMenu>
              );
            })}
          </TableBody>
        </Table>
      </TableScroll>
      <Stack gap={0}>
        <Text size="caption-l" color="muted" role="status">
          <bdi>
            {selected.length} of {eligible.length} builds selected
          </bdi>
        </Text>
        <Text
          size="caption-l"
          role="status"
          style={{ marginBlockStart: notice ? 'var(--space-4)' : 0 }}
        >
          <bdi>{notice}</bdi>
        </Text>
      </Stack>
    </>
  );
  return (
    <div style={{ inlineSize: 'min(100%, 47rem)' }}>
      {surface === 'overlay' ? (
        <ExampleSurface surface={surface}>{contents}</ExampleSurface>
      ) : (
        <Card className="table-example-card">{contents}</Card>
      )}
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

export function RelationsDrawer({ ctx }: PreviewProps): ReactElement {
  const [open, setOpen] = useState(true);
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  return (
    <OverlayExampleFrame ctx={ctx} title="Document relations example" height={304} modal>
      <div className="table-example-drawer-stage">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild hidden={open} {...(!open ? ctx.subject : {})}>
            <Button ref={trigger} variant="secondary" tone="neutral">
              Show relations
            </Button>
          </DrawerTrigger>
          <DrawerContent
            className="table-example-drawer"
            returnFocus={trigger}
            side={{ narrow: 'bottom', wide: 'end' }}
            swipeToClose={false}
          >
            <DrawerHeader>
              <DrawerTitle>Document relations</DrawerTitle>
              <DrawerClose aria-label="Close document relations" />
            </DrawerHeader>
            <DrawerBody>
              <TableScroll className="table-example-relations-scroll" aria-labelledby={titleId}>
                <Table
                  {...ctx.subject}
                  size="s"
                  stickyHeader
                  striped
                  className="table-example-relations"
                >
                  <TableCaption id={titleId} className="unica-visually-hidden">
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
    </OverlayExampleFrame>
  );
}

export function ResultExamples({ ctx }: PreviewProps): ReactElement {
  const state = ctx.story?.controls.result;
  const caption = useRef<HTMLTableCaptionElement>(null);
  const captionId = useId();
  return (
    <ExampleSurface surface={ctx.surface}>
      <TableScroll aria-labelledby={captionId}>
        <Table
          {...ctx.subject}
          className="table-example-results"
          aria-busy={state === 'loading' || undefined}
        >
          <TableCaption id={captionId} ref={caption} tabIndex={-1}>
            Branch checks
          </TableCaption>
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
                        <bdi>There are no open checks under the current filter.</bdi>
                      </EmptyDescription>
                    </Empty>
                  ) : (
                    <Alert status="danger" size="s">
                      <AlertTitle>Branch checks could not load</AlertTitle>
                      <AlertDescription>
                        <bdi>Retry to restart the check.</bdi>
                      </AlertDescription>
                      <AlertActions>
                        <Button
                          className="table-example-feedback-action"
                          size="s"
                          variant="secondary"
                          tone="neutral"
                          onClick={() => {
                            caption.current?.focus({ preventScroll: true });
                            ctx.story?.setControl('result', 'loading');
                          }}
                        >
                          Retry
                        </Button>
                      </AlertActions>
                    </Alert>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableScroll>
      {state === 'loading' && <VisuallyHidden role="status">Loading branch checks</VisuallyHidden>}
    </ExampleSurface>
  );
}
