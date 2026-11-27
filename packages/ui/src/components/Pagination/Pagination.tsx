import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { cx } from '../../core/cx.js';
import { nonBlank } from '../../core/passiveRoot.js';
import { useStateAuthority } from '../../core/useControllableState.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { CaretGlyph } from '../../internal/glyphs/index.js';
import { usePaginationFocus } from './focus.js';
import { normalizePage, pageDigits, pageWindow, resolveMessages } from './model.js';
import { PageTarget } from './PageTarget.js';
import type { PaginationProps } from './types.js';
import './pagination.css';

const reservedRootProps = /* @__PURE__ */ new Set([
  'aria-current',
  'aria-disabled',
  'children',
  'contenteditable',
  'dangerouslysetinnerhtml',
  'role',
  'tabindex',
]);

/** Navigates a collection with a known number of pages using buttons or native links. */
export function Pagination({
  pageCount,
  page,
  defaultPage = 1,
  onPageChange,
  getPageHref,
  renderLink,
  size = 'm',
  format = 'auto',
  messages,
  className,
  style,
  ref,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  ...props
}: PaginationProps): ReactElement | null {
  const linkHref = typeof getPageHref === 'function' ? getPageHref : undefined;
  const controlled = Boolean(linkHref) || page !== undefined;
  const hasRange = Number.isSafeInteger(pageCount) && pageCount > 0;
  const visible = hasRange && pageCount > 1;
  const [requested, { propose, restore }] = useStateAuthority({
    value: controlled ? normalizePage(page ?? 1) : undefined,
    defaultValue: normalizePage(defaultPage),
    onChange: linkHref ? undefined : onPageChange,
    allowModeSwitch: true,
  });
  const current = hasRange ? Math.min(pageCount, requested) : requested;
  const { track, targetRef } = usePaginationFocus(visible);

  useIsoLayoutEffect(() => {
    if (!controlled && current !== requested) {
      restore(current);
    }
  }, [controlled, current, requested, restore]);

  if (!visible) {
    return null;
  }

  const pages = pageWindow(current, pageCount);
  const strings = resolveMessages(messages);
  const totalText = pageDigits(pageCount, strings.digits);
  const places = String(pageCount).length;
  const samples = strings.digits.map((digit) => digit.repeat(places));
  const rootProps = Object.fromEntries(
    Object.entries(props).filter(([name]) => !reservedRootProps.has(name.toLowerCase())),
  );
  const geometry = { '--_pagination-slots': pages.length } as CSSProperties;

  function renderPosition(currentText: string): ReactNode {
    return strings.position.map((part, index) => {
      if (part === '{page}') {
        return (
          <strong key={index} className="unica-pagination-current-text">
            <bdi className="unica-pagination-digits">{currentText}</bdi>
          </strong>
        );
      }
      if (part === '{pageCount}') {
        return (
          <bdi key={index} className="unica-pagination-digits">
            {totalText}
          </bdi>
        );
      }
      return part;
    });
  }

  const target = { getPageHref: linkHref, renderLink, requestPage: propose };

  const numeralMetrics = (
    <span className="unica-pagination-numeral-metrics" aria-hidden="true">
      {samples.map((sample) => (
        <bdi key={sample} className="unica-pagination-digits">
          <span>{sample}</span>
          <strong>{sample}</strong>
        </bdi>
      ))}
    </span>
  );

  return (
    <nav
      {...rootProps}
      ref={ref}
      className={cx('unica-pagination', className)}
      style={style}
      aria-label={nonBlank(label) ?? 'Pagination'}
      aria-labelledby={nonBlank(labelledBy)}
      data-unica-pagination-size={size}
    >
      <div
        className="unica-pagination-layout"
        data-unica-pagination-format={format}
        style={geometry}
      >
        <div className="unica-pagination-ruler" aria-hidden="true">
          <div className="unica-pagination-budget">
            <div className="unica-pagination-measured-slot">{numeralMetrics}</div>
          </div>
        </div>
        <div className="unica-pagination-fit">
          <ul className="unica-pagination-track" ref={track} role="list">
            <li className="unica-pagination-step" data-unica-pagination-target="previous">
              <PageTarget
                {...target}
                ref={targetRef}
                page={current - 1}
                name={strings.previousPage}
                disabled={current === 1}
              >
                <CaretGlyph className="unica-pagination-arrow" direction="left" weight="bold" />
              </PageTarget>
            </li>
            <li className="unica-pagination-position">
              {samples.map((sample) => (
                <span
                  key={sample}
                  className="unica-pagination-position-metric"
                  aria-hidden="true"
                  dir="auto"
                >
                  {renderPosition(sample)}
                </span>
              ))}
              <span dir="auto">{renderPosition(pageDigits(current, strings.digits))}</span>
            </li>
            {pages.map((item) => {
              if (typeof item !== 'number') {
                return (
                  <li key={item} className="unica-pagination-gap" aria-hidden="true">
                    …
                  </li>
                );
              }

              const digits = pageDigits(item, strings.digits);
              return (
                <li
                  key={item}
                  className="unica-pagination-number"
                  data-unica-pagination-target={item}
                >
                  {item === 1 && numeralMetrics}
                  <PageTarget
                    {...target}
                    ref={targetRef}
                    page={item}
                    name={strings.pageLabel.replace('{page}', () => digits)}
                    current={item === current}
                  >
                    <bdi className="unica-pagination-digits">{digits}</bdi>
                  </PageTarget>
                </li>
              );
            })}
            <li className="unica-pagination-step" data-unica-pagination-target="next">
              <PageTarget
                {...target}
                ref={targetRef}
                page={current + 1}
                name={strings.nextPage}
                disabled={current === pageCount}
              >
                <CaretGlyph className="unica-pagination-arrow" direction="right" weight="bold" />
              </PageTarget>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
