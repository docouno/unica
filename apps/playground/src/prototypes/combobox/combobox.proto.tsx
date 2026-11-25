import {
  BusyGlyph,
  CaretDownGlyph,
  LockGlyph,
  SearchGlyph,
  fieldStatusGlyphs,
} from '../control-glyphs.js';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, ReactElement, ReactNode, RefObject } from 'react';
import { Icon, Input, Kbd, Spinner } from '@docouno/unica';
import type { GlyphSource, InputProps } from '@docouno/unica';
import { CloseGlyph } from '../control-glyphs.js';
import { FormField } from '../form-field/form-field.proto.js';
import { ListboxGroup, ListboxOption } from '../select/listbox.proto.js';
import type { SelectOption } from '../select/listbox.proto.js';
import { SelectPanel } from '../select/select-control.proto.js';
import '../select/select.css';
import './combobox.css';

export interface Suggestion extends SelectOption {
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
    if (!open || !node || !anchor) {
      return;
    }
    let above: boolean | undefined;
    const position = (): void => {
      const box = anchor.getBoundingClientRect();
      const viewport = window.visualViewport;
      const top = (viewport?.offsetTop ?? 0) + 16;
      const left = (viewport?.offsetLeft ?? 0) + 16;
      const bottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - 16;
      const right = (viewport?.offsetLeft ?? 0) + (viewport?.width ?? window.innerWidth) - 16;
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
      const rtl = getComputedStyle(anchor).direction === 'rtl';
      const inlineStart = rtl ? box.right - width : box.left;
      node.style.left = `${Math.max(left, Math.min(inlineStart, right - width))}px`;
      node.style.top = `${above ? box.top - node.getBoundingClientRect().height - 8 : box.bottom + 8}px`;
      node.style.visibility = 'visible';
      if (scroll) {
        scroll.scrollTop = scrollTop;
      }
    };
    const onScroll = (event: Event): void => {
      if (!(event.target instanceof Node) || !node.contains(event.target)) {
        position();
      }
    };

    node.showPopover();
    position();
    const visibility = new IntersectionObserver(([entry]) => {
      if (entry && !entry.isIntersecting) {
        closeRef.current();
      }
    });
    visibility.observe(anchor);
    const observer = new ResizeObserver(position);
    observer.observe(anchor);
    observer.observe(node);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', onScroll, true);
    window.visualViewport?.addEventListener('resize', position);
    window.visualViewport?.addEventListener('scroll', position);
    return () => {
      visibility.disconnect();
      observer.disconnect();
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', onScroll, true);
      window.visualViewport?.removeEventListener('resize', position);
      window.visualViewport?.removeEventListener('scroll', position);
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
  busy,
  id,
  onActivate,
  onPick,
}: SuggestionRowsProps): ReactElement {
  const options = [...groups.values()].flat();
  const hasIcons = options.some((option) => option.icon);
  const hasShortcuts = kind === 'text' && options.some((option) => option.shortcut);
  const renderOption = (option: Suggestion): ReactElement => {
    const current = option.value === active;
    const optionProps = {
      id: optionId(id, option.value),
      onMouseMove: () => onActivate(option.disabled ? undefined : option.value),
      onMouseDown: (event: MouseEvent) => event.preventDefault(),
      onClick: () => {
        if (!option.disabled) {
          onPick(option);
        }
      },
    };
    return kind === 'catalog' ? (
      <ListboxOption
        {...optionProps}
        option={option}
        selected={option.value === selected}
        active={current}
        key={option.value}
      />
    ) : (
      <div
        {...optionProps}
        role="option"
        aria-selected={current}
        aria-disabled={option.disabled || undefined}
        className="choice-option-proto suggestion-text-option-proto"
        data-active={current || undefined}
        key={option.value}
      >
        {option.icon && (
          <span className="choice-option-icon-proto" aria-hidden="true">
            <Icon usage="slot" icon={option.icon} />
          </span>
        )}
        <span className="choice-option-copy-proto">
          <span dir="auto">{option.label}</span>
          {option.description && (
            <span className="choice-option-description-proto" dir="auto">
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
      className="choice-list-proto suggestion-list-proto"
      data-external-focus=""
      data-icons={hasIcons || undefined}
      data-shortcuts={hasShortcuts || undefined}
      onMouseMove={(event) => {
        if (event.target instanceof Element && !event.target.closest('[role="option"]')) {
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
    if (!open || previewOpen) {
      return;
    }
    const dismiss = (event: PointerEvent): void => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) {
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
    <SelectPanel
      data-wb-subject={subject}
      ref={popup}
      popover={previewOpen ? undefined : 'manual'}
      className={
        previewOpen
          ? 'suggestion-panel-proto suggestion-pinned-proto'
          : 'suggestion-panel-proto suggestion-native-proto'
      }
      data-kind={kind}
    >
      <div className="choice-list-frame-proto suggestion-frame-proto" data-size={size}>
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
    </SelectPanel>
  );

  const describedBy =
    [
      ...new Set(
        [
          authoredDescription,
          description ? `${id}-description` : undefined,
          message ? `${id}-message` : undefined,
          (shown ? browsingCopy : unconfirmed && recoveryCopy) ? recoveryId : undefined,
        ]
          .flatMap((part) => part?.trim().split(/\s+/) ?? [])
          .filter(Boolean),
      ),
    ].join(' ') || undefined;

  return (
    <div ref={root} className="suggestion-field-proto" data-width={width}>
      <FormField
        htmlFor={id}
        label={label}
        required={fieldProps.required}
        size={size}
        description={description}
        descriptionId={`${id}-description`}
        message={message ?? ''}
        messageId={`${id}-message`}
        status={disabled ? 'neutral' : fieldProps.status}
        feedbackIcon={false}
      >
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
