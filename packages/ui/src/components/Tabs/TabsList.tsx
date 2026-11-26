import { useMemo, useRef } from 'react';
import type { JSX, RefCallback } from 'react';
import { useRovingFocus } from '../../core/collections/useRovingFocus.js';
import { composeEventHandlers } from '../../core/composeEventHandlers.js';
import { cx, dataFlag } from '../../core/cx.js';
import { warnOnce } from '../../core/devWarning.js';
import { getComputedStyleSafe, getDefaultView, matchesSafe } from '../../core/dom.js';
import { observeFocusTransfer } from '../../core/focus-transfer.js';
import { observeControlPath } from '../../core/forms/observeControlPath.js';
import { defineGlyph } from '../../core/glyph.js';
import type { GlyphSvgProps } from '../../core/glyph.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { nonBlank } from '../../core/passiveRoot.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { CaretGlyph } from '../../internal/glyphs/index.js';
import { IconButton } from '../Button/index.js';
import { getEntryItem } from './collection.js';
import type { TabItem } from './collection.js';
import { tabAttributes, tabFocusOptions, TabsListContext, useTabs } from './context.js';
import { distributionStyle, useTabsLayout } from './layout.js';
import type { TabsListProps } from './types.js';

const leftCaret = /* @__PURE__ */ defineGlyph(({ className }: GlyphSvgProps): JSX.Element => (
  <CaretGlyph className={className} direction="left" />
));
const rightCaret = /* @__PURE__ */ defineGlyph(({ className }: GlyphSvgProps): JSX.Element => (
  <CaretGlyph className={className} direction="right" />
));
const emptyItems: readonly TabItem[] = [];
const listReserved = /* @__PURE__ */ new Set([
  'aria-orientation',
  'dangerouslysetinnerhtml',
  'role',
  'tabindex',
]);
const layoutAttributes = ['dir', 'class', 'style'] as const;

