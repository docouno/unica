import { createContext, useContext, useId, useLayoutEffect, useRef, useState } from 'react';
import type {
  ComponentPropsWithRef,
  CSSProperties,
  MouseEvent,
  ReactElement,
  ReactNode,
  Ref,
  RefObject,
} from 'react';
import { Divider, Icon, Indicator, defineGlyph, Input } from '@docouno/unica';
import type { GlyphSource, InputProps } from '@docouno/unica';
import {
  BookOpenIcon,
  GearIcon,
  KeyIcon,
  PuzzlePieceIcon,
  ShieldCheckIcon,
  SquaresFourIcon,
  UsersIcon,
} from '@phosphor-icons/react/ssr';
import {
  AccountGlyph,
  BackGlyph,
  BooksGlyph,
  BranchGlyph,
  CaretDownGlyph,
  CloseGlyph,
  FileTextGlyph,
  FolderGlyph,
  NotificationGlyph,
  SearchGlyph,
  SidebarGlyph,
  SlidersGlyph,
  TrashGlyph,
} from '../control-glyphs.js';
import { Button, IconButton } from '../button/button.proto.js';
import { PopoverContent } from '../popover/popover.proto.js';
import { useShellPopoverPosition, windowBounds } from './app-shell-position.js';
import { HintPreview } from '../tooltip/tooltip.preview.js';
import { NavList, TreeView } from './navigation.proto.js';
import type { NavigationSection } from './navigation.proto.js';
export { DocumentTabs } from './document-tabs.proto.js';
import '../dialog/dialog.css';
import './app-shell.css';

const AccessKeyGlyph = defineGlyph(KeyIcon, 'phosphor');
const ArchiveGlyph = defineGlyph(BookOpenIcon, 'phosphor');
const AuditGlyph = defineGlyph(ShieldCheckIcon, 'phosphor');
const ExtensionGlyph = defineGlyph(PuzzlePieceIcon, 'phosphor');
const MembersGlyph = defineGlyph(UsersIcon, 'phosphor');
const OverviewGlyph = defineGlyph(SquaresFourIcon, 'phosphor');
const SettingsGlyph = defineGlyph(GearIcon, 'phosphor');

export interface AppShellProps extends ComponentPropsWithRef<'div'> {
  readonly topRail?: ReactNode;
  readonly leftRail?: ReactNode;
  readonly leftAside?: ReactNode;
  readonly rightAside?: ReactNode;
  readonly header?: ReactNode;
  readonly subbar?: ReactNode;
  readonly minHeight?: number;
  readonly viewportHeight?: number | string;
  readonly canvasAs?: 'main' | 'section';
  readonly defaultNavigationCollapsed?: boolean;
  readonly defaultInspectorCollapsed?: boolean;
}

const DockControls = createContext<{
  readonly start?: ReactNode;
  readonly end?: ReactNode;
}>({});
const InspectorDockControl = createContext<ReactNode>(null);

function DockToggle({
  side,
  name,
  controls,
  expanded,
  onToggle,
  buttonRef,
}: {
  readonly side: 'start' | 'end';
  readonly name: string;
  readonly controls: string;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly buttonRef?: RefObject<HTMLButtonElement | null>;
}): ReactElement {
  const label = `${expanded ? 'Hide' : 'Show'} ${name}`;
  return (
    <HintPreview
      side="bottom"
      trigger={(bindings) => (
        <IconButton
          {...bindings}
          ref={(button) => {
            bindings.ref(button);
            if (buttonRef) {
              buttonRef.current = button;
            }
          }}
          className={`app-shell-dock-toggle app-shell-dock-${side}`}
          icon={SidebarGlyph}
          size="s"
          variant="ghost"
          tone="neutral"
          aria-label={label}
          aria-controls={controls}
          aria-expanded={expanded}
          onClick={(event) => {
            bindings.onClick?.(event);
            onToggle();
          }}
        />
      )}
    >
      {label}
    </HintPreview>
  );
}

interface PanelProps {
  readonly id: string;
  readonly side: 'start' | 'end';
  readonly label: string;
  readonly children: ReactNode;
  readonly dialogRef: Ref<HTMLDialogElement>;
}

