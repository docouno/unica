import { CaretDownGlyph, LockGlyph, SearchGlyph, fieldStatusGlyphs } from '../control-glyphs.js';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { Input, Icon, Spinner } from '@docouno/unica';
import { FormField } from '../form-field/form-field.proto.js';
import type { ControlSize, FieldStatus, FieldVariant, GlyphSource } from '@docouno/unica';
import { PopoverContent } from '../popover/popover.proto.js';
import { Button } from '../button/button.proto.js';
import type { PopoverContentProps } from '../popover/popover.proto.js';
import { Listbox } from './listbox.proto.js';
import type { SelectOption } from './listbox.proto.js';

export function SelectPanel({ className = '', ...props }: PopoverContentProps): ReactElement {
  return (
    <PopoverContent role="presentation" {...props} className={`select-panel-proto ${className}`} />
  );
}

function SelectionSummary({
  labels,
  placeholder,
}: {
  readonly labels: readonly string[];
  readonly placeholder: string;
}): ReactElement {
  const root = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(labels.length);
  const signature = labels.join('\u0000');
  useLayoutEffect(() => {
    const node = root.current;
    if (!node) {
      return;
    }
    const measure = (): void => {
      const widths = [...node.querySelectorAll<HTMLElement>('[data-measure-label]')].map(
        (item) => item.getBoundingClientRect().width,
      );
      const available = node.clientWidth;
      const total = widths.at(-1) ?? 0;
      if (total <= available) {
        setCount(widths.length);
        return;
      }
      const counts = [...node.querySelectorAll<HTMLElement>('[data-measure-count]')].map(
        (item) => item.getBoundingClientRect().width,
      );
      const gap = parseFloat(getComputedStyle(node).columnGap);
      let shown = 1;
      for (let index = 0; index < widths.length - 1; index += 1) {
        if ((widths[index] ?? 0) + (counts[index] ?? 0) + gap <= available) {
          shown = index + 1;
        }
      }
      setCount(shown);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [signature]);
  const shown = Math.min(count, labels.length);
  return (
    <span ref={root} className="select-summary-proto" data-empty={labels.length === 0 || undefined}>
      <span className="select-summary-labels-proto" dir="auto">
        {labels.length ? labels.slice(0, shown).join(', ') : placeholder}
      </span>
      {labels.length > shown && (
        <span className="select-summary-count-proto" aria-hidden="true">
          <bdi dir="ltr">+{labels.length - shown}</bdi>
        </span>
      )}
      <span className="select-summary-measure-proto" aria-hidden="true">
        {labels.map((label, index) => (
          <span key={index}>
            <span data-measure-label>{[...labels.slice(0, index), label].join(', ')}</span>
            <span className="select-summary-count-proto" data-measure-count>
              <bdi dir="ltr">+{labels.length - index - 1}</bdi>
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}

export interface SelectProps extends Omit<
  ComponentPropsWithRef<'button'>,
  'value' | 'defaultValue' | 'onChange'
> {
  readonly 'data-wb-subject'?: string | undefined;
  readonly options: readonly SelectOption[];
  readonly value?: string | null | undefined;
  readonly defaultValue?: string | null | undefined;
  readonly values?: readonly string[] | undefined;
  readonly defaultValues?: readonly string[] | undefined;
  readonly onValueChange?: ((value: string | null) => void) | undefined;
  readonly onValuesChange?: ((values: readonly string[]) => void) | undefined;
  readonly multiple?: boolean | undefined;
  readonly searchable?: boolean | undefined;
  readonly clearable?: boolean | undefined;
  readonly readOnly?: boolean | undefined;
  readonly loading?: boolean | undefined;
  readonly placeholder?: string | undefined;
  readonly size?: ControlSize | undefined;
  readonly width?: 'auto' | 'full' | undefined;
  readonly variant?: FieldVariant | undefined;
  readonly status?: FieldStatus | undefined;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
  readonly required?: boolean | undefined;
  readonly iconLeft?: GlyphSource | undefined;
  readonly orphanLabels?: Readonly<Record<string, string>> | undefined;
  readonly emptyState?: ReactNode;
  readonly errorState?: ReactNode;
  /** In-flow state study. Real popover focus/dismissal is demonstrated separately. */
  readonly previewOpen?: boolean | undefined;
  readonly previewQuery?: string | undefined;
  readonly previewState?: 'hover' | 'pressed' | 'focus' | undefined;
  readonly previewActive?: string | undefined;
}

// Local interaction harness; package forms, localization and complete browser support are Wave 2.
export function Select({
  options,
  value,
  defaultValue = null,
  values,
  defaultValues = [],
  onValueChange,
  onValuesChange,
  multiple = false,
  searchable,
  clearable,
  readOnly,
  loading,
  placeholder = 'Choose an option…',
  size = 'm',
  width = 'full',
  variant = 'default',
  status = 'neutral',
  label,
  description,
  message,
  required,
  iconLeft,
  orphanLabels,
  emptyState = 'No options available.',
  errorState,
  previewOpen,
  previewQuery = '',
  previewState,
  previewActive,
  className = '',
  style,
  id,
  disabled,
  hidden,
  ref,
  'data-wb-subject': subject,
  ...props
}: SelectProps): ReactElement {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const [localValue, setLocalValue] = useState(defaultValue);
  const [localValues, setLocalValues] = useState(defaultValues);
  const [query, setQuery] = useState(previewQuery);
  const [open, setOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(previewOpen === true && searchable === true);
  const [active, setActive] = useState(previewActive ?? '');
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const placement = useRef<'above' | 'below' | null>(null);
  const modality = useRef('keyboard');
  const busy = Boolean(loading && !disabled);
  const failed = Boolean(errorState && !busy);
  const initialLoad = busy && options.length === 0;
  const showSearch = searchable && !initialLoad;
  const actualOpen = (previewOpen || open) && !disabled;
  const selected = multiple
    ? (values ?? localValues)
    : [value === undefined ? localValue : value].filter((key): key is string => key !== null);
  const labels = selected.map(
    (key) =>
      options.find((option) => option.value === key)?.label ??
      orphanLabels?.[key] ??
      'Unavailable option',
  );
  const effectiveStatus = disabled ? 'neutral' : status;
  const statusGlyph = effectiveStatus === 'neutral' ? null : fieldStatusGlyphs[effectiveStatus];
  const filtered = options.filter((option) =>
    `${option.label} ${option.description ?? ''} ${option.group ?? ''}`
      .toLocaleLowerCase()
      .includes(query.trim().toLocaleLowerCase()),
  );
  const enabled = [
    ...filtered.filter((option) => !option.disabled),
    ...selected
      .filter((key) => !options.some((option) => option.value === key))
      .map((key) => ({
        value: key,
        label: orphanLabels?.[key] ?? 'Unavailable option',
      })),
  ];
  const activeKey = enabled.some((option) => option.value === active)
    ? active
    : (enabled.find((option) => selected.includes(option.value))?.value ?? enabled[0]?.value ?? '');
  const focusContent = (): void => {
    const target =
      panel.current?.querySelector<HTMLElement>(
        failed
          ? '[data-select-error] button'
          : showSearch
            ? 'input:not(:disabled)'
            : '[role="listbox"]',
      ) ?? panel.current;
    target?.focus({ preventScroll: true });
  };
  const openPanel = (): void => {
    setActive(
      enabled.find((option) => selected.includes(option.value))?.value ?? enabled[0]?.value ?? '',
    );
    if (previewOpen) {
      focusContent();
    } else {
      panel.current?.showPopover();
    }
  };
  const close = (returnFocus: boolean): void => {
    if (previewOpen) {
      return;
    }
    panel.current?.hidePopover();
    setQuery('');
    if (returnFocus) {
      trigger.current?.focus({ preventScroll: true });
    }
  };
  const setSingle = (next: string | null): void => {
    setLocalValue(next);
    onValueChange?.(next);
    close(true);
  };
  const setMulti = (next: readonly string[]): void => {
    setLocalValues(next);
    onValuesChange?.(next);
  };
  const clearSelection = (): void => {
    if (multiple) {
      setMulti([]);
      queueMicrotask(focusContent);
    } else {
      setSingle(null);
    }
  };

  useLayoutEffect(() => {
    if (!open || previewOpen) {
      return;
    }
    const node = panel.current;
    const button = trigger.current;
    if (!node || !button) {
      return;
    }
    const position = (): void => {
      const box = button.getBoundingClientRect();
      const viewport = window.visualViewport;
      const top = (viewport?.offsetTop ?? 0) + 16;
      const bottom = (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - 16;
      const left = (viewport?.offsetLeft ?? 0) + 16;
      const right = (viewport?.offsetLeft ?? 0) + (viewport?.width ?? window.innerWidth) - 16;
      if (box.bottom < top || box.top > bottom || box.right < left || box.left > right) {
        node.hidePopover();
        return;
      }
      const list = node.querySelector<HTMLElement>('.choice-list-proto');
      const scrollTop = list?.scrollTop ?? 0;
      node.style.width = `${Math.min(Math.max(box.width, 264), right - left)}px`;
      node.style.maxHeight = 'none';
      const natural = node.getBoundingClientRect().height;
      const below = bottom - box.bottom - 8;
      const above = box.top - top - 8;
      placement.current ??= below < natural && above > below ? 'above' : 'below';
      let flip = placement.current === 'above';
      const available = flip ? above : below;
      const opposite = flip ? below : above;
      if (available < Math.min(natural, 96) && opposite > available) {
        flip = !flip;
        placement.current = flip ? 'above' : 'below';
      }
      node.style.maxHeight = `${Math.max(64, flip ? above : below)}px`;
      if (list) {
        list.scrollTop = scrollTop;
      }
      const height = node.getBoundingClientRect().height;
      const rtl = getComputedStyle(button).direction === 'rtl';
      node.style.left = `${Math.max(left, Math.min(rtl ? box.right - node.offsetWidth : box.left, right - node.offsetWidth))}px`;
      node.style.top = `${Math.max(top, flip ? box.top - height - 8 : box.bottom + 8)}px`;
      node.style.visibility = 'visible';
    };
    position();
    const focusTarget =
      node.querySelector<HTMLElement>(
        failed
          ? '[data-select-error] button'
          : modality.current === 'touch' || !showSearch
            ? '[role="listbox"]'
            : 'input:not(:disabled)',
      ) ?? node;
    if (!node.contains(document.activeElement) || document.activeElement === node) {
      focusTarget.focus({ preventScroll: true });
    }
    const observer = new ResizeObserver(position);
    observer.observe(button);
    observer.observe(node);
    const onScroll = (event: Event): void => {
      if (!(event.target instanceof Node) || !node.contains(event.target)) {
        position();
      }
    };
    window.addEventListener('resize', position);
    window.addEventListener('scroll', onScroll, true);
    window.visualViewport?.addEventListener('resize', position);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', onScroll, true);
      window.visualViewport?.removeEventListener('resize', position);
    };
  }, [open, previewOpen, showSearch, failed, busy]);

  const describedBy =
    [
      props['aria-describedby'],
      description ? `${controlId}-description` : '',
      message && !(disabled && status !== 'neutral') ? `${controlId}-message` : '',
    ]
      .filter(Boolean)
      .join(' ') || undefined;
  const content = (
    <div className={`select-proto ${className}`} data-width={width} style={style} hidden={hidden}>
      <div className="select-anchor-proto">
        <button
          {...props}
          data-wb-subject={subject}
          type="button"
          id={controlId}
          disabled={disabled}
          ref={(node) => {
            trigger.current = node;
            if (typeof ref === 'function') {
              return ref(node);
            }
            if (ref) {
              ref.current = node;
            }
          }}
          className="select-trigger-proto"
          data-size={size}
          data-variant={variant}
          data-status={effectiveStatus}
          data-preview={previewState}
          data-open={actualOpen || undefined}
          data-readonly={readOnly || undefined}
          data-loading={busy || undefined}
          aria-label={[
            props['aria-label'] ?? (typeof label === 'string' ? label : placeholder),
            labels.join(', '),
          ]
            .filter(Boolean)
            .join(': ')}
          aria-haspopup={searchable ? 'dialog' : 'listbox'}
          aria-expanded={actualOpen}
          aria-controls={`${controlId}-panel`}
          aria-describedby={describedBy}
          aria-invalid={effectiveStatus === 'danger' || undefined}
          aria-busy={busy || undefined}
          title={labels.length ? labels.join(', ') : undefined}
          onPointerDown={(event) => {
            modality.current = event.pointerType;
            props.onPointerDown?.(event);
          }}
          onKeyDown={(event) => {
            props.onKeyDown?.(event);
            modality.current = 'keyboard';
            if (['ArrowDown', 'ArrowUp'].includes(event.key) && !event.defaultPrevented) {
              event.preventDefault();
              openPanel();
            }
          }}
          onClick={(event) => {
            props.onClick?.(event);
            if (event.defaultPrevented || previewOpen) {
              return;
            }
            if (panel.current?.matches(':popover-open')) {
              close(true);
            } else {
              openPanel();
            }
          }}
        >
          {iconLeft && <Icon usage="slot" icon={iconLeft} size={size} color="secondary" />}
          <SelectionSummary
            labels={labels}
            placeholder={busy && !labels.length ? 'Loading options…' : placeholder}
          />
          {statusGlyph && <Icon usage="slot" icon={statusGlyph} className="select-status-proto" />}
          {readOnly && (
            <Icon usage="slot" icon={LockGlyph} className="select-readonly-icon-proto" />
          )}
          {busy ? (
            <Spinner className="select-spinner-proto" size={size} tone="muted" />
          ) : (
            <Icon usage="slot" icon={CaretDownGlyph} className="select-disclosure-proto" />
          )}
        </button>
      </div>
      {!disabled && (
        <SelectPanel
          data-wb-subject={subject}
          ref={panel}
          id={`${controlId}-panel`}
          tabIndex={-1}
          size={size}
          popover={previewOpen ? undefined : 'auto'}
          className={previewOpen ? 'select-panel-pinned-proto' : 'select-panel-native-proto'}
          role={searchable ? 'dialog' : 'presentation'}
          aria-label={
            searchable
              ? typeof label === 'string'
                ? label
                : (props['aria-label'] ?? 'Choose options')
              : undefined
          }
          hidden={previewOpen ? !actualOpen : undefined}
          onToggle={(event) => {
            if (event.newState === 'open') {
              placement.current = null;
            }
            setOpen(event.newState === 'open');
            if (event.newState === 'closed') {
              setQuery('');
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              event.stopPropagation();
              close(true);
            }
            if (event.key === 'Tab' && !previewOpen) {
              const stops = [
                ...event.currentTarget.querySelectorAll<HTMLElement>(
                  'button, input, [role="listbox"]',
                ),
              ].filter(
                (element) =>
                  !element.matches(':disabled, [aria-disabled="true"]') &&
                  !(showSearch && element.getAttribute('role') === 'listbox') &&
                  getComputedStyle(element).visibility !== 'hidden' &&
                  element.getClientRects().length > 0,
              );
              const index = stops.indexOf(document.activeElement as HTMLElement);
              const next = stops[index + (event.shiftKey ? -1 : 1)];
              if (next) {
                event.preventDefault();
                next.focus({ preventScroll: true });
              } else {
                // Leave through the anchor so the browser resumes its native outer Tab order.
                if (event.shiftKey) {
                  event.preventDefault();
                }
                close(false);
                trigger.current?.focus({ preventScroll: true });
              }
            }
          }}
          onBlur={(event) => {
            if (
              event.relatedTarget instanceof Node &&
              !event.currentTarget.contains(event.relatedTarget) &&
              event.relatedTarget !== trigger.current
            ) {
              close(false);
            }
          }}
        >
          {(showSearch || readOnly || multiple || (clearable && selected.length > 0)) && (
            <div className="select-panel-header-proto">
              {(readOnly || multiple || (clearable && selected.length > 0)) && (
                <div className="select-panel-meta-proto">
                  <span dir="auto">
                    {readOnly
                      ? 'Read only'
                      : multiple
                        ? `${selected.length} selected`
                        : 'Selected value'}
                  </span>
                  {!readOnly && (multiple || selected.length > 0) && (
                    <Button
                      size="s"
                      variant="ghost"
                      tone="neutral"
                      disabled={busy || selected.length === 0}
                      aria-hidden={selected.length === 0 || undefined}
                      data-empty={selected.length === 0 || undefined}
                      className="select-clear-selection-proto"
                      onClick={clearSelection}
                    >
                      Clear selection
                    </Button>
                  )}
                </div>
              )}
              {showSearch && (
                <Input
                  size={size}
                  disabled={failed}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  aria-label="Search options"
                  placeholder="Search options…"
                  iconLeft={SearchGlyph}
                  value={query}
                  clearable
                  onClear={() => setQuery('')}
                  onChange={(event) => {
                    setQuery(event.currentTarget.value);
                    setActive('');
                  }}
                  onKeyDown={(event) => {
                    if (event.nativeEvent.isComposing) {
                      return;
                    }
                    const index = enabled.findIndex((option) => option.value === activeKey);
                    let next: SelectOption | undefined;
                    if (event.key === 'ArrowDown') {
                      next = enabled[Math.min(index + 1, enabled.length - 1)];
                    } else if (event.key === 'ArrowUp') {
                      next = enabled[Math.max(index - 1, 0)];
                    } else if (event.key === 'Enter') {
                      event.preventDefault();
                      if (activeKey && !readOnly && !busy) {
                        if (multiple) {
                          setMulti(
                            selected.includes(activeKey)
                              ? selected.filter((key) => key !== activeKey)
                              : [...selected, activeKey],
                          );
                        } else {
                          setSingle(
                            options.some((option) => option.value === activeKey) ? activeKey : null,
                          );
                        }
                      }
                      return;
                    } else {
                      return;
                    }
                    event.preventDefault();
                    if (next) {
                      setActive(next.value);
                    }
                  }}
                />
              )}
            </div>
          )}
          {busy && (
            <div
              className="select-loading-proto"
              data-initial={initialLoad || undefined}
              role="status"
            >
              <span className="select-loading-icon-proto">
                <Spinner size={size} tone="muted" />
              </span>
              <span>{initialLoad ? 'Loading options…' : 'Updating options…'}</span>
            </div>
          )}
          {initialLoad ? null : failed ? (
            <div className="select-error-proto" data-select-error="" role="status">
              {errorState}
            </div>
          ) : (
            <Listbox
              options={filtered}
              catalog={options}
              value={selected[0] ?? null}
              values={selected}
              multiple={multiple}
              size={size}
              activeValue={activeKey}
              onActiveValueChange={setActive}
              orphanLabels={orphanLabels}
              readOnly={readOnly || busy}
              aria-busy={busy || undefined}
              aria-label={typeof label === 'string' ? label : (props['aria-label'] ?? 'Options')}
              onValueChange={setSingle}
              onValuesChange={setMulti}
              externalFocus={searchFocused}
              emptyState={
                query ? (
                  <span className="select-empty-copy-proto">
                    <strong>No matches for “{query}”</strong>
                    <span>Try a different name or clear the search.</span>
                  </span>
                ) : (
                  emptyState
                )
              }
            />
          )}
        </SelectPanel>
      )}
    </div>
  );
  return label || description || message ? (
    <FormField
      label={label}
      description={description}
      message={disabled && status !== 'neutral' ? '' : (message ?? '')}
      required={required}
      status={effectiveStatus}
      htmlFor={controlId}
      descriptionId={description ? `${controlId}-description` : undefined}
      messageId={message ? `${controlId}-message` : undefined}
      feedbackIcon={false}
      hidden={hidden}
    >
      {content}
    </FormField>
  ) : (
    content
  );
}
