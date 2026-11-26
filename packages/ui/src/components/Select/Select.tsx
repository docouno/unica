import { useId, useMemo, useRef, useState } from 'react';
import type { JSX, KeyboardEvent, ReactElement, ReactNode } from 'react';
import { composeEventHandlers } from '../../core/composeEventHandlers.js';
import { cx, dataFlag } from '../../core/cx.js';
import { warnOnce } from '../../core/devWarning.js';
import { getDeepActiveElement, getDocumentBody, isElementNode } from '../../core/dom.js';
import { useNativeComposition } from '../../core/forms/useNativeComposition.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { focusElement } from '../../core/overlay/dom.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import {
  CaretGlyph,
  FieldDangerGlyph,
  FieldInfoGlyph,
  FieldSuccessGlyph,
  FieldWarningGlyph,
  LockGlyph,
  SearchGlyph,
} from '../../internal/glyphs/index.js';
import { Button } from '../Button/index.js';
import { Icon } from '../Icon/index.js';
import { Input } from '../Input/index.js';
import { createCatalog, filterEntries, visitParts } from '../Listbox/collection.js';
import type { Row } from '../Listbox/collection.js';
import { PickerRows } from '../Listbox/PickerRows.js';
import { usePickerNavigation } from '../Listbox/usePickerNavigation.js';
import { omitSelectionProps, usePickerSelection } from '../Listbox/usePickerSelection.js';
import { focusContent } from '../Popover/interaction.js';
import { Spinner } from '../Progress/index.js';
import { SelectionSummary } from './SelectionSummary.js';
import { SelectContent, SelectGroup, SelectOption, SelectTrigger } from './SelectParts.js';
import type { SelectContentProps, SelectProps, SelectTriggerProps } from './types.js';
import { useSelectPopover } from './useSelectPopover.js';
import './select.css';

const statusGlyphs = {
  info: FieldInfoGlyph,
  success: FieldSuccessGlyph,
  warning: FieldWarningGlyph,
  danger: FieldDangerGlyph,
};

function readParts(children: ReactNode): {
  readonly trigger?: SelectTriggerProps;
  readonly content?: SelectContentProps;
} {
  let trigger: SelectTriggerProps | undefined;
  let content: SelectContentProps | undefined;
  visitParts(children, (child: ReactElement) => {
    if (child.type === SelectTrigger && !trigger && !content) {
      trigger = child.props as SelectTriggerProps;
    } else if (child.type === SelectContent && !content) {
      content = child.props as SelectContentProps;
    } else {
      warnOnce('select-parts', 'Select accepts one SelectTrigger followed by one SelectContent.');
    }
  });
  if (Boolean(trigger) !== Boolean(content)) {
    warnOnce('select-parts', 'Select accepts one SelectTrigger followed by one SelectContent.');
  }
  return { ...(trigger && { trigger }), ...(content && { content }) };
}

function combineTrigger(root: SelectTriggerProps, part: SelectTriggerProps): SelectTriggerProps {
  const result = { ...part, ...root };
  for (const [key, next] of Object.entries(part)) {
    const first: unknown = Reflect.get(root, key);
    if (/^on[A-Z]/u.test(key) && typeof next === 'function' && typeof first === 'function') {
      Reflect.set(
        result,
        key,
        composeEventHandlers(first as (event: unknown) => void, next as (event: unknown) => void),
      );
    }
  }
  if (root['aria-labelledby']?.trim() || root['aria-label']?.trim()) {
    return {
      ...result,
      'aria-label': root['aria-label'],
      'aria-labelledby': root['aria-labelledby'],
    };
  }
  return result;
}