// The same panel stays mounted while it moves between docked and modal layouts.
function ShellPanel({ id, side, label, children, dialogRef }: PanelProps): ReactElement {
  const pressedBackdrop = useRef(false);

  function isBackdrop(event: MouseEvent<HTMLDialogElement>): boolean {
    if (event.target !== event.currentTarget || !event.currentTarget.open) {
      return false;
    }
    const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect();
    return (
      event.clientX < left ||
      event.clientX >= right ||
      event.clientY < top ||
      event.clientY >= bottom
    );
  }

  return (
    <dialog
      ref={dialogRef}
      id={id}
      className={`app-shell-panel app-shell-sheet app-shell-panel-${side} unica-scrollbar unica-scrollbar--compact`}
      role="presentation"
      onPointerDown={(event) => {
        pressedBackdrop.current =
          side === 'start' && event.isPrimary && event.button === 0 && isBackdrop(event);
      }}
      onPointerCancel={() => {
        pressedBackdrop.current = false;
      }}
      onClick={(event) => {
        if (pressedBackdrop.current && isBackdrop(event)) {
          event.currentTarget.close();
        }
        pressedBackdrop.current = false;
      }}
    >
      <div className="app-shell-sheet-preview">
        <h2 tabIndex={-1}>{label}</h2>
        <IconButton
          size="s"
          variant="ghost"
          icon={CloseGlyph}
          className="app-shell-panel-close"
          aria-label={`Close ${label.toLowerCase()}`}
          onClick={(event) => event.currentTarget.closest('dialog')?.close()}
        />
      </div>
      {children}
    </dialog>
  );
}

function openShellPanel(panel: HTMLDialogElement | null, trigger: HTMLButtonElement): void {
  const shell = trigger.closest<HTMLElement>('.app-shell-proto');
  if (!panel || !shell || panel.open) {
    return;
  }
  const body = panel.querySelector<HTMLElement>('.app-shell-aside-body');
  const chrome = Array.from(
    panel.querySelectorAll<HTMLElement>(
      '.app-shell-sheet-preview, .app-shell-sheet-rail, .app-shell-aside-header, .app-shell-aside-footer',
    ),
  );
  function position(): void {
    if (!shell || !panel) {
      return;
    }
    if (!trigger.getClientRects().length) {
      panel.close();
      shell.querySelector<HTMLElement>('.app-shell-main')?.focus({ preventScroll: true });
      return;
    }
    const frame = shell.getBoundingClientRect();
    const viewport = windowBounds();
    const left = Math.max(viewport.left, frame.left);
    const right = Math.min(viewport.right, frame.right);
    const alignToFrame = right - left >= Math.min(240, viewport.right - viewport.left);
    panel.style.setProperty('--shell-sheet-left', `${alignToFrame ? left : viewport.left}px`);
    panel.style.setProperty(
      '--shell-sheet-right',
      `${window.innerWidth - (alignToFrame ? right : viewport.right)}px`,
    );
    panel.style.setProperty('--shell-sheet-top', `${viewport.top}px`);
    panel.style.setProperty('--shell-sheet-height', `${viewport.bottom - viewport.top}px`);
    if (!body) {
      panel.setAttribute('data-whole-scroll', '');
      return;
    }
    const padding = getComputedStyle(panel);
    const inset = getComputedStyle(body);
    const chromeHeight = chrome.reduce((total, part) => total + part.offsetHeight, 0);
    const available =
      panel.clientHeight -
      chromeHeight -
      parseFloat(padding.paddingBlockStart) -
      parseFloat(padding.paddingBlockEnd) -
      parseFloat(inset.marginBlockStart) -
      parseFloat(inset.marginBlockEnd);
    panel.toggleAttribute('data-whole-scroll', available < 96);
  }
  const heading = panel.querySelector<HTMLElement>('.app-shell-sheet-preview > h2');
  const title = heading?.textContent ?? '';
  panel.setAttribute('role', 'dialog');
  if (title) {
    panel.setAttribute('aria-label', title);
  }
  panel.dataset.surface = 'overlay';
  panel.showModal();
  position();
  heading?.focus({ preventScroll: true });
  const observer = new ResizeObserver(position);
  observer.observe(shell);
  for (const part of chrome) {
    observer.observe(part);
  }
  window.visualViewport?.addEventListener('resize', position);
  window.visualViewport?.addEventListener('scroll', position);
  panel.addEventListener(
    'close',
    () => {
      observer.disconnect();
      window.visualViewport?.removeEventListener('resize', position);
      window.visualViewport?.removeEventListener('scroll', position);
      panel.setAttribute('role', 'presentation');
      panel.removeAttribute('aria-label');
      panel.removeAttribute('data-whole-scroll');
      delete panel.dataset.surface;
      if (trigger.getClientRects().length) {
        trigger.focus({ preventScroll: true });
      }
    },
    { once: true },
  );
}

