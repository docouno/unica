import { FormField } from '../prototypes/form-field/form-field.proto.js';
import {
  Badge,
  Blockquote,
  Checkbox,
  Code,
  Divider,
  Icon,
  Kbd,
  Link,
  Spinner,
  Text,
  Title,
  Input,
} from '@docouno/unica';
import { useId, useRef, useState } from 'react';
import { folioSceneHref } from './folio/folio.routes.js';
import type { ReactElement } from 'react';
import {
  ArrowUpRightIcon,
  CodeIcon,
  LinkIcon,
  ListBulletsIcon,
  MagnifyingGlassIcon,
  TextBIcon,
  TextItalicIcon,
  TextUnderlineIcon,
  WarningIcon,
} from '@phosphor-icons/react';
import { Subbar } from '../prototypes/app-shell/app-shell.proto.js';
import { Button, IconButton } from '@docouno/unica';
import { ToastCard } from '../prototypes/toast/toast.proto.js';
import {
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
} from '../prototypes/popover/popover.proto.js';
import { Listbox, SelectPanel } from '../prototypes/select/select.proto.js';
import { Tabs, TabsContent, TabsList, TabsTab } from '../prototypes/tabs/tabs.proto.js';
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbPage,
} from '../prototypes/breadcrumb/breadcrumb.proto.js';
import { defineScene } from '../workbench/types.js';
import { FolioScene, FolioWorkspace, Person, TeamMembers } from './folio/folio.shared.js';

const blocks = [
  {
    value: 'warning',
    label: 'Warning callout',
    description: 'Pre-flight safety gate or quorum check',
    icon: WarningIcon,
  },
  {
    value: 'code',
    label: 'Fenced command block',
    description: 'Executable shell or SQL verification snippet',
    icon: CodeIcon,
  },
  {
    value: 'runbook',
    label: 'Runbook embed',
    description: 'Live status card linked to a Tier-0 playbook',
    icon: LinkIcon,
  },
] as const;

