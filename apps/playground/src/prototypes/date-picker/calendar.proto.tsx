import { useEffect, useId, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactElement } from 'react';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import type { ControlSize } from '../input/input.proto.js';
import {
  addDays,
  addMonths,
  dateLabel,
  dateObject,
  dateAvailability,
  rangeDurationLabel,
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
  readonly onFeedback?: ((issue: string, message: string) => void) | undefined;
  readonly onToday?: (() => void) | undefined;
  readonly previewAnchor?: string | undefined;
  readonly previewCandidate?: string | undefined;
  readonly previewRange?: DateRange | undefined;
  readonly previewDates?: Readonly<Record<string, 'hover' | 'active' | 'focus'>> | undefined;
  readonly initialView?: 'days' | 'months' | 'years' | undefined;
  readonly initialActiveDate?: string | undefined;
}

function dayInMonth(day: string, month: string): string {
  const last = Number(addDays(addMonths(month, 1), -1).slice(8));
  return `${month.slice(0, 7)}-${String(Math.min(Number(day.slice(8)), last)).padStart(2, '0')}`;
}

function orderedRange(first: string, second: string): DateRange {
  return first <= second ? [first, second] : [second, first];
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
  onFeedback,
  onToday,
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
  const [yearStart, setYearStart] = useState(() => Math.floor(Number(month.slice(0, 4)) / 12) * 12);
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
  const [rejectedDate, setRejectedDate] = useState('');
  const selected = value ?? localValue;
  const currentRange = range ?? localRange;
  const fixedPoint = previewAnchor || anchor;
  const inspectedDate = previewCandidate || hovered;
  const canPreview = fixedPoint && inspectedDate && inspectedDate !== fixedPoint;
  const pending =
    readOnly || disabled
      ? undefined
      : (previewRange ?? (canPreview ? orderedRange(fixedPoint, inspectedDate) : undefined));
  const date = dateObject(viewMonth);
  const year = date.getUTCFullYear();
  const monthIndex = date.getUTCMonth();
  const count = layout === 'year' ? 12 : Math.min(12, Math.max(1, numberOfMonths));
  const navigation =
    view === 'years'
      ? { step: 144, label: '12 years' }
      : layout === 'year'
        ? { step: 12, label: 'year' }
        : { step: 1, label: 'month' };
  const firstPeriod = view === 'years' ? yearStart : year;
  const lastPeriod = view === 'years' ? yearStart + 11 : year;
  const minYear = Number(min?.slice(0, 4) ?? '0001');
  const maxYear = Number(max?.slice(0, 4) ?? '9999');
  const hasEarlierPeriod =
    navigation.step === 1
      ? viewMonth.slice(0, 7) > (min?.slice(0, 7) ?? '0001-01')
      : firstPeriod > minYear;
  const hasLaterPeriod =
    navigation.step === 1
      ? viewMonth.slice(0, 7) < (max?.slice(0, 7) ?? '9999-12')
      : lastPeriod < maxYear;
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
  const issueFor = (day: string, candidate?: DateRange): string =>
    blockedReason(day) || (candidate ? rangeIssue(candidate, constraints) : '');
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
  const inspectedIssue = disabled ? '' : issueFor(inspectedDate, pending);
  const rejectedIssue =
    !readOnly && !disabled && rejectedDate
      ? issueFor(rejectedDate, fixedPoint ? orderedRange(fixedPoint, rejectedDate) : undefined)
      : '';
  const feedbackIssue = rejectedIssue || inspectedIssue;
  const feedbackDate = rejectedIssue ? rejectedDate : inspectedDate;
  const proposedRange = pending && !inspectedIssue ? pending : undefined;
  const previewLabel = proposedRange ? `Preview · ${rangeDurationLabel(proposedRange)}` : '';
  const rangePrompt = anchor ? 'Choose a second date' : 'Choose a first date';
  const feedback =
    feedbackIssue ||
    (noAvailability
      ? 'No dates available in this view'
      : readOnly
        ? currentRange
          ? `${rangeDurationLabel(currentRange)} · Read only`
          : 'Read only'
        : mode === 'range'
          ? previewLabel || rangePrompt
          : 'Unavailable dates cannot be selected');
  const firstDateLabel = dateLabel(anchor, locale, {
    year: Number(anchor.slice(0, 4)) === year ? undefined : 'numeric',
  });
  const feedbackMessage = firstDateLabel ? `First ${firstDateLabel} · ${feedback}` : feedback;
  useEffect(() => {
    onFeedback?.(feedbackIssue, feedbackMessage);
  }, [onFeedback, feedbackIssue, feedbackMessage]);
  const pick = (day: string): void => {
    if (disabled || readOnly) {
      return;
    }
    const next = mode === 'range' && anchor ? orderedRange(anchor, day) : undefined;
    if (issueFor(day, next)) {
      setHovered(day);
      setRejectedDate(day);
      return;
    }
    setRejectedDate('');
    if (mode === 'range') {
      if (!next) {
        setAnchor(day);
        setHovered(day);
      } else {
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
  const switchView = (next: 'days' | 'months' | 'years', returnTo?: 'months' | 'years'): void => {
    if (next === 'years') {
      setYearStart(Math.floor(year / 12) * 12);
    }
    setView(next);
    setHovered('');
    requestAnimationFrame(() => {
      const calendar = root.current;
      const selector = returnTo
        ? `.calendar-title-button-proto[data-period="${returnTo}"]`
        : next === 'days'
          ? '.calendar-day-proto[tabindex="0"]'
          : '.calendar-period-proto[aria-pressed="true"]:not(:disabled)';
      const focus =
        calendar?.querySelector<HTMLButtonElement>(selector) ??
        calendar?.querySelector<HTMLButtonElement>('.calendar-period-proto:not(:disabled)');
      focus?.focus();
    });
  };
  const move = (offset: number): void => {
    if (view === 'years') {
      const next = yearStart + offset / 12;
      setYearStart(next);
      const atBoundary = offset < 0 ? next <= minYear : next + 11 >= maxYear;
      if (atBoundary) {
        requestAnimationFrame(() => {
          const years = root.current?.querySelectorAll<HTMLButtonElement>(
            '.calendar-period-proto:not(:disabled)',
          );
          (offset < 0 ? years?.[years.length - 1] : years?.[0])?.focus();
        });
      }
      return;
    }
    const next = addMonths(viewMonth, offset);
    if (Number(next.slice(0, 4)) < 1 || Number(next.slice(0, 4)) > 9999) {
      return;
    }
    setHovered('');
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
      next = dayInMonth(day, target);
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
                const acceptedDay =
                  currentRange && day >= currentRange[0] && day <= currentRange[1];
                const acceptedEdge = day === currentRange?.[0] || day === currentRange?.[1];
                const coveredByPreview =
                  proposedRange && day >= proposedRange[0] && day <= proposedRange[1];
                const band = acceptedDay ? currentRange : proposedRange;
                const inRange = !outside && (acceptedDay || coveredByPreview);
                const start =
                  inRange && day === band?.[0] && !(coveredByPreview && proposedRange[0] < day);
                const end =
                  inRange && day === band?.[1] && !(coveredByPreview && proposedRange[1] > day);
                const proposedDay =
                  coveredByPreview && day === inspectedDate && day !== fixedPoint && !acceptedEdge;
                const isFixed = fixedPoint === day;
                const draftAnchor = isFixed && currentRange && !acceptedEdge;
                const rejected = !readOnly && !disabled && day === feedbackDate && feedbackIssue;
                const edge =
                  mode === 'range' ? acceptedEdge || (isFixed && !currentRange) : day === selected;
                const committed = mode === 'range' ? Boolean(acceptedDay) : day === selected;
                const unavailableReason = blockedReason(day);
                return (
                  <div
                    role="gridcell"
                    key={day}
                    className="calendar-cell-proto"
                    data-range={inRange || undefined}
                    data-start={start || undefined}
                    data-end={end || undefined}
                    data-preview-range={Boolean(inRange && !acceptedDay) || undefined}
                    aria-selected={!outside && committed}
                  >
                    {!outside && (
                      <button
                        type="button"
                        className="calendar-day-proto"
                        data-date={day}
                        data-edge={edge || undefined}
                        data-candidate={proposedDay || undefined}
                        data-draft-anchor={Boolean(draftAnchor) || undefined}
                        data-rejected={Boolean(rejected) || undefined}
                        data-actionable={
                          (!readOnly && !disabled && !unavailableReason) || undefined
                        }
                        data-today={day === today || undefined}
                        data-preview={previewDates?.[day]}
                        disabled={disabled}
                        aria-disabled={Boolean(unavailableReason) || undefined}
                        aria-current={day === today ? 'date' : undefined}
                        aria-label={`${dateLabel(day, locale, { weekday: 'long' })}${isFixed && (anchor || !currentRange) ? ', start date' : ''}${unavailableReason ? `, ${unavailableReason}` : ''}${indicators.includes(day) ? ', has events' : ''}`}
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
                        }}
                        onMouseEnter={() => setHovered(day)}
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
        {count === 1 && onToday && !readOnly && !disabled && (
          <button
            type="button"
            className="date-picker-today-proto"
            onFocus={() => setHovered('')}
            onMouseEnter={() => setHovered('')}
            onClick={onToday}
          >
            Today
          </button>
        )}
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
          switchView('days', view);
        }
      }}
    >
      <div className="calendar-heading-proto">
        {view !== 'months' && (
          <button
            type="button"
            className="calendar-nav-proto"
            aria-label={`Previous ${navigation.label}`}
            disabled={disabled || !hasEarlierPeriod}
            onClick={() => move(-navigation.step)}
          >
            <CaretLeftIcon className="calendar-arrow-proto" size="1em" />
          </button>
        )}
        <div className="calendar-heading-label-proto" aria-live="polite">
          {view === 'years' ? (
            <span>
              {yearStart} – {yearStart + 11}
            </span>
          ) : view === 'months' ? (
            <span>{year}</span>
          ) : (
            <>
              {layout !== 'year' && (
                <button
                  type="button"
                  disabled={disabled}
                  className="calendar-title-button-proto"
                  data-period="months"
                  onClick={() => switchView('months')}
                >
                  {dateLabel(viewMonth, locale, { day: undefined, month: 'long', year: undefined })}
                </button>
              )}
              <button
                type="button"
                disabled={disabled}
                className="calendar-title-button-proto"
                data-period="years"
                onClick={() => switchView('years')}
              >
                {year}
              </button>
            </>
          )}
        </div>
        {view !== 'months' && (
          <button
            type="button"
            className="calendar-nav-proto"
            aria-label={`Next ${navigation.label}`}
            disabled={disabled || !hasLaterPeriod}
            onClick={() => move(navigation.step)}
          >
            <CaretRightIcon className="calendar-arrow-proto" size="1em" />
          </button>
        )}
      </div>
      {view === 'days' ? (
        <div
          className="calendar-months-proto"
          data-year={layout === 'year' || undefined}
          onMouseLeave={() => setHovered('')}
        >
          {Array.from({ length: count }, (_, index) =>
            renderMonth(addMonths(layout === 'year' ? `${year}-01-01` : viewMonth, index), index),
          )}
        </div>
      ) : (
        <div
          className="calendar-period-grid-proto"
          role="group"
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
              (view === 'months'
                ? Boolean(
                    (min && period.slice(0, 7) < min.slice(0, 7)) ||
                    (max && period.slice(0, 7) > max.slice(0, 7)),
                  )
                : yearStart + index < minYear || yearStart + index > maxYear);
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
                  const nextDay = dayInMonth(active, periodDate);
                  setActive(min && nextDay < min ? min : max && nextDay > max ? max : nextDay);
                  switchView('days');
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
        view === 'days' &&
        (mode === 'range' ||
          min ||
          max ||
          unavailable.length > 0 ||
          readOnly ||
          noAvailability) && (
          <div
            className="calendar-feedback-proto"
            aria-live="polite"
            data-error={Boolean(feedbackIssue) || undefined}
          >
            <bdi>{feedbackMessage}</bdi>
          </div>
        )}
    </div>
  );
}
