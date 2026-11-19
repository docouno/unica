import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode, RefObject } from 'react';
import { CalendarBlankIcon, XIcon } from '@phosphor-icons/react';
import { Input } from '../input/input.proto.js';
import type { ControlSize, FieldStatus, FieldVariant, InputProps } from '../input/input.proto.js';
import { PopoverContent } from '../popover/popover.proto.js';
import { Calendar } from './calendar.proto.js';
import type { CalendarFeedback } from './calendar.proto.js';
import {
  dateAvailability,
  dateLabel,
  numericDate,
  parseDate,
  rangeIssue,
} from './date-utils.proto.js';
import type { DateRange } from './date-utils.proto.js';
import './date-picker.css';
function datePlaceholder(locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  })
    .formatToParts(new Date('2026-09-16T12:00:00Z'))
    .map(({ type, value }) =>
      type === 'day' ? 'DD' : type === 'month' ? 'MM' : type === 'year' ? 'YYYY' : value,
    )
    .join('');
}

function defaultViewDate(today: string, min?: string, max?: string): string {
  return min && today < min ? min : max && today > max ? max : today;
}
export { Calendar } from './calendar.proto.js';
export type { CalendarProps } from './calendar.proto.js';

export interface DatePickerPanelProps extends HTMLAttributes<HTMLDivElement> {
  readonly title?: string | undefined;
  readonly feedback?: CalendarFeedback | undefined;
  readonly panelRef?: RefObject<HTMLDivElement | null> | undefined;
  readonly floating?: boolean | undefined;
}
// The in-flow form is for material comparisons. Live fields use a native top-layer popover.
export function DatePickerPanel({
  title,
  feedback,
  panelRef,
  floating,
  children,
  className = '',
  ...props
}: DatePickerPanelProps): ReactElement {
  return (
    <PopoverContent
      {...props}
      ref={panelRef}
      popover={floating ? 'manual' : undefined}
      className={`date-picker-panel-proto ${className}`}
      aria-label={title || 'Choose dates'}
    >
      {children}
      {feedback !== undefined && (
        <div
          className="date-picker-panel-feedback-proto"
          role="status"
          data-empty={!feedback.message || undefined}
          data-draft-prompt={feedback.draftPrompt}
          data-longest-preview={feedback.longestPreview}
        >
          <bdi>{feedback.message}</bdi>
        </div>
      )}
    </PopoverContent>
  );
}

