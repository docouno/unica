import { CaretLeftGlyph, CaretRightGlyph, CheckGlyph } from '../control-glyphs.js';
import { useId, useLayoutEffect, useRef } from 'react';
import type { ComponentPropsWithRef, ReactElement } from 'react';
import { menuRows } from './menu.entries.js';
import type { MenuEntry, MenuRow, MenuSize } from './menu.entries.js';
import { Icon, Kbd } from '@docouno/unica';
import './menu.css';

export function MenuSurface({
  size = 'm',
  className = '',
  children,
  ...props
}: ComponentPropsWithRef<'div'> & { readonly size?: MenuSize }): ReactElement {
  return (
    <div {...props} className={`menu-proto ${className}`} data-size={size} data-surface="overlay">
      {children}
    </div>
  );
}

interface MenuRowsProps {
  readonly items: readonly MenuEntry[];
  readonly activeBranch?: string | undefined;
  readonly branchControls?: string | undefined;
  readonly flipped?: boolean | undefined;
}

function MenuShortcut({ keys }: { readonly keys: string }): ReactElement {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const slot = ref.current;
    const cap = slot?.querySelector('kbd');
    const row = slot?.closest<HTMLElement>('.menu-item-proto');
    if (!slot || !cap || !row) {
      return;
    }
    const update = (): void => {
      const style = getComputedStyle(row);
      const available =
        row.clientWidth -
        Number.parseFloat(style.paddingLeft) -
        Number.parseFloat(style.paddingRight);
      slot.toggleAttribute('data-hidden', cap.offsetWidth > available + 0.5);
    };
    const observer = new ResizeObserver(update);
    observer.observe(row);
    observer.observe(cap);
    update();
    return () => observer.disconnect();
  }, [keys]);
  return (
    <span ref={ref} className="menu-shortcut-proto" aria-hidden="true">
      <Kbd>{keys}</Kbd>
    </span>
  );
}

function MenuRowView({
  item,
  activeBranch,
  branchControls,
  flipped,
  preview,
}: Omit<MenuRowsProps, 'items'> & {
  readonly item: MenuRow;
  readonly preview: boolean;
}): ReactElement {
  const id = useId();
  const choice = item.type === 'radio' || item.type === 'checkbox';
  const branch = item.type === 'branch';
  const shortcut = 'shortcut' in item ? item.shortcut : undefined;
  const expanded = branch && (item.id === activeBranch || item.preview === 'expanded');
  const attrs = {
    className: 'menu-item-proto',
    'data-option': item.id,
    'data-shortcut': shortcut ? true : undefined,
    'data-branch': branch || undefined,
    'data-open': expanded || undefined,
    'data-flipped': expanded && flipped ? true : undefined,
    'data-unavailable': item.disabled || undefined,
    'data-danger': 'tone' in item && item.tone === 'danger' ? true : undefined,
    'data-preview': preview ? item.preview : undefined,
  };
  const contents = (
    <>
      <span className="menu-mark-proto" aria-hidden="true">
        {choice &&
          item.checked &&
          (item.type === 'radio' ? (
            <span className="menu-radio-dot-proto" />
          ) : (
            <Icon usage="slot" icon={CheckGlyph} className="menu-glyph-proto" />
          ))}
      </span>
      <span className="menu-icon-slot-proto" aria-hidden="true">
        {item.icon && <Icon usage="slot" icon={item.icon} className="menu-glyph-proto" />}
      </span>
      <span className="menu-copy-proto">
        <span id={id} className="menu-label-proto">
          <bdi>{item.label}</bdi>
        </span>
        {item.description && (
          <span id={`${id}-description`} className="menu-description-proto">
            <bdi>{item.description}</bdi>
          </span>
        )}
      </span>
      {branch && (
        <Icon usage="slot" icon={CaretRightGlyph} className="menu-branch-proto" directional />
      )}
      {shortcut && <MenuShortcut keys={shortcut} />}
    </>
  );

  if (preview) {
    return <div {...attrs}>{contents}</div>;
  }

  const interactive = {
    ...attrs,
    role: choice ? (item.type === 'radio' ? 'menuitemradio' : 'menuitemcheckbox') : 'menuitem',
    tabIndex: -1,
    'aria-labelledby': id,
    'aria-describedby': item.description ? `${id}-description` : undefined,
    'aria-disabled': item.disabled || undefined,
    'aria-checked': choice ? item.checked : undefined,
    'aria-haspopup': branch ? ('menu' as const) : undefined,
    'aria-controls': expanded ? branchControls : undefined,
    'aria-expanded': branch ? expanded : undefined,
    'aria-keyshortcuts': 'keyShortcuts' in item ? item.keyShortcuts : undefined,
  };
  return item.type === 'link' && !item.disabled ? (
    <a {...interactive} href={item.href}>
      {contents}
    </a>
  ) : (
    <button {...interactive} type="button">
      {contents}
    </button>
  );
}