export function AppShell({
  topRail,
  leftRail,
  leftAside,
  rightAside,
  header,
  subbar,
  minHeight = 900,
  viewportHeight,
  canvasAs: Canvas = 'main',
  defaultNavigationCollapsed = false,
  defaultInspectorCollapsed = false,
  children,
  className = '',
  style,
  ...props
}: AppShellProps): ReactElement {
  const navigationId = useId();
  const inspectorId = useId();
  const mainId = useId();
  const navigationPanel = useRef<HTMLDialogElement>(null);
  const inspectorPanel = useRef<HTMLDialogElement>(null);
  const main = useRef<HTMLElement>(null);
  const [navigationCollapsed, setNavigationCollapsed] = useState(defaultNavigationCollapsed);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(defaultInspectorCollapsed);
  const inspectorToggle = useRef<HTMLButtonElement>(null);
  const transferInspectorFocus = useRef(false);

  useLayoutEffect(() => {
    if (transferInspectorFocus.current) {
      transferInspectorFocus.current = false;
      const target = inspectorToggle.current;
      (target?.getClientRects().length ? target : main.current)?.focus({ preventScroll: true });
    }
  }, [inspectorCollapsed]);

  const inspectorControl = rightAside && (
    <DockToggle
      side="end"
      name="inspector"
      controls={inspectorId}
      expanded={!inspectorCollapsed}
      onToggle={() => {
        transferInspectorFocus.current = true;
        setInspectorCollapsed((value) => !value);
      }}
      buttonRef={inspectorToggle}
    />
  );
  const dockControls = {
    start: leftAside && (
      <DockToggle
        side="start"
        name="navigation"
        controls={navigationId}
        expanded={!navigationCollapsed}
        onToggle={() => setNavigationCollapsed((value) => !value)}
      />
    ),
    end: inspectorCollapsed && inspectorControl && (
      <div className="app-shell-inspector-control" data-reopen="">
        <Divider className="app-shell-inspector-divider" orientation="vertical" />
        {inspectorControl}
      </div>
    ),
  };
  const frameStyle = {
    '--shell-min-height': `${minHeight}px`,
    '--shell-viewport-height':
      typeof viewportHeight === 'number' ? `${viewportHeight}px` : viewportHeight,
    ...style,
  } as CSSProperties;

  return (
    <div
      {...props}
      className={`app-shell-proto ${className}`}
      data-top-rail={Boolean(topRail) || undefined}
      data-left-rail={Boolean(leftRail) || undefined}
      data-left-aside={Boolean(leftAside) || undefined}
      data-right-aside={Boolean(rightAside) || undefined}
      data-navigation-collapsed={navigationCollapsed || undefined}
      data-inspector-collapsed={inspectorCollapsed || undefined}
      data-bounded={Boolean(viewportHeight) || undefined}
      style={frameStyle}
    >
      <a
        className="app-shell-skip"
        href={`#${mainId}`}
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to content
      </a>
      {topRail && <div className="app-shell-top-region">{topRail}</div>}
      <div className="app-shell-body">
        {leftRail && <div className="app-shell-rail-region">{leftRail}</div>}
        <div className="app-shell-stage">
          {(leftAside || leftRail) && (
            <ShellPanel
              id={navigationId}
              side="start"
              label="Navigation"
              dialogRef={navigationPanel}
            >
              {leftRail && (
                <div className="app-shell-sheet-rail">
                  {leftAside ? (
                    <details>
                      <summary>Workspace sections</summary>
                      {leftRail}
                    </details>
                  ) : (
                    leftRail
                  )}
                </div>
              )}
              {leftAside}
            </ShellPanel>
          )}
          <div className="app-shell-canvas">
            {(leftAside || leftRail || rightAside) && (
              <div className="app-shell-mobile-bar">
                {(leftAside || leftRail) && (
                  <Button
                    size="s"
                    variant="secondary"
                    tone="neutral"
                    iconLeft={SidebarGlyph}
                    className="app-shell-panel-toggle app-shell-navigation-toggle"
                    aria-haspopup="dialog"
                    aria-controls={navigationId}
                    onClick={(event) =>
                      openShellPanel(navigationPanel.current, event.currentTarget)
                    }
                  >
                    Navigation
                  </Button>
                )}
                {rightAside && (
                  <Button
                    size="s"
                    variant="secondary"
                    tone="neutral"
                    iconLeft={SidebarGlyph}
                    className="app-shell-panel-toggle app-shell-inspector-toggle"
                    aria-haspopup="dialog"
                    aria-controls={inspectorId}
                    onClick={(event) => openShellPanel(inspectorPanel.current, event.currentTarget)}
                  >
                    Inspector
                  </Button>
                )}
              </div>
            )}
            <div className="app-shell-header-slot">
              <DockControls value={dockControls}>
                {header ?? ((leftAside || rightAside) && <Header data-dock-only />)}
              </DockControls>
            </div>
            {subbar}
            <Canvas
              id={mainId}
              ref={main}
              tabIndex={-1}
              aria-label={Canvas === 'section' ? 'Workspace canvas' : undefined}
              className="app-shell-main unica-scrollbar unica-scrollbar--compact"
            >
              {children}
            </Canvas>
          </div>
          {rightAside && (
            <ShellPanel id={inspectorId} side="end" label="Inspector" dialogRef={inspectorPanel}>
              <InspectorDockControl value={!inspectorCollapsed && inspectorControl}>
                {rightAside}
              </InspectorDockControl>
            </ShellPanel>
          )}
        </div>
      </div>
    </div>
  );
}

