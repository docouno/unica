import type { ReactElement, ReactNode } from 'react';
import { passiveRootAttributes } from '../../core/passiveRoot.js';
import type { PassiveRootProps } from '../../core/passiveRoot.js';
import { Icon } from '../Icon/Icon.js';
import type { GlyphSource } from '../Icon/glyph.js';
import './blockquote.css';

export type BlockquoteTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface BlockquoteProps extends PassiveRootProps {
  readonly size?: 's' | 'm' | 'l' | undefined;
  readonly tone?: BlockquoteTone | undefined;
  readonly attribution?: ReactNode;
  readonly citeUrl?: string | undefined;
  readonly iconLeft?: GlyphSource | undefined;
  readonly iconRight?: GlyphSource | undefined;
}

export function Blockquote({
  size = 'm',
  tone = 'neutral',
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
      {...passiveRootAttributes(props)}
      className={className ? `unica-blockquote ${className}` : 'unica-blockquote'}
      data-unica-blockquote-size={size}
      data-unica-blockquote-tone={tone}
    >
      <div className="unica-blockquote__body">
        {iconLeft && (
          <span
            className="unica-blockquote__glyph unica-blockquote__glyph--start"
            aria-hidden="true"
          >
            <Icon usage="slot" icon={iconLeft} size={size} />
          </span>
        )}
        <blockquote cite={citeUrl}>{children}</blockquote>
        {iconRight && (
          <span className="unica-blockquote__glyph unica-blockquote__glyph--end" aria-hidden="true">
            <Icon usage="slot" icon={iconRight} size={size} />
          </span>
        )}
      </div>
      {hasAttribution && <figcaption>{attribution}</figcaption>}
    </figure>
  );
}
