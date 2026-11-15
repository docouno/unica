import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import {
  CopyIcon,
  DotsThreeIcon,
  FileTextIcon,
  PlusIcon,
  SidebarSimpleIcon,
} from '@phosphor-icons/react';
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
import { Badge } from '../../prototypes/badge/badge.proto.js';
import { Breadcrumb } from '../../prototypes/breadcrumb/breadcrumb.proto.js';
import { Button, IconButton } from '../../prototypes/button/button.proto.js';
import { Code, CodeBlock } from '../../prototypes/code/code.proto.js';
import { Blockquote } from '../../prototypes/blockquote/blockquote.proto.js';
import { Alert } from '../../prototypes/feedback/feedback.proto.js';
import { Icon } from '../../prototypes/icon/icon.proto.js';
import { Table, TableScroll } from '../../prototypes/table/table.proto.js';
import { Text } from '../../prototypes/text/text.proto.js';
import { Title } from '../../prototypes/title/title.proto.js';
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
  readonly crumbs: readonly string[];
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
  crumbs,
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
          <Breadcrumb items={crumbs} />
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
    <AvatarGroup>
      <Avatar initials="PE" size="xs" tone="accent" />
      <Avatar initials="DB" size="xs" tone="info" />
      <Avatar initials="NW" size="xs" tone="success" />
      {!compact && <Avatar initials="+6" size="xs" />}
    </AvatarGroup>
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
  initials = 'DB',
  name = 'Database reliability',
  size = '2xs',
}: {
  readonly initials?: string;
  readonly name?: string;
  readonly size?: '2xs' | 'xs';
}): ReactElement {
  return (
    <span className="folio-person">
      <Avatar initials={initials} size={size} />
      <span>{name}</span>
    </span>
  );
}

export function RecoveryTable(): ReactElement {
  return (
    <TableScroll>
      <Table>
        <thead>
          <tr>
            <th>Cluster tier</th>
            <th>Target RTO</th>
            <th>WAL mode</th>
            <th>Verification probe</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tier-0 Ledger</td>
            <td>&lt; 30 sec</td>
            <td>Synchronous</td>
            <td>
              <Code>SELECT pg_is_in_recovery() = false</Code>
            </td>
          </tr>
          <tr>
            <td>Tier-1 Product</td>
            <td>&lt; 2 min</td>
            <td>Quorum sync</td>
            <td>
              <Code>pg_stat_replication lag &lt; 1 MB</Code>
            </td>
          </tr>
          <tr>
            <td>Tier-2 Analytics</td>
            <td>&lt; 15 min</td>
            <td>Async stream</td>
            <td>
              <Code>replay_delay_seconds &lt; 30</Code>
            </td>
          </tr>
        </tbody>
      </Table>
    </TableScroll>
  );
}

export function RunbookArticle({ compact = false }: { readonly compact?: boolean }): ReactElement {
  return (
    <article className={`folio-prose folio-runbook ${compact ? 'folio-runbook-compact' : ''}`}>
      <div className="folio-row folio-wrap">
        <Badge status="success" dot>
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
      <Alert status="warning" title="Pre-flight quorum verification required">
        Confirm synchronous replication lag is 0 B on pg-replica-01 and pause schema migrations
        before fencing the writer VIP.
      </Alert>
      {!compact && (
        <ul className="folio-checklist">
          <li>
            Verify <Code>pg_stat_replication</Code> reports <Code>sync_state = sync</Code> on
            standby
          </li>
          <li>Pause PgBouncer writer pools and confirm zero active DDL locks</li>
        </ul>
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
  onMenu,
}: {
  readonly onEdit?: () => void;
  readonly onMenu?: () => void;
}): ReactElement {
  return (
    <div className="folio-row">
      <IconButton size="s" icon={CopyIcon} aria-label="Copy document link" onClick={onMenu} />
      <Button size="s" variant="secondary" tone="neutral" onClick={onEdit}>
        Edit
      </Button>
      <IconButton size="s" icon={DotsThreeIcon} aria-label="Document actions" onClick={onMenu} />
    </div>
  );
}

export function DocumentName({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <span className="folio-document-name">
      <Icon icon={FileTextIcon} size="s" />
      <span>{children}</span>
    </span>
  );
}
