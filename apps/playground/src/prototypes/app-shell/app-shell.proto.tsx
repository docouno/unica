import {
  AccountGlyph,
  BackGlyph,
  BooksGlyph,
  BranchGlyph,
  CaretDownGlyph,
  CaretRightGlyph,
  CloseGlyph,
  FileTextGlyph,
  FolderGlyph,
  NotificationGlyph,
  PlusGlyph,
  SearchGlyph,
  SidebarGlyph,
  SlidersGlyph,
  TrashGlyph,
} from '../control-glyphs.js';
import {
  BookOpenIcon,
  GearIcon,
  KeyIcon,
  PuzzlePieceIcon,
  ShieldCheckIcon,
  SquaresFourIcon,
  UsersIcon,
} from '@phosphor-icons/react/ssr';
import { useId, useRef, useState } from 'react';
import type { ComponentPropsWithRef, CSSProperties, ReactElement, ReactNode } from 'react';
import { Icon, Indicator, Kbd, defineGlyph } from '@docouno/unica';
import type { GlyphDefinition } from '@docouno/unica';
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
  readonly navigationCollapsed?: boolean;
}

// A visual composition frame. Production navigation and modal focus ship separately.
export function AppShell({
  topRail,
  leftRail,
  leftAside,
  rightAside,
  header,
  subbar,
  minHeight = 900,
  navigationCollapsed = false,
  children,
  className = '',
  style,
  onKeyDown,
  ...props
}: AppShellProps): ReactElement {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const navigationId = useId();
  const inspectorId = useId();
  const navigationTrigger = useRef<HTMLButtonElement>(null);
  const inspectorTrigger = useRef<HTMLButtonElement>(null);
  const frameStyle = {
    '--shell-min-height': `${minHeight}px`,
    ...style,
  } as CSSProperties;

  function closeNavigation(): void {
    setNavigationOpen(false);
    navigationTrigger.current?.focus();
  }

  function closeInspector(): void {
    setInspectorOpen(false);
    inspectorTrigger.current?.focus();
  }

  return (
    <div
      {...props}
      className={`app-shell-proto ${className}`}
      data-top-rail={Boolean(topRail) || undefined}
      data-left-rail={Boolean(leftRail) || undefined}
      data-navigation-collapsed={navigationCollapsed || undefined}
      style={frameStyle}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && event.key === 'Escape') {
          if (inspectorOpen) {
            closeInspector();
          } else if (navigationOpen) {
            closeNavigation();
          }
        }
      }}
    >
      {topRail && <div className="app-shell-top-region">{topRail}</div>}
      <div className="app-shell-body">
        {leftRail && <div className="app-shell-rail-region">{leftRail}</div>}
        <div className="app-shell-stage">
          {leftAside && (
            <div
              className="app-shell-left-region"
              id={navigationId}
              data-open={navigationOpen || undefined}
            >
              <button
                type="button"
                className="app-shell-panel-close app-shell-navigation-close"
                aria-label="Close navigation"
                onClick={closeNavigation}
              >
                <Icon usage="slot" icon={CloseGlyph} />
              </button>
              {leftAside}
            </div>
          )}
          <div className="app-shell-canvas">
            {(leftAside || rightAside) && (
              <div className="app-shell-mobile-bar">
                {leftAside && (
                  <button
                    ref={navigationTrigger}
                    type="button"
                    className="app-shell-panel-toggle app-shell-navigation-toggle"
                    aria-expanded={navigationOpen}
                    aria-controls={navigationId}
                    onClick={() => setNavigationOpen(!navigationOpen)}
                  >
                    <Icon usage="slot" icon={SidebarGlyph} />
                    Navigation
                  </button>
                )}
                {rightAside && (
                  <button
                    ref={inspectorTrigger}
                    type="button"
                    className="app-shell-panel-toggle app-shell-inspector-toggle"
                    aria-expanded={inspectorOpen}
                    aria-controls={inspectorId}
                    onClick={() => setInspectorOpen(!inspectorOpen)}
                  >
                    <Icon usage="slot" icon={SidebarGlyph} className="app-shell-inspector-glyph" />
                    Inspector
                  </button>
                )}
              </div>
            )}
            {header}
            {subbar}
            <main className="app-shell-main">{children}</main>
          </div>
          {rightAside && (
            <div
              className="app-shell-right-region"
              id={inspectorId}
              data-open={inspectorOpen || undefined}
            >
              <button
                type="button"
                className="app-shell-panel-close app-shell-inspector-close"
                aria-label="Close inspector"
                onClick={closeInspector}
              >
                <Icon usage="slot" icon={CloseGlyph} />
              </button>
              {rightAside}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export interface BrandMarkProps extends ComponentPropsWithRef<'span'> {
  readonly decorative?: boolean | undefined;
}

export function BrandMark({
  className = '',
  decorative = false,
  ...props
}: BrandMarkProps): ReactElement {
  return (
    <span {...props} className={`app-shell-brand ${className}`}>
      {decorative ? (
        <Icon usage="slot" icon={BooksGlyph} size="inherit" />
      ) : (
        <Icon icon={BooksGlyph} size="inherit" aria-label="Folio" />
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
        <div className="app-shell-top-brand">{brand}</div>
        <div className="app-shell-top-content">{children}</div>
      </div>
      {actions && <div className="app-shell-top-actions">{actions}</div>}
    </header>
  );
}

export interface GlobalSearchProps extends ComponentPropsWithRef<'input'> {
  readonly shortcut?: string;
}

export function GlobalSearch({
  shortcut = '⌘K',
  placeholder = 'Search runbooks, ADRs, services…',
  ...props
}: GlobalSearchProps): ReactElement {
  return (
    <label className="app-shell-search">
      <Icon usage="slot" icon={SearchGlyph} />
      <input {...props} type="search" aria-label="Search workspace" placeholder={placeholder} />
      <Kbd>{shortcut}</Kbd>
    </label>
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

export interface DocumentTab {
  readonly value: string;
  readonly label: string;
  readonly dirty?: boolean;
}

export interface DocumentTabsProps {
  readonly items?: readonly DocumentTab[];
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
}

const documentTabs: readonly DocumentTab[] = [
  { value: 'runbook', label: 'Zero-Downtime PG Failover' },
  { value: 'adr', label: 'ADR-014 Traffic Draining', dirty: true },
];

export function DocumentTabs({
  items = documentTabs,
  defaultValue = 'adr',
  onValueChange,
}: DocumentTabsProps): ReactElement {
  const [current, setCurrent] = useState(defaultValue);
  return (
    <nav
      className="app-shell-document-tabs unica-scrollbar unica-scrollbar--compact"
      aria-label="Open documents"
    >
      {items.map((item) => (
        <button
          type="button"
          key={item.value}
          className="app-shell-document-tab"
          aria-current={current === item.value ? 'page' : undefined}
          onClick={() => {
            setCurrent(item.value);
            onValueChange?.(item.value);
          }}
        >
          <Icon usage="slot" icon={item.dirty ? BranchGlyph : FileTextGlyph} />
          <span>{item.label}</span>
          {item.dirty ? (
            <span className="app-shell-dirty-dot" />
          ) : (
            <Icon usage="slot" icon={CloseGlyph} />
          )}
        </button>
      ))}
      <button type="button" className="app-shell-new-tab" aria-label="Open another document">
        <Icon usage="slot" icon={PlusGlyph} />
      </button>
    </nav>
  );
}

export type RailDestination =
  'overview' | 'notifications' | 'documents' | 'extensions' | 'search' | 'admin' | 'preferences';

interface RailItem {
  readonly value: RailDestination;
  readonly label: string;
  readonly icon: GlyphDefinition;
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
}

export function LeftRail({
  active = 'documents',
  showBrand = false,
  profile = 'PE',
  onNavigate,
  className = '',
  ...props
}: LeftRailProps): ReactElement {
  function item(entry: RailItem): ReactElement {
    return (
      <button
        key={entry.value}
        type="button"
        className="app-shell-rail-item"
        aria-label={
          entry.count === undefined ? entry.label : `${entry.label}, ${entry.count} unread`
        }
        aria-current={active === entry.value ? 'page' : undefined}
        title={entry.label}
        onClick={() => onNavigate?.(entry.value)}
      >
        {entry.count === undefined ? (
          <Icon usage="slot" icon={entry.icon} />
        ) : (
          <Indicator count={entry.count} max={9} size="s" className="app-shell-rail-indicator">
            <Icon usage="slot" icon={entry.icon} />
          </Indicator>
        )}
      </button>
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
        <button type="button" className="app-shell-profile" aria-label="Account menu">
          {profile}
        </button>
      </div>
    </nav>
  );
}

export interface AsidePanelProps extends ComponentPropsWithRef<'aside'> {
  readonly side?: 'left' | 'right';
  readonly width?: number;
  readonly title?: string;
  readonly leading?: ReactNode;
  readonly actions?: ReactNode;
  readonly footer?: ReactNode;
}

export function AsidePanel({
  side = 'left',
  width = side === 'left' ? 243 : 296,
  title,
  leading,
  actions,
  footer,
  children,
  className = '',
  style,
  ...props
}: AsidePanelProps): ReactElement {
  return (
    <aside
      aria-label={title}
      {...props}
      className={`app-shell-aside ${className}`}
      data-side={side}
      style={{ '--aside-width': `${width}px`, ...style } as CSSProperties}
    >
      {title && (
        <div className="app-shell-aside-header">
          <span className="app-shell-aside-title">
            {leading}
            {title}
          </span>
          {actions}
        </div>
      )}
      <div className="app-shell-aside-body">{children}</div>
      {footer && <div className="app-shell-aside-footer">{footer}</div>}
    </aside>
  );
}

export function WorkspaceBadge(): ReactElement {
  return <span className="app-shell-workspace-badge">PE</span>;
}

export interface HeaderProps extends ComponentPropsWithRef<'header'> {
  readonly actions?: ReactNode;
}

export function Header({ actions, children, className = '', ...props }: HeaderProps): ReactElement {
  return (
    <header {...props} className={`app-shell-header ${className}`}>
      <div className="app-shell-header-content">{children}</div>
      {actions && <div className="app-shell-header-actions">{actions}</div>}
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

interface NavigationItem {
  readonly value: string;
  readonly label: string;
  readonly icon?: GlyphDefinition;
  readonly count?: number;
  readonly children?: readonly NavigationItem[];
}

interface NavigationSection {
  readonly label: string;
  readonly items: readonly NavigationItem[];
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

interface NavigationProps {
  readonly sections: readonly NavigationSection[];
  readonly defaultActive: string;
  readonly expanded?: readonly string[] | undefined;
  readonly tree?: boolean;
  readonly onNavigate?: ((value: string) => void) | undefined;
}

function Navigation({
  sections,
  defaultActive,
  expanded = [],
  tree = false,
  onNavigate,
}: NavigationProps): ReactElement {
  const [current, setCurrent] = useState(defaultActive);
  function row(entry: NavigationItem, nested = false): ReactElement {
    return (
      <button
        type="button"
        key={entry.value}
        className="app-shell-nav-row"
        data-nested={nested || undefined}
        aria-current={current === entry.value ? 'page' : undefined}
        onClick={() => {
          setCurrent(entry.value);
          onNavigate?.(entry.value);
        }}
      >
        {tree && !nested && (
          <Icon
            usage="slot"
            icon={CaretRightGlyph}
            className="app-shell-nav-glyph app-shell-group-caret"
            directional
          />
        )}
        <Icon
          className="app-shell-nav-glyph"
          usage="slot"
          icon={entry.icon ?? (nested ? FileTextGlyph : FolderGlyph)}
        />
        <span className="app-shell-nav-label">{entry.label}</span>
        {entry.count !== undefined && <span className="app-shell-nav-count">{entry.count}</span>}
      </button>
    );
  }
  return (
    <nav
      className="app-shell-navigation"
      aria-label="Workspace pages"
      data-tree={tree || undefined}
    >
      {sections.map((section) => (
        <div className="app-shell-nav-section" key={section.label}>
          <div className="app-shell-nav-section-label">
            <span>{section.label}</span>
            {section.label === 'Documents' && (
              <div className="app-shell-nav-tools">
                <Icon usage="slot" icon={SlidersGlyph} />
                <Icon usage="slot" icon={PlusGlyph} />
              </div>
            )}
          </div>
          {section.items.map((entry) =>
            entry.children ? (
              <details
                className="app-shell-nav-group"
                key={entry.value}
                open={expanded.includes(entry.value)}
              >
                <summary>
                  <Icon
                    usage="slot"
                    icon={CaretRightGlyph}
                    className="app-shell-nav-glyph app-shell-group-caret"
                    directional
                  />
                  <Icon usage="slot" icon={FolderGlyph} className="app-shell-nav-glyph" />
                  <span className="app-shell-nav-label">{entry.label}</span>
                  <span className="app-shell-nav-count">{entry.count}</span>
                </summary>
                <div className="app-shell-nav-children">
                  {entry.children.map((child) => row(child, true))}
                </div>
              </details>
            ) : (
              row(entry)
            ),
          )}
        </div>
      ))}
    </nav>
  );
}

export function WorkspaceNavigation({
  kind = 'documents',
  defaultActive = 'adr-014',
  expanded = ['architecture', 'runbooks'],
  onNavigate,
}: WorkspaceNavigationProps): ReactElement {
  const sections =
    kind === 'admin' ? adminSections : kind === 'extensions' ? extensionSections : documentSections;
  return (
    <Navigation
      sections={sections}
      defaultActive={defaultActive}
      expanded={expanded}
      tree={kind === 'documents'}
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
    <Navigation sections={settingsSections} defaultActive={defaultActive} onNavigate={onNavigate} />
  );
}

export type WorkspaceUtilityProps = ComponentPropsWithRef<'button'>;

export function WorkspaceTrash({ className = '', ...props }: WorkspaceUtilityProps): ReactElement {
  return (
    <button type="button" {...props} className={`app-shell-nav-row ${className}`}>
      <Icon usage="slot" icon={TrashGlyph} className="app-shell-nav-glyph" />
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

export function BackToWorkspace({ className = '', ...props }: WorkspaceUtilityProps): ReactElement {
  return (
    <button
      type="button"
      aria-label="Back to workspace"
      {...props}
      className={`app-shell-back ${className}`}
    >
      <Icon usage="slot" icon={BackGlyph} directional />
    </button>
  );
}

export interface PropertyRowProps extends ComponentPropsWithRef<'div'> {
  readonly label: ReactNode;
  readonly description?: ReactNode;
}

export function PropertyRow({
  label,
  description,
  children,
  className = '',
  ...props
}: PropertyRowProps): ReactElement {
  return (
    <div {...props} className={`app-shell-property-row ${className}`}>
      <div className="app-shell-property-label">
        <span>{label}</span>
        {description && <span className="app-shell-property-description">{description}</span>}
      </div>
      <div className="app-shell-property-control">{children}</div>
    </div>
  );
}

export interface StickyActionBarProps extends ComponentPropsWithRef<'div'> {
  readonly actions?: ReactNode;
}

export function StickyActionBar({
  actions,
  children,
  className = '',
  ...props
}: StickyActionBarProps): ReactElement {
  return (
    <div
      {...props}
      role="region"
      aria-label="Unsaved changes"
      className={`app-shell-sticky-bar ${className}`}
    >
      <div>{children}</div>
      <div className="app-shell-header-actions">{actions}</div>
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
