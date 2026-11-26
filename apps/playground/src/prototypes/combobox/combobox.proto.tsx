import {
  BusyGlyph,
  CaretDownGlyph,
  LockGlyph,
  SearchGlyph,
  fieldStatusGlyphs,
} from '../control-glyphs.js';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactElement, ReactNode, RefObject } from 'react';
import { FormField, Icon, Input, Kbd, ListboxGroup, ListboxOption, Spinner } from '@docouno/unica';
import type { ControlSize, GlyphSource, InputProps } from '@docouno/unica';
import { CloseGlyph } from '../control-glyphs.js';
import './combobox.css';

export interface Suggestion {
  readonly value: string;
  readonly label: string;
  readonly description?: string | undefined;
  readonly group?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly icon?: GlyphSource | undefined;
  readonly insertText?: string;
  readonly shortcut?: string;
}

interface FieldProps extends Pick<
  InputProps,
  | 'placeholder'
  | 'status'
  | 'size'
  | 'variant'
  | 'width'
  | 'clearable'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'aria-label'
  | 'aria-describedby'
> {
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
  readonly editorAction?: ReactNode;
  readonly 'data-wb-subject'?: string | undefined;
  readonly options: readonly Suggestion[];
  readonly iconLeft?: GlyphSource | null | undefined;
  readonly minimumQueryLength?: number;
  readonly searchState?: 'loading' | 'error';
  readonly listMessage?: ReactNode;
  readonly filter?: ((option: Suggestion, query: string) => boolean) | null;
  /** In-flow design study. No native dismissal or focus transfer. */
  readonly previewOpen?: boolean;
  readonly previewActive?: string;
}

export interface ComboboxProps extends FieldProps {
  readonly defaultSelection?: Suggestion | undefined;
  readonly previewDraft?: string;
  readonly onSelectionChange?: (selection: Suggestion | null) => void;
  readonly onQueryChange?: (text: string) => void;
}

export interface AutocompleteProps
  extends FieldProps, Pick<InputProps, 'name' | 'minLength' | 'maxLength' | 'pattern'> {
  readonly defaultValue?: string | undefined;
  readonly browsable?: boolean;
  readonly onTextChange?: ((text: string) => void) | undefined;
  readonly onSuggestion?: ((suggestion: Suggestion) => void) | undefined;
}

interface SuggestionFieldProps
  extends FieldProps, Pick<InputProps, 'name' | 'minLength' | 'maxLength' | 'pattern'> {
  readonly disclosure?: boolean;
  readonly kind: 'catalog' | 'text';
  readonly initialText?: string | undefined;
  readonly initialSelection?: Suggestion | undefined;
  readonly onSelectionChange?: (selection: Suggestion | null) => void;
  readonly onTextChange?: ((text: string) => void) | undefined;
  readonly onSuggestion?: ((suggestion: Suggestion) => void) | undefined;
}

const searchOption = (option: Suggestion, query: string): boolean =>
  [option.label, option.description, option.group, option.insertText].some((part) =>
    part?.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );

