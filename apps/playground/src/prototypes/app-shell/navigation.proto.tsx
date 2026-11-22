import { useId, useRef, useState } from 'react';
import type { ComponentPropsWithRef, KeyboardEvent, ReactElement, ReactNode, Ref } from 'react';
import { Icon, Tooltip, defineGlyph } from '@docouno/unica';
import type { GlyphSource } from '@docouno/unica';
import { FolderOpenIcon } from '@phosphor-icons/react/ssr';
import { CaretRightGlyph, FileTextGlyph, FolderGlyph } from '../control-glyphs.js';
import { useClippedLabel } from '../use-clipped-label.js';

const FolderOpenGlyph = defineGlyph(FolderOpenIcon, 'phosphor');

export interface NavigationItem {
  readonly value: string;
  readonly label: string;
  readonly icon?: GlyphSource;
  readonly count?: number;
  readonly href?: string;
  readonly disabled?: boolean;
  readonly children?: readonly NavigationItem[];
}

export interface NavigationSection {
  readonly label: string;
  readonly items: readonly NavigationItem[];
}

interface CommonProps {
  readonly label: string;
  readonly defaultActive?: string;
  readonly onNavigate?: ((value: string, label: string) => void) | undefined;
}

function RowContent({
  item,
  icon = item.icon,
  labelRef,
}: {
  readonly item: NavigationItem;
  readonly icon?: GlyphSource | undefined;
  readonly labelRef?: Ref<HTMLSpanElement>;
}): ReactElement {
  return (
    <>
      {icon && <Icon usage="slot" icon={icon} className="app-shell-nav-icon" />}
      <span className="app-shell-nav-label" dir="auto" ref={labelRef}>
        {item.label}
      </span>
      {item.count !== undefined && (
        <span className="app-shell-nav-count" dir="ltr" aria-label={`${item.count} items`}>
          {item.count > 99 ? '99+' : item.count}
        </span>
      )}
    </>
  );
}

