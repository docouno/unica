import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  CopyIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  GitDiffIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { AsidePanel } from '../prototypes/app-shell/app-shell.proto.js';
import { Badge } from '../prototypes/badge/badge.proto.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../prototypes/disclosure/disclosure.proto.js';
import { List, ListItem } from '../prototypes/list/list.proto.js';
import { Progress } from '../prototypes/progress/progress.proto.js';
import { Menu } from '../prototypes/menu/menu.live.js';
import type { MenuEntry } from '../prototypes/menu/menu.entries.js';
import { IconButton } from '../prototypes/button/button.proto.js';
import { HoverCard } from '../prototypes/tooltip/tooltip.proto.js';
import { TeamPreview } from '../prototypes/tooltip/hover-card.content.js';
import { Link } from '../prototypes/link/link.proto.js';
import { Switch } from '../prototypes/binary-controls/binary-controls.proto.js';
import { Tabs } from '../prototypes/tabs/tabs.proto.js';
import { Text } from '../prototypes/text/text.proto.js';
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbPage,
} from '../prototypes/breadcrumb/breadcrumb.proto.js';
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
  const [owner, setOwner] = useState(true);
  const [tab, setTab] = useState('details');
  const [notice, setNotice] = useState('');
  const items: readonly MenuEntry[] = [
    {
      id: 'copy',
      label: 'Copy document link',
      icon: CopyIcon,
      shortcut: '⌘L',
      run: () => setNotice('Document link selected for copying.'),
    },
    {
      id: 'compare',
      label: 'Compare revisions',
      icon: GitDiffIcon,
      shortcut: '⌘D',
      run: () => setTab('history'),
    },
    {
      id: 'export',
      label: 'Export Markdown',
      icon: DownloadSimpleIcon,
      run: () => setNotice('Markdown export selected for this revision.'),
    },
    { id: 'separator', type: 'separator' },
    {
      id: 'trash',
      label: 'Move to trash',
      icon: TrashIcon,
      tone: 'danger',
      run: () => setNotice('Move to trash requires workspace confirmation.'),
    },
  ];
  return (
    <FolioScene className="folio-reader">
      <FolioWorkspace
        breadcrumb={
          <Breadcrumb size="s">
            <BreadcrumbLink href="?item=02-workspace-overview">Platform Eng</BreadcrumbLink>
            <BreadcrumbLink href="?item=03-document-collection">Runbooks</BreadcrumbLink>
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
              <Menu
                label="Document actions"
                size="s"
                align="end"
                items={items}
                trigger={(props) => (
                  <IconButton
                    {...props}
                    size="s"
                    icon={DotsThreeIcon}
                    aria-label="Document actions"
                  />
                )}
              />
            }
            onEdit={() => setNotice('The current verified revision is ready to edit.')}
          />
        }
        rightAside={
          <AsidePanel aria-label="Document inspector" side="right" width={296}>
            <Tabs
              value={tab}
              onValueChange={setTab}
              items={[
                { value: 'details', label: 'Details' },
                { value: 'history', label: 'History' },
                { value: 'links', label: 'Links' },
              ]}
            />
            {tab === 'details' && (
              <>
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
                        <div className="folio-owner-preview">
                          <Link
                            href="?item=03-document-collection"
                            tone="neutral"
                            underline="hover"
                            onPointerEnter={() => setOwner(true)}
                            onFocus={() => setOwner(true)}
                            onKeyDown={(event) => {
                              if (event.key === 'Escape' && owner) {
                                event.preventDefault();
                                event.stopPropagation();
                                setOwner(false);
                              }
                            }}
                            onClick={() => setOwner(false)}
                          >
                            <Person name="Database reliability" />
                          </Link>
                          {owner && (
                            <HoverCard aria-hidden="true">
                              <TeamPreview />
                            </HoverCard>
                          )}
                        </div>
                      </dd>
                    </div>
                  </dl>
                </InspectorSection>
                <InspectorSection title="Quorum health">
                  <Collapsible size="s" defaultOpen>
                    <CollapsibleTrigger>Replication &amp; WAL checks</CollapsibleTrigger>
                    <CollapsibleContent>
                      <List aria-label="Replica checks">
                        <ListItem
                          title={
                            <Text as="span" size="caption-l">
                              pg-replica-01
                            </Text>
                          }
                          description="sync_state = sync (0 B)"
                        >
                          <Progress value={100} label="WAL catch-up" />
                        </ListItem>
                      </List>
                    </CollapsibleContent>
                  </Collapsible>
                </InspectorSection>
              </>
            )}
            {tab !== 'links' && (
              <InspectorSection title="Recent revisions">
                {[
                  { label: 'v14 · 2h ago', team: 'DB team', diff: '+42 −6' },
                  { label: 'v13 · 4d ago', team: 'Core team', diff: '+118 −14' },
                  { label: 'v12 · 28 Aug', team: 'Platform', diff: '+94' },
                ].map((revision) => (
                  <div key={revision.label} className="folio-row folio-between">
                    <Text size="caption-l">
                      {revision.label} · {revision.team}
                    </Text>
                    <span className="folio-revision-diff">{revision.diff}</span>
                  </div>
                ))}
              </InspectorSection>
            )}
            {tab === 'links' && (
              <InspectorSection title="Linked documents">
                <Text size="body-s">ADR-014 Traffic Draining</Text>
                <Text size="body-s">Core Networking Charter</Text>
                <Text size="body-s">Database Reliability Playbook</Text>
              </InspectorSection>
            )}
          </AsidePanel>
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
  render: () => <ReaderScene />,
});
