import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbPage,
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Link,
  Progress,
  Switch,
  Text,
} from '@docouno/unica';
import { useState } from 'react';
import { folioSceneHref } from './folio/folio.routes.js';
import type { ReactElement } from 'react';
import {
  CopyIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  GitDiffIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { AsidePanel } from '../prototypes/app-shell/app-shell.proto.js';
import { List, ListItem } from '../prototypes/list/list.proto.js';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@docouno/unica';
import { IconButton } from '@docouno/unica';
import { TeamPreview } from '../examples/hover-card-content.js';
import { Tabs, TabsPanel, TabsList, TabsTrigger } from '@docouno/unica';
import { defineScene } from '../workbench/types.js';
import {
  DocumentActions,
  FolioScene,
  FolioWorkspace,
  InspectorSection,
  Person,
  RunbookArticle,
} from './folio/folio.shared.js';

function ReaderScene(): ReactElement {
  const [tab, setTab] = useState('details');
  const [notice, setNotice] = useState('');
  const revisions = (
    <InspectorSection title="Recent revisions">
      <List size="s" markers={false} dividers aria-label="Recent revisions">
        {[
          { version: 'v14', time: '2h ago', team: 'DB team', diff: '+42 −6' },
          { version: 'v13', time: '4d ago', team: 'Core team', diff: '+118 −14' },
          { version: 'v12', time: '28 Aug', team: 'Platform', diff: '+94' },
        ].map((revision) => (
          <ListItem
            key={revision.version}
            title={`Compare ${revision.version}`}
            description={`${revision.time} · ${revision.team}`}
            action={{
              onClick: () => setNotice(`Revision ${revision.version} selected for comparison.`),
            }}
            trailing={<bdi className="folio-revision-diff">{revision.diff}</bdi>}
          />
        ))}
      </List>
    </InspectorSection>
  );
  return (
    <FolioScene className="folio-reader">
      <FolioWorkspace
        breadcrumb={
          <Breadcrumb size="s">
            <BreadcrumbLink href={folioSceneHref('02-workspace-overview')}>
              Platform Eng
            </BreadcrumbLink>
            <BreadcrumbLink href={folioSceneHref('03-document-collection')}>
              Runbooks
            </BreadcrumbLink>
            <BreadcrumbPage>Zero-Downtime PG Failover</BreadcrumbPage>
          </Breadcrumb>
        }
        documentTabs
        activeDocument="runbook"
        minHeight={1120}
        actions={
          <DocumentActions
            onCopy={() => setNotice('Document link selected for copying.')}
            menu={
              <Menu size="s">
                <MenuTrigger asChild>
                  <IconButton size="s" icon={DotsThreeIcon} aria-label="Document actions" />
                </MenuTrigger>
                <MenuContent align="end">
                  <MenuItem
                    icon={CopyIcon}
                    shortcut="⌘L"
                    onClick={() => setNotice('Document link selected for copying.')}
                  >
                    Copy document link
                  </MenuItem>
                  <MenuItem icon={GitDiffIcon} shortcut="⌘D" onClick={() => setTab('history')}>
                    Compare revisions
                  </MenuItem>
                  <MenuItem
                    icon={DownloadSimpleIcon}
                    onClick={() => setNotice('Markdown export selected for this revision.')}
                  >
                    Export Markdown
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem
                    icon={TrashIcon}
                    tone="danger"
                    onClick={() => setNotice('Move to trash requires workspace confirmation.')}
                  >
                    Move to trash
                  </MenuItem>
                </MenuContent>
              </Menu>
            }
            onEdit={() => setNotice('The current verified revision is ready to edit.')}
          />
        }
        rightAside={
          <Tabs className="folio-reader-inspector-tabs" size="s" value={tab} onValueChange={setTab}>
            <AsidePanel
              aria-label="Document inspector"
              side="right"
              width={320}
              headerContent={
                <TabsList aria-label="Document inspector panels">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="history" count={3} countLabel="3 revisions">
                    History
                  </TabsTrigger>
                  <TabsTrigger value="links">Links</TabsTrigger>
                </TabsList>
              }
            >
              <TabsPanel value="details">
                <InspectorSection title="Properties">
                  <dl className="folio-inspector-properties">
                    <div>
                      <dt>Status</dt>
                      <dd>
                        <Badge status="success" size="s">
                          Verified
                        </Badge>
                      </dd>
                    </div>
                    <div>
                      <dt>Pager sync</dt>
                      <dd>
                        <Switch size="s" defaultChecked aria-label="Pager sync" />
                      </dd>
                    </div>
                    <div>
                      <dt>Tags</dt>
                      <dd className="folio-row folio-wrap">
                        <Badge size="s">runbook</Badge>
                        <Badge size="s">postgres</Badge>
                      </dd>
                    </div>
                    <div>
                      <dt>Owner</dt>
                      <dd>
                        <HoverCard defaultOpen>
                          <HoverCardTrigger asChild>
                            <Link
                              href={folioSceneHref('03-document-collection')}
                              tone="neutral"
                              underline="hover"
                            >
                              <Person name="Database reliability" />
                            </Link>
                          </HoverCardTrigger>
                          <HoverCardContent align="end">
                            <TeamPreview />
                          </HoverCardContent>
                        </HoverCard>
                      </dd>
                    </div>
                  </dl>
                </InspectorSection>
                <InspectorSection title="Quorum health">
                  <Collapsible size="s" defaultOpen>
                    <CollapsibleTrigger>Replication &amp; WAL checks</CollapsibleTrigger>
                    <CollapsibleContent>
                      <List markers={false} size="s" aria-label="Replica checks">
                        <ListItem title="pg-replica-01" description="sync_state = sync (0 B)">
                          <Progress value={100} label="WAL catch-up" />
                        </ListItem>
                      </List>
                    </CollapsibleContent>
                  </Collapsible>
                </InspectorSection>
                {revisions}
              </TabsPanel>
              <TabsPanel value="history">{revisions}</TabsPanel>
              <TabsPanel value="links">
                <InspectorSection title="Linked documents">
                  <Text size="body-s">ADR-014 Traffic Draining</Text>
                  <Text size="body-s">Core Networking Charter</Text>
                  <Text size="body-s">Database Reliability Playbook</Text>
                </InspectorSection>
              </TabsPanel>
            </AsidePanel>
          </Tabs>
        }
      >
        <div className="folio-prose-stage">
          <RunbookArticle />
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
  id: '04-document-reader',
  title: '04 · Document Reader & Overlays',
  group: 'Folio',
  defaultViewport: 1440,
  uses: [
    'alert',
    'app-shell',
    'avatar',
    'badge',
    'blockquote',
    'breadcrumb',
    'button',
    'code',
    'collapsible',
    'hover-card',
    'icon',
    'indicator',
    'kbd',
    'link',
    'list',
    'menu',
    'progress',
    'switch',
    'table',
    'tabs',
    'text',
    'title',
  ],
  render: ReaderScene,
});
