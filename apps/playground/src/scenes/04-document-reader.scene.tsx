import { useState } from 'react';
import type { ReactElement } from 'react';
import { CopyIcon, DownloadSimpleIcon, GitDiffIcon, TrashIcon } from '@phosphor-icons/react';
import { AsidePanel } from '../prototypes/app-shell/app-shell.proto.js';
import { Badge } from '../prototypes/badge/badge.proto.js';
import { Collapsible } from '../prototypes/accordion/accordion.proto.js';
import { Progress } from '../prototypes/feedback/feedback.proto.js';
import { HoverCard, Menu, MenuItem, MenuSeparator } from '../prototypes/menu/menu.proto.js';
import { Switch } from '../prototypes/selection/selection.proto.js';
import { Tabs } from '../prototypes/tabs/tabs.proto.js';
import { Tag } from '../prototypes/tag/tag.proto.js';
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
    <FolioScene>
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
          <AsidePanel title="Document inspector" side="right" width={296}>
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
                        <Tag size="s">runbook</Tag>
                        <Tag size="s">postgres</Tag>
                      </dd>
                    </div>
                    <div>
                      <dt>Owner</dt>
                      <dd>
                        <div className="folio-owner-preview">
                          <button
                            className="folio-minor-action"
                            type="button"
                            onClick={() => setOwner(!owner)}
                            aria-expanded={owner}
                          >
                            <Person name="Database reliability" />
                          </button>
                          {owner && (
                            <HoverCard>
                              <Person name="Database reliability" />
                              <Text size="caption-l" color="secondary">
                                Staff SRE · Core Infrastructure
                              </Text>
                              <Badge status="success" size="s">
                                On-call
                              </Badge>
                              <Text size="caption-l" color="muted">
                                28 Tier-0 runbooks owned · UTC+1
                              </Text>
                            </HoverCard>
                          )}
                        </div>
                      </dd>
                    </div>
                    <div>
                      <dt>Service</dt>
                      <dd>Core Postgres</dd>
                    </div>
                    <div>
                      <dt>Review due</dt>
                      <dd>15 Jan 2027</dd>
                    </div>
                    <div>
                      <dt>Cluster</dt>
                      <dd>eu-central-1 · Tier-0</dd>
                    </div>
                  </dl>
                </InspectorSection>
                <InspectorSection title="Quorum health">
                  <Collapsible title="Replication & WAL checks" defaultOpen>
                    <Text size="caption-l" color="secondary">
                      pg-replica-01 · sync_state = sync (0 B)
                    </Text>
                    <Progress value={100} label="WAL catch-up" status="success" />
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
                    <div>
                      <Text size="caption-l">{revision.label}</Text>
                      <Text size="caption-m" color="muted">
                        {revision.team}
                      </Text>
                    </div>
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
  render: ReaderScene,
});