export interface BrandMarkProps extends ComponentPropsWithRef<'span'> {
  readonly label?: string;
  readonly decorative?: boolean;
}

export function BrandMark({
  label = 'Workspace',
  decorative = false,
  className = '',
  ...props
}: BrandMarkProps): ReactElement {
  return (
    <span {...props} className={`app-shell-brand ${className}`}>
      {decorative ? (
        <Icon usage="slot" icon={BooksGlyph} size="inherit" />
      ) : (
        <Icon icon={BooksGlyph} size="inherit" aria-label={label} />
      )}
    </span>
  );
}

export interface TopRailProps extends ComponentPropsWithRef<'header'> {
  readonly actions?: ReactNode;
  readonly brand?: ReactNode;
}

export function TopRail({
  actions,
  brand = <BrandMark />,
  children,
  className = '',
  ...props
}: TopRailProps): ReactElement {
  return (
    <header {...props} className={`app-shell-top-rail ${className}`}>
      <div className="app-shell-top-lead">
        {brand && <div className="app-shell-top-brand">{brand}</div>}
        <div className="app-shell-top-content">{children}</div>
      </div>
      {actions && <div className="app-shell-top-actions">{actions}</div>}
    </header>
  );
}

export type GlobalSearchProps = Omit<InputProps, 'size' | 'type' | 'iconLeft'>;

export function GlobalSearch({
  placeholder = 'Search runbooks, ADRs, services…',
  className = '',
  ...props
}: GlobalSearchProps): ReactElement {
  return (
    <Input
      aria-label="Search workspace"
      placeholder={placeholder}
      {...props}
      className={`app-shell-search ${className}`}
      type="search"
      size="s"
      iconLeft={SearchGlyph}
    />
  );
}

export function WorkspaceStatus(): ReactElement {
  return (
    <div className="app-shell-workspace-status">
      <span className="app-shell-branch">
        <Icon usage="slot" icon={BranchGlyph} /> main · eu-central-1
      </span>
      <span className="app-shell-status-divider" />
      <span>Platform Eng</span>
    </div>
  );
}

export type RailDestination =
  'overview' | 'notifications' | 'documents' | 'extensions' | 'search' | 'admin' | 'preferences';

interface RailItem {
  readonly value: RailDestination;
  readonly label: string;
  readonly icon: GlyphSource;
  readonly count?: number;
}

const primaryRailItems: readonly RailItem[] = [
  { value: 'overview', label: 'Overview', icon: OverviewGlyph },
  { value: 'notifications', label: 'Notifications', icon: NotificationGlyph, count: 3 },
  { value: 'documents', label: 'Documents', icon: FileTextGlyph },
  { value: 'extensions', label: 'Extensions', icon: ExtensionGlyph },
];
const utilityRailItems: readonly RailItem[] = [
  { value: 'admin', label: 'Workspace admin', icon: SlidersGlyph },
  { value: 'preferences', label: 'Preferences', icon: SettingsGlyph },
];

