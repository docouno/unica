import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactElement, ReactNode } from 'react';
import {
  BellIcon,
  BookOpenIcon,
  CheckIcon,
  GearIcon,
  LockSimpleIcon,
  PencilSimpleIcon,
  PlusIcon,
  ShieldCheckIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react/ssr';
import type { PreviewProps } from '../../workbench/types.js';
import {
  Badge,
  Box,
  Button,
  Card,
  IconButton,
  Container,
  Flex,
  Grid,
  GridItem,
  Icon,
  Stack,
  Text,
  Title,
  Input,
} from '@docouno/unica';
import { CloseGlyph } from '../../prototypes/control-glyphs.js';
import {
  AppShell,
  AsidePanel,
  GlobalSearch,
  Header,
  LeftRail,
  PropertyRow,
  SettingsRow,
  StickyActionBar,
  Subbar,
  TopRail,
  WorkspaceBadge,
} from '../../prototypes/app-shell/app-shell.proto.js';
import type { RailDestination } from '../../prototypes/app-shell/app-shell.proto.js';
import { DocumentTabs } from '../../prototypes/app-shell/document-tabs.proto.js';
import type { DocumentTab } from '../../prototypes/app-shell/document-tabs.proto.js';
import { NavList, TreeView } from '../../prototypes/app-shell/navigation.proto.js';
import type {
  NavigationItem,
  NavigationSection,
} from '../../prototypes/app-shell/navigation.proto.js';
import '../../prototypes/app-shell/app-shell.examples.css';

function Example({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <section className="shell-study-example">
      <Title as="h3" size="heading-s">
        {title}
      </Title>
      {children}
    </section>
  );
}

const treeItems: readonly NavigationItem[] = [
  {
    value: 'research',
    label: 'Research',
    count: 5,
    children: [
      { value: 'field-notes', label: 'Field notes' },
      {
        value: 'interviews',
        label: 'Interviews',
        count: 3,
        children: [
          { value: 'synthesis', label: 'Interview synthesis' },
          {
            value: 'transcripts',
            label: 'Interview transcripts and participant consent for the upcoming workshop',
          },
          {
            value: 'private',
            label: 'Restricted recordings',
            disabled: true,
            icon: LockSimpleIcon,
          },
        ],
      },
      { value: 'recruiting', label: 'Recruiting' },
    ],
  },
  {
    value: 'planning',
    label: 'Planning',
    count: 12,
    children: [
      { value: 'timeline', label: 'Timeline' },
      { value: 'briefs', label: 'Project briefs' },
    ],
  },
  { value: 'archive', label: 'Archive', count: 124 },
  { value: 'templates', label: 'Templates', count: 0, children: [] },
];

const navSections: readonly NavigationSection[] = [
  {
    label: 'Workspace',
    items: [
      { value: 'overview', label: 'Overview', icon: BookOpenIcon },
      { value: 'inbox', label: 'Inbox', icon: BellIcon, count: 12 },
      {
        value: 'preferences',
        label: 'Preferences',
        icon: GearIcon,
        children: [
          { value: 'profile', label: 'Profile' },
          { value: 'notifications', label: 'Notifications and delivery preferences' },
        ],
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      { value: 'members', label: 'Members', icon: ShieldCheckIcon, count: 0 },
      { value: 'audit', label: 'Audit log', icon: LockSimpleIcon, disabled: true },
    ],
  },
];

export function ExampleNavigation({
  onNavigate,
}: {
  readonly onNavigate?: (value: string, label: string) => void;
}): ReactElement {
  return (
    <AsidePanel
      title="Studio workspace"
      leading={<WorkspaceBadge>ST</WorkspaceBadge>}
      footer={
        <Text size="caption-l" color="muted">
          Shared with 8 people
        </Text>
      }
    >
      <TreeView
        label="Documents"
        items={treeItems}
        defaultActive="synthesis"
        defaultExpanded={['research', 'interviews']}
        onNavigate={onNavigate}
      />
    </AsidePanel>
  );
}

function Canvas({ title = 'Interview synthesis' }: { readonly title?: string }): ReactElement {
  return (
    <article className="shell-study-canvas">
      <Text size="caption-l" color="muted">
        Research library
      </Text>
      <Title size="heading-m">{title}</Title>
      <Text size="body-s" color="secondary">
        Notes and decisions from the first round of fieldwork.
      </Text>
      <Card size="s">
        <Text size="body-s" weight="semibold">
          Key finding
        </Text>
        <Text size="caption-l" color="muted">
          People return to the workspace to see what changed and pick up where they left off.
        </Text>
      </Card>
    </article>
  );
}

function BarContent({ onNewNote }: { readonly onNewNote?: () => void }): ReactElement {
  return (
    <Header
      actions={
        <Button size="s" variant="secondary" tone="neutral" iconLeft={PlusIcon} onClick={onNewNote}>
          New note
        </Button>
      }
    >
      Studio / Research
    </Header>
  );
}

export function WorkspaceTopology({ ctx }: PreviewProps): ReactElement {
  const layout = ctx.story?.controls.layout ?? 'l-shaped';
  const hasNavigation = layout === 'l-shaped' || layout === 'classic' || layout === 'asides';
  const hasInspector = layout === 'classic' || layout === 'asides';
  return (
    <AppShell
      canvasAs="section"
      minHeight={320}
      topRail={
        layout === 'l-shaped' && (
          <TopRail>
            <GlobalSearch placeholder="Search library…" />
          </TopRail>
        )
      }
      leftRail={
        (layout === 'l-shaped' || layout === 'classic' || layout === 'rail') && (
          <LeftRail showBrand={layout !== 'l-shaped'} />
        )
      }
      leftAside={
        hasNavigation && (
          <AsidePanel title="Library">
            <Text size="body-s">Research notes</Text>
          </AsidePanel>
        )
      }
      rightAside={
        hasInspector && (
          <AsidePanel title="Inspector" side="right">
            <Text size="body-s">Shared with the team</Text>
          </AsidePanel>
        )
      }
      header={<Header>Research library</Header>}
      subbar={
        layout === 'l-shaped' && (
          <Subbar>
            <Text size="caption-l" color="muted">
              Document view
            </Text>
          </Subbar>
        )
      }
    >
      <Box padding={16}>
        <Text>Interview notes and findings</Text>
      </Box>
    </AppShell>
  );
}

export function NavigationStates(): ReactElement {
  const [rail, setRail] = useState<RailDestination>('documents');
  const [drafts, setDrafts] = useState<readonly NavigationItem[]>([]);
  return (
    <div className="shell-study-panels">
      <Example title="Workspace rail">
        <div className="shell-study-rail">
          <LeftRail active={rail} onNavigate={setRail} showBrand />
        </div>
      </Example>
      <Example title="NavList · routes and disclosure groups">
        <AsidePanel title="Settings">
          <NavList label="Settings" sections={navSections} defaultActive="notifications" />
        </AsidePanel>
      </Example>
      <Example title="TreeView · branches and leaves">
        <ExampleNavigation />
      </Example>
      <Example title="Empty tree">
        <AsidePanel title="New workspace">
          <TreeView
            label="Documents"
            items={drafts}
            actions={
              <IconButton
                aria-label="Create a document"
                icon={PlusIcon}
                size="s"
                variant="ghost"
                tone="neutral"
                onClick={() =>
                  setDrafts((current) => {
                    const number = current.length + 1;
                    return [...current, { value: `draft-${number}`, label: `Untitled ${number}` }];
                  })
                }
              />
            }
          />
        </AsidePanel>
      </Example>
    </div>
  );
}

const tabs: readonly DocumentTab[] = [
  { value: 'brief', label: 'Project brief', pinned: true },
  {
    value: 'interviews',
    label: 'Interviews and participant consent for the next workshop',
    dirty: true,
  },
  { value: 'summary', label: 'Interview synthesis' },
  { value: 'decisions', label: 'Decision log' },
  { value: 'launch', label: 'Launch checklist' },
  { value: 'roadmap', label: 'Next-quarter roadmap' },
  { value: 'notes', label: 'Field notes' },
  { value: 'archive', label: 'Archive', dirty: true },
];

export function Documents(): ReactElement {
  const [items, setItems] = useState([...tabs]);
  const [value, select] = useState('interviews');
  const [newFocus, setNewFocus] = useState<string>();
  const [pending, setPending] = useState<string>();
  const [newCount, setNewCount] = useState(0);
  const confirmation = useRef<HTMLDialogElement>(null);
  const labelId = useId();

  function add(): void {
    const key = `draft-${newCount + 1}`;
    setNewCount(newCount + 1);
    setItems([...items, { value: key, label: `Untitled ${newCount + 1}` }]);
    select(key);
    setNewFocus(key);
  }

  function remove(key: string): void {
    const index = items.findIndex((item) => item.value === key);
    const remaining = items.filter((item) => item.value !== key);
    setItems(remaining);
    if (value === key) {
      select(remaining[index]?.value ?? remaining[index - 1]?.value ?? '');
    }
  }

  return (
    <div className="shell-study-stack">
      <Example title="Open documents · pinned, current, unsaved and overflow">
        <AppShell
          canvasAs="section"
          minHeight={260}
          topRail={
            <TopRail brand={null}>
              <DocumentTabs
                items={items}
                value={value}
                focusValue={newFocus}
                onValueChange={select}
                onAdd={add}
                onClose={(key) => {
                  if (!items.find((item) => item.value === key)?.dirty) {
                    remove(key);
                  } else {
                    setPending(key);
                    confirmation.current?.showModal();
                  }
                }}
              />
            </TopRail>
          }
        >
          <Canvas title={items.find((item) => item.value === value)?.label ?? 'Open a document'} />
          <dialog
            className="dialog-surface shell-study-confirm"
            ref={confirmation}
            aria-labelledby={labelId}
            data-surface="overlay"
          >
            <Title id={labelId} as="h2" size="heading-s">
              Close without saving?
            </Title>
            <Text size="body-s" color="secondary">
              {items.find((item) => item.value === pending)?.label} has unsaved changes.
            </Text>
            <div className="app-shell-sticky-actions">
              <Button
                size="s"
                variant="secondary"
                tone="neutral"
                onClick={() => confirmation.current?.close()}
              >
                Keep editing
              </Button>
              <Button
                size="s"
                tone="danger"
                onClick={() => {
                  confirmation.current?.close();
                  if (pending) {
                    remove(pending);
                  }
                }}
              >
                Discard and close
              </Button>
            </div>
          </dialog>
        </AppShell>
      </Example>
      <Example title="Empty strip">
        <EmptyDocuments />
      </Example>
    </div>
  );
}

function EmptyDocuments(): ReactElement {
  const [open, setOpen] = useState(false);
  const [nextFocus, setNextFocus] = useState<string>();
  return (
    <AppShell
      canvasAs="section"
      minHeight={155}
      topRail={
        <TopRail brand={null}>
          <DocumentTabs
            items={open ? [{ value: 'draft', label: 'Untitled' }] : []}
            value={open ? 'draft' : ''}
            focusValue={nextFocus}
            onAdd={
              open
                ? undefined
                : () => {
                    setOpen(true);
                    setNextFocus('draft');
                  }
            }
            onClose={
              open
                ? () => {
                    setOpen(false);
                    setNextFocus(undefined);
                  }
                : undefined
            }
          />
        </TopRail>
      }
    >
      <div className="shell-study-canvas">
        <Text size="body-s" color="muted">
          {open ? 'Untitled' : 'Open a document to resume work.'}
        </Text>
      </div>
    </AppShell>
  );
}

export function InspectorRows({ children }: { readonly children?: ReactNode }): ReactElement {
  const keyId = useId();
  return (
    <div className="shell-study-inspector">
      <PropertyRow label="Owner">
        <Text size="caption-l">Research team</Text>
      </PropertyRow>
      <PropertyRow
        label="Visibility"
        status={
          <Badge size="s" status="neutral">
            Read only
          </Badge>
        }
      >
        <Text size="caption-l" color="muted">
          Workspace
        </Text>
      </PropertyRow>
      <PropertyRow label="Reference" controlId={keyId}>
        <Input
          id={keyId}
          dir="ltr"
          size="s"
          variant="ghost"
          defaultValue="RS-104"
          placeholder="Enter a reference"
        />
      </PropertyRow>
      {children}
    </div>
  );
}

export function ResponsiveShell(): ReactElement {
  const [name, setName] = useState('Interview synthesis');
  const workspace = useRef<HTMLDivElement>(null);
  return (
    <AppShell
      canvasAs="section"
      ref={workspace}
      viewportHeight={580}
      topRail={
        <TopRail>
          <GlobalSearch placeholder="Search workspace…" />
        </TopRail>
      }
      leftRail={<LeftRail />}
      leftAside={
        <ExampleNavigation
          onNavigate={(_value, label) => {
            setName(label);
            const panel = workspace.current?.querySelector<HTMLDialogElement>(
              '.app-shell-panel-start:modal',
            );
            if (panel) {
              panel.close();
              panel.addEventListener(
                'close',
                () => workspace.current?.querySelector<HTMLElement>('.app-shell-main')?.focus(),
                { once: true },
              );
            }
          }}
        />
      }
      rightAside={
        <AsidePanel
          side="right"
          title="Document properties"
          footer={
            <Text size="caption-l" color="muted">
              Updated today
            </Text>
          }
        >
          <InspectorRows>
            {[
              ['Phase', 'Discovery'],
              ['Review', 'In progress'],
              ['Participants', '12 interviews'],
              ['Collection', 'Field research'],
              ['Created', 'September 8'],
              ['Last edited by', 'Research team'],
              ['Version', '4'],
            ].map(([label, value]) => (
              <PropertyRow key={label} label={label}>
                <Text size="caption-l">{value}</Text>
              </PropertyRow>
            ))}
          </InspectorRows>
        </AsidePanel>
      }
      header={
        <BarContent
          onNewNote={() => {
            setName('Untitled note');
            workspace.current?.querySelector<HTMLElement>('.app-shell-main')?.focus();
          }}
        />
      }
    >
      <Canvas title={name} />
      <div className="shell-study-canvas">
        <Title as="h2" size="heading-s">
          Next sessions
        </Title>
        {[
          'Invite reviewers',
          'Share the shortlist',
          'Update the research guide',
          'Publish the findings',
        ].map((title) => (
          <Card size="s" key={title}>
            <Text size="body-s">{title}</Text>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

function MobilePreview({ side }: { readonly side: 'start' | 'end' }): ReactElement {
  const start = side === 'start';
  return (
    <div className="shell-study-mobile-pin" aria-hidden="true" inert>
      <AppShell
        canvasAs="section"
        minHeight={380}
        topRail={
          <TopRail>
            <GlobalSearch placeholder="Search workspace…" />
          </TopRail>
        }
      >
        <Canvas />
      </AppShell>
      <div className="shell-study-mobile-scrim" />
      <div
        className="shell-study-mobile-sheet app-shell-sheet"
        data-preview="pinned"
        data-side={side}
        data-surface="overlay"
      >
        <div className="app-shell-sheet-preview">
          <h2>{start ? 'Navigation' : 'Inspector'}</h2>
          <IconButton
            size="s"
            variant="ghost"
            icon={CloseGlyph}
            className="app-shell-panel-close"
            aria-label={start ? 'Close navigation' : 'Close inspector'}
          />
        </div>
        {start ? (
          <ExampleNavigation />
        ) : (
          <AsidePanel side="right" title="Document properties">
            <InspectorRows />
          </AsidePanel>
        )}
      </div>
    </div>
  );
}

export function Properties(): ReactElement {
  const id = useId();
  return (
    <div className="shell-study-panels">
      <Example title="SettingsRow · standard settings">
        <Card className="app-shell-example-properties" size="s">
          <SettingsRow
            label="Default view"
            description="Applies when opening a project on this device."
            controlId={`${id}-view`}
          >
            <Input id={`${id}-view`} size="s" defaultValue="Library" />
          </SettingsRow>
          <SettingsRow
            label="Permission inheritance"
            description="Managed by your workspace administrator."
            status={
              <Badge size="s" status="neutral">
                Managed
              </Badge>
            }
            controlId={`${id}-managed`}
          >
            <Input id={`${id}-managed`} size="s" defaultValue="Workspace" disabled />
          </SettingsRow>
          <SettingsRow
            label="Workspace alias"
            description={
              <Text as="span" id={`${id}-error`} size="caption-l" color="danger">
                An alias can contain letters, digits and hyphens.
              </Text>
            }
            status={
              <Badge size="s" status="danger">
                Invalid
              </Badge>
            }
            controlId={`${id}-invalid`}
          >
            <Input
              id={`${id}-invalid`}
              aria-describedby={`${id}-error`}
              aria-invalid="true"
              size="s"
              status="danger"
              defaultValue="Design team!"
            />
          </SettingsRow>
        </Card>
      </Example>
      <Example title="PropertyRow · narrow inspector">
        <AsidePanel side="right" title="Document properties">
          <InspectorRows />
        </AsidePanel>
      </Example>
    </div>
  );
}

type SaveState = 'clean' | 'dirty' | 'saving' | 'error';

function SaveBar({
  state,
  onDiscard,
  onSave,
}: {
  readonly state: SaveState;
  readonly onDiscard?: () => void;
  readonly onSave?: () => void;
}): ReactElement {
  const saving = state === 'saving';
  const clean = state === 'clean';
  return (
    <StickyActionBar
      data-state={state}
      aria-label="Document changes"
      actions={
        <>
          <Button
            size="s"
            variant="ghost"
            tone="neutral"
            disabled={clean || saving}
            onClick={onDiscard}
          >
            Discard
          </Button>
          <Button size="s" disabled={clean} loading={saving} onClick={onSave}>
            {state === 'error' ? 'Retry save' : 'Save changes'}
          </Button>
        </>
      }
    >
      <div className="app-shell-sticky-message" role="status">
        <Icon
          usage="slot"
          icon={clean ? CheckIcon : state === 'error' ? WarningCircleIcon : PencilSimpleIcon}
        />
        <bdi>
          {
            {
              clean: 'All changes saved',
              dirty: 'Unsaved changes',
              saving: 'Saving changes…',
              error: 'Could not save. Your changes are still here.',
            }[state]
          }
        </bdi>
      </div>
    </StickyActionBar>
  );
}

export function SaveStates({ ctx }: PreviewProps): ReactElement {
  const [state, setState] = useState<SaveState>('dirty');
  const fail = ctx.story?.controls.fail === true;
  const pendingSave = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(pendingSave.current), []);
  const [saved, setSaved] = useState('Research workspace');
  const [draft, setDraft] = useState('Field research workspace');
  const field = useRef<HTMLInputElement>(null);

  return (
    <AppShell
      canvasAs="section"
      viewportHeight={360}
      leftRail={<LeftRail />}
      leftAside={<ExampleNavigation />}
      header={<Header>Workspace settings</Header>}
    >
      <div className="shell-study-canvas">
        <Title size="heading-m">Preferences</Title>
        <label>
          Workspace name
          <Input
            ref={field}
            size="m"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setState(event.target.value === saved ? 'clean' : 'dirty');
            }}
            disabled={state === 'saving'}
          />
        </label>
        <Card size="s">
          <Text size="body-s" weight="semibold">
            Access and permissions
          </Text>
          <Text size="body-s" color="secondary">
            Only invited members can open this workspace.
          </Text>
        </Card>
        <Card size="s">
          <Text size="body-s" weight="semibold">
            Review reminders
          </Text>
          <Text size="body-s" color="secondary">
            Editors receive a weekly digest of documents awaiting review.
          </Text>
        </Card>
      </div>
      <SaveBar
        state={state}
        onSave={() => {
          if (fail) {
            ctx.story?.setControl('fail', false);
          }
          setState('saving');
          pendingSave.current = window.setTimeout(() => {
            if (fail) {
              setState('error');
            } else {
              setSaved(draft);
              setState('clean');
              window.requestAnimationFrame(() => field.current?.focus());
            }
          }, 700);
        }}
        onDiscard={() => {
          setDraft(saved);
          setState('clean');
          field.current?.focus();
        }}
      />
    </AppShell>
  );
}

export function SaveStateGallery(): ReactElement {
  return (
    <div className="shell-study-save-previews" inert>
      {(['clean', 'dirty', 'saving', 'error'] as const).map((state) => (
        <SaveBar key={state} state={state} />
      ))}
    </div>
  );
}

const layoutMedia = ['(width >= 768px)', '(width >= 1024px)', '(width >= 1440px)'];

function observeLayoutWidth(onChange: () => void): () => void {
  const queries = layoutMedia.map((query) => window.matchMedia(query));
  for (const query of queries) {
    query.addEventListener('change', onChange);
  }
  return () => {
    for (const query of queries) {
      query.removeEventListener('change', onChange);
    }
  };
}

function layoutWidthStep(): number {
  return layoutMedia.filter((query) => window.matchMedia(query).matches).length;
}

export function LayoutExamples({ ctx }: PreviewProps): ReactElement {
  // Refresh the pinned study when Chromium retains old media styles inside the inspection panes.
  const step = useSyncExternalStore(observeLayoutWidth, layoutWidthStep, () => 0);
  return (
    <div
      className={`shell-study-stack shell-study-layout${ctx.surface === 'overlay' ? ' unica-overlay-surface' : ''}`}
      key={step}
    >
      <Example title="Box, Stack and Flex · spacing, baseline and wrapping">
        <Box
          className="shell-study-layout-guide shell-study-layout-box"
          padding={{ tablet: 24, desktop: 32 }}
        >
          <Stack gap={{ mobile: 8, tablet: 16 }}>
            <div className="shell-study-layout-cell">Workspace access</div>
            <Flex
              wrap="wrap"
              align="center"
              gap={{ mobile: 8, tablet: 16 }}
              direction={{ mobile: 'column', tablet: 'row' }}
            >
              <div className="shell-study-layout-cell">Editors</div>
              <div className="shell-study-layout-cell">External collaborators</div>
              <div className="shell-study-layout-cell">Service accounts</div>
            </Flex>
            <Flex wrap="wrap" align="baseline" gap={8}>
              <Title as="h4" size="heading-s">
                Permissions
              </Title>
              <Text size="caption-l" color="muted">
                Updated today
              </Text>
            </Flex>
          </Stack>
        </Box>
      </Example>
      <Example title="Grid and GridItem · one to four tracks">
        <Grid
          className="shell-study-layout-guide"
          columns={{ mobile: 1, tablet: 2, desktop: 3, wide: 4 }}
          gap={{ mobile: 8, tablet: 16, wide: 24 }}
        >
          <GridItem span={{ mobile: 1, desktop: 2 }} className="shell-study-layout-cell">
            All teams
          </GridItem>
          <GridItem className="shell-study-layout-cell">HR</GridItem>
          <GridItem className="shell-study-layout-cell">IT</GridItem>
          <GridItem className="shell-study-layout-cell" hidden>
            Hidden item
          </GridItem>
          <GridItem className="shell-study-layout-cell">QA</GridItem>
        </Grid>
      </Example>
      <Example title="Container · 720, 960 and 1280px">
        <Stack gap={8}>
          {(['s', 'm', 'l'] as const).map((size, index) => (
            <Container
              size={size}
              className="shell-study-layout-guide shell-study-layout-measure"
              key={size}
            >
              <div className="shell-study-layout-cell">{[720, 960, 1280][index]}px</div>
            </Container>
          ))}
        </Stack>
      </Example>
    </div>
  );
}

export function DrawerLayouts(): ReactElement {
  return (
    <div className="shell-study-panels">
      <Example title="Navigation">
        <MobilePreview side="start" />
      </Example>
      <Example title="Inspector">
        <MobilePreview side="end" />
      </Example>
    </div>
  );
}
