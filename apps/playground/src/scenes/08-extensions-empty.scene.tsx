import { useLayoutEffect, useRef, useState } from 'react';
import { folioSceneHref } from './folio/folio.routes.js';
import type { ReactElement } from 'react';
import {
  ArrowsLeftRightIcon,
  BooksIcon,
  CheckCircleIcon,
  DatabaseIcon,
  GithubLogoIcon,
  MagnifyingGlassIcon,
  PhoneCallIcon,
  PlugsConnectedIcon,
  PlusIcon,
  SlackLogoIcon,
} from '@phosphor-icons/react';
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbPage,
} from '../prototypes/breadcrumb/breadcrumb.proto.js';
import { defineScene } from '../workbench/types.js';
import { AsidePanel, WorkspaceNavigation } from '../prototypes/app-shell/app-shell.proto.js';
import { Button } from '@docouno/unica';
import {
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '../prototypes/empty/empty.proto.js';
import { ToastCard } from '../prototypes/toast/toast.proto.js';
import { Badge, Card, Icon, Input, Spinner, Text, Title } from '@docouno/unica';
import { List, ListItem } from '../prototypes/list/list.proto.js';
import { FolioScene, FolioWorkspace, PageIntro, SectionHeading } from './folio/folio.shared.js';
import './folio/folio.settings.css';

function ExtensionsScene(): ReactElement {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [notice, setNotice] = useState('');
  const [sandboxCreated, setSandboxCreated] = useState(false);
  const sandboxHeading = useRef<HTMLHeadingElement>(null);
  const sandboxChanged = useRef(false);

  useLayoutEffect(() => {
    if (sandboxChanged.current) {
      sandboxHeading.current?.focus();
      sandboxChanged.current = false;
    }
  }, [sandboxCreated]);

  function changeSandbox(created: boolean): void {
    sandboxChanged.current = true;
    setSandboxCreated(created);
  }

  const show = (name: string, group: string): boolean =>
    (!query || name.toLowerCase().includes(query.toLowerCase())) &&
    (category === 'all' || category === group || category === 'schedules' || category === 'keys');
  const github = show('GitHub Enterprise', 'source-control');
  const pagerDuty = show('PagerDuty Incident Sync', 'incident-response');
  const slack = show('Slack Triage Bridge', 'incident-response');
  const snapshot = show('S3 Cold Snapshot', 'source-control');
  const mirror = show('GitHub ADR Mirror', 'source-control');
  const visibleCount = [github, pagerDuty, slack, snapshot, mirror].filter(Boolean).length;

  return (
    <FolioScene>
      <FolioWorkspace
        classic
        activeRail="extensions"
        minHeight={1160}
        breadcrumb={
          <Breadcrumb size="s">
            <BreadcrumbLink href={folioSceneHref('02-workspace-overview')}>
              Platform Eng
            </BreadcrumbLink>
            <span>Extensions</span>
            <BreadcrumbPage>Connector catalog</BreadcrumbPage>
          </Breadcrumb>
        }
        leftAside={
          <AsidePanel title="Extensions">
            <Input
              size="s"
              iconLeft={MagnifyingGlassIcon}
              aria-label="Filter connectors"
              placeholder="Filter connectors…"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
            />
            <span className="folio-connector-result-status" role="status">
              {visibleCount === 1 ? '1 connector shown' : `${visibleCount} connectors shown`}
            </span>
            <WorkspaceNavigation kind="extensions" defaultActive="all" onNavigate={setCategory} />
          </AsidePanel>
        }
        actions={
          <>
            <Badge size="s" status="success" dot>
              4 active
            </Badge>
            <Button
              size="s"
              variant="secondary"
              tone="neutral"
              onClick={() => setNotice('All connected integrations are healthy.')}
            >
              Delivery logs
            </Button>
            <Button
              size="s"
              iconLeft={PlusIcon}
              onClick={() => setNotice('Choose a connector below to review its setup.')}
            >
              Register connector
            </Button>
          </>
        }
      >
        <div className="folio-content folio-extensions-content">
          <PageIntro
            title="Repository & incident connectors"
            description="Bi-directional sync between Git-backed architecture records, alert routing, and runbook drills."
          />
          {(github || pagerDuty) && (
            <div className="folio-grid-2">
              {github && (
                <Card className="folio-connector-card folio-connector-featured">
                  <div className="folio-row folio-between">
                    <div className="folio-row folio-connector-link">
                      <span className="folio-connector-icon">
                        <Icon usage="slot" icon={BooksIcon} />
                      </span>
                      <Icon
                        usage="slot"
                        icon={ArrowsLeftRightIcon}
                        className="folio-connector-arrow"
                      />
                      <span className="folio-connector-icon">
                        <Icon usage="slot" icon={GithubLogoIcon} />
                      </span>
                    </div>
                    <Badge size="s" status="success" dot>
                      Active
                    </Badge>
                  </div>
                  <div className="folio-connector-copy">
                    <div className="folio-row folio-wrap folio-connector-title">
                      <Title as="h2" size="body-m">
                        GitHub Enterprise
                      </Title>
                      <Text size="caption-l" color="muted">
                        v2.4 · GitOps
                      </Text>
                    </div>
                    <Text size="body-xs" color="secondary">
                      Syncs ADR pull requests and runbook frontmatter with default branch commits.
                    </Text>
                  </div>
                  <div className="folio-row folio-wrap">
                    <Badge size="s">Bi-directional</Badge>
                    <Badge size="s">Signed commits</Badge>
                  </div>
                  <div className="folio-row folio-between folio-connector-footer">
                    <div className="folio-row folio-connector-sync">
                      <Icon usage="slot" icon={CheckCircleIcon} />
                      <Text size="caption-l" color="muted">
                        Synced 2m ago
                      </Text>
                    </div>
                    <Button
                      size="s"
                      variant="secondary"
                      tone="neutral"
                      onClick={() => setNotice('GitHub Enterprise configuration selected.')}
                    >
                      Configure
                    </Button>
                  </div>
                </Card>
              )}
              {pagerDuty && (
                <Card className="folio-connector-card folio-connector-featured">
                  <div className="folio-row folio-between">
                    <div className="folio-row folio-connector-link">
                      <span className="folio-connector-icon">
                        <Icon usage="slot" icon={BooksIcon} />
                      </span>
                      <Icon
                        usage="slot"
                        icon={ArrowsLeftRightIcon}
                        className="folio-connector-arrow"
                      />
                      <span className="folio-connector-icon">
                        <Icon usage="slot" icon={PhoneCallIcon} />
                      </span>
                    </div>
                    <Badge size="s" status="success" dot>
                      Active
                    </Badge>
                  </div>
                  <div className="folio-connector-copy">
                    <div className="folio-row folio-wrap folio-connector-title">
                      <Title as="h2" size="body-m">
                        PagerDuty Incident Sync
                      </Title>
                      <Text size="caption-l" color="muted">
                        v1.9 · On-call
                      </Text>
                    </div>
                    <Text size="body-xs" color="secondary">
                      Attaches verified Tier-0 playbooks automatically to high-urgency service
                      alerts.
                    </Text>
                  </div>
                  <div className="folio-row folio-wrap">
                    <Badge size="s">Auto-attach</Badge>
                    <Badge size="s">Escalation</Badge>
                  </div>
                  <div className="folio-row folio-between folio-connector-footer">
                    <div className="folio-row folio-connector-sync">
                      <Icon usage="slot" icon={CheckCircleIcon} />
                      <Text size="caption-l" color="muted">
                        14 services linked
                      </Text>
                    </div>
                    <Button
                      size="s"
                      variant="secondary"
                      tone="neutral"
                      onClick={() => setNotice('PagerDuty Incident Sync configuration selected.')}
                    >
                      Configure
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          )}
          <section className="folio-stack">
            <SectionHeading>Installed &amp; indexing</SectionHeading>
            {slack || snapshot || mirror ? (
              <Card>
                <List
                  size="m"
                  markers={false}
                  dividers
                  aria-label="Installed and indexing connectors"
                >
                  {[
                    {
                      title: 'Slack Triage Bridge',
                      visible: slack,
                      icon: SlackLogoIcon,
                      description:
                        'Posts verification reminders and drill summaries in #infra-drills.',
                    },
                    {
                      title: 'S3 Cold Snapshot',
                      visible: snapshot,
                      icon: DatabaseIcon,
                      description:
                        'Exports immutable Parquet and Markdown to eu-central-1 at 02:00 UTC.',
                    },
                  ]
                    .filter((connector) => connector.visible)
                    .map((connector) => (
                      <ListItem
                        key={connector.title}
                        title={connector.title}
                        description={connector.description}
                        leading={<Icon usage="slot" icon={connector.icon} />}
                        trailing={
                          <>
                            <Badge>Installed</Badge>
                            <Button
                              variant="ghost"
                              tone="neutral"
                              aria-label={`Manage ${connector.title}`}
                              onClick={() => setNotice(`${connector.title} management selected.`)}
                            >
                              Manage
                            </Button>
                          </>
                        }
                      />
                    ))}
                  {mirror && (
                    <ListItem
                      title="GitHub ADR Mirror"
                      description="Scanning 48 repository trees…"
                      leading={<Spinner size="s" tone="muted" />}
                      trailing={
                        <Badge status="info" dot>
                          Indexing
                        </Badge>
                      }
                    />
                  )}
                </List>
              </Card>
            ) : (
              <Empty size="s" align="start">
                <EmptyDescription>
                  <bdi>No installed connectors match this filter.</bdi>
                </EmptyDescription>
              </Empty>
            )}
          </section>
          <section className="folio-stack">
            <SectionHeading>Custom webhook sandboxes</SectionHeading>
            <Card size="l" className="folio-webhook-card">
              <div className="folio-webhook-stage">
                {sandboxCreated ? (
                  <div className="folio-webhook-sandbox">
                    <div className="folio-webhook-sandbox-copy">
                      <Title
                        ref={sandboxHeading}
                        className="folio-webhook-sandbox-title"
                        as="h3"
                        size="heading-s"
                        tabIndex={-1}
                      >
                        Webhook sandbox
                      </Title>
                      <Text size="body-s" color="muted">
                        <bdi>Waiting for the first signed event.</bdi>
                      </Text>
                    </div>
                    <Button
                      size="s"
                      variant="secondary"
                      tone="neutral"
                      onClick={() => changeSandbox(false)}
                    >
                      Remove sandbox
                    </Button>
                  </div>
                ) : (
                  <Empty>
                    <EmptyMedia icon={PlugsConnectedIcon} />
                    <EmptyTitle ref={sandboxHeading} tabIndex={-1}>
                      No webhook sandboxes yet
                    </EmptyTitle>
                    <EmptyDescription>
                      <bdi>Test signed events before routing them to production.</bdi>
                    </EmptyDescription>
                    <EmptyActions>
                      <Button
                        variant="secondary"
                        tone="neutral"
                        onClick={() => changeSandbox(true)}
                      >
                        Create webhook sandbox
                      </Button>
                    </EmptyActions>
                  </Empty>
                )}
              </div>
            </Card>
          </section>
        </div>
      </FolioWorkspace>
      {notice && (
        <div className="folio-toast-dock">
          <ToastCard status="info" title="Connectors" onDismiss={() => setNotice('')}>
            {notice}
          </ToastCard>
        </div>
      )}
    </FolioScene>
  );
}

export default defineScene({
  id: '08-extensions-empty',
  title: 'Extensions & Empty Sandbox',
  group: 'Folio',
  summary: 'Connector discovery, indexing feedback, and a webhook sandbox empty state.',
  defaultViewport: 1440,
  uses: [
    'app-shell',
    'badge',
    'breadcrumb',
    'button',
    'card',
    'empty',
    'icon',
    'indicator',
    'input',
    'list',
    'spinner',
    'text',
    'title',
    'toast',
  ],
  render: ExtensionsScene,
});