function useSuggestionPlacement(
  open: boolean,
  close: () => void,
): {
  readonly panel: RefObject<HTMLDivElement | null>;
  readonly input: RefObject<HTMLInputElement | null>;
  readonly row: RefObject<HTMLDivElement | null>;
} {
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  useLayoutEffect(() => {
    closeRef.current = close;
  }, [close]);

  useLayoutEffect(() => {
    const node = panel.current;
    const anchor = row.current;
    const view = node?.ownerDocument.defaultView;
    if (!open || !node || !anchor || !view) {
      return;
    }
    let above: boolean | undefined;
    const position = (): void => {
      const box = anchor.getBoundingClientRect();
      const viewport = view.visualViewport;
      const top = (viewport?.offsetTop ?? 0) + 16;
      const left = (viewport?.offsetLeft ?? 0) + 16;
      const bottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? view.innerHeight) - 16;
      const right = (viewport?.offsetLeft ?? 0) + (viewport?.width ?? view.innerWidth) - 16;
      if (box.bottom < top || box.top > bottom || box.right < left || box.left > right) {
        closeRef.current();
        return;
      }
      const scroll = node.querySelector<HTMLElement>('.suggestion-scroll-proto');
      const scrollTop = scroll?.scrollTop ?? 0;
      const width = Math.min(Math.max(box.width, 264), right - left);
      node.style.width = `${width}px`;
      node.style.maxHeight = '';
      const height = node.getBoundingClientRect().height;
      const before = box.top - top - 8;
      const after = bottom - box.bottom - 8;
      above ??= after < height && before > after;
      if (
        (above ? before : after) < Math.min(96, height) &&
        (above ? after : before) > (above ? before : after)
      ) {
        above = !above;
      }
      node.style.maxHeight = `${Math.max(0, above ? before : after)}px`;
      const rtl = view.getComputedStyle(anchor).direction === 'rtl';
      const inlineStart = rtl ? box.right - width : box.left;
      node.style.left = `${Math.max(left, Math.min(inlineStart, right - width))}px`;
      node.style.top = `${above ? box.top - node.getBoundingClientRect().height - 8 : box.bottom + 8}px`;
      node.style.visibility = 'visible';
      if (scroll) {
        scroll.scrollTop = scrollTop;
      }
    };
    const onScroll = (event: Event): void => {
      if (!(event.target instanceof view.Node) || !node.contains(event.target)) {
        position();
      }
    };

    node.showPopover();
    position();
    const visibility = new view.IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting) {
        closeRef.current();
      }
    });
    visibility.observe(anchor);
    const observer = new view.ResizeObserver(position);
    observer.observe(anchor);
    observer.observe(node);
    view.addEventListener('resize', position);
    view.addEventListener('scroll', onScroll, true);
    view.visualViewport?.addEventListener('resize', position);
    view.visualViewport?.addEventListener('scroll', position);
    return () => {
      visibility.disconnect();
      observer.disconnect();
      view.removeEventListener('resize', position);
      view.removeEventListener('scroll', onScroll, true);
      view.visualViewport?.removeEventListener('resize', position);
      view.visualViewport?.removeEventListener('scroll', position);
      node.hidePopover();
      node.style.visibility = '';
    };
  }, [open]);

  return { panel, input, row };
}

function RestoreButton({
  inPanel,
  onClick,
}: {
  inPanel?: boolean;
  onClick: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      className="suggestion-restore-proto"
      tabIndex={inPanel ? -1 : undefined}
      onMouseDown={inPanel ? (event) => event.preventDefault() : undefined}
      onClick={onClick}
    >
      Restore previous selection
    </button>
  );
}

function optionId(listId: string, value: string): string {
  return `${listId}-${encodeURIComponent(value)}`;
}

function groupSuggestions(options: readonly Suggestion[]): Map<string | undefined, Suggestion[]> {
  const groups = new Map<string | undefined, Suggestion[]>();
  for (const option of options) {
    const entries = groups.get(option.group) ?? [];
    entries.push(option);
    groups.set(option.group, entries);
  }
  return groups;
}

interface SuggestionRowsProps {
  readonly groups: ReadonlyMap<string | undefined, readonly Suggestion[]>;
  readonly selected?: string | undefined;
  readonly active?: string | undefined;
  readonly kind: 'catalog' | 'text';
  readonly size: ControlSize;
  readonly hideCatalogIcons: boolean;
  readonly busy: boolean;
  readonly id: string;
  readonly onActivate: (value: string | undefined) => void;
  readonly onPick: (option: Suggestion) => void;
}