/** A compact single- or multiple-choice field with an anchored, native popover. */
export function Select(props: SelectProps): JSX.Element {
  const {
    children,
    options,
    className,
    style,
    hidden,
    inert,
    dir,
    ref,
    open,
    defaultOpen,
    onOpenChange,
    disabled,
    readOnly,
    required,
    size = 'm',
    variant = 'default',
    status = 'neutral',
    width = 'full',
    iconLeft,
    placeholder,
    searchable,
    clearable,
    loading,
    emptyState,
    errorState,
    ...attributes
  } = props;
  const native = omitSelectionProps(attributes);
  const id = useId();
  const parts = useMemo(() => readParts(children), [children]);
  const { ref: triggerPartRef, ...triggerPart } = parts.trigger ?? {};
  const {
    children: optionsChildren,
    ref: panelPartRef,
    className: panelClassName,
    onFocusCapture: onPanelFocusCapture,
    'aria-label': panelLabel,
    'aria-labelledby': panelLabelledBy,
    ...panelProps
  } = parts.content ?? {};
  const triggerProps = combineTrigger(native, triggerPart);
  const {
    id: triggerId = id,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    onKeyDown,
    onPointerDown,
    onClick,
    title,
    className: triggerClassName,
    ...buttonProps
  } = triggerProps;
  const fieldName =
    labelledBy?.trim() || label?.trim()
      ? { 'aria-labelledby': labelledBy, 'aria-label': label }
      : { 'aria-labelledby': triggerId };
  const panelName =
    panelLabelledBy?.trim() || panelLabel?.trim()
      ? { 'aria-labelledby': panelLabelledBy, 'aria-label': panelLabel }
      : fieldName;
  const panelId = `${id}-panel`;
  const listId = `${id}-list`;
  const feedbackId = `${id}-feedback`;
  const trigger = useRef<HTMLButtonElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const list = useRef<HTMLDivElement | null>(null);
  const search = useRef<HTMLInputElement | null>(null);
  const recovery = useRef<HTMLDivElement | null>(null);
  const pointer = useRef('');
  const lastPanelFocus = useRef<Element | null>(null);
  const triggerRef = useMemo(() => mergeRefs(trigger, ref, triggerPartRef), [ref, triggerPartRef]);
  const panelRef = useMemo(() => mergeRefs(panel, panelPartRef), [panelPartRef]);
  const composition = useNativeComposition(search);
  const [searchDraft, setQuery] = useState('');
  const query = searchable ? searchDraft : '';
  const [listFocus, setListFocus] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);
  const [dialogHeld, setDialogHeld] = useState(false);
  const catalog = useMemo(
    () => createCatalog(options, optionsChildren, SelectOption, SelectGroup),
    [options, optionsChildren],
  );
  const hasError = errorState !== null && errorState !== undefined && errorState !== false;
  const selection = usePickerSelection({
    props,
    catalog,
    getFocusTarget: () => trigger.current,
    busy: loading,
    failed: hasError && !loading,
    onReset: () => {
      setQuery('');
      navigation.enter();
      popover.close();
    },
  });
  const unavailable = Boolean(selection.disabled || hidden || inert);
  const busy = Boolean(loading && !unavailable);
  const failed = hasError && !busy && !unavailable;
  const pending = busy && catalog.byValue.size === 0;
  const hasList = !pending && !failed;
  const hasSearch = Boolean(searchable && !pending);
  const needsDialog = Boolean(
    searchable || selection.multiple || clearable || readOnly || pending || failed,
  );
  const dialogMode = needsDialog || dialogHeld;

  function focusPanel(input: 'direct' | 'touch'): void {
    const node = panel.current;
    if (!node) {
      return;
    }
    if (failed && recovery.current) {
      focusContent(recovery.current);
      return;
    }
    const target =
      (input === 'direct' && search.current && !search.current.disabled
        ? search.current
        : list.current) ?? node;
    focusElement(target, node.ownerDocument);
  }
  const popover = useSelectPopover({
    trigger,
    panel,
    open,
    defaultOpen,
    onOpenChange,
    disabled: unavailable,
    onClose: () => {
      setQuery('');
      setDialogHeld(false);
      setListFocus(false);
      setSearchFocus(false);
      composition.cancel();
      lastPanelFocus.current = null;
    },
    onFocusContent: (input) => {
      navigation.enter();
      if (needsDialog) {
        setDialogHeld(true);
      }
      focusPanel(input);
    },
  });
  if (popover.open && needsDialog && !dialogHeld) {
    setDialogHeld(true);
  }

  useIsoLayoutEffect(() => {
    const node = panel.current;
    if (!popover.open || !node) {
      return;
    }
    const active = getDeepActiveElement(node.ownerDocument);
    const removed = lastPanelFocus.current && !lastPanelFocus.current.isConnected;
    const lostWithChild =
      removed && (active === null || active === getDocumentBody(node.ownerDocument));
    if (pending) {
      if (lostWithChild) {
        focusElement(node, node.ownerDocument);
      }
    } else if (
      active === node ||
      lostWithChild ||
      (active === search.current && failed) ||
      (active === recovery.current && !failed)
    ) {
      focusPanel(popover.modality.current);
    }
  }, [popover.open, pending, failed, hasSearch]);

  const entries = filterEntries(selection.entries, query);
  const navigation = usePickerNavigation({
    list,
    entries,
    selected: selection.selected,
    enabled: popover.open && hasList && !unavailable,
    focused: listFocus || searchFocus,
    typeahead: !searchFocus,
    editing: searchFocus,
    onChoose: choose,
  });
  function choose(row: Row, host: HTMLElement): void {
    if (selection.choose(row, host) && !selection.multiple) {
      popover.close();
    }
  }

  function handleSearchKey(event: KeyboardEvent<HTMLInputElement>): void {
    if (composition.isActive() || event.nativeEvent.isComposing || event.keyCode === 229) {
      // Safari can report the Enter that finishes composition with isComposing=false.
      if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
        event.preventDefault();
      }
      return;
    }
    navigation.onKeyDown(event);
  }

  const selected = selection.labels.length > 0;
  const messages = selection.messages;
  const currentStatus = unavailable ? 'neutral' : status;
  const StatusGlyph = currentStatus === 'neutral' ? null : statusGlyphs[currentStatus];
  const triggerPlaceholder = busy ? messages.loading : (placeholder ?? messages.placeholder);
  const displayClear = !readOnly && (selection.multiple || (clearable && selected));
  const displayMeta = readOnly || selection.multiple || (clearable && selected);
  const hasOptions = entries.some((entry) => !('options' in entry) || entry.options.length > 0);
  const feedback = [
    selected ? messages.selectionAnnouncement(selection.labels) : undefined,
    readOnly ? messages.readOnly : undefined,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <div
      className={cx('unica-select', className)}
      style={style}
      dir={dir}
      hidden={hidden}
      inert={inert}
      data-unica-select-width={width}
    >
      <button
        {...buttonProps}
        id={triggerId}
        ref={triggerRef}
        role={undefined}
        dangerouslySetInnerHTML={undefined}
        popoverTarget={undefined}
        popoverTargetAction={undefined}
        onChange={undefined}
        onChangeCapture={undefined}
        aria-disabled={undefined}
        type="button"
        disabled={disabled}
        tabIndex={undefined}
        aria-label={label}
        aria-labelledby={labelledBy}
        aria-describedby={
          [describedBy, feedback ? feedbackId : undefined].filter(Boolean).join(' ') || undefined
        }
        aria-haspopup={dialogMode ? 'dialog' : 'listbox'}
        aria-expanded={popover.open}
        aria-controls={popover.open ? (dialogMode ? panelId : listId) : undefined}
        aria-invalid={currentStatus === 'danger' || undefined}
        aria-busy={busy || undefined}
        className={cx('unica-select-trigger', triggerClassName)}
        title={title ?? (selected ? selection.labels.join(', ') : undefined)}
        data-unica-select-size={size}
        data-unica-select-variant={variant}
        data-unica-select-status={currentStatus}
        data-unica-select-open={dataFlag(popover.open)}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (event.defaultPrevented) {
            return;
          }
          pointer.current = event.pointerType;
          popover.beginPointer();
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) {
            return;
          }
          pointer.current = '';
          if (
            !selection.isUnavailable(event.currentTarget) &&
            !event.nativeEvent.isComposing &&
            !event.altKey &&
            !event.ctrlKey &&
            !event.metaKey &&
            (event.key === 'ArrowUp' || event.key === 'ArrowDown')
          ) {
            event.preventDefault();
            popover.openFromKeyboard();
          }
        }}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) {
            return;
          }
          event.preventDefault();
          if (event.button === 0 && !selection.isUnavailable(event.currentTarget)) {
            const nativeEvent = event.nativeEvent;
            const pointerType =
              ('pointerType' in nativeEvent && nativeEvent.pointerType) || pointer.current;
            popover.toggle(
              event.detail > 0 && pointerType === 'touch' ? 'touch' : 'direct',
              event.detail > 0,
            );
          }
        }}
      >
        {iconLeft && <Icon usage="slot" icon={iconLeft} size={size} color="secondary" />}
        <SelectionSummary labels={selection.labels} placeholder={triggerPlaceholder} />
        {StatusGlyph && <StatusGlyph className="unica-select-status" />}
        {readOnly && <LockGlyph className="unica-select-chrome" />}
        {busy ? (
          <Spinner size={size} tone="muted" className="unica-select-chrome" />
        ) : (
          <CaretGlyph className="unica-select-chrome" direction="down" />
        )}
      </button>
      {feedback && (
        <span id={feedbackId} className="unica-visually-hidden">
          {feedback}
        </span>
      )}
      <div
        {...panelProps}
        ref={panelRef}
        id={panelId}
        className={cx('unica-overlay-surface', 'unica-select-content', panelClassName)}
        dangerouslySetInnerHTML={undefined}
        role={dialogMode ? 'dialog' : 'presentation'}
        popover="auto"
        tabIndex={-1}
        data-surface="overlay"
        aria-modal={undefined}
        {...(dialogMode ? panelName : undefined)}
        onFocusCapture={(event) => {
          if (isElementNode(event.target)) {
            lastPanelFocus.current = event.target;
          }
          onPanelFocusCapture?.(event);
        }}
      >
        {!pending && (hasSearch || displayMeta) && (
          <div className="unica-select-header">
            {displayMeta && (
              <div className="unica-select-meta">
                <span dir="auto">
                  {readOnly
                    ? messages.readOnly
                    : selection.multiple
                      ? messages.selectedCount(selection.selected.size)
                      : messages.selectedValue}
                </span>
                {displayClear && (
                  <Button
                    className="unica-select-clear"
                    variant="ghost"
                    tone="neutral"
                    size="s"
                    disabled={!selected || busy || failed || unavailable}
                    data-unica-select-empty={dataFlag(!selected)}
                    onClick={(event) => {
                      if (selection.clear(event.currentTarget)) {
                        if (selection.multiple) {
                          focusPanel(searchFocus ? 'direct' : popover.modality.current);
                        } else {
                          popover.close();
                        }
                      }
                    }}
                  >
                    {messages.clearSelection}
                  </Button>
                )}
              </div>
            )}
            {hasSearch && (
              <Input
                ref={search}
                size={size}
                dir="auto"
                placeholder={messages.searchLabel}
                aria-label={messages.searchLabel}
                aria-controls={hasList ? listId : undefined}
                aria-activedescendant={searchFocus ? navigation.activeId : undefined}
                iconLeft={SearchGlyph}
                disabled={failed || unavailable}
                clearable
                clearLabel={messages.clearSearch}
                value={query}
                onChange={(event) => setQuery(event.currentTarget.value)}
                onCompositionStart={(event) => composition.start(event.currentTarget)}
                onCompositionEnd={(event) => composition.finish(event.currentTarget, () => {})}
                onKeyDown={handleSearchKey}
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setSearchFocus(false)}
              />
            )}
          </div>
        )}
        {busy && (
          <div
            className="unica-select-loading"
            role="status"
            data-unica-select-initial={dataFlag(pending)}
          >
            <Spinner size={size} tone="muted" />
            <span dir="auto">{pending ? messages.loading : messages.updating}</span>
          </div>
        )}
        {failed && (
          <div
            className="unica-select-recovery unica-scrollbar unica-scrollbar--compact"
            ref={recovery}
            tabIndex={-1}
          >
            {errorState}
          </div>
        )}
        {hasList && (
          <>
            <div
              {...fieldName}
              aria-busy={busy || undefined}
              aria-readonly={Boolean(readOnly || busy) || undefined}
              aria-required={!readOnly && required ? true : undefined}
              aria-multiselectable={selection.multiple || undefined}
              aria-activedescendant={listFocus ? navigation.activeId : undefined}
              ref={list}
              id={listId}
              tabIndex={hasSearch ? -1 : 0}
              role="listbox"
              className="unica-listbox unica-scrollbar unica-scrollbar--compact unica-select-list"
              data-unica-listbox-external-focus={dataFlag(searchFocus)}
              data-unica-listbox-empty-active={dataFlag(!navigation.activeId)}
              onFocus={() => setListFocus(true)}
              onBlur={() => setListFocus(false)}
              onKeyDown={navigation.onKeyDown}
            >
              <PickerRows
                entries={entries}
                selection={selection}
                navigation={navigation}
                size={size}
                keepFocus={searchFocus}
                onChoose={(row, host) => {
                  if (!searchFocus && list.current) {
                    focusElement(list.current, list.current.ownerDocument);
                  }
                  navigation.activate(row.value);
                  choose(row, host);
                }}
              />
            </div>
            {!hasOptions && (
              <div className="unica-listbox-empty" role="status">
                {query.trim() ? (
                  <span className="unica-select-empty-copy" dir="auto">
                    <strong>{messages.noMatches(query)}</strong>
                    <span>{messages.noMatchesHint}</span>
                  </span>
                ) : (
                  (emptyState ?? messages.empty)
                )}
              </div>
            )}
          </>
        )}
        {selection.multiple && (
          <span className="unica-visually-hidden" aria-live="polite" aria-atomic="true">
            {popover.open && messages.selectionAnnouncement(selection.labels)}
          </span>
        )}
      </div>
      {selection.carrier}
    </div>
  );
}
