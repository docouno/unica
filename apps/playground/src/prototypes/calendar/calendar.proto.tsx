import { useRef, useState } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { CalendarBlankIcon, CaretLeftIcon, CaretRightIcon, XIcon } from '@phosphor-icons/react';
import { Input } from '../input/input.proto.js';
import type { ControlSize, FieldVariant } from '../input/input.proto.js';
import { PopoverContent } from '../popover/popover.proto.js';
import '../select/select.css';
import './calendar.css';

export interface CalendarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  readonly month?: string | undefined;
  readonly selected?: number | undefined;
  readonly defaultSelected?: number | undefined;
  readonly range?: readonly [number, number] | undefined;
  readonly onSelect?: ((date: string) => void) | undefined;
  readonly disabled?: boolean | undefined;
}

const weekdays: readonly string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const shortMonths: readonly string[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function monthParts(value: string): readonly [number, number] {
  const match = /^(\d{4})-(\d{2})/.exec(value);
  return match ? [Number(match[1]), Math.max(0, Math.min(11, Number(match[2]) - 1))] : [2026, 8];
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function displayDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const [year, month] = monthParts(value);
  return `${value.slice(8, 10)} ${shortMonths[month]} ${year}`;
}

// A deterministic month grid with native day buttons, not a production date-picker state machine.
export function Calendar({
  month = '2026-09',
  selected,
  defaultSelected = 14,
  range,
  onSelect,
  disabled,
  className = '',
  ...props
}: CalendarProps): ReactElement {
  const [view, setView] = useState<readonly [number, number]>(() => monthParts(month));
  const [localDay, setLocalDay] = useState(defaultSelected);
  const [year, monthIndex] = view;
  const selectedDay = selected ?? localDay;
  const firstWeekday = (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const previousDays = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  const count = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const heading = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, monthIndex, 1)));
  const moveMonth = (offset: number): void => {
    const next = new Date(Date.UTC(year, monthIndex + offset, 1));
    setView([next.getUTCFullYear(), next.getUTCMonth()]);
  };
  return (
    <div {...props} className={`calendar-proto ${className}`}>
      <div className="calendar-heading-proto">
        <button
          type="button"
          className="field-icon-button-proto"
          aria-label="Previous month"
          disabled={disabled}
          onClick={() => moveMonth(-1)}
        >
          <CaretLeftIcon size="1em" className="calendar-arrow-proto" />
        </button>
        <strong>
          {shortMonths[monthIndex]} {year}
        </strong>
        <button
          type="button"
          className="field-icon-button-proto"
          aria-label="Next month"
          disabled={disabled}
          onClick={() => moveMonth(1)}
        >
          <CaretRightIcon size="1em" className="calendar-arrow-proto" />
        </button>
      </div>
      <div className="calendar-grid-proto">
        {weekdays.map((day) => (
          <span className="calendar-weekday-proto" key={day}>
            {day}
          </span>
        ))}
        {Array.from({ length: count }, (_, index) => {
          const day = index - firstWeekday + 1;
          const outside = day < 1 || day > daysInMonth;
          const label = day < 1 ? previousDays + day : day > daysInMonth ? day - daysInMonth : day;
          const inRange = !outside && range && day >= range[0] && day <= range[1];
          const edge =
            !outside && (range ? day === range[0] || day === range[1] : day === selectedDay);
          return (
            <button
              key={`${year}-${monthIndex}-${day}`}
              type="button"
              className="calendar-day-proto"
              disabled={disabled || outside}
              data-outside={outside || undefined}
              data-range={inRange || undefined}
              data-edge={edge || undefined}
              aria-pressed={edge || false}
              aria-label={`${label} ${heading}`}
              onClick={() => {
                setLocalDay(day);
                onSelect?.(isoDate(year, monthIndex, day));
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
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
  readonly disabled?: boolean | undefined;
  readonly size?: ControlSize | undefined;
  readonly variant?: FieldVariant | undefined;
  readonly clearable?: boolean | undefined;
}

export function DatePicker({
  value,
  defaultValue = '2027-01-15',
  onValueChange,
  defaultOpen = false,
  label,
  disabled,
  size = 'm',
  variant = 'default',
  clearable,
  className = '',
  onKeyDown,
  ...props
}: DatePickerProps): ReactElement {
  const [localValue, setLocalValue] = useState(defaultValue);
  const [open, setOpen] = useState(defaultOpen);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const current = value ?? localValue;
  const update = (next: string): void => {
    setLocalValue(next);
    onValueChange?.(next);
  };
  return (
    <div
      {...props}
      className={`date-picker-proto ${className}`}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (open && !disabled && event.key === 'Escape' && !event.defaultPrevented) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          toggleRef.current?.focus({ preventScroll: true });
        }
      }}
    >
      <Input
        label={label}
        disabled={disabled}
        size={size}
        variant={variant}
        value={displayDate(current)}
        aria-label={label ? undefined : 'Date'}
        onChange={(event) => update(event.currentTarget.value)}
        suffix={
          <span className="date-field-actions-proto">
            {clearable && current && (
              <button
                type="button"
                className="field-icon-button-proto"
                aria-label="Clear date"
                disabled={disabled}
                onClick={() => update('')}
              >
                <XIcon size="1em" />
              </button>
            )}
            <button
              ref={toggleRef}
              type="button"
              className="field-icon-button-proto"
              aria-label={open ? 'Hide calendar' : 'Choose date'}
              aria-expanded={open}
              disabled={disabled}
              onClick={() => setOpen(!open)}
            >
              <CalendarBlankIcon size="1em" />
            </button>
          </span>
        }
      />
      {open && !disabled && (
        <PopoverContent className="date-picker-panel-proto" aria-label="Choose a date">
          <Calendar
            month={current}
            selected={Number(current.slice(8, 10)) || undefined}
            onSelect={(next) => {
              update(next);
              setOpen(false);
            }}
          />
          <div className="calendar-footer-proto">Review due: {displayDate(current)}</div>
        </PopoverContent>
      )}
    </div>
  );
}

export interface DateRangePickerProps extends Omit<
  DatePickerProps,
  'value' | 'defaultValue' | 'onValueChange' | 'clearable'
> {
  readonly value?: readonly [string, string] | undefined;
  readonly defaultValue?: readonly [string, string] | undefined;
  readonly onValueChange?: ((value: readonly [string, string]) => void) | undefined;
  readonly panelTitle?: ReactNode;
}

export function DateRangePicker({
  value,
  defaultValue = ['2026-09-14', '2026-09-17'],
  onValueChange,
  panelTitle = 'Date range',
  defaultOpen = false,
  label,
  disabled,
  size = 'm',
  variant = 'default',
  className = '',
  ...props
}: DateRangePickerProps): ReactElement {
  const [localValue, setLocalValue] = useState<readonly [string, string]>(defaultValue);
  const [open, setOpen] = useState(defaultOpen);
  const [pickingEnd, setPickingEnd] = useState(false);
  const current = value ?? localValue;
  const update = (next: readonly [string, string]): void => {
    setLocalValue(next);
    onValueChange?.(next);
  };
  const pick = (next: string): void => {
    if (!pickingEnd) {
      update([next, next]);
      setPickingEnd(true);
    } else {
      update(next < current[0] ? [next, current[0]] : [current[0], next]);
      setPickingEnd(false);
      setOpen(false);
    }
  };
  return (
    <div {...props} className={`date-picker-proto ${className}`}>
      <Input
        label={label}
        disabled={disabled}
        size={size}
        variant={variant}
        value={`${displayDate(current[0])} – ${displayDate(current[1])}`}
        readOnly
        aria-label={label ? undefined : 'Date range'}
        suffix={
          <button
            type="button"
            className="field-icon-button-proto"
            aria-label={open ? 'Hide date range calendar' : 'Choose date range'}
            aria-expanded={open}
            disabled={disabled}
            onClick={() => setOpen(!open)}
          >
            <CalendarBlankIcon size="1em" />
          </button>
        }
      />
      {open && !disabled && (
        <PopoverContent className="date-picker-panel-proto" aria-label="Choose a date range">
          <div className="calendar-panel-heading-proto">
            <strong>{panelTitle}</strong>
            <button
              type="button"
              className="field-icon-button-proto"
              aria-label="Close date range"
              onClick={() => setOpen(false)}
            >
              <XIcon size="1em" />
            </button>
          </div>
          <div className="calendar-range-fields-proto">
            <Input
              size="s"
              variant="ghost"
              value={displayDate(current[0])}
              readOnly
              aria-label="Range start"
            />
            <span aria-hidden="true">–</span>
            <Input
              size="s"
              variant="ghost"
              value={displayDate(current[1])}
              readOnly
              aria-label="Range end"
            />
          </div>
          <Calendar
            month={current[0]}
            range={[Number(current[0].slice(8, 10)), Number(current[1].slice(8, 10))]}
            onSelect={pick}
          />
          <div className="calendar-footer-proto">
            {pickingEnd
              ? 'Choose the end date'
              : `${displayDate(current[0])} – ${displayDate(current[1])}`}
          </div>
        </PopoverContent>
      )}
    </div>
  );
}
