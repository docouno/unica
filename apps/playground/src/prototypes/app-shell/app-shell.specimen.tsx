import type { ReactElement } from 'react';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { defineSpecimen } from '../../workbench/types.js';
import { Button } from '../button/button.proto.js';
import { Text } from '../text/text.proto.js';
import { Title } from '../title/title.proto.js';
import {
  AppShell,
  AsidePanel,
  BackToWorkspace,
  DocumentTabs,
  GlobalSearch,
  Header,
  LeftRail,
  PropertyRow,
  SettingsNavigation,
  StickyActionBar,
  Subbar,
  TopRail,
  WorkspaceBadge,
  WorkspaceNavigation,
  WorkspaceStatus,
  WorkspaceSwitcher,
  WorkspaceTrash,
} from './app-shell.proto.js';
import './app-shell.examples.css';

function DocumentNavigation(): ReactElement {
  return (
    <AsidePanel
      title="Platform Eng"
      leading={<WorkspaceBadge />}
      actions={<WorkspaceSwitcher />}
      footer={<WorkspaceTrash />}
    >
      <WorkspaceNavigation defaultActive="adr-014" />
    </AsidePanel>
  );
}

function ExampleDocument(): ReactElement {
  return (
    <article className="app-shell-example-document">
      <Text size="caption-l" color="accent">
        Architecture Decision Record · Target: Q4 Edge Rollout
      </Text>
      <Title size="heading-m">ADR-014: Regional Envoy Traffic Draining</Title>
      <Text size="body-s" color="secondary">
        Defines deterministic connection-draining budgets and healthcheck shedding when evacuating
        an availability zone under elevated p99 latency.
      </Text>
      <hr />
      <Title as="h2" size="body-m">
        1. Context &amp; cross-region failover contract
      </Title>
      <blockquote>
        Never shed regional ingress faster than downstream connection pools can re-establish TLS
        sessions in sibling regions.
      </blockquote>
      <Text size="body-s">
        Regional drain budgets are versioned with the runbook so the next drill remains
        reproducible.
      </Text>
    </article>
  );
}

function TopologyExamples(): ReactElement {
  return (
    <div className="app-shell-example-grid">
      <section>
        <Text size="caption-l" color="muted">
          L-shaped · rails, navigation &amp; canvas
        </Text>
        <AppShell
          minHeight={540}
          topRail={
            <TopRail actions={<WorkspaceStatus />}>
              <GlobalSearch />
            </TopRail>
          }
          leftRail={<LeftRail active="documents" />}
          leftAside={<DocumentNavigation />}
          header={<Header>Platform Eng / Architecture</Header>}
        >
          <ExampleDocument />
        </AppShell>
      </section>
      <section>
        <Text size="caption-l" color="muted">
          Classic · rail with its own brand
        </Text>
        <AppShell
          minHeight={420}
          leftRail={<LeftRail active="extensions" showBrand />}
          leftAside={
            <AsidePanel title="Extensions">
              <WorkspaceNavigation kind="extensions" defaultActive="all" />
            </AsidePanel>
          }
          header={<Header>Platform Eng / Extensions / Connector catalog</Header>}
        >
          <div className="app-shell-example-document">
            <Title size="heading-m">Repository &amp; incident connectors</Title>
            <Text size="body-s" color="secondary">
              Bi-directional sync between Git-backed architecture records, alert routing, and
              runbook drills.
            </Text>
          </div>
        </AppShell>
      </section>
      <section>
        <Text size="caption-l" color="muted">
          Aside only · personal preferences
        </Text>
        <AppShell
          minHeight={400}
          leftAside={
            <AsidePanel width={256} title="Preferences" leading={<BackToWorkspace />}>
              <SettingsNavigation />
            </AsidePanel>
          }
          header={<Header>Preferences / Appearance &amp; editor</Header>}
        >
          <div className="app-shell-example-document">
            <Title size="heading-m">Interface color mode</Title>
            <Text size="body-s" color="secondary">
              Follow operating system polarity or lock workspace theme.
            </Text>
          </div>
        </AppShell>
      </section>
      <section>
        <Text size="caption-l" color="muted">
          Rail only · workspace administration
        </Text>
        <AppShell
          minHeight={320}
          leftRail={<LeftRail active="admin" showBrand />}
          header={<Header>Platform Eng / Administration / Batch import</Header>}
        >
          <div className="app-shell-example-document">
            <Title size="heading-m">Batch import</Title>
            <Text size="body-s" color="secondary">
              Review the archive schema and validation policy before importing.
            </Text>
          </div>
        </AppShell>
      </section>
    </div>
  );
}

