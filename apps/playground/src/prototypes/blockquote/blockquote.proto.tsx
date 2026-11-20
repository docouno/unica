import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { Icon } from '@docouno/unica';
import type { GlyphSource } from '@docouno/unica';
import './blockquote.css';

export type BlockquoteTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface BlockquoteProps extends Omit<
  ComponentPropsWithRef<'figure'>,
  'dangerouslySetInnerHTML'
> {
  readonly size?: 's' | 'm' | 'l';
  readonly tone?: BlockquoteTone;
  readonly attribution?: ReactNode;
  readonly citeUrl?: string;
  readonly iconLeft?: GlyphSource;
  readonly iconRight?: GlyphSource;
}

// The anatomy demonstrates the reading experience, not a final package API.
export function Blockquote({
  size = 'm',
  tone = 'neutral',
  attribution,
  citeUrl,
  iconLeft,
  iconRight,
  className = '',
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
      {...props}
      className={`blockquote-proto ${className}`}
      data-size={size}
      data-tone={tone}
      data-leading-icon={Boolean(iconLeft) || undefined}
      data-trailing-icon={Boolean(iconRight) || undefined}
    >
      <div className="blockquote-body-proto">
        {iconLeft && (
          <span className="blockquote-glyph-proto" aria-hidden="true">
            <Icon usage="slot" icon={iconLeft} size={size} />
          </span>
        )}
        <blockquote cite={citeUrl}>{children}</blockquote>
        {iconRight && (
          <span className="blockquote-glyph-proto blockquote-glyph-end-proto" aria-hidden="true">
            <Icon usage="slot" icon={iconRight} size={size} />
          </span>
        )}
      </div>
      {hasAttribution && <figcaption>{attribution}</figcaption>}
    </figure>
  );
}
