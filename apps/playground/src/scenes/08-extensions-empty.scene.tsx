import { useState } from 'react';
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
import { Badge } from '../prototypes/badge/badge.proto.js';
import { Button } from '../prototypes/button/button.proto.js';
import { Card } from '../prototypes/card/card.proto.js';
import { Empty } from '../prototypes/empty/empty.proto.js';
import { ToastCard } from '../prototypes/toast/toast.proto.js';
import { Spinner } from '../prototypes/progress/progress.proto.js';
import { SkeletonText } from '../prototypes/skeleton/skeleton.proto.js';
import { Icon } from '../prototypes/icon/icon.proto.js';
import { Input } from '../prototypes/input/input.proto.js';
import { Text } from '../prototypes/text/text.proto.js';
import { Title } from '../prototypes/title/title.proto.js';
import { FolioScene, FolioWorkspace, PageIntro, SectionHeading } from './folio/folio.shared.js';
import './folio/folio.settings.css';

function ExtensionsScene(): ReactElement {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [notice, setNotice] = useState('');
  const [sandboxCreated, setSandboxCreated] = useState(false);
  const show = (name: string, group: string): boolean =>
    (!query || name.toLowerCase().includes(query.toLowerCase())) &&
    (category === 'all' || category === group || category === 'schedules' || category === 'keys');
  const featuredVisible =
    show('GitHub Enterprise', 'source-control') ||
    show('PagerDuty Incident Sync', 'incident-response');
  const installedVisible =
    show('Slack Triage Bridge', 'incident-response') ||
    show('S3 Cold Snapshot', 'source-control') ||
    show('GitHub ADR Mirror', 'source-control');

  return (
    <FolioScene>
      <FolioWorkspace
        classic
        activeRail="extensions"
        minHeight={1160}
        breadcrumb={
          <Breadcrumb size="s">
            <BreadcrumbLink href="?item=02-workspace-overview">Platform Eng</BreadcrumbLink>
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
          {featuredVisible && (
            <div className="folio-grid-2">
              {show('GitHub Enterprise', 'source-control') && (
                <Card className="folio-connector-card folio-connector-featured">
                  <div className="folio-row folio-between">
                    <div className="folio-row folio-connector-link">
                      <span className="folio-connector-icon">
                        <Icon icon={BooksIcon} />
                      </span>
                      <Icon icon={ArrowsLeftRightIcon} />
                      <span className="folio-connector-icon">
                        <Icon icon={GithubLogoIcon} />
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
                    <Text size="body-s" color="secondary">
                      Syncs ADR pull requests and runbook frontmatter with default branch commits.
                    </Text>
                  </div>
                  <div className="folio-row folio-wrap">
                    <Badge size="s">Bi-directional</Badge>
                    <Badge size="s">Signed commits</Badge>
                  </div>
                  <div className="folio-row folio-between folio-connector-footer">
                    <div className="folio-row folio-connector-sync">
                      <Icon icon={CheckCircleIcon} />
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
              {show('PagerDuty Incident Sync', 'incident-response') && (
                <Card className="folio-connector-card folio-connector-featured">
                  <div className="folio-row folio-between">
                    <div className="folio-row folio-connector-link">
                      <span className="folio-connector-icon">
                        <Icon icon={BooksIcon} />
                      </span>
                      <Icon icon={ArrowsLeftRightIcon} />
                      <span className="folio-connector-icon">
                        <Icon icon={PhoneCallIcon} />
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
                    <Text size="body-s" color="secondary">
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
                      <Icon icon={CheckCircleIcon} />
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
            {installedVisible ? (
              <div className="folio-grid-3">
                {show('Slack Triage Bridge', 'incident-response') && (
                  <Card className="folio-connector-card folio-connector-installed">
                    <div className="folio-row folio-between">
                      <span className="folio-connector-icon">
                        <Icon icon={SlackLogoIcon} />
                      </span>
                      <Badge size="s">Installed</Badge>
                    </div>
                    <div className="folio-connector-copy">
                      <Title as="h3" size="body-m" className="folio-connector-installed-title">
                        Slack Triage Bridge
                      </Title>
                      <Text size="body-s" color="secondary">
                        Posts runbook verification reminders and drill summaries to #infra-drills.
                      </Text>
                    </div>
                    <div className="folio-row folio-between folio-connector-footer">
                      <Text size="caption-l" color="muted">
                        Channel #infra-drills
                      </Text>
                      <Button
                        size="s"
                        variant="ghost"
                        tone="neutral"
                        onClick={() => setNotice('Slack Triage Bridge management selected.')}
                      >
                        Manage
                      </Button>
                    </div>
                  </Card>
                )}
                {show('S3 Cold Snapshot', 'source-control') && (
                  <Card className="folio-connector-card folio-connector-installed">
                    <div className="folio-row folio-between">
                      <span className="folio-connector-icon">
                        <Icon icon={DatabaseIcon} />
                      </span>
                      <Badge size="s">Installed</Badge>
                    </div>
                    <div className="folio-connector-copy">
                      <Title as="h3" size="body-m" className="folio-connector-installed-title">
                        S3 Cold Snapshot
                      </Title>
                      <Text size="body-s" color="secondary">
                        Writes immutable nightly Parquet &amp; Markdown bundles to eu-central-1.
                      </Text>
                    </div>
                    <div className="folio-row folio-between folio-connector-footer">
                      <Text size="caption-l" color="muted">
                        Nightly 02:00 UTC
                      </Text>
                      <Button
                        size="s"
                        variant="ghost"
                        tone="neutral"
                        onClick={() => setNotice('S3 Cold Snapshot management selected.')}
                      >
                        Manage
                      </Button>
                    </div>
                  </Card>
                )}
                {show('GitHub ADR Mirror', 'source-control') && (
                  <Card
                    className="folio-connector-card folio-connector-installed folio-connector-indexing"
                    aria-busy="true"
                  >
                    <div className="folio-row folio-between">
                      <div className="folio-row folio-connector-title">
                        <Spinner size="s" tone="muted" />
                        <Title as="h3" size="body-m" className="folio-connector-installed-title">
                          GitHub ADR Mirror
                        </Title>
                      </div>
                      <Badge size="s" status="info" dot>
                        Indexing
                      </Badge>
                    </div>
                    <SkeletonText size="body-s" lines={1} width="76%" />
                    <SkeletonText size="caption-l" lines={2} />
                    <div className="folio-row folio-connector-footer">
                      <Text size="caption-m" color="muted">
                        Scanning 48 repository trees…
                      </Text>
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <Text size="body-s" color="muted">
                No installed connectors match this filter.
              </Text>
            )}
          </section>
          <section className="folio-stack">
            <SectionHeading>Custom webhook sandboxes</SectionHeading>
            <Card className="folio-webhook-card">
              {sandboxCreated ? (
                <Empty
                  icon={<PlugsConnectedIcon size="1em" />}
                  title="Webhook sandbox ready"
                  description="Inspect signed event payloads before routing production alerts."
                >
                  <Button
                    size="s"
                    variant="secondary"
                    tone="neutral"
                    onClick={() => setSandboxCreated(false)}
                  >
                    Remove sandbox
                  </Button>
                </Empty>
              ) : (
                <Empty
                  icon={<PlugsConnectedIcon size="1em" />}
                  title="No custom webhook sandboxes yet"
                  description="Deploy an isolated dry-run endpoint to inspect signed event payloads before routing production alerts."
                >
                  <Button
                    size="s"
                    variant="secondary"
                    tone="neutral"
                    onClick={() => setSandboxCreated(true)}
                  >
                    Create webhook sandbox
                  </Button>
                </Empty>
              )}
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
  render: () => <ExtensionsScene />,
});
