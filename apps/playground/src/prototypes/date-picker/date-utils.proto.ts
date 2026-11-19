// Calendar-only dates keep the visual preview independent of local time zones.
export type DateRange = readonly [string, string];
export function dateObject(value: string): Date {
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? new Date('2026-09-01T12:00:00Z') : date;
}
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
export function addDays(value: string, count: number): string {
  const date = dateObject(value);
  date.setUTCDate(date.getUTCDate() + count);
  return isoDate(date);
}
export function addMonths(value: string, count: number): string {
  const date = dateObject(`${value.slice(0, 7)}-01`);
  date.setUTCMonth(date.getUTCMonth() + count);
  return isoDate(date);
}
export function dateLabel(
  value: string,
  locale = 'en-GB',
  options?: Intl.DateTimeFormatOptions,
): string {
  return value
    ? new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
        ...options,
      }).format(dateObject(value))
    : '';
}
export function numericDate(value: string, locale = 'en-GB'): string {
  return value
    ? new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(dateObject(value))
    : '';
}
export function parseDate(text: string, locale = 'en-GB'): string | null {
  let value = text.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const match = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(value);
    if (!match) {
      return null;
    }
    const parts = new Intl.DateTimeFormat(locale).formatToParts(new Date('2026-09-14T12:00:00Z'));
    const monthFirst =
      parts.find((part) => part.type === 'month' || part.type === 'day')?.type === 'month';
    value = `${match[3]}-${String(monthFirst ? match[1] : match[2]).padStart(2, '0')}-${String(monthFirst ? match[2] : match[1]).padStart(2, '0')}`;
  }
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && isoDate(date) === value ? value : null;
}
export function rangeDays(range: DateRange): number {
  return (
    Math.round((dateObject(range[1]).getTime() - dateObject(range[0]).getTime()) / 86400000) + 1
  );
}

export function rangeDurationLabel(range: DateRange): string {
  if (!range[0] || !range[1]) {
    return 'No period';
  }
  const days = rangeDays(range);
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

export interface DateConstraints {
  readonly min?: string | undefined;
  readonly max?: string | undefined;
  readonly unavailable?: readonly string[] | undefined;
  readonly minRangeDays?: number | undefined;
  readonly maxRangeDays?: number | undefined;
  readonly allowUnavailableInRange?: boolean | undefined;
  readonly locale?: string | undefined;
}
export function dateAvailability(
  date: string,
  { min, max, unavailable = [], locale = 'en-GB' }: DateConstraints,
): string {
  if (!date) {
    return '';
  }
  if (min && date < min) {
    return `Available from ${dateLabel(min, locale)}`;
  }
  if (max && date > max) {
    return `Available through ${dateLabel(max, locale)}`;
  }
  return unavailable.includes(date) ? `${dateLabel(date, locale)} is unavailable` : '';
}
// Calendar tint, candidate feedback and typed validation share the same constraints.
export function rangeIssue(range: DateRange, constraints: DateConstraints): string {
  if (range[0] > range[1]) {
    return 'The end date must be on or after the start date.';
  }
  const endpointIssue =
    dateAvailability(range[0], constraints) || dateAvailability(range[1], constraints);
  if (endpointIssue) {
    return `${endpointIssue}.`;
  }
  const days = rangeDays(range);
  if (days < (constraints.minRangeDays ?? 1)) {
    return `Choose at least ${constraints.minRangeDays} days.`;
  }
  if (constraints.maxRangeDays && days > constraints.maxRangeDays) {
    return `Choose no more than ${constraints.maxRangeDays} days.`;
  }
  if (
    !constraints.allowUnavailableInRange &&
    constraints.unavailable?.some((day) => day >= range[0] && day <= range[1])
  ) {
    return 'This range includes an unavailable date.';
  }
  return '';
}