export interface LeftRailProps extends ComponentPropsWithRef<'nav'> {
  readonly active?: RailDestination;
  readonly showBrand?: boolean;
  readonly profile?: ReactNode;
  readonly onNavigate?: (value: RailDestination) => void;
  readonly links?: Partial<Record<RailDestination, string>>;
}

export function LeftRail({
  active = 'documents',
  showBrand = false,
  profile = 'PE',
  onNavigate,
  links,
  className = '',
  ...props
}: LeftRailProps): ReactElement {
  const accountId = useId();
  const accountTrigger = useRef<HTMLButtonElement>(null);
  const accountPanel = useRef<HTMLDivElement>(null);
  useShellPopoverPosition(accountTrigger, accountPanel, 186, 'account');

  function item(entry: RailItem): ReactElement {
    const href = links?.[entry.value];
    const accessibleName =
      entry.count === undefined ? entry.label : `${entry.label}, ${entry.count} unread`;
    const contents = (
      <>
        {entry.count === undefined ? (
          <Icon usage="slot" icon={entry.icon} />
        ) : (
          <Indicator count={entry.count} max={9} size="s" className="app-shell-rail-indicator">
            <Icon usage="slot" icon={entry.icon} />
          </Indicator>
        )}
        <span className="app-shell-rail-label">{entry.label}</span>
      </>
    );
    return (
      <HintPreview
        key={entry.value}
        side="end"
        canShow={(anchor) => !anchor.closest('.app-shell-sheet-rail')}
        trigger={(bindings) => {
          const itemProps = {
            ...bindings,
            className: 'app-shell-rail-item',
            'aria-current': active === entry.value ? ('page' as const) : undefined,
            'aria-label': accessibleName,
            onClick: () => onNavigate?.(entry.value),
          };
          return href ? (
            <a {...itemProps} href={href}>
              {contents}
            </a>
          ) : (
            <button {...itemProps} type="button">
              {contents}
            </button>
          );
        }}
      >
        {entry.label}
      </HintPreview>
    );
  }
  return (
    <nav
      aria-label="Workspace sections"
      {...props}
      className={`app-shell-left-rail ${className}`}
      data-brand={showBrand || undefined}
    >
      <div className="app-shell-rail-items">
        {showBrand && (
          <div className="app-shell-rail-brand">
            <BrandMark />
          </div>
        )}
        {primaryRailItems.map(item)}
        {showBrand && item({ value: 'search', label: 'Search workspace', icon: SearchGlyph })}
      </div>
      <div className="app-shell-rail-items">
        {utilityRailItems.map(item)}
        <button
          type="button"
          className="app-shell-profile"
          aria-label="Account"
          ref={accountTrigger}
          popoverTarget={accountId}
        >
          <span>{profile}</span>
          <span className="app-shell-rail-label">Account</span>
        </button>
        <PopoverContent
          id={accountId}
          ref={accountPanel}
          size="s"
          popover="auto"
          role="region"
          aria-label="Account details"
          className="app-shell-popover"
        >
          <AccountLabel />
        </PopoverContent>
      </div>
    </nav>
  );
}

export interface AsidePanelProps extends ComponentPropsWithRef<'aside'> {
  readonly side?: 'left' | 'right';
  readonly width?: number;
  readonly title?: string;
  readonly headerContent?: ReactNode;
  readonly leading?: ReactNode;
  readonly actions?: ReactNode;
  readonly footer?: ReactNode;
}

export function AsidePanel({
  side = 'left',
  width = side === 'left' ? 243 : 296,
  title,
  headerContent,
  leading,
  actions,
  footer,
  children,
  className = '',
  style,
  ...props
}: AsidePanelProps): ReactElement {
  const dockControl = useContext(InspectorDockControl);
  const hasHeaderContent = Boolean(title || headerContent || actions);
  return (
    <aside
      aria-label={title}
      {...props}
      className={`app-shell-aside ${className}`}
      data-side={side}
      style={{ '--aside-width': `${width}px`, ...style } as CSSProperties}
    >
      {(hasHeaderContent || dockControl) && (
        <div className="app-shell-aside-header" data-dock-only={!hasHeaderContent || undefined}>
          {headerContent ? (
            <div className="app-shell-aside-header-content">{headerContent}</div>
          ) : title ? (
            <span className="app-shell-aside-title">
              {leading}
              {title}
            </span>
          ) : null}
          {actions && <div className="app-shell-aside-header-actions">{actions}</div>}
          {dockControl && <div className="app-shell-inspector-control">{dockControl}</div>}
        </div>
      )}
      <div className="app-shell-aside-body unica-scrollbar unica-scrollbar--compact">
        {children}
      </div>
      {footer && <div className="app-shell-aside-footer">{footer}</div>}
    </aside>
  );
}