function SuggestionRows({
  groups,
  selected,
  active,
  kind,
  size,
  hideCatalogIcons,
  busy,
  id,
  onActivate,
  onPick,
}: SuggestionRowsProps): ReactElement {
  const options = [...groups.values()].flat();
  const hasIcons = !hideCatalogIcons && options.some((option) => option.icon);
  const hasShortcuts = kind === 'text' && options.some((option) => option.shortcut);
  const renderOption = (option: Suggestion): ReactElement => {
    const current = option.value === active;
    const idForOption = optionId(id, option.value);
    const optionProps = {
      id: idForOption,
      'data-active': current || undefined,
      onMouseMove: () => onActivate(option.disabled ? undefined : option.value),
      onClick: () => {
        if (!option.disabled) {
          onPick(option);
        }
      },
    };
    return kind === 'catalog' ? (
      <ListboxOption
        {...optionProps}
        className="suggestion-catalog-option-proto"
        value={option.value}
        label={option.label}
        description={option.description}
        disabled={option.disabled}
        iconLeft={hasIcons ? option.icon : undefined}
        reserveIconSpace={hasIcons}
        size={size}
        selected={option.value === selected}
        active={current}
        key={option.value}
      />
    ) : (
      <div
        {...optionProps}
        role="option"
        aria-labelledby={`${idForOption}-label`}
        aria-describedby={option.description ? `${idForOption}-description` : undefined}
        aria-selected={current}
        aria-disabled={option.disabled || undefined}
        className="suggestion-text-option-proto"
        key={option.value}
      >
        {option.icon && (
          <span className="suggestion-option-icon-proto" aria-hidden="true">
            <Icon usage="slot" icon={option.icon} />
          </span>
        )}
        <span className="suggestion-option-copy-proto">
          <span id={`${idForOption}-label`} dir="auto">
            {option.label}
          </span>
          {option.description && (
            <span
              id={`${idForOption}-description`}
              className="suggestion-option-description-proto"
              dir="auto"
            >
              {option.description}
            </span>
          )}
        </span>
        {option.shortcut && <Kbd className="suggestion-shortcut-proto">{option.shortcut}</Kbd>}
      </div>
    );
  };
  return (
    <div
      id={id}
      role="listbox"
      aria-label={kind === 'catalog' ? 'Matching options' : 'Suggestions'}
      aria-busy={busy || undefined}
      className="suggestion-list-proto"
      data-icons={hasIcons || undefined}
      data-shortcuts={hasShortcuts || undefined}
      onMouseDown={(event) => {
        const ElementConstructor = event.currentTarget.ownerDocument.defaultView?.Element;
        if (
          ElementConstructor &&
          event.target instanceof ElementConstructor &&
          event.target.closest('[role="option"]')
        ) {
          event.preventDefault();
        }
      }}
      onMouseMove={(event) => {
        const ElementConstructor = event.currentTarget.ownerDocument.defaultView?.Element;
        if (
          ElementConstructor &&
          event.target instanceof ElementConstructor &&
          !event.target.closest('[role="option"]')
        ) {
          onActivate(undefined);
        }
      }}
      onMouseLeave={() => onActivate(undefined)}
    >
      {[...groups].map(([group, entries]) =>
        group ? (
          <ListboxGroup key={group} label={group}>
            {entries.map(renderOption)}
          </ListboxGroup>
        ) : (
          entries.map(renderOption)
        ),
      )}
    </div>
  );
}

function SuggestionMessage({
  title,
  detail,
  icon,
  warning,
}: {
  readonly title: ReactNode;
  readonly detail?: ReactNode;
  readonly icon: GlyphSource;
  readonly warning?: boolean;
}): ReactElement {
  return (
    <div className="suggestion-notice-proto" role="status" data-warning={warning || undefined}>
      <Icon usage="slot" icon={icon} />
      <div className="suggestion-notice-copy-proto">
        <strong>{typeof title === 'string' ? <bdi>{title}</bdi> : title}</strong>
        {detail && <span>{typeof detail === 'string' ? <bdi>{detail}</bdi> : detail}</span>}
      </div>
    </div>
  );
}

