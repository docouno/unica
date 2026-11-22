import { useEffect, useId, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { Icon, Tooltip, defineGlyph } from '@docouno/unica';
import { PushPinIcon } from '@phosphor-icons/react/ssr';
import {
  CaretDownGlyph,
  CheckGlyph,
  CloseGlyph,
  FileTextGlyph,
  PlusGlyph,
} from '../control-glyphs.js';
import { IconButton } from '@docouno/unica';
import { PopoverContent } from '../popover/popover.proto.js';
import { useShellPopoverPosition } from './app-shell-position.js';
import { useClippedLabel } from '../use-clipped-label.js';

const PinGlyph = defineGlyph(PushPinIcon, 'phosphor');

export interface DocumentTab {
  readonly value: string;
  readonly label: string;
  readonly href?: string;
  readonly dirty?: boolean;
  readonly pinned?: boolean;
}

export interface DocumentTabsProps {
  readonly items: readonly DocumentTab[];
  readonly value?: string;
  readonly focusValue?: string | undefined;
  readonly onValueChange?: (value: string) => void;
  readonly onClose?: ((value: string) => void) | undefined;
  readonly onAdd?: (() => void) | undefined;
}

function DocumentTabTrigger({
  item,
  current,
  onSelect,
  onClose,
}: {
  readonly item: DocumentTab;
  readonly current: 'page' | undefined;
  readonly onSelect: ((value: string) => void) | undefined;
  readonly onClose: (() => void) | undefined;
}): ReactElement {
  const [label, clipped] = useClippedLabel<HTMLSpanElement>(item.label);
  const name = [item.label, item.pinned && 'Pinned', item.dirty && 'Unsaved changes']
    .filter(Boolean)
    .join(', ');
  const attributes = {
    className: 'app-shell-document-tab',
    'aria-label': name,
    'aria-current': current,
  };
  const contents = (
    <>
      <Icon usage="slot" icon={item.pinned ? PinGlyph : FileTextGlyph} />
      <span className="app-shell-document-label" dir="auto" ref={label}>
        {item.label}
      </span>
      {item.dirty && <span className="app-shell-dirty-dot" />}
    </>
  );

  return (
    <Tooltip label={item.label} side="bottom" disabled={!(item.pinned || clipped)}>
      {item.href ? (
        <a {...attributes} href={item.href}>
          {contents}
        </a>
      ) : (
        <button
          {...attributes}
          type="button"
          onClick={() => onSelect?.(item.value)}
          onKeyDown={(event) => {
            if (event.key === 'Delete' && onClose) {
              event.preventDefault();
              onClose();
            }
          }}
        >
          {contents}
        </button>
      )}
    </Tooltip>
  );
}

export function DocumentTabs({
  items,
  value,
  focusValue,
  onValueChange,
  onClose,
  onAdd,
}: DocumentTabsProps): ReactElement {
  const viewport = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const picker = useRef<HTMLDivElement>(null);
  const pickerTrigger = useRef<HTMLButtonElement>(null);
  const add = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<{ closed: string; next: string | undefined } | undefined>(undefined);
  const [overflow, setOverflow] = useState(false);
  const pickerId = useId();
  const ordered = [...items.filter((item) => item.pinned), ...items.filter((item) => !item.pinned)];
  useShellPopoverPosition(pickerTrigger, picker, 300, 'documents', overflow);

  useEffect(() => {
    const rail = viewport.current;
    const row = list.current;
    if (!rail || !row) {
      return;
    }
    function measure(): void {
      setOverflow(Boolean(rail && row && row.offsetWidth > rail.clientWidth + 1));
    }
    const observer = new ResizeObserver(measure);
    observer.observe(rail);
    observer.observe(row);
    measure();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const rail = viewport.current;
    if (!rail) {
      return;
    }
    const sections = [...rail.querySelectorAll<HTMLElement>('.app-shell-document-item')];
    const pending = pendingFocus.current;
    let visible = sections.find((item) => item.dataset.value === value);
    if (pending && !items.some((item) => item.value === pending.closed)) {
      const next = sections.find((item) => item.dataset.value === pending.next);
      (next?.querySelector<HTMLElement>('.app-shell-document-tab') ?? add.current)?.focus({
        preventScroll: true,
      });
      visible = next;
      pendingFocus.current = undefined;
    }
    if (visible) {
      const tab = visible.getBoundingClientRect();
      const fitted = rail.getBoundingClientRect();
      const delta =
        tab.left < fitted.left + 4
          ? tab.left - fitted.left - 4
          : tab.right > fitted.right - 4
            ? tab.right - fitted.right + 4
            : 0;
      if (delta) {
        rail.scrollLeft += delta;
      }
    }
  }, [items, value]);

  useEffect(() => {
    if (focusValue) {
      const target = [...(list.current?.children ?? [])].find(
        (child) => (child as HTMLElement).dataset.value === focusValue,
      );
      target?.querySelector<HTMLElement>('.app-shell-document-tab')?.focus();
    }
  }, [focusValue]);

  function close(item: DocumentTab, index: number): void {
    pendingFocus.current = {
      closed: item.value,
      next: ordered[index + 1]?.value ?? ordered[index - 1]?.value,
    };
    onClose?.(item.value);
  }

  return (
    <nav
      className="app-shell-document-tabs"
      aria-label="Open documents"
      data-overflow={overflow || undefined}
    >
      <div className="app-shell-document-scroll" ref={viewport} hidden={items.length === 0}>
        <ul className="app-shell-document-list" role="list" ref={list}>
          {ordered.map((item, index) => {
            const current = value === item.value ? 'page' : undefined;
            const canClose = onClose !== undefined && !item.pinned;
            return (
              <li
                key={item.value}
                className="app-shell-document-item"
                data-value={item.value}
                data-current={current}
                data-pinned={item.pinned || undefined}
              >
                <DocumentTabTrigger
                  item={item}
                  current={current}
                  onSelect={onValueChange}
                  onClose={canClose ? () => close(item, index) : undefined}
                />
                {canClose && (
                  <IconButton
                    size="s"
                    variant="ghost"
                    icon={CloseGlyph}
                    className="app-shell-document-close"
                    aria-label={`Close ${item.label}`}
                    onClick={() => close(item, index)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
      {overflow && (
        <IconButton
          size="s"
          variant="ghost"
          icon={CaretDownGlyph}
          className="app-shell-new-tab"
          aria-label="All open documents"
          ref={pickerTrigger}
          popoverTarget={pickerId}
        />
      )}
      {overflow && (
        <PopoverContent
          id={pickerId}
          ref={picker}
          size="s"
          popover="auto"
          role="region"
          aria-label="All open documents"
          className="app-shell-popover app-shell-document-popup"
          onToggle={(event) => {
            if (event.newState === 'open') {
              const surface = event.currentTarget;
              const active = surface.querySelector<HTMLElement>('[aria-current="page"]');
              (active ?? surface.querySelector<HTMLElement>('a, button'))?.focus();
            }
          }}
        >
          <ul
            className="app-shell-document-choices unica-scrollbar unica-scrollbar--compact"
            role="list"
          >
            {ordered.map((item) => {
              const current = value === item.value ? 'page' : undefined;
              const name = [item.label, item.pinned && 'Pinned', item.dirty && 'Unsaved changes']
                .filter(Boolean)
                .join(', ');
              const content = (
                <>
                  {item.pinned && <Icon usage="slot" icon={PinGlyph} />}
                  <span className="app-shell-nav-label" dir="auto">
                    {item.label}
                  </span>
                  {item.dirty && <span className="app-shell-dirty-dot" />}
                  {current && <Icon usage="slot" icon={CheckGlyph} />}
                </>
              );
              return (
                <li key={item.value}>
                  {item.href ? (
                    <a
                      className="app-shell-nav-row"
                      href={item.href}
                      aria-current={current}
                      aria-label={name}
                    >
                      {content}
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="app-shell-nav-row"
                      aria-current={current}
                      aria-label={name}
                      onClick={() => {
                        picker.current?.hidePopover();
                        const row = [...(list.current?.children ?? [])].find(
                          (child) => (child as HTMLElement).dataset.value === item.value,
                        );
                        row?.querySelector<HTMLElement>('.app-shell-document-tab')?.focus();
                        onValueChange?.(item.value);
                      }}
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      )}
      {onAdd && (
        <IconButton
          size="s"
          variant="ghost"
          icon={PlusGlyph}
          ref={add}
          className="app-shell-new-tab"
          aria-label="Open another document"
          onClick={onAdd}
        />
      )}
    </nav>
  );
}