function EditorScene(): ReactElement {
  const referenceId = useId();
  const referenceButtonRef = useRef<HTMLButtonElement>(null);
  const referenceTriggerRef = useRef<HTMLElement | null>(null);
  const referencePanelRef = useRef<HTMLDivElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const referenceTouchRef = useRef(false);
  const [mode, setMode] = useState('write');
  const [preview, setPreview] = useState(false);
  const editing = mode === 'write' && !preview;
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(true);
  const [reference, setReference] = useState<string | null>('/runbooks/zero-downtime-pg-failover');
  const [pinned, setPinned] = useState(true);
  const [draftReference, setDraftReference] = useState(reference ?? '');
  const [draftPinned, setDraftPinned] = useState(pinned);
  const [slashOpen, setSlashOpen] = useState(true);
  const [query, setQuery] = useState('/callout');
  const [insertedBlock, setInsertedBlock] = useState('');
  const [notice, setNotice] = useState('');
  const closeReference = (): void => {
    setReferenceOpen(false);
    requestAnimationFrame(() => {
      const trigger = referenceTriggerRef.current;
      (trigger?.isConnected ? trigger : referenceButtonRef.current)?.focus();
    });
  };
  const cancelReference = (): void => {
    setDraftReference(reference ?? '');
    setDraftPinned(pinned);
    closeReference();
  };
  const toggleReference = (trigger: HTMLElement, keyboard: boolean): void => {
    referenceTriggerRef.current = trigger;
    setDraftReference(reference ?? '');
    setDraftPinned(pinned);
    if (referenceOpen) {
      closeReference();
      return;
    }
    setReferenceOpen(true);
    requestAnimationFrame(() => {
      if (referenceTouchRef.current && !keyboard) {
        referencePanelRef.current?.focus();
      } else {
        referenceInputRef.current?.focus();
      }
    });
  };
  const workspace = (
    <FolioWorkspace
      breadcrumb={
        <Breadcrumb size="s">
          <BreadcrumbLink href={folioSceneHref('02-workspace-overview')}>
            Platform Eng
          </BreadcrumbLink>
          <span>Architecture</span>
          <BreadcrumbPage>ADR-014 Traffic Draining</BreadcrumbPage>
        </Breadcrumb>
      }
      documentTabs
      minHeight={1040}
      actions={
        <div className="folio-row folio-wrap">
          <span className="folio-row">
            <Spinner size="s" tone="muted" />
            <Text size="caption-l" color="muted">
              Saving draft…
            </Text>
          </span>
          <TeamMembers compact />
          <Button
            size="s"
            variant="secondary"
            tone="neutral"
            onClick={() => {
              setPreview(mode === 'write' ? !preview : true);
              setMode('write');
            }}
          >
            {mode === 'write' && preview ? 'Exit preview' : 'Preview'}
          </Button>
          <Button
            size="s"
            onClick={() => setNotice('Revision prepared for your workspace’s publishing review.')}
          >
            Publish changes
          </Button>
        </div>
      }
      subbar={
        <Subbar
          actions={
            editing && (
              <div className="folio-row">
                <Text size="caption-l" color="muted">
                  Insert block
                </Text>
                <Kbd>⌘/</Kbd>
              </div>
            )
          }
        >
          <TabsList aria-label="Editor views" className="folio-editor-mode-tabs">
            <TabsTab value="write">Write</TabsTab>
            <TabsTab value="diff" count={42} countLabel="42 changed lines">
              Diff
            </TabsTab>
            <TabsTab value="split">Split</TabsTab>
          </TabsList>
          {editing && (
            <>
              <Divider orientation="vertical" className="folio-editor-tool-divider" />
              <div className="folio-row">
                <IconButton
                  size="s"
                  variant="ghost"
                  icon={TextBIcon}
                  aria-label="Bold"
                  pressed={bold}
                  onPressedChange={setBold}
                />
                <IconButton
                  size="s"
                  variant="ghost"
                  icon={TextItalicIcon}
                  aria-label="Italic"
                  pressed={italic}
                  onPressedChange={setItalic}
                />
                <IconButton
                  size="s"
                  variant="ghost"
                  icon={TextUnderlineIcon}
                  aria-label="Underline"
                  pressed={underline}
                  onPressedChange={setUnderline}
                />
                <IconButton
                  ref={referenceButtonRef}
                  size="s"
                  variant="ghost"
                  icon={LinkIcon}
                  aria-label={reference ? 'Edit document reference' : 'Add document reference'}
                  aria-haspopup="dialog"
                  aria-expanded={referenceOpen}
                  aria-controls={`${referenceId}-panel`}
                  onPointerDown={(event) => {
                    referenceTouchRef.current = event.pointerType === 'touch';
                  }}
                  onClick={(event) => toggleReference(event.currentTarget, event.detail === 0)}
                />
                <IconButton
                  size="s"
                  variant="ghost"
                  icon={ListBulletsIcon}
                  aria-label="Insert block"
                  onClick={() => setSlashOpen(!slashOpen)}
                />
              </div>
            </>
          )}
        </Subbar>
      }
    >
      <div className="folio-prose-stage folio-editor-stage">
        <article className="folio-prose">
          <div className="folio-row folio-between folio-wrap">
            <div className="folio-row folio-wrap">
              <Badge status="accent" size="s" dot>
                Draft · v3.3
              </Badge>
              <Text size="caption-l" color="muted">
                Architecture Decision Record · Target: Q4 Edge Rollout
              </Text>
            </div>
            <Person initials="NW" name="Core networking · Editing" />
          </div>
          <div className="folio-stack">
            <Title as="h1" size="heading-xl">
              ADR-014: Regional Envoy Traffic Draining
            </Title>
            <Text size="body-m" color="secondary">
              Defines deterministic connection-draining budgets and healthcheck shedding when
              evacuating an availability zone under elevated p99 latency.
            </Text>
          </div>
          <Divider decorative={false} />
          <TabsContent value="diff" className="folio-stack">
            <Title as="h2" size="body-m">
              Draft comparison
            </Title>
            <Text size="body-s" color="secondary">
              <bdi>38 additions · 4 removals</bdi>
            </Text>
            <Text size="body-s">
              <del>
                <bdi>Drain healthchecks for 30 seconds.</bdi>
              </del>
            </Text>
            <Text size="body-s">
              <ins>
                <bdi>
                  Drain healthchecks for 45 seconds while sibling zones absorb pooled connections.
                </bdi>
              </ins>
            </Text>
          </TabsContent>
          <TabsContent value="split" className="folio-stack">
            <Title as="h2" size="body-m">
              Compare revisions
            </Title>
            <div className="folio-editor-revisions">
              <section className="folio-stack">
                <Title as="h3" size="body-m">
                  Verified revision
                </Title>
                <Text size="body-s">
                  <bdi>Drain healthchecks for 30 seconds.</bdi>
                </Text>
              </section>
              <section className="folio-stack">
                <Title as="h3" size="body-m">
                  Current draft
                </Title>
                <Text size="body-s">
                  <bdi>
                    Drain healthchecks for 45 seconds while sibling zones absorb pooled connections.
                  </bdi>
                </Text>
              </section>
            </div>
          </TabsContent>
          <TabsContent value="write" className="folio-stack">
            <section className="folio-stack">
              <Title as="h2" size="body-m">
                1. Context & cross-region failover contract
              </Title>
              <Blockquote size="s" attribution="Core Networking Charter · §2.4">
                Never shed regional ingress faster than downstream connection pools can re-establish
                TLS sessions in sibling zones.
              </Blockquote>
              <Text size="body-s">
                Regional drain budgets signal <Code>x-envoy-drain: 1</Code> and inherit quorum from{' '}
                {reference && !preview ? (
                  <Link
                    href={reference}
                    aria-haspopup="dialog"
                    aria-expanded={referenceOpen}
                    aria-controls={`${referenceId}-panel`}
                    onPointerDown={(event) => {
                      referenceTouchRef.current = event.pointerType === 'touch';
                    }}
                    onClick={(event) => {
                      event.preventDefault();
                      toggleReference(event.currentTarget, event.detail === 0);
                    }}
                  >
                    Zero-Downtime PG Failover{' '}
                    <Icon usage="slot" icon={ArrowUpRightIcon} size="inherit" />
                  </Link>
                ) : (
                  'Zero-Downtime PG Failover'
                )}
              </Text>
              <Text
                size="body-s"
                style={{
                  fontWeight: bold ? 700 : undefined,
                  fontStyle: italic ? 'italic' : undefined,
                  textDecoration: underline ? 'underline' : undefined,
                }}
              >
                Drain healthchecks hold Envoy listeners in graceful shed mode for 45 seconds while
                sibling availability zones absorb pooled TLS connections.
              </Text>
            </section>
            {!preview && (
              <section className="folio-stack">
                <Title as="h2" size="body-m">
                  2. Rollout slash-command
                </Title>
                <Text size="body-s" color="secondary">
                  Type / to insert a live callout, SQL verification check, or runbook embed:
                </Text>
                <div className="folio-slash-command">
                  <Input
                    size="s"
                    aria-label="Insert an editorial block"
                    iconLeft={MagnifyingGlassIcon}
                    value={query}
                    onChange={(event) => {
                      setQuery(event.currentTarget.value);
                      setSlashOpen(true);
                    }}
                    onFocus={() => setSlashOpen(true)}
                  />
                  {slashOpen && (
                    <SelectPanel className="choice-panel-proto" size="s">
                      <Listbox
                        size="s"
                        title="Editorial blocks"
                        value={null}
                        options={
                          query === '/callout'
                            ? blocks
                            : blocks.filter((block) =>
                                `${block.label} ${block.description}`
                                  .toLowerCase()
                                  .includes(query.replace(/^\//, '').toLowerCase()),
                              )
                        }
                        onValueChange={(value) => {
                          setInsertedBlock(
                            blocks.find((block) => block.value === value)?.label ?? '',
                          );
                          setSlashOpen(false);
                        }}
                      />
                    </SelectPanel>
                  )}
                </div>
                {insertedBlock && (
                  <div className="folio-notice" role="status">
                    {insertedBlock} inserted in the draft.
                  </div>
                )}
              </section>
            )}
          </TabsContent>
        </article>
        {editing && referenceOpen && (
          <PopoverContent
            ref={referencePanelRef}
            id={`${referenceId}-panel`}
            className="folio-editor-reference"
            aria-labelledby={`${referenceId}-title`}
            aria-describedby={`${referenceId}-description`}
            tabIndex={-1}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                cancelReference();
              }
            }}
          >
            <PopoverHeader>
              <PopoverTitle id={`${referenceId}-title`}>
                {reference ? 'Edit document reference' : 'Add document reference'}
              </PopoverTitle>
              <PopoverDescription id={`${referenceId}-description`}>
                Keep the supporting runbook close to the decision.
              </PopoverDescription>
            </PopoverHeader>
            <PopoverClose aria-label="Close reference editor" onClick={cancelReference} />
            <PopoverBody>
              <form
                id={`${referenceId}-form`}
                className="folio-stack"
                onSubmit={(event) => {
                  event.preventDefault();
                  setReference(draftReference.trim());
                  setPinned(draftPinned);
                  closeReference();
                  setNotice('Document reference updated.');
                }}
              >
                <FormField htmlFor={`${referenceId}-path`} label="Document path" size="s" required>
                  <Input
                    id={`${referenceId}-path`}
                    ref={referenceInputRef}
                    size="s"
                    name="reference"
                    value={draftReference}
                    onChange={(event) => setDraftReference(event.currentTarget.value)}
                    required
                    pattern={'.*\\S.*'}
                    dir="ltr"
                    placeholder="/runbooks/document-name"
                  />
                </FormField>
                <Checkbox
                  size="s"
                  checked={draftPinned}
                  onCheckedChange={setDraftPinned}
                  label="Pin to verified revision (v14)"
                />
              </form>
            </PopoverBody>
            <PopoverFooter className="folio-editor-reference-actions">
              <Button
                size="s"
                variant="ghost"
                tone="danger"
                disabled={!reference}
                onClick={() => {
                  setReference(null);
                  closeReference();
                  setNotice('Document reference unlinked.');
                }}
              >
                Unlink
              </Button>
              <div className="folio-row folio-wrap">
                <Button size="s" variant="secondary" tone="neutral" onClick={cancelReference}>
                  Cancel
                </Button>
                <Button size="s" type="submit" form={`${referenceId}-form`}>
                  Apply
                </Button>
              </div>
            </PopoverFooter>
          </PopoverContent>
        )}
      </div>
    </FolioWorkspace>
  );
  return (
    <FolioScene>
      <Tabs size="s" value={mode} onValueChange={setMode}>
        {workspace}
      </Tabs>
      {notice && (
        <div className="folio-toast-dock">
          <ToastCard status="success" title={notice} onDismiss={() => setNotice('')} />
        </div>
      )}
    </FolioScene>
  );
}

export default defineScene({
  id: '05-rich-editor',
  title: '05 · Rich Editor & Slash Autocomplete',
  group: 'Folio',
  defaultViewport: 1440,
  uses: [
    'app-shell',
    'avatar',
    'badge',
    'blockquote',
    'breadcrumb',
    'button',
    'checkbox',
    'code',
    'divider',
    'icon',
    'indicator',
    'form-field',
    'input',
    'kbd',
    'link',
    'listbox',
    'popover',
    'spinner',
    'tabs',
    'text',
    'title',
    'toast',
  ],
  render: EditorScene,
});
