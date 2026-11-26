import { useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { useRovingFocus } from '../../core/collections/useRovingFocus.js';
import type { CollectionItem } from '../../core/collections/navigation.js';
import { cx } from '../../core/cx.js';
import { warnOnce } from '../../core/devWarning.js';
import { matchesSafe } from '../../core/dom.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { focusElement } from '../../core/overlay/dom.js';
import { nonBlank } from '../../core/passiveRoot.js';
import { useControllableState } from '../../core/useControllableState.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { VisuallyHidden } from '../Layout/index.js';
import { isModifiedTagKey, TagView } from './Tag.js';
import { getTagText, tagRootAttributes } from './attributes.js';
import type { TagGroupItem, TagGroupMessages, TagGroupProps } from './types.js';
import { useTagFieldset } from './useTagFieldset.js';
import './tag.css';

interface AssignedItem {
  readonly key: string;
  readonly text: string;
  readonly item: TagGroupItem;
}

const disclosureKey = 'disclosure';

const defaults: TagGroupMessages = {
  empty: 'No labels',
  more: (count) => `+${count} more`,
  less: 'Show less',
  moreLabel: (count) => `+${count} more ${count === 1 ? 'value' : 'values'}`,
  lessLabel: 'Show less',
  removed: (labels) => `${labels.join(', ')} removed.`,
};

function disclosureCopy(
  expanded: boolean,
  hiddenCount: number,
  messages: Partial<TagGroupMessages> | undefined,
): { text: string; name: string } {
  if (expanded) {
    const customText = nonBlank(messages?.less);
    return {
      text: customText ?? defaults.less,
      name: nonBlank(messages?.lessLabel) ?? customText ?? defaults.lessLabel,
    };
  }
  const customText = nonBlank(messages?.more?.(hiddenCount));
  return {
    text: customText ?? defaults.more(hiddenCount),
    name:
      nonBlank(messages?.moreLabel?.(hiddenCount)) ?? customText ?? defaults.moreLabel(hiddenCount),
  };
}

function normalizeItems(items: readonly TagGroupItem[]): ReadonlyMap<string, AssignedItem> {
  const normalized = new Map<string, AssignedItem>();
  for (const item of items) {
    const text = getTagText(item.label, item.textValue);
    if (!nonBlank(item.id) || !nonBlank(item.removeLabel) || text === undefined) {
      warnOnce('tag-group-item', 'TagGroup items require a nonempty id, value, and removeLabel.');
      continue;
    }
    const key = `tag:${item.id}`;
    if (normalized.has(key)) {
      warnOnce('tag-group-duplicate', 'TagGroup item ids must be unique.');
      continue;
    }
    normalized.set(key, { key, text, item });
  }
  return normalized;
}

function recoveryKey(
  missing: string,
  previousVisible: readonly CollectionItem[],
  previousItems: ReadonlyMap<string, AssignedItem>,
  items: ReadonlyMap<string, AssignedItem>,
  visible: readonly AssignedItem[],
  navigation: readonly CollectionItem[],
): string | null {
  const available = new Set(navigation.filter(({ navigable }) => navigable).map(({ key }) => key));
  const disclosure = available.has(disclosureKey) ? disclosureKey : null;
  const visibleKeys = visible.map(({ key }) => key);
  if (missing === disclosureKey) {
    return visibleKeys.findLast((key) => available.has(key)) ?? null;
  }
  if (items.has(missing) && !visibleKeys.includes(missing) && disclosure) {
    return disclosure;
  }

  const oldKeys = [...previousItems.keys()];
  const position = oldKeys.indexOf(missing);
  const next = oldKeys.slice(position + 1).find((key) => available.has(key));
  if (next) {
    return next;
  }

  const oldVisible = previousVisible
    .filter(({ key }) => key !== disclosureKey)
    .map(({ key }) => key);
  const before = oldVisible.slice(0, Math.max(0, oldVisible.indexOf(missing)));
  const slot = before.filter((key) => visibleKeys.includes(key)).length;
  const oldVisibleSet = new Set(oldVisible);
  const newNext = visibleKeys
    .slice(slot)
    .find((key) => !oldVisibleSet.has(key) && available.has(key));
  const previous = oldKeys.slice(0, Math.max(0, position)).findLast((key) => available.has(key));
  return newNext ?? previous ?? visibleKeys.findLast((key) => available.has(key)) ?? disclosure;
}

/** Arrange assigned values in a wrapping toolbar with one keyboard entry point. */
export function TagGroup({
  items,
  onRemove,
  size = 'm',
  disabled = false,
  maxVisible,
  expanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  emptyFocusRef,
  messages,
  ref,
  className,
  onKeyDown,
  onFocus,
  onBlur,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  ...props
}: TagGroupProps): ReactElement {
  const root = useRef<HTMLDivElement>(null);
  const rootRef = useMemo(() => mergeRefs(root, ref), [ref]);
  const fieldsetDisabled = useTagFieldset(root, true);
  const assigned = useMemo(() => normalizeItems(items), [items]);
  const previous = useRef(assigned);
  const [entryKey, setEntryKey] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState({ text: '', turn: 0 });
  const [expanded, setExpanded] = useControllableState({
    value: expandedProp,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  });

  const count = assigned.size;
  const limit =
    maxVisible !== undefined && Number.isFinite(maxVisible)
      ? Math.max(1, Math.floor(maxVisible))
      : count;
  const hasDisclosure = count > limit;
  const isExpanded = hasDisclosure && expanded;
  const visible = [...assigned.values()].slice(0, isExpanded ? count : limit);
  const navigation: CollectionItem[] = visible.map(({ item, key, text }) => ({
    key,
    label: text,
    navigable: !disabled && !fieldsetDisabled && !item.disabled,
  }));
  const disclosure = hasDisclosure ? disclosureCopy(isExpanded, count - limit, messages) : null;
  if (disclosure) {
    navigation.push({ key: disclosureKey, label: '', navigable: !fieldsetDisabled });
  }

  const roving = useRovingFocus<HTMLButtonElement>({
    items: navigation,
    entryKey,
    orientation: 'horizontal',
    wrap: false,
    typeahead: false,
    resolveRecoveryKey: (missing, oldVisible) =>
      recoveryKey(missing, oldVisible, previous.current, assigned, visible, navigation),
    onRecoveryFallback: (doc, canRecover) => {
      const target = emptyFocusRef?.current;
      const recovered =
        target && !matchesSafe(target, '[aria-disabled="true"]') && focusElement(target, doc);
      if (!recovered && canRecover()) {
        focusElement(root.current, doc);
      }
    },
  });

  const removedMessage = messages?.removed ?? defaults.removed;
  useIsoLayoutEffect(() => {
    const old = previous.current;
    previous.current = assigned;
    if (old === assigned) {
      return;
    }
    const removed = [...old.values()]
      .filter(({ key }) => !assigned.has(key))
      .map(({ text }) => text);
    if (removed.length > 0) {
      const text = removedMessage(removed);
      setAnnouncement((current) => ({ text, turn: current.turn + 1 }));
    }
  }, [assigned, removedMessage]);

  const name = nonBlank(label);
  const nameIds = nonBlank(labelledBy);
  if (!name && !nameIds) {
    warnOnce('tag-group-name', 'TagGroup requires an aria-label or aria-labelledby.');
  }

  return (
    <div
      {...tagRootAttributes(props)}
      ref={rootRef}
      className={cx('unica-tag-group', className)}
      role="toolbar"
      aria-label={name}
      aria-labelledby={nameIds}
      tabIndex={-1}
      data-unica-tag-group-size={size}
      onFocus={(event) => {
        const key = roving.getItemKey(event.target);
        if (key !== null && !matchesSafe(event.target, ':disabled')) {
          setEntryKey(key);
        }
        onFocus?.(event);
      }}
      onBlur={(event) => {
        onBlur?.(event);
        roving.onBlur(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) {
          return;
        }
        const target = event.target as HTMLButtonElement;
        const key = roving.getItemKey(target);
        if (key === null || matchesSafe(target, ':disabled')) {
          return;
        }
        if (
          isModifiedTagKey(event) ||
          (event.repeat && (event.key === 'Enter' || event.key === ' '))
        ) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
          }
          return;
        }
        if (key !== disclosureKey && (event.key === 'Backspace' || event.key === 'Delete')) {
          event.preventDefault();
          if (!event.repeat) {
            target.click();
          }
          return;
        }
        roving.onKeyDown(event);
      }}
    >
      {visible.map(({ key, item, text }) => {
        const { id, label: children, status, iconLeft, removeIcon, removeLabel, loading } = item;
        const action = roving.getItemProps(key);
        return (
          <TagView
            key={key}
            onRemoveFocus={action.onFocus}
            props={{
              children,
              textValue: text,
              status,
              iconLeft,
              removeIcon,
              removeLabel,
              loading,
              disabled: disabled || item.disabled,
              onRemove: () => onRemove(id),
              removeRef: action.ref,
              removeTabIndex: action.tabIndex,
              size,
            }}
          />
        );
      })}
      {disclosure && (
        <button
          {...roving.getItemProps(disclosureKey)}
          type="button"
          className="unica-tag-disclosure"
          data-unica-tag-size={size}
          aria-expanded={isExpanded}
          aria-label={disclosure.name}
          onClick={(event) => {
            if (!event.defaultPrevented && !matchesSafe(event.currentTarget, ':disabled')) {
              setExpanded(!isExpanded);
            }
          }}
        >
          <bdi>{disclosure.text}</bdi>
        </button>
      )}
      {count === 0 && <span className="unica-tag-empty">{messages?.empty ?? defaults.empty}</span>}
      <VisuallyHidden role="status" aria-atomic="true">
        <span key={announcement.turn}>{announcement.text}</span>
      </VisuallyHidden>
    </div>
  );
}
