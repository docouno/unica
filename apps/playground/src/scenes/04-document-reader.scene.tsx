import { useState } from 'react';
import type { ReactElement } from 'react';
import { CopyIcon, DownloadSimpleIcon, GitDiffIcon, TrashIcon } from '@phosphor-icons/react';
import { AsidePanel } from '../prototypes/app-shell/app-shell.proto.js';
import { Badge } from '../prototypes/badge/badge.proto.js';
import { Collapsible } from '../prototypes/accordion/accordion.proto.js';
import { Progress } from '../prototypes/progress/progress.proto.js';
import { Menu, MenuItem, MenuSeparator } from '../prototypes/menu/menu.proto.js';
import { HoverCard } from '../prototypes/tooltip/tooltip.proto.js';
import { TeamPreview } from '../prototypes/tooltip/hover-card.content.js';
import { Link } from '../prototypes/link/link.proto.js';
import { Switch } from '../prototypes/binary-controls/binary-controls.proto.js';
import { Tabs } from '../prototypes/tabs/tabs.proto.js';
import { Text } from '../prototypes/text/text.proto.js';
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
  const [menu, setMenu] = useState(true);
  const [owner, setOwner] = useState(true);
  const [tab, setTab] = useState('details');
  const [notice, setNotice] = useState('');
  const action = (message: string): void => {
    setNotice(message);
    setMenu(false);
  };
  return (
    <FolioScene className="folio-reader">
      <FolioWorkspace
        crumbs={['Platform Eng', 'Runbooks', 'Zero-Downtime PG Failover']}
        documentTabs
        activeDocument="runbook"
        minHeight={1120}
        actions={
          <DocumentActions
            onMenu={() => setMenu(!menu)}
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
                  <Collapsible title="Replication & WAL checks" defaultOpen>
                    <Text size="caption-l" color="secondary">
                      pg-replica-01 · sync_state = sync (0 B)
                    </Text>
                    <Progress value={100} label="WAL catch-up" />
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
      {menu && (
        <div className="folio-floating-actions">
          <Menu>
            <MenuItem
              icon={CopyIcon}
              shortcut="⌘L"
              onClick={() => action('Document link selected for copying.')}
            >
              Copy document link
            </MenuItem>
            <MenuItem
              icon={GitDiffIcon}
              shortcut="⌘D"
              onClick={() => {
                setTab('history');
                setMenu(false);
              }}
            >
              Compare revisions
            </MenuItem>
            <MenuItem
              icon={DownloadSimpleIcon}
              onClick={() => action('Markdown export selected for this revision.')}
            >
              Export Markdown
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              icon={TrashIcon}
              danger
              onClick={() => action('Move to trash requires workspace confirmation.')}
            >
              Move to trash
            </MenuItem>
          </Menu>
        </div>
      )}
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
