import type { PaginationMessages } from './types.js';

export function normalizePage(page: number): number {
  return Number.isFinite(page) ? Math.max(1, Math.trunc(page)) : 1;
}

export function pageWindow(current: number, total: number): (number | 'start-gap' | 'end-gap')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'end-gap', total];
  }
  if (current >= total - 3) {
    return [1, 'start-gap', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, 'start-gap', current - 1, current, current + 1, 'end-gap', total];
}

// Freeze the Unicode 17 format and default-ignorable ranges for identical SSR and hydration.
const invisibleRanges = [
  [0xad, 0xad],
  [0x34f, 0x34f],
  [0x600, 0x605],
  [0x61c, 0x61c],
  [0x6dd, 0x6dd],
  [0x70f, 0x70f],
  [0x890, 0x891],
  [0x8e2, 0x8e2],
  [0x115f, 0x1160],
  [0x17b4, 0x17b5],
  [0x180b, 0x180f],
  [0x200b, 0x200f],
  [0x202a, 0x202e],
  [0x2060, 0x206f],
  [0x3164, 0x3164],
  [0xfe00, 0xfe0f],
  [0xfeff, 0xfeff],
  [0xffa0, 0xffa0],
  [0xfff0, 0xfffb],
  [0x110bd, 0x110bd],
  [0x110cd, 0x110cd],
  [0x13430, 0x1343f],
  [0x1bca0, 0x1bca3],
  [0x1d173, 0x1d17a],
  [0xe0000, 0xe0fff],
] as const;

function isPrintableDigit(digit: string): boolean {
  const codePoint = digit.codePointAt(0) ?? 0;
  return (
    !/[\s\p{Cc}\p{Cs}\p{Noncharacter_Code_Point}]/u.test(digit) &&
    !invisibleRanges.some(([start, end]) => codePoint >= start && codePoint <= end)
  );
}

const defaults: PaginationMessages = {
  previousPage: 'Previous page',
  nextPage: 'Next page',
  pageLabel: 'Page {page}',
  position: 'Page\u00a0{page} of\u00a0{pageCount}',
  digits: '0123456789',
};

function message(value: string | undefined, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function template(value: string | undefined, fallback: string, markers: readonly string[]): string {
  if (typeof value !== 'string') {
    return fallback;
  }
  const tokens: readonly string[] = value.match(/\{[^{}]*\}/gu) ?? [];
  const literal = value.replace(/\{[^{}]*\}/gu, '');
  return tokens.length === markers.length &&
    markers.every((marker) => tokens.includes(marker)) &&
    !/[{}]/u.test(literal)
    ? value
    : fallback;
}

interface ResolvedMessages extends Omit<PaginationMessages, 'position' | 'digits'> {
  readonly position: readonly string[];
  readonly digits: readonly string[];
}

export function resolveMessages(
  messages: Partial<PaginationMessages> | undefined,
): ResolvedMessages {
  const digits = typeof messages?.digits === 'string' ? Array.from(messages.digits) : [];
  const validDigits =
    digits.length === 10 && new Set(digits).size === 10 && digits.every(isPrintableDigit);

  return {
    previousPage: message(messages?.previousPage, defaults.previousPage),
    nextPage: message(messages?.nextPage, defaults.nextPage),
    pageLabel: template(messages?.pageLabel, defaults.pageLabel, ['{page}']),
    position: template(messages?.position, defaults.position, ['{page}', '{pageCount}']).split(
      /(\{page\}|\{pageCount\})/u,
    ),
    digits: validDigits ? digits : Array.from(defaults.digits),
  };
}

export function pageDigits(page: number, digits: readonly string[]): string {
  return String(page).replace(/[0-9]/gu, (digit) => digits[Number(digit)] ?? digit);
}
