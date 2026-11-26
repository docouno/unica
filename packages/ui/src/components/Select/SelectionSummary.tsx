import { Fragment, useRef, useState } from 'react';
import type { JSX } from 'react';
import { dataFlag } from '../../core/cx.js';
import { getDefaultView } from '../../core/dom.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';

interface Props {
  readonly labels: readonly string[];
  readonly placeholder: string;
}

export function SelectionSummary({ labels, placeholder }: Props): JSX.Element {
  const summary = useRef<HTMLSpanElement | null>(null);
  const measureLabels = useRef<HTMLSpanElement | null>(null);
  const measureCount = useRef<HTMLSpanElement | null>(null);
  const [fit, setFit] = useState(labels.length);
  const signature = JSON.stringify(labels);

  useIsoLayoutEffect(() => {
    const node = summary.current;
    const prefix = measureLabels.current;
    const count = measureCount.current;
    if (!node || !prefix || !count) {
      setFit(1);
      return;
    }
    const view = getDefaultView(node.ownerDocument);
    if (!view) {
      return;
    }
    const measure = (): void => {
      const available = node.getBoundingClientRect().width;
      const origin = prefix.getBoundingClientRect().left;
      const gap = Number.parseFloat(view.getComputedStyle(node).columnGap) || 0;
      const widths = [...prefix.children].map(
        (item) => item.getBoundingClientRect().right - origin,
      );
      const counts = [...count.children].map((item) => item.getBoundingClientRect().width);
      const lastFit = widths.findLastIndex((width, index) => {
        const remaining = widths.length - index - 1;
        return (
          width + (remaining ? gap + (counts[String(remaining).length - 1] ?? 0) : 0) <= available
        );
      });
      setFit(Math.max(1, lastFit + 1));
    };
    measure();
    if (!view.ResizeObserver) {
      return;
    }
    const observer = new view.ResizeObserver(measure);
    observer.observe(node);
    observer.observe(prefix);
    observer.observe(count);
    return () => observer.disconnect();
  }, [signature]);

  const shown = Math.min(fit, labels.length);
  const remaining = labels.length - shown;
  return (
    <>
      <span className="unica-visually-hidden">
        {labels.length ? labels.join(', ') : placeholder}
      </span>
      <span
        ref={summary}
        className="unica-select-summary"
        data-unica-select-empty={dataFlag(!labels.length)}
        aria-hidden="true"
      >
        <span className="unica-select-labels" dir="auto">
          {labels.length ? labels.slice(0, shown).join(', ') : placeholder}
        </span>
        {remaining > 0 && (
          <bdi className="unica-select-count" dir="ltr">
            +{remaining}
          </bdi>
        )}
        {labels.length > 1 && (
          <>
            <span ref={measureLabels} className="unica-select-measure" dir="ltr">
              {labels.map((label, index) => (
                <Fragment key={index}>
                  {index > 0 && ', '}
                  <bdi>{label}</bdi>
                </Fragment>
              ))}
            </span>
            <span ref={measureCount} className="unica-select-measure">
              {Array.from({ length: String(labels.length - 1).length }, (_, index) => (
                <bdi key={index} className="unica-select-count" dir="ltr">
                  +{'0'.repeat(index + 1)}
                </bdi>
              ))}
            </span>
          </>
        )}
      </span>
    </>
  );
}
