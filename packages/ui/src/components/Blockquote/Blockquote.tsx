import type { ReactElement } from 'react';
import { cx } from '../../core/cx.js';
import { passiveRootAttributes } from '../../core/passiveRoot.js';
import { Icon } from '../Icon/Icon.js';
import type { BlockquoteProps } from './types.js';
import './blockquote.css';

export type { BlockquoteProps, BlockquoteStatus } from './types.js';

/**
 * Editorial quotation rendered on a native `<figure>` + `<blockquote>` with optional attribution
 * and semantic status rail. Passive without live-region announcements.
 */
export function Blockquote({
  size = 'm',
  status = 'neutral',
  attribution,
  citeUrl,
  iconLeft,
  iconRight,
  className,
  children,
  ...props
}: BlockquoteProps): ReactElement {
  const hasAttribution =
    attribution !== null &&
    attribution !== undefined &&
    attribution !== '' &&
    typeof attribution !== 'boolean';

  return (
    <figure
      {...passiveRootAttributes<'figure'>(props)}
      className={cx('unica-blockquote', className)}
      data-unica-blockquote-size={size}
      data-unica-blockquote-status={status}
    >
      <div className="unica-blockquote-body">
        {iconLeft && (
          <span className="unica-blockquote-glyph unica-blockquote-glyph-start" aria-hidden="true">
            <Icon usage="slot" icon={iconLeft} size={size} />
          </span>
        )}
        <blockquote cite={citeUrl}>{children}</blockquote>
        {iconRight && (
          <span className="unica-blockquote-glyph unica-blockquote-glyph-end" aria-hidden="true">
            <Icon usage="slot" icon={iconRight} size={size} />
          </span>
        )}
      </div>
      {hasAttribution && <figcaption>{attribution}</figcaption>}
    </figure>
  );
}