export function WorkspaceBadge({
  children = 'PE',
}: {
  readonly children?: ReactNode;
}): ReactElement {
  return (
    <span className="app-shell-workspace-badge" aria-hidden="true">
      {children}
    </span>
  );
}

export interface HeaderProps extends ComponentPropsWithRef<'header'> {
  readonly actions?: ReactNode;
}

export function Header({ actions, children, className = '', ...props }: HeaderProps): ReactElement {
  const dock = useContext(DockControls);
  return (
    <header {...props} className={`app-shell-header ${className}`}>
      <div className="app-shell-header-content">
        {dock.start}
        {children}
      </div>
      {actions && <div className="app-shell-header-actions">{actions}</div>}
      {dock.end}
    </header>
  );
}

export interface SubbarProps extends ComponentPropsWithRef<'div'> {
  readonly actions?: ReactNode;
}

export function Subbar({ actions, children, className = '', ...props }: SubbarProps): ReactElement {
  return (
    <div {...props} className={`app-shell-subbar ${className}`}>
      <div className="app-shell-subbar-content">{children}</div>
      {actions && <div className="app-shell-subbar-actions">{actions}</div>}
    </div>
  );
}

const documentSections: readonly NavigationSection[] = [
  {
    label: 'Documents',
    items: [
      {
        value: 'architecture',
        label: 'Architecture',
        count: 34,
        children: [
          { value: 'adr-014', label: 'ADR-014 Traffic Draining' },
          { value: 'service-mesh', label: 'Service Mesh v3' },
          { value: 'cold-storage', label: 'Cold Storage Tiering' },
        ],
      },
      {
        value: 'runbooks',
        label: 'Runbooks',
        count: 28,
        children: [
          { value: 'pg-failover', label: 'Zero-Downtime PG Failover' },
          { value: 'redis', label: 'Redis Eviction Policy' },
          { value: 'tls', label: 'Edge TLS Rotation' },
        ],
      },
      { value: 'incidents', label: 'Incidents', count: 19 },
      { value: 'rfcs', label: 'RFCs', count: 24 },
      { value: 'onboarding', label: 'Onboarding', count: 15 },
    ],
  },
];
const adminSections: readonly NavigationSection[] = [
  {
    label: 'Workspace admin',
    items: [
      { value: 'general', label: 'General', icon: SettingsGlyph },
      { value: 'members', label: 'Members & roles', count: 14, icon: MembersGlyph },
      { value: 'metadata', label: 'Metadata schema', count: 6, icon: FileTextGlyph },
      { value: 'projects', label: 'Projects', count: 5, icon: FolderGlyph },
    ],
  },
  {
    label: 'Portability & audit',
    items: [
      { value: 'import', label: 'Batch import', icon: BooksGlyph },
      { value: 'export', label: 'Export archive', icon: ArchiveGlyph },
      { value: 'audit', label: 'Audit log', icon: AuditGlyph },
    ],
  },
];
const extensionSections: readonly NavigationSection[] = [
  {
    label: 'Categories',
    items: [
      { value: 'all', label: 'All connectors', count: 8, icon: OverviewGlyph },
      { value: 'source-control', label: 'Source control', count: 3, icon: BranchGlyph },
      { value: 'incident-response', label: 'Incident response', count: 3, icon: NotificationGlyph },
      { value: 'webhooks', label: 'Webhooks & API', count: 2, icon: ExtensionGlyph },
    ],
  },
  {
    label: 'Runtime',
    items: [
      { value: 'schedules', label: 'Sync schedules', icon: SlidersGlyph },
      { value: 'keys', label: 'Signing keys', icon: AccessKeyGlyph },
    ],
  },
];
const settingsSections: readonly NavigationSection[] = [
  {
    label: 'Personal',
    items: [
      { value: 'appearance', label: 'Appearance & editor', icon: SlidersGlyph },
      { value: 'notifications', label: 'Notifications', icon: NotificationGlyph },
      { value: 'shortcuts', label: 'Keyboard shortcuts', icon: OverviewGlyph },
    ],
  },
  {
    label: 'Security',
    items: [
      { value: 'sessions', label: 'Sessions & passkeys', icon: AuditGlyph },
      { value: 'tokens', label: 'Personal API tokens', icon: AccessKeyGlyph },
    ],
  },
];

