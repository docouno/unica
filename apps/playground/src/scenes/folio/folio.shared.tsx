import { Badge, Blockquote, Code, Icon, Text, Title } from '@docouno/unica';
import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { CopyIcon, FileTextIcon, PlusIcon, SidebarSimpleIcon } from '@phosphor-icons/react';
import {
  AppShell,
  AsidePanel,
  DocumentTabs,
  GlobalSearch,
  Header,
  LeftRail,
  TopRail,
  WorkspaceNavigation,
  WorkspaceBadge,
  WorkspaceSwitcher,
  WorkspaceTrash,
  WorkspaceStatus,
} from '../../prototypes/app-shell/app-shell.proto.js';
import type { RailDestination } from '../../prototypes/app-shell/app-shell.proto.js';
import { Avatar, AvatarGroup } from '../../prototypes/avatar/avatar.proto.js';
import { Button, IconButton } from '../../prototypes/button/button.proto.js';
import { CodeBlock } from '../../prototypes/code-block/code-block.proto.js';
import { Alert, AlertTitle, AlertDescription } from '../../prototypes/alert/alert.proto.js';
import { List, ListItem } from '../../prototypes/list/list.proto.js';
import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableHeader,
  TableRow,
  TableRowHeader,
  TableScroll,
} from '../../prototypes/table/table.proto.js';
import './folio.css';

export interface FolioSceneProps {
  readonly children: ReactNode;
  readonly className?: string;
}
export function FolioScene({ children, className = '' }: FolioSceneProps): ReactElement {
  return <div className={`folio-scene ${className}`}>{children}</div>;
}

export interface WorkspaceProps {
  readonly children: ReactNode;
  readonly breadcrumb: ReactNode;
  readonly actions?: ReactNode;
  readonly rightAside?: ReactNode;
  readonly leftAside?: ReactNode;
  readonly subbar?: ReactNode;
  readonly documentTabs?: boolean;
  readonly activeDocument?: string;
  readonly activeRail?: RailDestination;
  readonly activeNavigation?: string;
  readonly classic?: boolean;
  readonly railOnly?: boolean;
  readonly expandedNavigation?: readonly string[];
  readonly minHeight?: number;
}

export function FolioWorkspace({
  children,
  breadcrumb,
  actions,
  rightAside,
  leftAside,
  subbar,
  documentTabs = false,
  activeDocument = 'adr',
  activeRail = 'documents',
  activeNavigation,
  classic = false,
  railOnly = false,
  expandedNavigation,
  minHeight = 960,
}: WorkspaceProps): ReactElement {
  const [navigationVisible, setNavigationVisible] = useState(true);
  return (
    <AppShell
      minHeight={minHeight}
      navigationCollapsed={!navigationVisible}
      topRail={
        classic ? undefined : (
          <TopRail actions={<WorkspaceStatus />}>
            {documentTabs ? <DocumentTabs defaultValue={activeDocument} /> : <GlobalSearch />}
          </TopRail>
        )
      }
      leftRail={<LeftRail active={activeRail} showBrand={classic} />}
      leftAside={
        railOnly
          ? undefined
          : (leftAside ?? (
              <AsidePanel
                title="Platform Eng"
                leading={<WorkspaceBadge />}
                actions={<WorkspaceSwitcher />}
                footer={<WorkspaceTrash />}
              >
                <WorkspaceNavigation
                  defaultActive={
                    activeNavigation ??
                    (documentTabs ? (activeDocument === 'runbook' ? 'pg-failover' : 'adr-014') : '')
                  }
                  expanded={
                    expandedNavigation ??
                    (documentTabs ? ['architecture', 'runbooks'] : ['architecture'])
                  }
                />
              </AsidePanel>
            ))
      }
      rightAside={rightAside}
      header={
        <Header
          className="folio-workspace-header"
          actions={
            actions ?? (
              <Button size="s" iconLeft={PlusIcon}>
                New document
              </Button>
            )
          }
        >
          {!railOnly && (
            <>
              <IconButton
                className="app-shell-desktop-navigation-toggle"
                size="s"
                variant="ghost"
                tone="neutral"
                icon={SidebarSimpleIcon}
                aria-label="Toggle left navigation"
                aria-expanded={navigationVisible}
                onClick={() => setNavigationVisible(!navigationVisible)}
              />
              <span className="app-shell-navigation-seam" />
            </>
          )}
          {breadcrumb}
        </Header>
      }
      subbar={subbar}
    >
      {children}
    </AppShell>
  );
}

export function TeamMembers({ compact = false }: { readonly compact?: boolean }): ReactElement {
  return (
    <AvatarGroup
      label="Document collaborators"
      size="xs"
      max={3}
      members={[
        { id: 'platform', name: 'Platform engineer' },
        { id: 'database', name: 'Database reliability' },
        { id: 'network', name: 'Network engineer' },
        ...(!compact
          ? [
              { id: 'editor', name: 'Content editor' },
              { id: 'reviewer', name: 'Design reviewer' },
              { id: 'owner', name: 'Project owner' },
              { id: 'writer', name: 'Technical writer' },
              { id: 'security', name: 'Security engineer' },
              { id: 'release', name: 'Release coordinator' },
            ]
          : []),
      ]}
    />
  );
}

export function PageIntro({
  title,
  description,
  meta,
  children,
}: {
  readonly title: string;
  readonly description?: string;
  readonly meta?: ReactNode;
  readonly children?: ReactNode;
}): ReactElement {
  return (
    <div className="folio-page-intro">
      <div>
        <Title as="h1" size="heading-l">
          {title}
        </Title>
        {description && (
          <Text size="body-s" color="secondary">
            {description}
          </Text>
        )}
        {meta}
      </div>
      {children}
    </div>
  );
}