function useDatePanel(
  open: boolean,
  onClose: () => void,
): {
  panel: RefObject<HTMLDivElement | null>;
  trigger: RefObject<HTMLButtonElement | null>;
  field: RefObject<HTMLDivElement | null>;
} {
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = panel.current;
    const button = trigger.current;
    if (!open || !element || !button || typeof element.showPopover !== 'function') {
      return;
    }
    element.showPopover();
    const position = (): void => {
      const bounds =
        field.current?.querySelector('.input-shell-proto')?.getBoundingClientRect() ??
        button.getBoundingClientRect();
      const size = element.getBoundingClientRect();
      const viewport = window.visualViewport;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      const topOffset = viewport?.offsetTop ?? 0;
      const leftOffset = viewport?.offsetLeft ?? 0;
      const start =
        getComputedStyle(button).direction === 'rtl' ? bounds.right - size.width : bounds.left;
      element.style.left = `${Math.max(leftOffset + 8, Math.min(start, leftOffset + width - size.width - 8))}px`;
      const above = Math.max(0, bounds.top - topOffset - 16);
      const below = Math.max(0, height + topOffset - bounds.bottom - 16);
      const desiredHeight = element.scrollHeight + 2;
      const useBelow = desiredHeight <= below || below >= above;
      const available = useBelow ? below : above;
      element.style.maxBlockSize = `${Math.max(44, available)}px`;
      const actualHeight = Math.min(desiredHeight, Math.max(44, available));
      element.style.top = `${useBelow ? bounds.bottom + 8 : Math.max(topOffset + 8, bounds.top - actualHeight - 8)}px`;
    };
    position();
    const observer = new ResizeObserver(position);
    observer.observe(element);
    window.addEventListener('resize', position);
    window.visualViewport?.addEventListener('resize', position);
    window.visualViewport?.addEventListener('scroll', position);
    window.addEventListener('scroll', position, true);
    const outside = (event: PointerEvent): void => {
      if (
        !element.contains(event.target as Node) &&
        !field.current?.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    const escape = (event: globalThis.KeyboardEvent): void => {
      const target = event.target as Node;
      if (
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        (element.contains(target) || field.current?.contains(target))
      ) {
        event.preventDefault();
        onClose();
        button.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', position);
      window.visualViewport?.removeEventListener('resize', position);
      window.visualViewport?.removeEventListener('scroll', position);
      window.removeEventListener('scroll', position, true);
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      if (element.matches(':popover-open')) {
        element.hidePopover();
      }
    };
  }, [open, onClose]);
  return { panel, trigger, field };
}

function useDraftText(
  source: string,
  initialText: string,
): readonly [string, (text: string, nextSource?: string) => void] {
  const [draft, setDraft] = useState({ source, text: initialText });
  return [
    draft.source === source ? draft.text : initialText,
    (text, nextSource = source) => setDraft({ source: nextSource, text }),
  ];
}

export interface DatePickerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> {
  readonly value?: string | undefined;
  readonly defaultValue?: string | undefined;
  readonly onValueChange?: ((value: string) => void) | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
  readonly disabled?: boolean | undefined;
  readonly readOnly?: boolean | undefined;
  readonly required?: boolean | undefined;
  readonly size?: ControlSize | undefined;
  readonly variant?: FieldVariant | undefined;
  readonly status?: FieldStatus | undefined;
  readonly loading?: boolean | undefined;
  readonly clearable?: boolean | undefined;
  readonly locale?: string | undefined;
  readonly today?: string | undefined;
  readonly min?: string | undefined;
  readonly max?: string | undefined;
  readonly unavailable?: readonly string[] | undefined;
  readonly previewState?: InputProps['previewState'];
  readonly previewText?: string | undefined;
  /** Keeps the open panel in document flow for side-by-side design inspection. */
  readonly previewInline?: boolean | undefined;
}

export function DatePicker({
  value,
  defaultValue = '',
  onValueChange,
  defaultOpen = false,
  label,
  description,
  message,
  disabled,
  readOnly,
  required,
  size = 'm',
  variant = 'default',
  status = 'neutral',
  loading,
  clearable,
  locale = 'en-GB',
  today = '2026-09-16',
  min,
  max,
  unavailable = [],
  previewState,
  previewText,
  previewInline,
  className = '',
  ...props
}: DatePickerProps): ReactElement {
  const id = useId();
  const [localValue, setLocalValue] = useState(defaultValue);
  const current = value ?? localValue;
  const viewDate = defaultViewDate(current || today, min, max);
  const textSource = (next: string): string => `${locale}|${next}`;
  const [text, setText] = useDraftText(
    textSource(current),
    previewText ?? numericDate(current, locale),
  );
  const [error, setError] = useState('');
  const [noAvailableDays, setNoAvailableDays] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const close = useCallback((): void => {
    setOpen(false);
  }, []);
  const { panel, trigger, field } = useDatePanel(open && !disabled && !previewInline, close);
  const update = (next: string): void => {
    setLocalValue(next);
    onValueChange?.(next);
    setText(numericDate(next, locale), textSource(next));
    setError('');
  };
  const validate = (draft: string): string => {
    if (!draft.trim()) {
      return required ? 'Enter a date.' : '';
    }
    const next = parseDate(draft, locale);
    if (!next) {
      return `Enter a real date, for example ${numericDate(today, locale)}.`;
    }
    if (min && next < min) {
      return `Choose ${dateLabel(min, locale)} or later.`;
    }
    if (max && next > max) {
      return `Choose ${dateLabel(max, locale)} or earlier.`;
    }
    if (unavailable.includes(next)) {
      return 'This date is unavailable. Choose another day.';
    }
    return '';
  };
  const validity = !readOnly && !disabled ? validate(text) : '';
  useLayoutEffect(() => {
    field.current?.querySelector('input')?.setCustomValidity(validity);
  }, [field, validity]);
  const pick = (next: string): void => {
    update(next);
    close();
    trigger.current?.focus();
  };
  const canChooseToday = !readOnly && !dateAvailability(today, { min, max, unavailable, locale });
  const calendarMessage = noAvailableDays
    ? 'No dates available this month'
    : readOnly
      ? 'Read only'
      : '';
  return (
    <div
      {...props}
      ref={field}
      className={`date-picker-proto ${className}`}
      data-open={(open && !disabled) || undefined}
      data-preview-inline={previewInline || undefined}
    >
      <Input
        id={id}
        label={label}
        description={description}
        message={error || message}
        status={error ? 'danger' : status}
        loading={loading}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        size={size}
        variant={variant}
        value={text}
        placeholder={datePlaceholder(locale)}
        previewState={previewState}
        aria-label={label ? undefined : props['aria-label'] || 'Date'}
        onInvalid={() => setError(validity)}
        onChange={(event) => {
          const draft = event.currentTarget.value;
          setText(draft);
          setError('');
          const parsed = parseDate(draft, locale);
          if (parsed && !validate(draft)) {
            setLocalValue(parsed);
            onValueChange?.(parsed);
            setText(draft, textSource(parsed));
          } else if (!draft) {
            setLocalValue('');
            onValueChange?.('');
            setText('', textSource(''));
          }
        }}
        onBlur={() => {
          if (readOnly || disabled) {
            return;
          }
          const issue = validate(text);
          setError(issue);
          if (!issue) {
            const parsed = parseDate(text, locale);
            if (parsed) {
              setText(numericDate(parsed, locale));
            }
          }
        }}
        onKeyDown={(event) => {
          if (event.altKey && event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
            requestAnimationFrame(() =>
              panel.current
                ?.querySelector<HTMLButtonElement>('.calendar-day-proto[tabindex="0"]')
                ?.focus(),
            );
          }
        }}
        suffix={
          <span className="date-field-actions-proto">
            {clearable && text && !readOnly && (
              <button
                className="date-action-proto"
                type="button"
                aria-label="Clear date"
                disabled={disabled}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  update('');
                  field.current?.querySelector('input')?.focus();
                }}
              >
                <XIcon size="1em" />
              </button>
            )}
            <button
              ref={trigger}
              className="date-action-proto"
              type="button"
              aria-label={
                open && !disabled ? 'Close calendar' : readOnly ? 'View calendar' : 'Select date'
              }
              aria-expanded={open && !disabled}
              aria-controls={`${id}-panel`}
              disabled={disabled}
              onClick={(event) => {
                if (open) {
                  close();
                  event.currentTarget.focus();
                  return;
                }
                setOpen(true);
                if (event.detail === 0) {
                  requestAnimationFrame(() =>
                    panel.current
                      ?.querySelector<HTMLButtonElement>('.calendar-day-proto[tabindex="0"]')
                      ?.focus(),
                  );
                }
              }}
            >
              <CalendarBlankIcon size="1em" />
            </button>
          </span>
        }
      />
      {open && !disabled && (
        <DatePickerPanel
          id={`${id}-panel`}
          floating={!previewInline}
          panelRef={panel}
          title={readOnly ? 'View date' : 'Select date'}
          feedback={{ message: calendarMessage }}
        >
          <Calendar
            key={viewDate.slice(0, 7)}
            month={viewDate}
            value={current}
            onViewAvailability={setNoAvailableDays}
            onToday={canChooseToday ? () => pick(today) : undefined}
            today={today}
            locale={locale}
            min={min}
            max={max}
            unavailable={unavailable}
            readOnly={readOnly}
            showFeedback={false}
            onSelect={pick}
          />
        </DatePickerPanel>
      )}
    </div>
  );
}

