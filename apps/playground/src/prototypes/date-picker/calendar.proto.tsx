import { useEffect, useId, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactElement } from 'react';
import { CaretDownIcon, CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import type { ControlSize } from '../input/input.proto.js';
import {
  addDays,
  addMonths,
  dateLabel,
  dateObject,
  dateAvailability,
  rangeIssue,
} from './date-utils.proto.js';
import type { DateRange } from './date-utils.proto.js';
import './date-picker.css';

export interface CalendarProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onSelect' | 'defaultValue'
> {
  readonly month?: string | undefined;
  readonly value?: string | undefined;
  readonly defaultValue?: string | undefined;
  readonly range?: DateRange | undefined;
  readonly mode?: 'single' | 'range' | undefined;
  readonly onSelect?: ((date: string) => void) | undefined;
  readonly onRangeChange?: ((range: DateRange) => void) | undefined;
  readonly today?: string | undefined;
  readonly size?: ControlSize | undefined;
  readonly numberOfMonths?: number | undefined;
  readonly layout?: 'months' | 'year' | undefined;
  readonly locale?: string | undefined;
  readonly weekStartsOn?: number | undefined;
  readonly min?: string | undefined;
  readonly max?: string | undefined;
  readonly unavailable?: readonly string[] | undefined;
  readonly allowUnavailableInRange?: boolean | undefined;
  readonly minRangeDays?: number | undefined;
  readonly maxRangeDays?: number | undefined;
  readonly indicators?: readonly string[] | undefined;
  readonly readOnly?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly onViewAvailability?: ((empty: boolean) => void) | undefined;
  readonly showFeedback?: boolean | undefined;
  readonly onPreview?: ((date: string) => void) | undefined;
  /** Pinned design studies; neither moves focus nor changes the actual selection. */
  readonly previewAnchor?: string | undefined;
  readonly previewCandidate?: string | undefined;
  readonly previewRange?: DateRange | undefined;
  readonly previewDates?: Readonly<Record<string, 'hover' | 'active' | 'focus'>> | undefined;
  readonly initialView?: 'days' | 'months' | 'years' | undefined;
  readonly initialActiveDate?: string | undefined;
}

export function Calendar({
  month = '2026-09',
  value,
  defaultValue = '',
  range,
  mode = 'single',
  onSelect,
  onRangeChange,
  today = '2026-09-16',
  size = 'm',
  numberOfMonths = 1,
  layout = 'months',
  locale = 'en-GB',
  weekStartsOn = 1,
  min,
  max,
  unavailable = [],
  allowUnavailableInRange = false,
  minRangeDays = 1,
  maxRangeDays,
  indicators = [],
  readOnly,
  disabled,
  onPreview,
  showFeedback = true,
  onViewAvailability,
  previewRange,
  previewAnchor,
  previewCandidate,
  previewDates,
  initialView = 'days',
  initialActiveDate,
  className = '',
  ...props
}: CalendarProps): ReactElement {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const [viewMonth, setViewMonth] = useState(`${month.slice(0, 7)}-01`);
  const [view, setView] = useState(initialView);
  const [localValue, setLocalValue] = useState(defaultValue);
  const [localRange, setLocalRange] = useState<DateRange | undefined>();
  const [anchor, setAnchor] = useState('');
  const [hovered, setHovered] = useState('');
  const [active, setActive] = useState(
    initialActiveDate ||
      value ||
      range?.[1] ||
      defaultValue ||
      (today.startsWith(month.slice(0, 7)) ? today : `${month.slice(0, 7)}-01`),
  );
  const [reason, setReason] = useState('');
  const selected = value ?? localValue;
  const currentRange = range ?? localRange;
  const pending =
    previewRange ??
    (anchor
      ? ([
          anchor < hovered ? anchor : hovered || anchor,
          anchor < hovered ? hovered : anchor,
        ] as DateRange)
      : undefined);
  const fixedPoint = previewAnchor || anchor;
  const candidate =
    previewCandidate ||
    (anchor && hovered !== anchor ? hovered : '') ||
    (previewRange && !previewAnchor ? previewRange[1] : '');
  const proposedRange = pending && pending[0] !== pending[1] ? pending : undefined;
  const ribbon = pending ?? currentRange;
  const date = dateObject(viewMonth);
  const year = date.getUTCFullYear();
  const monthIndex = date.getUTCMonth();
  const yearStart = Math.floor(year / 12) * 12;
  const count = layout === 'year' ? 12 : Math.min(12, Math.max(1, numberOfMonths));
  const navigation =
    view === 'years'
      ? { step: 144, label: '12 years' }
      : view === 'months' || layout === 'year'
        ? { step: 12, label: 'year' }
        : { step: 1, label: 'month' };
  const firstPeriod = view === 'years' ? yearStart : year;
  const lastPeriod = view === 'years' ? yearStart + 11 : year;
  const hasEarlierPeriod =
    navigation.step === 1
      ? viewMonth.slice(0, 7) > (min?.slice(0, 7) ?? '0001-01')
      : firstPeriod > Number(min?.slice(0, 4) ?? '0001');
  const hasLaterPeriod =
    navigation.step === 1
      ? viewMonth.slice(0, 7) < (max?.slice(0, 7) ?? '9999-12')
      : lastPeriod < Number(max?.slice(0, 4) ?? '9999');
  const constraints = {
    min,
    max,
    unavailable,
    locale,
    minRangeDays,
    maxRangeDays,
    allowUnavailableInRange,
  };
  const blockedReason = (day: string): string => dateAvailability(day, constraints);
  const visibleStart = layout === 'year' ? `${year}-01-01` : viewMonth;
  const visibleEnd = addMonths(visibleStart, count);
  const visibleDays = Math.round(
    (dateObject(visibleEnd).getTime() - dateObject(visibleStart).getTime()) / 86400000,
  );
  const noAvailability = Array.from({ length: visibleDays }, (_, index) =>
    addDays(visibleStart, index),
  ).every((day) => Boolean(blockedReason(day)));
  useEffect(() => {
    onViewAvailability?.(noAvailability);
  }, [noAvailability, onViewAvailability]);
  const rangeReason = (candidate: DateRange): string => rangeIssue(candidate, constraints);
  const pendingIssue =
    pending && (previewRange || (hovered && hovered !== anchor) || reason)
      ? rangeReason(pending)
      : '';
  const pick = (day: string): void => {
    if (disabled || readOnly || blockedReason(day)) {
      return;
    }
    if (mode === 'range' && !onSelect) {
      if (!anchor) {
        setAnchor(day);
        setHovered(day);
      } else {
        const next: DateRange = day < anchor ? [day, anchor] : [anchor, day];
        const error = rangeReason(next);
        if (error) {
          setReason(error);
          return;
        }
        setLocalRange(next);
        onRangeChange?.(next);
        setAnchor('');
        setHovered('');
      }
    } else {
      setLocalValue(day);
      onSelect?.(day);
    }
  };
  const switchView = (next: 'days' | 'months' | 'years'): void => {
    setView(next);
    requestAnimationFrame(() =>
      root.current
        ?.querySelector<HTMLButtonElement>(
          next === 'days'
            ? '.calendar-day-proto[tabindex="0"]'
            : '.calendar-period-proto[aria-pressed="true"]',
        )
        ?.focus(),
    );
  };
  const move = (offset: number): void => {
    const next = addMonths(viewMonth, offset);
    if (Number(next.slice(0, 4)) < 1 || Number(next.slice(0, 4)) > 9999) {
      return;
    }
    setViewMonth(next);
  };
  const focusDate = (day: string): void => {
    setActive(day);
    if (day < visibleStart || day >= visibleEnd) {
      setViewMonth(`${day.slice(0, 7)}-01`);
    }
    requestAnimationFrame(() =>
      root.current?.querySelector<HTMLButtonElement>(`[data-date="${day}"]`)?.focus(),
    );
  };
  const keyDay = (event: KeyboardEvent<HTMLButtonElement>, day: string): void => {
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const weekday = (dateObject(day).getUTCDay() - weekStartsOn + 7) % 7;
    let next = '';
    if (event.key === 'ArrowRight') {
      next = addDays(day, rtl ? -1 : 1);
    }
    if (event.key === 'ArrowLeft') {
      next = addDays(day, rtl ? 1 : -1);
    }
    if (event.key === 'ArrowDown') {
      next = addDays(day, 7);
    }
    if (event.key === 'ArrowUp') {
      next = addDays(day, -7);
    }
    if (event.key === 'Home') {
      next = addDays(day, -weekday);
    }
    if (event.key === 'End') {
      next = addDays(day, 6 - weekday);
    }
    if (event.key === 'PageDown' || event.key === 'PageUp') {
      const target = addMonths(
        day,
        (event.key === 'PageDown' ? 1 : -1) * (event.shiftKey ? 12 : 1),
      );
      const last = Number(addDays(addMonths(target, 1), -1).slice(8));
      next = `${target.slice(0, 8)}${String(Math.min(Number(day.slice(8)), last)).padStart(2, '0')}`;
    }
    if (next) {
      event.preventDefault();
      focusDate(next);
    }
  };
  const renderMonth = (base: string, index: number): ReactElement => {
    const first = dateObject(base);
    const offset = (first.getUTCDay() - weekStartsOn + 7) % 7;
    const headingId = `${id}-${index}`;
    return (
      <div className="calendar-month-proto" key={base}>
        {count > 1 && (
          <h4 id={headingId} className="calendar-month-title-proto">
            {dateLabel(base, locale, {
              day: undefined,
              month: 'long',
              year: layout === 'year' ? undefined : 'numeric',
            })}
          </h4>
        )}
        <div
          className="calendar-grid-proto"
          role="grid"
          aria-label={dateLabel(base, locale, { day: undefined, month: 'long', year: 'numeric' })}
        >
          <div role="row" className="calendar-week-proto calendar-weekdays-proto">
            {Array.from({ length: 7 }, (_, col) => (
              <span
                role="columnheader"
                key={col}
                className="calendar-weekday-proto"
                aria-label={dateLabel(addDays('2026-09-06', (weekStartsOn + col) % 7), locale, {
                  day: undefined,
                  month: undefined,
                  year: undefined,
                  weekday: 'long',
                })}
              >
                {dateLabel(addDays('2026-09-06', (weekStartsOn + col) % 7), locale, {
                  day: undefined,
                  month: undefined,
                  year: undefined,
                  weekday: 'short',
                }).slice(0, 2)}
              </span>
            ))}
          </div>
          {Array.from({ length: 6 }, (_, row) => (
            <div role="row" className="calendar-week-proto" key={row}>
              {Array.from({ length: 7 }, (_, col) => {
                const day = addDays(base, row * 7 + col - offset);
                const outside = day.slice(0, 7) !== base.slice(0, 7);
                const inRange = !outside && ribbon && day >= ribbon[0] && day <= ribbon[1];
                const start = inRange && day === ribbon?.[0];
                const end = inRange && day === ribbon?.[1];
                const proposedDay = Boolean(
                  pending && candidate && day === candidate && day !== fixedPoint,
                );
                const edge =
                  mode === 'range'
                    ? Boolean(fixedPoint && day === fixedPoint) || (!proposedDay && (start || end))
                    : day === selected;
                const committed =
                  mode === 'range'
                    ? Boolean(currentRange && day >= currentRange[0] && day <= currentRange[1])
                    : day === selected;
                const unavailableReason = blockedReason(day);
                const invalidPreview = pendingIssue;
                return (
                  <div
                    role="gridcell"
                    key={day}
                    className="calendar-cell-proto"
                    data-range={inRange || undefined}
                    data-start={start || undefined}
                    data-end={end || undefined}
                    data-preview-range={Boolean(proposedRange && inRange) || undefined}
                    data-invalid-range={Boolean(invalidPreview && inRange) || undefined}
                    aria-selected={!outside && committed}
                  >
                    {!outside && (
                      <button
                        type="button"
                        className="calendar-day-proto"
                        data-date={day}
                        data-edge={edge || undefined}
                        data-candidate={proposedDay || undefined}
                        data-actionable={
                          (!readOnly && !disabled && !unavailableReason) || undefined
                        }
                        data-today={day === today || undefined}
                        data-preview={previewDates?.[day]}
                        disabled={disabled}
                        aria-disabled={Boolean(unavailableReason) || undefined}
                        aria-current={day === today ? 'date' : undefined}
                        aria-label={`${dateLabel(day, locale, { weekday: 'long' })}${unavailableReason ? `, ${unavailableReason}` : ''}${indicators.includes(day) ? ', has events' : ''}`}
                        tabIndex={
                          day === active ||
                          (!(active >= visibleStart && active < visibleEnd) &&
                            index === 0 &&
                            day === base)
                            ? 0
                            : -1
                        }
                        onClick={() => pick(day)}
                        onKeyDown={(event) => keyDay(event, day)}
                        onFocus={() => {
                          setActive(day);
                          setHovered(day);
                          setReason(unavailableReason);
                          onPreview?.(day);
                        }}
                        onMouseEnter={() => {
                          setHovered(day);
                          setReason(unavailableReason);
                          onPreview?.(day);
                        }}
                      >
                        <span>{Number(day.slice(8))}</span>
                        {indicators.includes(day) && (
                          <i className="calendar-indicator-proto" aria-hidden="true" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };
  return (
    <div
      {...props}
      ref={root}
      className={`calendar-proto ${className}`}
      data-size={size}
      data-multiple={count > 1 || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      onKeyDownCapture={(event) => {
        if (event.key === 'Escape' && view !== 'days') {
          event.preventDefault();
          event.stopPropagation();
          switchView(view === 'years' && layout !== 'year' ? 'months' : 'days');
        }
      }}
    >
      <div className="calendar-heading-proto">
        <button
          type="button"
          className="calendar-nav-proto"
          aria-label={`Previous ${navigation.label}`}
          disabled={disabled || !hasEarlierPeriod}
          onClick={() => move(-navigation.step)}
        >
          <CaretLeftIcon className="calendar-arrow-proto" size="1em" />
        </button>
        <div className="calendar-heading-label-proto" aria-live="polite">
          {view === 'years' ? (
            <span>
              {yearStart} – {yearStart + 11}
            </span>
          ) : (
            <>
              {layout !== 'year' && view === 'days' && (
                <button
                  type="button"
                  disabled={disabled}
                  className="calendar-title-button-proto"
                  onClick={() => switchView('months')}
                >
                  {dateLabel(viewMonth, locale, { day: undefined, month: 'long', year: undefined })}
                  <CaretDownIcon size="0.7em" />
                </button>
              )}
              <button
                type="button"
                disabled={disabled}
                className="calendar-title-button-proto"
                onClick={() => switchView('years')}
              >
                {year}
                <CaretDownIcon size="0.7em" />
              </button>
            </>
          )}
        </div>
        <button
          type="button"
          className="calendar-nav-proto"
          aria-label={`Next ${navigation.label}`}
          disabled={disabled || !hasLaterPeriod}
          onClick={() => move(navigation.step)}
        >
          <CaretRightIcon className="calendar-arrow-proto" size="1em" />
        </button>
      </div>
      {view === 'days' ? (
        <div
          className="calendar-months-proto"
          data-year={layout === 'year' || undefined}
          onMouseLeave={() => {
            if (!previewRange) {
              setHovered('');
            }
            onPreview?.('');
            setReason('');
          }}
        >
          {Array.from({ length: count }, (_, index) =>
            renderMonth(addMonths(layout === 'year' ? `${year}-01-01` : viewMonth, index), index),
          )}
        </div>
      ) : (
        <div
          className="calendar-period-grid-proto"
          aria-label={view === 'months' ? 'Choose month' : 'Choose year'}
        >
          {Array.from({ length: 12 }, (_, index) => {
            const period =
              view === 'months'
                ? `${year}-${String(index + 1).padStart(2, '0')}-01`
                : `${yearStart + index}-${String(monthIndex + 1).padStart(2, '0')}-01`;
            const isSelected =
              view === 'months' ? index === monthIndex : yearStart + index === year;
            const periodDisabled =
              disabled ||
              Boolean(
                min &&
                (view === 'months'
                  ? period.slice(0, 7) < min.slice(0, 7)
                  : yearStart + index < Number(min.slice(0, 4))),
              ) ||
              Boolean(
                max &&
                (view === 'months'
                  ? period.slice(0, 7) > max.slice(0, 7)
                  : yearStart + index > Number(max.slice(0, 4))),
              );
            return (
              <button
                type="button"
                key={period}
                className="calendar-period-proto"
                aria-pressed={isSelected}
                disabled={periodDisabled}
                onClick={() => {
                  const periodDate =
                    view === 'years' &&
                    min &&
                    period < min &&
                    period.slice(0, 4) === min.slice(0, 4)
                      ? min
                      : view === 'years' &&
                          max &&
                          period > max &&
                          period.slice(0, 4) === max.slice(0, 4)
                        ? max
                        : period;
                  setViewMonth(`${periodDate.slice(0, 7)}-01`);
                  switchView(view === 'years' && layout !== 'year' ? 'months' : 'days');
                }}
              >
                {view === 'months'
                  ? dateLabel(period, locale, { day: undefined, month: 'short', year: undefined })
                  : yearStart + index}
              </button>
            );
          })}
        </div>
      )}
      {showFeedback &&
        (mode === 'range' || unavailable.length > 0 || readOnly || noAvailability) && (
          <div
            className="calendar-feedback-proto"
            aria-live="polite"
            data-error={Boolean(reason || pendingIssue) || undefined}
          >
            {reason ||
              pendingIssue ||
              (noAvailability ? 'No available dates in this view. Try another month.' : '') ||
              (readOnly
                ? 'Read only · browse without changing dates'
                : anchor
                  ? 'Choose an end date'
                  : mode === 'range'
                    ? 'Choose a start and end date'
                    : 'Unavailable dates cannot be selected')}
          </div>
        )}
    </div>
  );
}