/** Names the tablist and provides roving focus and local horizontal scrolling. */
export function TabsList({
  distribution,
  messages,
  children,
  className,
  style,
  dir,
  ref,
  onBlur,
  onFocus,
  onKeyDown,
  onScroll,
  onTouchMove,
  onWheel,
  hidden,
  inert,
  'aria-hidden': ariaHidden,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...props
}: TabsListProps): JSX.Element {
  const tabs = useTabs();
  const { attachList, publish } = tabs.collection;
  const { items: committedItems, selected, size, orientation, activationMode, select } = tabs;
  const items = committedItems ?? emptyItems;
  const horizontal = orientation === 'horizontal';
  const viewport = useRef<HTMLDivElement>(null);
  const listRef = useMemo(() => {
    const register: RefCallback<HTMLDivElement> = (node) => {
      if (node) {
        return attachList(node);
      }
    };
    return mergeRefs(viewport, register, ref);
  }, [attachList, ref]);
  const { start, end, rtl, hints, sync, update, reveal, markBrowsing, browse } = useTabsLayout(
    viewport,
    committedItems,
    selected,
    orientation,
    distribution,
  );
  const entry = getEntryItem(items, selected)?.key ?? null;
  const roving = useRovingFocus<HTMLButtonElement>({
    items,
    entryKey: entry,
    recoveryKey: entry,
    orientation,
    wrap: true,
    homeEnd: true,
    typeahead: false,
    focusOptions: tabFocusOptions,
    itemsFromDOM: true,
    readItems: () => {
      publish();
      return tabs.collection.read()?.items ?? emptyItems;
    },
    onNavigate: (key) => {
      const target = tabs.collection.read()?.items.find((item) => item.key === key)?.node;
      if (target) {
        reveal(target);
        if (activationMode === 'automatic') {
          select(key, target);
        }
      }
    },
  });
  const { captureFocusTransfer } = roving;

  useIsoLayoutEffect(() => {
    const list = viewport.current;
    if (list) {
      return observeFocusTransfer(list, captureFocusTransfer);
    }
  }, [captureFocusTransfer]);

  useIsoLayoutEffect(() => {
    const list = viewport.current;
    const view = list && getDefaultView(list.ownerDocument);
    if (!list || !view) {
      return;
    }
    const observe = (): void => {
      publish();
      sync();
    };
    // The path also catches disabled fieldsets and first-legend changes outside the list.
    const readingArea = (): string => {
      const css = getComputedStyleSafe(list);
      return `${css?.direction ?? ''}:${css?.scrollPaddingInlineStart ?? ''}`;
    };
    let previousArea = readingArea();
    let observing = false;
    const stopPath = observeControlPath(
      list,
      () => {
        if (!observing) {
          return;
        }
        publish();
        const nextArea = readingArea();
        // Installing or removing our own arrows changes the frame's children,
        // but only inherited geometry changes should interrupt a browse.
        if (nextArea !== previousArea) {
          previousArea = nextArea;
          sync();
        }
      },
      layoutAttributes,
    );
    observing = true;
    const content = new view.MutationObserver(observe);
    content.observe(list, {
      attributes: true,
      attributeFilter: ['disabled', 'dir'],
      childList: true,
      characterData: true,
      subtree: true,
    });
    return () => {
      stopPath();
      content.disconnect();
    };
  }, [publish, sync]);

  const label = nonBlank(ariaLabel);
  const labelledBy = nonBlank(ariaLabelledBy);
  if (!label && !labelledBy) {
    warnOnce('TabsList.name', 'TabsList requires aria-label or aria-labelledby.');
  }
  const context = useMemo(
    () => ({ collection: tabs.collection, getItemProps: roving.getItemProps, hints, reveal }),
    [tabs.collection, roving.getItemProps, hints, reveal],
  );

  return (
    <div
      className={cx('unica-tabs-frame', className)}
      style={hidden ? { ...style, display: 'none' } : style}
      dir={dir}
      hidden={hidden}
      inert={inert}
      aria-hidden={ariaHidden}
      data-unica-tabs-size={size}
      data-unica-tabs-orientation={orientation}
      data-unica-tabs-scroll-start={dataFlag(horizontal && start)}
      data-unica-tabs-scroll-end={dataFlag(horizontal && end)}
      data-unica-tabs-scroll-rtl={dataFlag(rtl)}
    >
      <div
        {...tabAttributes(props, listReserved)}
        ref={listRef}
        className="unica-tabs-list"
        hidden={hidden}
        inert={inert}
        role="tablist"
        aria-hidden={ariaHidden}
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-orientation={orientation}
        tabIndex={-1}
        onBlur={composeEventHandlers(onBlur, (event) => {
          roving.onBlur(event);
          update();
        })}
        onFocus={composeEventHandlers(onFocus, (event) => {
          const key = roving.getItemKey(event.target);
          const item = key === null ? undefined : items.find((candidate) => candidate.key === key);
          if (item && matchesSafe(item.node, ':focus')) {
            reveal(item.node);
          }
        })}
        onKeyDown={composeEventHandlers(onKeyDown, (event) => {
          const key = roving.getItemKey(event.target);
          if (key === null) {
            return;
          }
          roving.onKeyDown(event);
          const origin = items.find((item) => item.key === key);
          if (event.defaultPrevented && origin && matchesSafe(origin.node, ':focus')) {
            // Home or End on the current tab still interrupts an in-flight scroll.
            reveal(origin.node);
          }
        })}
        onScroll={composeEventHandlers(onScroll, update)}
        onTouchMove={composeEventHandlers(onTouchMove, markBrowsing)}
        onWheel={composeEventHandlers(onWheel, (event) => {
          if (event.deltaX !== 0 || (event.shiftKey && event.deltaY !== 0)) {
            markBrowsing();
          }
        })}
      >
        <div className="unica-tabs-strip" style={distributionStyle(distribution)}>
          <TabsListContext value={context}>{children}</TabsListContext>
        </div>
      </div>
      {horizontal &&
        !hidden &&
        (start || end) &&
        (['start', 'end'] as const).map((edge) => (
          <IconButton
            key={edge}
            className="unica-tabs-scroll-arrow"
            data-unica-tabs-edge={edge}
            icon={(edge === 'start') !== rtl ? leftCaret : rightCaret}
            aria-label={
              edge === 'start'
                ? (nonBlank(messages?.scrollBack) ?? 'Scroll tabs back')
                : (nonBlank(messages?.scrollForward) ?? 'Scroll tabs forward')
            }
            hidden={edge === 'start' ? !start : !end}
            size={size}
            variant="ghost"
            tone="neutral"
            type="button"
            tabIndex={-1}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => browse(edge)}
          />
        ))}
    </div>
  );
}