function SuggestionField({
  kind,
  options,
  disclosure,
  initialSelection,
  initialText,
  onSelectionChange,
  onTextChange,
  onSuggestion,
  filter = searchOption,
  minimumQueryLength = 0,
  listMessage,
  searchState,
  previewOpen,
  previewActive,
  size = 'm',
  width = 'full',
  placeholder = 'Search options',
  clearable = true,
  iconLeft,
  disabled,
  readOnly,
  label,
  description,
  message,
  editorAction,
  'aria-describedby': authoredDescription,
  'data-wb-subject': subject,
  ...fieldProps
}: SuggestionFieldProps): ReactElement {
  const id = useId();
  const listId = `${id}-suggestions`;
  const recoveryId = `${id}-recovery`;
  const root = useRef<HTMLDivElement>(null);
  const composing = useRef(false);
  const keyboardNavigation = useRef(false);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initialText ?? initialSelection?.label ?? '');
  const [selection, setSelection] = useState(initialSelection);
  const [editing, setEditing] = useState(
    initialSelection !== undefined && initialText !== undefined,
  );
  const [requested, setRequested] = useState<string>();
  const [compactCatalog, setCompactCatalog] = useState(false);
  const catalog = kind === 'catalog';
  const confirmed = editing ? undefined : selection;
  const replacement = catalog && editing && selection !== undefined;
  const unconfirmed = catalog && editing && (text.length > 0 || replacement);
  const unavailable = disabled || readOnly;
  const pending = searchState === 'loading' && !unavailable;
  const shown = Boolean((open || previewOpen) && !unavailable);
  const query = confirmed ? '' : text;
  const belowMinimum = !confirmed && query.trim().length < minimumQueryLength;
  const results =
    belowMinimum || searchState ? [] : options.filter((option) => !filter || filter(option, query));
  const groups = groupSuggestions(results);
  const enabled = [...groups.values()].flat().filter((option) => !option.disabled);
  const active = shown
    ? enabled.find((option) => option.value === (previewActive ?? requested))
    : undefined;
  const close = (): void => {
    setOpen(false);
    setRequested(undefined);
  };
  const {
    panel: popup,
    input,
    row,
  } = useSuggestionPlacement(open && !previewOpen && !unavailable, close);
  useLayoutEffect(() => {
    const panel = popup.current;
    const view = panel?.ownerDocument.defaultView;
    if (!shown || !catalog || !panel || !view) {
      return;
    }
    const measure = (width: number): void => {
      const rem = Number.parseFloat(
        view.getComputedStyle(panel.ownerDocument.documentElement).fontSize,
      );
      setCompactCatalog(width <= 15 * rem);
    };
    const style = view.getComputedStyle(panel);
    measure(
      panel.clientWidth -
        Number.parseFloat(style.paddingInlineStart) -
        Number.parseFloat(style.paddingInlineEnd),
    );
    const observer = new view.ResizeObserver(([entry]) => {
      if (entry) {
        measure(entry.contentRect.width);
      }
    });
    observer.observe(panel);
    return () => observer.disconnect();
  }, [catalog, popup, shown]);
  const focusInput = (): void => input.current?.focus({ preventScroll: true });
  const pendingResets = useRef<Event[]>([]);
  useLayoutEffect(() => {
    const editor = input.current;
    const form = editor?.form;
    if (catalog || !editor || !form) {
      return;
    }
    const resets = pendingResets.current;
    let timer: ReturnType<typeof setTimeout>;
    const syncReset = (event: Event): void => {
      if (!event.isTrusted || event.target !== form) {
        return;
      }
      resets.push(event);
      clearTimeout(timer);
      // A late cancellation cannot undo an earlier reset that already restored the input.
      timer = setTimeout(() => {
        if (resets.some((reset) => !reset.defaultPrevented)) {
          setText(editor.value);
          setRequested(undefined);
          setOpen(false);
        }
        resets.length = 0;
      }, 0);
    };
    form.addEventListener('reset', syncReset);
    return () => {
      clearTimeout(timer);
      resets.length = 0;
      form.removeEventListener('reset', syncReset);
    };
  }, [catalog, input]);

  const changeText = (next: string): void => {
    pendingResets.current.length = 0;
    setText(next);
    onTextChange?.(next);
  };
  const writeText = (next: string): void => {
    const editor = input.current;
    const view = editor?.ownerDocument.defaultView;
    if (!catalog && editor && view && editor.value !== next) {
      // Use the same input event path as typing so the native field keeps its reset value.
      const descriptor = Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'value');
      if (descriptor?.set) {
        descriptor.set.call(editor, next);
        editor.dispatchEvent(new view.Event('input', { bubbles: true }));
        return;
      }
    }
    changeText(next);
  };
  const pick = (option: Suggestion): void => {
    if (catalog) {
      setSelection(option);
      setEditing(false);
      onSelectionChange?.(option);
    }
    writeText(catalog ? option.label : (option.insertText ?? option.label));
    close();
    onSuggestion?.(option);
    focusInput();
  };
  const restore = (): void => {
    if (selection) {
      pick(selection);
    }
  };
  const clear = (): void => {
    const editor = input.current;
    if (
      !editor ||
      unavailable ||
      composing.current ||
      editor.matches(':disabled') ||
      editor.closest('[inert]') ||
      (!editor.value && !confirmed)
    ) {
      return;
    }
    close();
    setSelection(undefined);
    setEditing(false);
    if (text) {
      writeText('');
    }
    if (confirmed) {
      onSelectionChange?.(null);
    }
    focusInput();
  };

  useLayoutEffect(() => {
    const boundary = root.current;
    const document = boundary?.ownerDocument;
    const view = document?.defaultView;
    if (!open || previewOpen || !boundary || !document || !view) {
      return;
    }
    const dismiss = (event: PointerEvent): void => {
      if (event.target instanceof view.Node && !boundary.contains(event.target)) {
        close();
      }
    };
    document.addEventListener('pointerdown', dismiss, true);
    return () => document.removeEventListener('pointerdown', dismiss, true);
  }, [open, previewOpen]);

  useLayoutEffect(() => {
    const scroller = popup.current?.querySelector<HTMLElement>('.suggestion-scroll-proto');
    const row = popup.current?.querySelector<HTMLElement>('[data-active]');
    if (!open || !keyboardNavigation.current || !scroller || !row) {
      return;
    }
    const viewport = scroller.getBoundingClientRect();
    const box = row.getBoundingClientRect();
    if (box.top < viewport.top + 4) {
      scroller.scrollTop -= viewport.top + 4 - box.top;
    } else if (box.bottom > viewport.bottom - 4) {
      scroller.scrollTop += box.bottom - viewport.bottom + 4;
    }
  }, [active, open, popup]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (unavailable || composing.current || event.nativeEvent.isComposing) {
      return;
    }
    if (event.key === 'Escape' && shown) {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === 'Tab') {
      close();
    } else if (event.key === 'Enter' && shown) {
      if (active) {
        event.preventDefault();
        pick(active);
      } else {
        close();
      }
    } else if (
      (event.key === 'ArrowDown' || event.key === 'ArrowUp') &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey
    ) {
      event.preventDefault();
      setOpen(true);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      const index = active ? enabled.indexOf(active) : -1;
      const next =
        index < 0
          ? (enabled.find((option) => option.value === confirmed?.value) ??
            enabled.at(step > 0 ? 0 : -1))
          : enabled[Math.max(0, Math.min(enabled.length - 1, index + step))];
      keyboardNavigation.current = true;
      setRequested(next?.value);
    }
  };

  let notice: ReactNode;
  if (pending) {
    notice = (
      <SuggestionMessage
        icon={BusyGlyph}
        title="Searching…"
        detail="Keep typing to refine your search."
      />
    );
  } else if (searchState === 'error') {
    notice = (
      <SuggestionMessage
        icon={fieldStatusGlyphs.danger}
        warning
        title="Couldn’t load results"
        detail={
          listMessage ??
          (catalog
            ? 'Your text is still here. Edit the query to search again.'
            : 'Keep your text or edit it to search again.')
        }
      />
    );
  } else if (belowMinimum) {
    notice = (
      <SuggestionMessage
        icon={SearchGlyph}
        title="Type to search"
        detail={listMessage ?? `Enter at least ${minimumQueryLength} characters.`}
      />
    );
  } else if (results.length === 0) {
    notice = query.trim() ? (
      <SuggestionMessage
        icon={SearchGlyph}
        title={catalog ? 'No matches' : 'No matching suggestions'}
        detail={
          listMessage ??
          (catalog
            ? 'Try a different spelling or a shorter search.'
            : 'You can use your text as entered.')
        }
      />
    ) : (
      <SuggestionMessage
        icon={SearchGlyph}
        title={catalog ? 'No options available' : 'No suggestions available'}
        detail={listMessage}
      />
    );
  } else if (!enabled.length) {
    notice = (
      <SuggestionMessage
        icon={LockGlyph}
        title="These results are unavailable"
        detail={listMessage}
      />
    );
  }

  const recoveryCopy = fieldProps.status === 'danger' ? undefined : 'Choose a result to confirm.';
  const browsingCopy = unconfirmed && recoveryCopy && enabled.length > 0;
  const panel = shown && (
    <div
      role="presentation"
      data-surface="overlay"
      data-wb-subject={subject}
      ref={popup}
      popover={previewOpen ? undefined : 'manual'}
      className={`unica-overlay-surface suggestion-panel-proto ${previewOpen ? 'suggestion-pinned-proto' : 'suggestion-native-proto'}`}
    >
      <div className="suggestion-frame-proto" data-size={size}>
        {(browsingCopy || replacement) && (
          <div className="suggestion-panel-recovery-proto">
            {browsingCopy && (
              <span id={recoveryId}>
                <bdi>Choose a result.</bdi>
              </span>
            )}
            {!browsingCopy && replacement && <span>Selection pending</span>}
            {replacement && <RestoreButton inPanel onClick={restore} />}
          </div>
        )}
        <div className="suggestion-scroll-proto unica-scrollbar unica-scrollbar--compact">
          {notice}
          <SuggestionRows
            id={listId}
            groups={groups}
            selected={confirmed?.value}
            active={active?.value}
            kind={kind}
            size={size}
            hideCatalogIcons={catalog && compactCatalog}
            busy={pending}
            onActivate={(value) => {
              if (value === undefined && keyboardNavigation.current) {
                return;
              }
              keyboardNavigation.current = false;
              setRequested(value);
            }}
            onPick={pick}
          />
        </div>
      </div>
    </div>
  );

  const describedBy =
    [
      ...new Set(
        [
          authoredDescription,
          (shown ? browsingCopy : unconfirmed && recoveryCopy) ? recoveryId : undefined,
        ]
          .flatMap((part) => part?.trim().split(/\s+/) ?? [])
          .filter(Boolean),
      ),
    ].join(' ') || undefined;

  const editor = (
    <div
      ref={row}
      data-wb-subject={subject}
      className="suggestion-editor-row-proto"
      data-size={size}
      data-status={
        !disabled && fieldProps.status && fieldProps.status !== 'neutral' ? '' : undefined
      }
    >
      <Input
        {...fieldProps}
        ref={input}
        id={id}
        className="suggestion-input-proto"
        size={size}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        iconLeft={iconLeft ?? undefined}
        value={catalog ? text : undefined}
        defaultValue={catalog ? undefined : initialText}
        dir="auto"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={shown}
        aria-controls={shown ? listId : undefined}
        aria-activedescendant={active ? optionId(listId, active.value) : undefined}
        aria-label={
          fieldProps['aria-label'] ??
          (label ? undefined : catalog ? 'Search options' : 'Enter text')
        }
        aria-describedby={describedBy}
        onKeyDown={onKeyDown}
        onBlur={() => {
          composing.current = false;
          close();
        }}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={(event) => {
          composing.current = false;
          setOpen(catalog || event.currentTarget.value.trim().length > 0);
        }}
        onChange={(event) => {
          const next = event.currentTarget.value;
          changeText(next);
          if (catalog) {
            setEditing(true);
          }
          if (confirmed) {
            onSelectionChange?.(null);
          }
          setRequested(undefined);
          if (!composing.current) {
            setOpen(catalog || next.trim().length > 0);
          }
        }}
      />
      {pending && <Spinner className="suggestion-spinner-proto" size={size} tone="muted" />}
      {(clearable || readOnly || disclosure) && (
        <span className="suggestion-actions-proto">
          {clearable && (
            <button
              type="button"
              className="suggestion-action-proto suggestion-clear-proto"
              aria-label={catalog ? 'Clear selection and search text' : 'Clear text'}
              aria-controls={id}
              disabled={disabled || readOnly}
              data-empty={!(text || confirmed) || undefined}
              onPointerDown={(event) => event.preventDefault()}
              onMouseDown={(event) => event.preventDefault()}
              onClick={clear}
            >
              <Icon usage="slot" icon={CloseGlyph} size={size} />
            </button>
          )}
          {readOnly && !disabled ? (
            <Icon
              usage="slot"
              icon={LockGlyph}
              size={size}
              color="muted"
              className="suggestion-lock-proto"
            />
          ) : (
            disclosure && (
              <button
                type="button"
                className="suggestion-action-proto suggestion-disclosure-proto"
                aria-label={
                  catalog
                    ? shown
                      ? 'Hide options'
                      : 'Show options'
                    : shown
                      ? 'Hide suggestions'
                      : 'Show suggestions'
                }
                aria-expanded={shown}
                aria-controls={shown ? listId : undefined}
                tabIndex={-1}
                disabled={disabled}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  focusInput();
                  if (shown) {
                    close();
                  } else {
                    setOpen(true);
                  }
                }}
              >
                <Icon usage="slot" icon={CaretDownGlyph} size={size} />
              </button>
            )
          )}
        </span>
      )}
    </div>
  );

  return (
    <div ref={root} className="suggestion-field-proto" data-width={width}>
      <FormField
        controlId={id}
        label={label}
        required={fieldProps.required}
        size={size}
        description={description}
        message={message ?? ''}
        status={disabled ? 'neutral' : fieldProps.status}
        disabled={disabled}
      >
        {editorAction ? (
          <div className="suggestion-editor-with-action-proto">
            {editor}
            {editorAction}
          </div>
        ) : (
          editor
        )}
      </FormField>
      {unconfirmed && !unavailable && !shown && (recoveryCopy || replacement) && (
        <div className="suggestion-recovery-proto">
          {recoveryCopy && (
            <span id={recoveryId}>
              <bdi>{recoveryCopy}</bdi>
            </span>
          )}
          {replacement && <RestoreButton onClick={restore} />}
        </div>
      )}
      {panel}
    </div>
  );
}

export function Combobox({
  defaultSelection,
  previewDraft,
  onQueryChange,
  ...props
}: ComboboxProps): ReactElement {
  return (
    <SuggestionField
      {...props}
      kind="catalog"
      disclosure
      initialSelection={defaultSelection}
      initialText={previewDraft}
      onTextChange={onQueryChange}
      iconLeft={props.iconLeft === null ? undefined : (props.iconLeft ?? SearchGlyph)}
    />
  );
}

export function Autocomplete({
  defaultValue,
  browsable = false,
  placeholder = 'Enter text',
  ...props
}: AutocompleteProps): ReactElement {
  return (
    <SuggestionField
      {...props}
      kind="text"
      disclosure={browsable}
      initialText={defaultValue}
      placeholder={placeholder}
    />
  );
}