export interface WorkspaceNavigationProps {
  readonly kind?: 'documents' | 'admin' | 'extensions';
  readonly defaultActive?: string;
  readonly expanded?: readonly string[];
  readonly onNavigate?: (value: string) => void;
}

export function WorkspaceNavigation({
  kind = 'documents',
  defaultActive = 'adr-014',
  expanded = ['architecture', 'runbooks'],
  onNavigate,
}: WorkspaceNavigationProps): ReactElement {
  const sections = kind === 'admin' ? adminSections : extensionSections;
  return kind === 'documents' ? (
    <TreeView
      label="Workspace documents"
      items={documentSections.flatMap((section) => section.items)}
      defaultActive={defaultActive}
      defaultExpanded={expanded}
      onNavigate={onNavigate}
    />
  ) : (
    <NavList
      label="Workspace pages"
      sections={sections}
      defaultActive={defaultActive}
      onNavigate={onNavigate}
    />
  );
}

export interface SettingsNavigationProps {
  readonly defaultActive?: string;
  readonly onNavigate?: (value: string) => void;
}

export function SettingsNavigation({
  defaultActive = 'appearance',
  onNavigate,
}: SettingsNavigationProps): ReactElement {
  return (
    <NavList
      label="Preferences sections"
      sections={settingsSections}
      defaultActive={defaultActive}
      onNavigate={onNavigate}
    />
  );
}

export type WorkspaceUtilityProps = ComponentPropsWithRef<'button'>;

export function WorkspaceTrash({ className = '', ...props }: WorkspaceUtilityProps): ReactElement {
  return (
    <button type="button" {...props} className={`app-shell-nav-row ${className}`}>
      <Icon usage="slot" icon={TrashGlyph} className="app-shell-nav-icon" />
      <span className="app-shell-nav-label">Trash</span>
      <span className="app-shell-nav-count">3</span>
    </button>
  );
}

export function WorkspaceSwitcher({
  className = '',
  ...props
}: WorkspaceUtilityProps): ReactElement {
  return (
    <button
      type="button"
      aria-label="Switch workspace"
      {...props}
      className={`app-shell-workspace-switcher ${className}`}
    >
      <Icon usage="slot" icon={CaretDownGlyph} />
    </button>
  );
}

export function BackToWorkspace({
  className = '',
  ...props
}: ComponentPropsWithRef<'a'> & { readonly href: string }): ReactElement {
  return (
    <a aria-label="Back to workspace" {...props} className={`app-shell-back ${className}`}>
      <Icon usage="slot" icon={BackGlyph} directional />
    </a>
  );
}

export interface PropertyRowProps extends ComponentPropsWithRef<'div'> {
  readonly label: ReactNode;
  readonly description?: ReactNode;
  readonly status?: ReactNode;
  readonly controlId?: string;
}

export function PropertyRow({
  label,
  description,
  status,
  controlId,
  children,
  className = '',
  ...props
}: PropertyRowProps): ReactElement {
  return (
    <div {...props} className={`app-shell-property-row ${className}`}>
      <div className="app-shell-property-label">
        <div className="app-shell-property-heading">
          {controlId ? <label htmlFor={controlId}>{label}</label> : <span>{label}</span>}
          {status}
        </div>
        {description && <span className="app-shell-property-description">{description}</span>}
      </div>
      <div className="app-shell-property-control">{children}</div>
    </div>
  );
}

export const SettingsRow: typeof PropertyRow = PropertyRow;

export interface StickyActionBarProps extends ComponentPropsWithRef<'div'> {
  readonly actions?: ReactNode;
}

export function StickyActionBar({
  actions,
  children,
  'aria-label': label = 'Unsaved changes',
  className = '',
  ...props
}: StickyActionBarProps): ReactElement {
  return (
    <div
      {...props}
      role="region"
      aria-label={label}
      className={`app-shell-sticky-bar ${className}`}
    >
      <div>{children}</div>
      <div className="app-shell-sticky-actions">{actions}</div>
    </div>
  );
}

export function AccountLabel(): ReactElement {
  return (
    <span className="app-shell-account-label">
      <Icon usage="slot" icon={AccountGlyph} /> Platform engineer
    </span>
  );
}
