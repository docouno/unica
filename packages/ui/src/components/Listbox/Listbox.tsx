import { useMemo, useRef, useState } from 'react';
import type { JSX } from 'react';
import { composeEventHandlers } from '../../core/composeEventHandlers.js';
import { cx, dataFlag } from '../../core/cx.js';
import { warnOnce } from '../../core/devWarning.js';
import { guardActivation } from '../../core/guardActivation.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { focusElement } from '../../core/overlay/dom.js';
import { createCatalog } from './collection.js';
import { ListboxGroup, ListboxOption } from './ListboxParts.js';
import { PickerRows } from './PickerRows.js';
import type { ListboxProps } from './types.js';
import { usePickerNavigation } from './usePickerNavigation.js';
import { omitSelectionProps, usePickerSelection } from './usePickerSelection.js';

/** An always-visible, single or multiple choice list with native form participation. */
export function Listbox(props: ListboxProps): JSX.Element {
  const {
    options,
    children,
    size = 'm',
    readOnly,
    required,
    emptyState,
    className,
    ref,
    onFocus,
    onBlur,
    onKeyDown,
    ...attributes
  } = props;
  const native = omitSelectionProps(attributes);
  if (!native['aria-label']?.trim() && !native['aria-labelledby']?.trim()) {
    warnOnce('listbox-name', 'Listbox requires aria-label or aria-labelledby.');
  }
  const list = useRef<HTMLDivElement | null>(null);
  const mergedRef = useMemo(() => mergeRefs(list, ref), [ref]);
  const [focused, setFocused] = useState(false);
  const catalog = useMemo(
    () => createCatalog(options, children, ListboxOption, ListboxGroup),
    [options, children],
  );
  const selection = usePickerSelection({
    props,
    catalog,
    getFocusTarget: () => list.current,
    onReset: () => navigation.enter(),
  });
  const navigation = usePickerNavigation({
    list,
    entries: selection.entries,
    selected: selection.selected,
    enabled: !selection.disabled,
    focused,
    typeahead: true,
    onChoose: selection.choose,
  });
  const hasRows = catalog.byValue.size > 0 || selection.entries !== catalog.entries;

  return (
    <>
      <div
        {...native}
        {...guardActivation(native, selection.isUnavailable)}
        ref={mergedRef}
        dangerouslySetInnerHTML={undefined}
        role="listbox"
        tabIndex={selection.disabled ? -1 : 0}
        aria-disabled={selection.disabled || undefined}
        aria-readonly={readOnly || undefined}
        aria-required={!selection.disabled && !readOnly && required ? true : undefined}
        aria-multiselectable={selection.multiple || undefined}
        aria-activedescendant={focused ? navigation.activeId : undefined}
        data-unica-listbox-empty-active={dataFlag(!navigation.activeId)}
        className={cx('unica-listbox', 'unica-scrollbar', className)}
        onFocus={composeEventHandlers(onFocus, (event) => {
          if (
            event.target === event.currentTarget &&
            !selection.isUnavailable(event.currentTarget)
          ) {
            navigation.enter();
            setFocused(true);
          }
        })}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onKeyDown={composeEventHandlers(onKeyDown, (event) => {
          if (!selection.isUnavailable(event.currentTarget)) {
            navigation.onKeyDown(event);
          }
        })}
      >
        <PickerRows
          entries={selection.entries}
          selection={selection}
          navigation={navigation}
          size={size}
          onChoose={(row, host) => {
            if (list.current) {
              focusElement(list.current, list.current.ownerDocument);
            }
            navigation.activate(row.value);
            selection.choose(row, host);
          }}
        />
      </div>
      {!hasRows && !native.hidden && (
        <div className="unica-listbox-empty" role="status">
          {emptyState ?? selection.messages.empty}
        </div>
      )}
      <span className="unica-visually-hidden" aria-live="polite" aria-atomic="true">
        {focused && selection.messages.selectionAnnouncement(selection.labels)}
      </span>
      {selection.carrier}
    </>
  );
}