export function SectionHeading({
  children,
  action,
}: {
  readonly children: ReactNode;
  readonly action?: ReactNode;
}): ReactElement {
  return (
    <div className="folio-section-heading">
      <Title as="h2" size="body-m">
        {children}
      </Title>
      {action}
    </div>
  );
}

export function InspectorSection({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <section className="folio-inspector-section">
      <Text size="caption-m" weight="semibold" color="muted" className="folio-eyebrow">
        {title}
      </Text>
      {children}
    </section>
  );
}

export function Person({
  initials,
  name = 'Database reliability',
  size = '2xs',
}: {
  readonly initials?: string;
  readonly name?: string;
  readonly size?: '2xs' | 'xs';
}): ReactElement {
  return (
    <span className="folio-person">
      <Avatar
        name={name}
        fallback={initials?.slice(0, size === '2xs' ? 1 : 2)}
        alt=""
        size={size}
      />
      <span>{name}</span>
    </span>
  );
}

export function RecoveryTable(): ReactElement {
  return (
    <TableScroll aria-label="Recovery targets by cluster tier">
      <Table aria-label="Recovery targets by cluster tier">
        <TableHeader>
          <TableRow>
            <TableColumnHeader>Cluster tier</TableColumnHeader>
            <TableColumnHeader align="end">Target RTO</TableColumnHeader>
            <TableColumnHeader>WAL mode</TableColumnHeader>
            <TableColumnHeader>Verification probe</TableColumnHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableRowHeader>Tier-0 Ledger</TableRowHeader>
            <TableCell align="end">
              <bdi>&lt; 30 sec</bdi>
            </TableCell>
            <TableCell>Synchronous</TableCell>
            <TableCell>
              <Code>SELECT pg_is_in_recovery() = false</Code>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableRowHeader>Tier-1 Product</TableRowHeader>
            <TableCell align="end">
              <bdi>&lt; 2 min</bdi>
            </TableCell>
            <TableCell>Quorum sync</TableCell>
            <TableCell>
              <Code>pg_stat_replication lag &lt; 1 MB</Code>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableRowHeader>Tier-2 Analytics</TableRowHeader>
            <TableCell align="end">
              <bdi>&lt; 15 min</bdi>
            </TableCell>
            <TableCell>Async stream</TableCell>
            <TableCell>
              <Code>replay_delay_seconds &lt; 30</Code>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableScroll>
  );
}

export function RunbookArticle({ compact = false }: { readonly compact?: boolean }): ReactElement {
  return (
    <article className={`folio-prose folio-runbook ${compact ? 'folio-runbook-compact' : ''}`}>
      <div className="folio-row folio-wrap">
        <Badge size="s" status="success" dot>
          Verified Runbook
        </Badge>
        {!compact && (
          <Text size="caption-l" color="muted">
            Tier-0 · Updated 2h ago · 5 min read
          </Text>
        )}
      </div>
      <div className="folio-stack">
        <Title as="h1" size="heading-xl">
          Zero-Downtime PG Failover
        </Title>
        <Text size="body-m" color="secondary">
          Operational procedure for promoting a synchronous standby replica during primary hardware
          degradation without dropping pooled transactions.
        </Text>
      </div>
      <Alert status="warning" size="s">
        <AlertTitle>Pre-flight quorum verification required</AlertTitle>
        <AlertDescription>
          Confirm synchronous replication lag is 0 B on pg-replica-01 and pause schema migrations
          before fencing the writer VIP.
        </AlertDescription>
      </Alert>
      {!compact && (
        <List className="folio-checklist">
          <ListItem>
            Verify <Code>pg_stat_replication</Code> reports <Code>sync_state = sync</Code> on
            standby
          </ListItem>
          <ListItem>Pause PgBouncer writer pools and confirm zero active DDL locks</ListItem>
        </List>
      )}
      {!compact && (
        <section className="folio-stack">
          <Title as="h2" size="body-m">
            1. Fence writer VIP and promote synchronous replica
          </Title>
          <Text size="body-s">
            Drain active PgBouncer pools, then execute <Code>pg_ctl promote</Code> on the target
            standby:
          </Text>
          <CodeBlock language="bash · pg-replica-01.prod">
            {
              "$ pgbouncer-adm pause --pool=core_rw --wait=5s\n$ ssh pg-replica-01 'sudo -u postgres pg_ctl promote -D /var/lib/postgresql/17'\n$ vip-manager switch --target=pg-replica-01 && pgbouncer-adm resume --pool=core_rw"
            }
          </CodeBlock>
        </section>
      )}
      <section className="folio-stack">
        <Title as="h2" size="body-m">
          {compact ? 'Recovery objectives' : '2. Recovery objectives by database tier'}
        </Title>
        <RecoveryTable />
      </section>
      {!compact && (
        <Blockquote size="s" attribution="Database Reliability Playbook · §4.2">
          Never re-attach a fenced former primary to the cluster VIP before running pg_rewind
          against the promoted timeline.
        </Blockquote>
      )}
    </article>
  );
}

export function DocumentActions({
  onEdit,
  onCopy,
  menu,
}: {
  readonly onEdit?: () => void;
  readonly onCopy?: () => void;
  readonly menu: ReactNode;
}): ReactElement {
  return (
    <div className="folio-row">
      <IconButton size="s" icon={CopyIcon} aria-label="Copy document link" onClick={onCopy} />
      <Button size="s" variant="secondary" tone="neutral" onClick={onEdit}>
        Edit
      </Button>
      {menu}
    </div>
  );
}

export function DocumentName({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <span className="folio-document-name">
      <Icon usage="slot" icon={FileTextIcon} size="s" />
      <span>{children}</span>
    </span>
  );
}