function NavigationExamples(): ReactElement {
  return (
    <div className="app-shell-example-navigation">
      <AsidePanel
        title="Platform Eng"
        leading={<WorkspaceBadge />}
        actions={<WorkspaceSwitcher />}
        footer={<WorkspaceTrash />}
      >
        <WorkspaceNavigation defaultActive="pg-failover" />
      </AsidePanel>
      <AsidePanel title="Platform Eng" leading={<WorkspaceBadge />} actions={<WorkspaceSwitcher />}>
        <WorkspaceNavigation kind="admin" defaultActive="members" />
      </AsidePanel>
      <AsidePanel title="Preferences" leading={<BackToWorkspace />} width={256}>
        <SettingsNavigation />
      </AsidePanel>
    </div>
  );
}

function EditorContext(): ReactElement {
  return (
    <AppShell
      minHeight={720}
      topRail={
        <TopRail actions={<WorkspaceStatus />}>
          <DocumentTabs />
        </TopRail>
      }
      leftRail={<LeftRail active="documents" />}
      leftAside={<DocumentNavigation />}
      header={
        <Header
          actions={
            <>
              <Button variant="secondary" tone="neutral" size="s">
                Preview
              </Button>
              <Button size="s">Publish changes</Button>
            </>
          }
        >
          Platform Eng / Architecture / ADR-014 Traffic Draining
        </Header>
      }
      subbar={
        <Subbar
          actions={
            <Text size="caption-l" color="muted">
              Insert block · ⌘/
            </Text>
          }
        >
          <span>Write</span>
          <span>Diff (+38 −4)</span>
          <span>Split</span>
        </Subbar>
      }
      rightAside={
        <AsidePanel side="right" title="Document properties">
          <PropertyRow label="Verification">
            <Text size="caption-l" color="success">
              Verified
            </Text>
          </PropertyRow>
          <PropertyRow label="Owner">
            <Text size="caption-l">Platform team</Text>
          </PropertyRow>
          <PropertyRow label="Last drill">
            <Text size="caption-l">14 Sep 2026</Text>
          </PropertyRow>
        </AsidePanel>
      }
    >
      <ExampleDocument />
      <StickyActionBar
        actions={
          <>
            <Button variant="secondary" tone="neutral" size="s">
              Discard
            </Button>
            <Button size="s" iconRight={ArrowRightIcon}>
              Save changes
            </Button>
          </>
        }
      >
        2 unsaved changes
      </StickyActionBar>
    </AppShell>
  );
}

export default defineSpecimen({
  id: 'app-shell',
  title: 'AppShell & navigation',
  group: 'Layout',
  summary: 'One workspace frame, four surface planes, and independent rails and asides.',
  sections: [
    {
      id: 'topologies',
      title: 'Composable workspace topologies',
      kind: 'matrix',
      render: TopologyExamples,
    },
    {
      id: 'navigation',
      title: 'Disclosure, selection & long navigation',
      kind: 'states',
      caption:
        'Open folders, select pages, and navigate by keyboard. Full treeview behavior belongs to the library implementation.',
      render: NavigationExamples,
    },
    {
      id: 'editor',
      title: 'Folio · Editing with a contextual inspector',
      kind: 'context',
      caption:
        'At narrow widths, Navigation and Inspector open the corresponding panel. Escape closes it and restores its trigger.',
      render: EditorContext,
    },
  ],
});