export interface DateRangePickerProps extends Omit<
  DatePickerProps,
  'value' | 'defaultValue' | 'onValueChange'
> {
  readonly value?: DateRange | undefined;
  readonly defaultValue?: DateRange | undefined;
  readonly onValueChange?: ((value: DateRange) => void) | undefined;
  readonly panelTitle?: string | undefined;
  readonly minRangeDays?: number | undefined;
  readonly maxRangeDays?: number | undefined;
  readonly allowUnavailableInRange?: boolean | undefined;
}
export function DateRangePicker({
  value,
  defaultValue = ['', ''],
  onValueChange,
  defaultOpen = false,
  label,
  description,
  message,
  disabled,
  readOnly,
  required,
  size = 'm',
  variant = 'default',
  status = 'neutral',
  loading,
  clearable,
  locale = 'en-GB',
  today = '2026-09-16',
  min,
  max,
  unavailable = [],
  previewState,
  previewText,
  previewInline,
  panelTitle = 'Choose date range',
  minRangeDays = 1,
  maxRangeDays,
  allowUnavailableInRange = false,
  className = '',
  ...props
}: DateRangePickerProps): ReactElement {
  const id = useId();
  const [localValue, setLocalValue] = useState<DateRange>(defaultValue);
  const current = value ?? localValue;
  const format = (range: DateRange): string =>
    range[0] && range[1]
      ? `${numericDate(range[0], locale)} – ${numericDate(range[1], locale)}`
      : '';
  const textSource = (next: DateRange): string => `${locale}|${next[0]}|${next[1]}`;
  const [text, setText] = useDraftText(textSource(current), previewText ?? format(current));
  const [error, setError] = useState('');
  const [calendarFeedback, setCalendarFeedback] = useState<CalendarFeedback>({ message: '' });
  const [open, setOpen] = useState(defaultOpen);
  const viewDate = defaultViewDate(current[0] || today, min, max);
  const focusCalendar = (): number =>
    requestAnimationFrame(() =>
      panel.current?.querySelector<HTMLButtonElement>('.calendar-day-proto[tabindex="0"]')?.focus(),
    );
  const close = useCallback((): void => {
    setOpen(false);
    setCalendarFeedback({ message: '' });
  }, []);
  const { panel, trigger, field } = useDatePanel(open && !disabled && !previewInline, close);
  const update = (next: DateRange): void => {
    setLocalValue(next);
    onValueChange?.(next);
    setText(format(next), textSource(next));
    setError('');
  };
  const validate = (range: DateRange): string =>
    rangeIssue(range, {
      min,
      max,
      unavailable,
      locale,
      minRangeDays,
      maxRangeDays,
      allowUnavailableInRange,
    });
  const parse = (draftText: string): DateRange | null => {
    const parts = draftText.trim().split(/\s*[–—]\s*|\s*\.\.\s*|\s+-\s+/);
    if (parts.length !== 2) {
      return null;
    }
    const from = parseDate(parts[0] || '', locale);
    const to = parseDate(parts[1] || '', locale);
    return from && to ? [from, to] : null;
  };
  const parsedText = parse(text);
  const validity =
    readOnly || disabled
      ? ''
      : !text.trim()
        ? required
          ? 'Enter a start and end date.'
          : ''
        : parsedText
          ? validate(parsedText)
          : 'Enter both dates with a four-digit year, separated by a dash.';
  useLayoutEffect(() => {
    field.current?.querySelector('input')?.setCustomValidity(validity);
  }, [field, validity]);
  const pick = (next: DateRange): void => {
    update(next);
    close();
    trigger.current?.focus();
  };
  return (
    <div
      {...props}
      ref={field}
      className={`date-picker-proto ${className}`}
      data-open={(open && !disabled) || undefined}
      data-preview-inline={previewInline || undefined}
    >
      <Input
        id={id}
        label={label}
        description={description}
        message={error || message}
        status={error ? 'danger' : status}
        loading={loading}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        size={size}
        variant={variant}
        value={text}
        previewState={previewState}
        placeholder={`${datePlaceholder(locale)} – ${datePlaceholder(locale)}`}
        aria-label={label ? undefined : props['aria-label'] || 'Date range'}
        onInvalid={() => setError(validity)}
        onChange={(event) => {
          const draftText = event.currentTarget.value;
          setText(draftText);
          setError('');
          const parsed = parse(draftText);
          if (parsed && !validate(parsed)) {
            setLocalValue(parsed);
            onValueChange?.(parsed);
            setText(draftText, textSource(parsed));
          } else if (!draftText) {
            setLocalValue(['', '']);
            onValueChange?.(['', '']);
            setText('', textSource(['', '']));
          }
        }}
        onBlur={() => {
          if (readOnly || disabled) {
            return;
          }
          if (!text.trim()) {
            setError(required ? 'Enter a start and end date.' : '');
            return;
          }
          const parsed = parse(text);
          if (!parsed) {
            setError('Enter both dates with a four-digit year, separated by a dash.');
          } else {
            const issue = validate(parsed);
            setError(issue);
            if (!issue) {
              setText(format(parsed));
            }
          }
        }}
        onKeyDown={(event) => {
          if (event.altKey && event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
            focusCalendar();
          }
        }}
        suffix={
          <span className="date-field-actions-proto">
            {clearable && text && !readOnly && (
              <button
                className="date-action-proto"
                type="button"
                aria-label="Clear date range"
                disabled={disabled}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  update(['', '']);
                  field.current?.querySelector('input')?.focus();
                }}
              >
                <XIcon size="1em" />
              </button>
            )}
            <button
              ref={trigger}
              className="date-action-proto"
              type="button"
              aria-label={
                open && !disabled
                  ? 'Close date range calendar'
                  : readOnly
                    ? 'View date range'
                    : 'Choose date range'
              }
              aria-expanded={open && !disabled}
              aria-controls={`${id}-panel`}
              disabled={disabled}
              onClick={(event) => {
                if (open) {
                  close();
                  event.currentTarget.focus();
                  return;
                }
                setOpen(true);
                if (event.detail === 0) {
                  focusCalendar();
                }
              }}
            >
              <CalendarBlankIcon size="1em" />
            </button>
          </span>
        }
      />
      {open && !disabled && (
        <DatePickerPanel
          id={`${id}-panel`}
          floating={!previewInline}
          panelRef={panel}
          title={readOnly && panelTitle === 'Choose date range' ? 'View date range' : panelTitle}
          feedback={calendarFeedback}
        >
          <Calendar
            key={textSource(current)}
            month={viewDate}
            initialActiveDate={viewDate}
            mode="range"
            range={current[0] && current[1] ? current : undefined}
            onFeedback={setCalendarFeedback}
            today={today}
            locale={locale}
            min={min}
            max={max}
            unavailable={unavailable}
            allowUnavailableInRange={allowUnavailableInRange}
            minRangeDays={minRangeDays}
            maxRangeDays={maxRangeDays}
            readOnly={readOnly}
            showFeedback={false}
            onRangeChange={pick}
          />
        </DatePickerPanel>
      )}
    </div>
  );
}
