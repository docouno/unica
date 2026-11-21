import { useId, useRef, useState, useSyncExternalStore } from 'react';
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
import { defineComponent } from '../../workbench/types.js';
import { Button, IconButton } from '../../prototypes/button/button.proto.js';
import {
  Badge,
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  Icon,
  Stack,
  Text,
  Title,
} from '@docouno/unica';
import { CloseGlyph } from '../../prototypes/control-glyphs.js';
import { Input } from '../../prototypes/input/input.proto.js';
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
      <h3>{title}</h3>
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

function ExampleNavigation({
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
      <div className="shell-study-card">
        <Text size="body-s" weight="semibold">
          Key finding
        </Text>
        <Text size="caption-l" color="muted">
          People return to the workspace to see what changed and pick up where they left off.
        </Text>
      </div>
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

function Topologies(): ReactElement {
  return (
    <div className="shell-study-stack">
      <Example title="L-shaped · top rail, side rail and navigation">
        <AppShell
          canvasAs="section"
          minHeight={360}
          topRail={
            <TopRail
              actions={
                <Text size="caption-l" color="muted">
                  Studio workspace
                </Text>
              }
            >
              <GlobalSearch placeholder="Search the workspace…" />
            </TopRail>
          }
          leftRail={<LeftRail />}
          leftAside={<ExampleNavigation />}
          header={<BarContent />}
          subbar={
            <Subbar>
              <Text size="caption-l" color="muted">
                Document view
              </Text>
            </Subbar>
          }
        >
          <Canvas />
        </AppShell>
      </Example>
      <Example title="Classic · side rail, navigation and inspector">
        <AppShell
          canvasAs="section"
          minHeight={330}
          leftRail={<LeftRail showBrand />}
          leftAside={<ExampleNavigation />}
          rightAside={
            <AsidePanel title="Inspector" side="right">
              <InspectorRows />
            </AsidePanel>
          }
        >
          <Canvas />
        </AppShell>
      </Example>
      <Example title="Aside only · inline-start and inline-end">
        <AppShell
          canvasAs="section"
          minHeight={290}
          leftAside={
            <AsidePanel title="Sections">
              <NavList
                label="Sections"
                sections={navSections.slice(0, 1)}
                defaultActive="overview"
              />
            </AsidePanel>
          }
          rightAside={
            <AsidePanel title="Inspector" side="right">
              <InspectorRows />
            </AsidePanel>
          }
        >
          <Canvas title="Workspace overview" />
        </AppShell>
      </Example>
      <Example title="Side rail only">
        <AppShell
          canvasAs="section"
          minHeight={300}
          leftRail={<LeftRail active="admin" showBrand />}
        >
          <Canvas title="Workspace access" />
        </AppShell>
      </Example>
      <Example title="Standalone · canvas and header">
        <AppShell canvasAs="section" minHeight={230} header={<BarContent />}>
          <Canvas title="Research library" />
        </AppShell>
      </Example>
    </div>
  );
}

function NavigationStates(): ReactElement {
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

function Documents(): ReactElement {
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

function InspectorRows({ children }: { readonly children?: ReactNode }): ReactElement {
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
        <Input id={keyId} dir="ltr" size="s" variant="ghost" defaultValue="RS-104" />
      </PropertyRow>
      {children}
    </div>
  );
}

function ResponsiveShell(): ReactElement {
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
          <div className="shell-study-card" key={title}>
            <Text size="body-s">{title}</Text>
          </div>
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

function Properties(): ReactElement {
  const id = useId();
  return (
    <div className="shell-study-panels">
      <Example title="SettingsRow · standard settings">
        <div className="app-shell-example-properties shell-study-card">
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
              <span id={`${id}-error`} className="app-shell-property-status">
                An alias can contain letters, digits and hyphens.
              </span>
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
        </div>
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
        <span>
          {
            {
              clean: 'All changes saved',
              dirty: 'Unsaved changes',
              saving: 'Saving changes…',
              error: 'Could not save. Your changes are still here.',
            }[state]
          }
        </span>
      </div>
    </StickyActionBar>
  );
}

function SaveStates(): ReactElement {
  const [state, setState] = useState<SaveState>('dirty');
  const [fail, setFail] = useState(false);
  const [saved, setSaved] = useState('Research workspace');
  const [draft, setDraft] = useState('Field research workspace');
  const field = useRef<HTMLInputElement>(null);

  return (
    <div className="shell-study-stack">
      <Example title="Sticky within the canvas · live form">
        <AppShell
          canvasAs="section"
          viewportHeight={420}
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
            <label className="shell-study-check">
              <input
                type="checkbox"
                checked={fail}
                onChange={(event) => setFail(event.target.checked)}
              />{' '}
              Simulate a save failure
            </label>
            <Text size="body-s" color="muted">
              Scroll the canvas to review the remaining settings.
            </Text>
            <div className="shell-study-card">
              <Text size="body-s">Access and permissions</Text>
            </div>
            <div className="shell-study-card">
              <Text size="body-s">Review reminders</Text>
            </div>
          </div>
          <SaveBar
            state={state}
            onSave={() => {
              setState('saving');
              window.setTimeout(() => {
                if (fail) {
                  setFail(false);
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
      </Example>
    </div>
  );
}

function SaveStateGallery(): ReactElement {
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

function LayoutExamples(): ReactElement {
  // Refresh the pinned study when Chromium retains old media styles inside the inspection panes.
  const step = useSyncExternalStore(observeLayoutWidth, layoutWidthStep, () => 0);
  return (
    <div className="shell-study-stack shell-study-layout" key={step}>
      <Example title="Box, Stack and Flex · spacing, baseline and wrapping">
        <Box
          className="shell-study-layout-guide shell-study-layout-box"
          padding={{ tablet: 'l', desktop: 'xl' }}
        >
          <Stack gap={{ mobile: 's', tablet: 'm' }}>
            <div className="shell-study-layout-cell">Workspace access</div>
            <Flex
              wrap="wrap"
              align="center"
              gap={{ mobile: 's', tablet: 'm' }}
              direction={{ mobile: 'column', tablet: 'row' }}
            >
              <div className="shell-study-layout-cell">Editors</div>
              <div className="shell-study-layout-cell">External collaborators</div>
              <div className="shell-study-layout-cell">Service accounts</div>
            </Flex>
            <Flex wrap="wrap" align="baseline" gap="s">
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
          gap={{ mobile: 's', tablet: 'm', wide: 'l' }}
        >
          <GridItem span={{ mobile: 1, desktop: 2 }} className="shell-study-layout-cell">
            Access overview
          </GridItem>
          <GridItem className="shell-study-layout-cell">Members</GridItem>
          <GridItem className="shell-study-layout-cell">Service accounts</GridItem>
          <GridItem className="shell-study-layout-cell" hidden>
            Hidden item
          </GridItem>
          <GridItem className="shell-study-layout-cell">Pending invitations</GridItem>
        </Grid>
      </Example>
      <Example title="Container · 720, 960 and 1280px">
        <Stack gap="s">
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

export default defineComponent({
  id: 'app-shell',
  title: 'AppShell & navigation',
  category: 'Layout',
  status: 'Proto',
  componentName: 'AppShell',
  summary: 'Workspace chrome, document navigation, inspectors and in-canvas actions.',
  props: {
    topRail: {
      kind: 'slot',
      group: 'Regions',
      default: 'search',
      description: 'Global search and identity along the top edge.',
      choices: [
        { value: 'none', label: 'Empty' },
        { value: 'search', label: 'Search', code: '<TopRail><GlobalSearch /></TopRail>' },
      ],
    },
    leftRail: {
      kind: 'slot',
      group: 'Regions',
      default: 'rail',
      description: 'Workspace destinations along the leading edge.',
      choices: [
        { value: 'none', label: 'Empty' },
        { value: 'rail', label: 'Destinations', code: '<LeftRail />' },
      ],
    },
    leftAside: {
      kind: 'slot',
      group: 'Regions',
      default: 'none',
      description: 'Document navigation beside the canvas.',
      choices: [
        { value: 'none', label: 'Empty' },
        { value: 'documents', label: 'Documents', code: '<ExampleNavigation />' },
      ],
    },
    rightAside: {
      kind: 'slot',
      group: 'Regions',
      default: 'none',
      description: 'Document properties on the trailing side.',
      choices: [
        { value: 'none', label: 'Empty' },
        {
          value: 'properties',
          label: 'Properties',
          code: '<AsidePanel side="right" title="Inspector"><InspectorRows /></AsidePanel>',
        },
      ],
    },
    navigationCollapsed: {
      kind: 'boolean',
      group: 'Navigation',
      default: false,
      description: 'Start with the navigation dock hidden.',
    },
    inspectorCollapsed: {
      kind: 'boolean',
      group: 'Navigation',
      default: false,
      description: 'Start with the inspector dock hidden.',
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { leftAside: 'none' },
      affects: ['navigationCollapsed'],
      reason: 'Only a supplied navigation panel can collapse.',
    },
    {
      kind: 'ignored',
      when: { rightAside: 'none' },
      affects: ['inspectorCollapsed'],
      reason: 'Only a supplied inspector panel can collapse.',
    },
  ],
  render: ({ ctx, values }) => (
    <AppShell
      key={`${values.navigationCollapsed}-${values.inspectorCollapsed}`}
      canvasAs="section"
      {...ctx.subject}
      minHeight={320}
      topRail={
        values.topRail === 'search' ? (
          <TopRail>
            <GlobalSearch />
          </TopRail>
        ) : undefined
      }
      leftRail={
        values.leftRail === 'rail' ? <LeftRail showBrand={values.topRail === 'none'} /> : undefined
      }
      leftAside={values.leftAside === 'documents' ? <ExampleNavigation /> : undefined}
      rightAside={
        values.rightAside === 'properties' ? (
          <AsidePanel side="right" title="Inspector">
            <InspectorRows />
          </AsidePanel>
        ) : undefined
      }
      defaultNavigationCollapsed={values.navigationCollapsed}
      defaultInspectorCollapsed={values.inspectorCollapsed}
    >
      <Canvas />
    </AppShell>
  ),
  code: ({ topRail, leftRail, leftAside, rightAside, navigationCollapsed, inspectorCollapsed }) => {
    const slots = [
      topRail === 'search' ? ' topRail={<TopRail><GlobalSearch /></TopRail>}' : '',
      leftRail === 'rail'
        ? topRail === 'none'
          ? ' leftRail={<LeftRail showBrand />}'
          : ' leftRail={<LeftRail />}'
        : '',
      leftAside === 'documents' ? ' leftAside={<ExampleNavigation />}' : '',
      rightAside === 'properties'
        ? ' rightAside={<AsidePanel side="right" title="Inspector"><InspectorRows /></AsidePanel>}'
        : '',
      navigationCollapsed ? ' defaultNavigationCollapsed' : '',
      inspectorCollapsed ? ' defaultInspectorCollapsed' : '',
    ].join('');
    return `<AppShell canvasAs="section" minHeight={320}${slots}>
  <Canvas />
</AppShell>`;
  },
  matrixViews: [
    {
      id: 'rails',
      title: 'Top and side rails',
      rows: 'leftRail',
      cols: 'topRail',
      fixed: {
        leftAside: 'none',
        rightAside: 'none',
        navigationCollapsed: false,
        inspectorCollapsed: false,
      },
    },
    {
      id: 'asides',
      title: 'Navigation and inspector',
      caption:
        'These cells show compact panel entry points. Responsive shell shows both desktop docks.',
      rows: 'leftAside',
      cols: 'rightAside',
      fixed: {
        topRail: 'none',
        leftRail: 'none',
        navigationCollapsed: false,
        inspectorCollapsed: false,
      },
    },
  ],
  cases: [
    {
      id: 'navigation',
      title: 'Rail, NavList and TreeView',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Select a destination or open a branch. In the tree, arrows move focus and Enter selects.',
      render: NavigationStates,
    },
    {
      id: 'documents',
      title: 'Open documents',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Switch documents, close a clean or dirty item, and use the full list when the strip overflows.',
      render: Documents,
    },
    {
      id: 'responsive',
      title: 'Responsive shell',
      kind: 'behavior',
      mode: 'live',
      caption:
        'At 1280px, hide Inspector from inside its header and reopen it from the workspace header. Navigation stays at the start of the workspace header. At 768px, the labeled buttons open sheets.',
      render: ResponsiveShell,
    },
    {
      id: 'drawer-layouts',
      title: 'Open navigation and inspector',
      kind: 'surface',
      mode: 'pinned',
      caption:
        'Both logical edges shown at compact width. Open the corresponding panel in Responsive shell to try it.',
      render: () => (
        <div className="shell-study-panels">
          <Example title="Navigation">
            <MobilePreview side="start" />
          </Example>
          <Example title="Inspector">
            <MobilePreview side="end" />
          </Example>
        </div>
      ),
    },
    {
      id: 'properties',
      title: 'Settings and property rows',
      kind: 'content',
      mode: 'live',
      render: Properties,
    },
    {
      id: 'save',
      title: 'Save, discard and retry',
      kind: 'behavior',
      mode: 'live',
      caption: 'Edit the workspace name, scroll the canvas, or simulate a failed save.',
      render: SaveStates,
    },
    {
      id: 'save-states',
      title: 'Save bar states',
      kind: 'content',
      mode: 'pinned',
      render: SaveStateGallery,
    },
    {
      id: 'layout',
      title: 'Layout primitives',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Resize the browser to see responsive track and spacing steps. Use the frame width to check content fit.',
      render: LayoutExamples,
    },
  ],
  usage: [
    {
      id: 'topologies',
      title: 'Composable workspace topologies',
      render: Topologies,
      code: `<AppShell
  topRail={<TopRail><GlobalSearch /></TopRail>}
  leftRail={<LeftRail />}
  leftAside={<ExampleNavigation />}
  header={<Header>Studio / Research</Header>}
>
  <Canvas />
</AppShell>`,
    },
  ],
});