function MenuGroup({
  group,
  preview,
  ...props
}: Omit<MenuRowsProps, 'items'> & {
  readonly group: Extract<MenuEntry, { type: 'group' }>;
  readonly preview: boolean;
}): ReactElement {
  const labelId = useId();
  return (
    <div role={preview ? undefined : 'group'} aria-labelledby={preview ? undefined : labelId}>
      <div id={labelId} className="menu-group-label-proto">
        {group.label}
      </div>
      {group.items.map((item) => (
        <MenuRowView key={item.id} item={item} preview={preview} {...props} />
      ))}
    </div>
  );
}

export function MenuRows({
  items,
  activeBranch,
  branchControls,
  flipped,
  preview = false,
  className = '',
  ...props
}: MenuRowsProps & ComponentPropsWithRef<'div'> & { readonly preview?: boolean }): ReactElement {
  const rows = menuRows(items);
  return (
    <div
      {...props}
      className={`menu-rows-proto unica-scrollbar unica-scrollbar--compact ${className}`}
      data-marks={
        rows.some((item) => item.type === 'checkbox' || item.type === 'radio') || undefined
      }
      data-icons={rows.some((item) => item.icon) || undefined}
    >
      {items.map((item) => {
        if (item.type === 'separator') {
          return <hr key={item.id} className="menu-separator-proto" />;
        }
        if (item.type === 'group') {
          return (
            <MenuGroup
              key={item.id}
              group={item}
              preview={preview}
              activeBranch={activeBranch}
              branchControls={branchControls}
              flipped={flipped}
            />
          );
        }
        return (
          <MenuRowView
            key={item.id}
            item={item}
            preview={preview}
            activeBranch={activeBranch}
            branchControls={branchControls}
            flipped={flipped}
          />
        );
      })}
    </div>
  );
}

export function MenuPreview({
  label,
  items,
  size = 'm',
  className = '',
}: {
  readonly label: string;
  readonly items: readonly MenuEntry[];
  readonly size?: MenuSize;
  readonly className?: string;
}): ReactElement {
  return (
    <MenuSurface role="group" aria-label={label} size={size} className={className}>
      <MenuRows items={items} preview />
    </MenuSurface>
  );
}

export function MenuBack({
  onClick,
  name,
  title,
}: {
  readonly onClick?: () => void;
  readonly name: string;
  readonly title: string;
}): ReactElement {
  const content = (
    <>
      <Icon usage="slot" icon={CaretLeftGlyph} directional size="s" />
      <span>Back</span>
      <span className="menu-back-title-proto" aria-hidden="true">
        {title}
      </span>
    </>
  );
  return onClick ? (
    <button
      type="button"
      className="menu-back-proto"
      role="menuitem"
      data-option="back"
      tabIndex={-1}
      aria-label={name}
      onClick={onClick}
    >
      {content}
    </button>
  ) : (
    <div className="menu-back-proto">{content}</div>
  );
}