export function NavList({
  label,
  sections,
  defaultActive,
  onNavigate,
}: CommonProps & { readonly sections: readonly NavigationSection[] }): ReactElement {
  const [current, setCurrent] = useState(defaultActive);
  function rows(items: readonly NavigationItem[]): ReactElement {
    return (
      <ul className="app-shell-nav-list" role="list">
        {items.map((item) => {
          const page = current === item.value ? 'page' : undefined;
          function choose(): void {
            setCurrent(item.value);
            onNavigate?.(item.value, item.label);
          }
          return (
            <li key={item.value}>
              {item.children && !item.disabled ? (
                <details
                  className="app-shell-nav-group"
                  open={item.children.some((child) => child.value === defaultActive) || undefined}
                >
                  <summary className="app-shell-nav-row">
                    <Icon
                      usage="slot"
                      icon={CaretRightGlyph}
                      className="app-shell-nav-caret"
                      directional
                    />
                    <RowContent item={item} />
                  </summary>
                  {rows(item.children)}
                </details>
              ) : item.href && !item.disabled ? (
                <a
                  href={item.href}
                  className="app-shell-nav-row"
                  aria-current={page}
                  onClick={choose}
                >
                  <RowContent item={item} />
                </a>
              ) : (
                <button
                  type="button"
                  className="app-shell-nav-row"
                  disabled={item.disabled}
                  aria-current={page}
                  onClick={choose}
                >
                  <RowContent item={item} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <nav className="app-shell-navigation" aria-label={label}>
      {sections.map((section) => (
        <div key={section.label} className="app-shell-nav-section">
          <div className="app-shell-nav-section-label">{section.label}</div>
          {rows(section.items)}
        </div>
      ))}
    </nav>
  );
}

function visibleItems(
  items: readonly NavigationItem[],
  expanded: ReadonlySet<string>,
): NavigationItem[] {
  return items.flatMap((item) =>
    item.children && expanded.has(item.value)
      ? [item, ...visibleItems(item.children, expanded)]
      : [item],
  );
}

interface TreeRowProps extends Pick<
  ComponentPropsWithRef<'div'>,
  'aria-selected' | 'onClick' | 'onFocus' | 'onKeyDown' | 'ref' | 'tabIndex'
> {
  readonly item: NavigationItem;
  readonly open: boolean;
  readonly branch: ReactNode;
  readonly onToggle: () => void;
}

function TreeRow({ item, open, branch, onToggle, ...row }: TreeRowProps): ReactElement {
  const groupId = useId();
  const [labelRef, clipped] = useClippedLabel<HTMLSpanElement>(item.label, 'block');

  return (
    <div className="app-shell-tree-node" role="none">
      <Tooltip label={item.label} side="end" align="start" disabled={!clipped}>
        <div
          {...row}
          className="app-shell-nav-row app-shell-tree-item"
          role="treeitem"
          aria-label={item.count === undefined ? item.label : `${item.label}, ${item.count} items`}
          aria-expanded={item.children ? open : undefined}
          aria-owns={open && item.children?.length ? groupId : undefined}
          aria-disabled={item.disabled || undefined}
        >
          {item.children ? (
            <span
              className="app-shell-tree-disclosure"
              aria-hidden="true"
              onClick={(event) => {
                event.stopPropagation();
                onToggle();
              }}
            >
              <Icon
                usage="slot"
                icon={CaretRightGlyph}
                className="app-shell-nav-caret"
                directional
              />
            </span>
          ) : (
            <span className="app-shell-tree-disclosure" data-empty aria-hidden="true" />
          )}
          <RowContent
            item={item}
            labelRef={labelRef}
            icon={
              item.icon ?? (item.children ? (open ? FolderOpenGlyph : FolderGlyph) : FileTextGlyph)
            }
          />
        </div>
      </Tooltip>
      {open &&
        item.children &&
        (item.children.length ? (
          <div id={groupId} className="app-shell-tree-branch" role="group">
            {branch}
          </div>
        ) : (
          <p className="app-shell-tree-branch app-shell-nav-empty">Empty folder</p>
        ))}
    </div>
  );
}

export function TreeView({
  label,
  items,
  defaultActive,
  defaultExpanded = [],
  onNavigate,
  actions,
}: CommonProps & {
  readonly items: readonly NavigationItem[];
  readonly defaultExpanded?: readonly string[];
  readonly actions?: ReactNode;
}): ReactElement {
  const [expanded, setExpanded] = useState(() => new Set(defaultExpanded));
  const [selected, setSelected] = useState(defaultActive);
  const [focused, setFocused] = useState(defaultActive);
  const elements = useRef(new Map<string, HTMLDivElement>());
  const search = useRef({ text: '', time: 0 });
  const visible = visibleItems(items, expanded);
  const stop = visible.some((item) => item.value === focused) ? focused : visible[0]?.value;

  function focus(item: NavigationItem | undefined): void {
    if (item) {
      setFocused(item.value);
      elements.current.get(item.value)?.focus();
    }
  }

  function toggle(value: string): void {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (!next.delete(value)) {
        next.add(value);
      }
      return next;
    });
  }

  function select(item: NavigationItem): void {
    if (item.disabled) {
      return;
    }
    setSelected(item.value);
    onNavigate?.(item.value, item.label);
  }

  function keyDown(
    event: KeyboardEvent<HTMLDivElement>,
    item: NavigationItem,
    parent?: NavigationItem,
  ): void {
    if (event.target !== event.currentTarget || event.altKey || event.metaKey || event.ctrlKey) {
      return;
    }
    const index = visible.indexOf(item);
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const openKey = rtl ? 'ArrowLeft' : 'ArrowRight';
    const closeKey = rtl ? 'ArrowRight' : 'ArrowLeft';
    const open = expanded.has(item.value);

    switch (event.key) {
      case 'ArrowDown':
        focus(visible[index + 1]);
        break;
      case 'ArrowUp':
        focus(visible[index - 1]);
        break;
      case 'Home':
        focus(visible[0]);
        break;
      case 'End':
        focus(visible.at(-1));
        break;
      case openKey:
        if (open) {
          focus(item.children?.[0]);
        } else if (item.children && !item.disabled) {
          toggle(item.value);
        }
        break;
      case closeKey:
        if (open) {
          toggle(item.value);
        } else {
          focus(parent);
        }
        break;
      case 'Enter':
      case ' ':
        select(item);
        break;
      default: {
        if (event.key.length !== 1 || event.nativeEvent.isComposing) {
          return;
        }
        const now = event.timeStamp;
        const key = event.key.toLocaleLowerCase();
        const prefix = now - search.current.time < 600 ? search.current.text : '';
        const query = prefix === key ? key : prefix + key;
        search.current = { text: query, time: now };
        const ordered = [...visible.slice(index + 1), ...visible.slice(0, index + 1)];
        focus(ordered.find((candidate) => candidate.label.toLocaleLowerCase().startsWith(query)));
      }
    }
    event.preventDefault();
    event.stopPropagation();
  }

  function rows(nodes: readonly NavigationItem[], parent?: NavigationItem): ReactElement[] {
    return nodes.map((item) => {
      const open = expanded.has(item.value);
      return (
        <TreeRow
          key={item.value}
          item={item}
          open={open}
          branch={open && item.children ? rows(item.children, item) : null}
          ref={(element) => {
            if (element) {
              elements.current.set(item.value, element);
            } else {
              elements.current.delete(item.value);
            }
          }}
          tabIndex={item.value === stop ? 0 : -1}
          aria-selected={item.value === selected}
          onKeyDown={(event) => keyDown(event, item, parent)}
          onFocus={() => setFocused(item.value)}
          onClick={() => {
            focus(item);
            select(item);
          }}
          onToggle={() => {
            focus(item);
            if (!item.disabled) {
              toggle(item.value);
            }
          }}
        />
      );
    });
  }

  return (
    <div className="app-shell-navigation app-shell-tree">
      <div className="app-shell-nav-section-label">
        <span>{label}</span>
        {actions}
      </div>
      {items.length ? (
        <div className="app-shell-nav-list" role="tree" aria-label={label}>
          {rows(items)}
        </div>
      ) : (
        <p className="app-shell-nav-empty">No documents yet</p>
      )}
    </div>
  );
}
