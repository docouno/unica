import type { JSX } from 'react';
import { cx } from '../../core/cx.js';
import { pickConsumerDataAttributes } from '../../core/passiveRoot.js';
import type { DividerProps } from './types.js';
import './divider.css';

export type { DividerProps } from './types.js';

/**
 * Horizontal or vertical section separator with optional centered or aligned inline label.
 * Decorative by default; set `decorative={false}` to expose a semantic separator.
 */
export function Divider({
  orientation,
  label,
  labelPosition,
  decorative,
  'aria-label': name,
  'aria-labelledby': labelledBy,
  className,
  dir,
  hidden,
  id,
  lang,
  ref,
  style,
  ...rest
}: DividerProps): JSX.Element {
  const vertical = orientation === 'vertical';
  const text = !vertical && typeof label === 'string' && label.trim() ? label : undefined;
  const position = labelPosition === 'start' || labelPosition === 'end' ? labelPosition : 'center';
  const semantic = text === undefined && decorative === false;
  const naming = semantic ? { 'aria-label': name, 'aria-labelledby': labelledBy } : undefined;
  const data = pickConsumerDataAttributes(rest, 'data-unica-divider-');

  return (
    <div
      {...data}
      {...(vertical ? naming : undefined)}
      ref={ref}
      id={id}
      dir={dir}
      lang={lang}
      hidden={hidden}
      style={style}
      className={cx('unica-divider', className)}
      role={vertical && semantic ? 'separator' : undefined}
      aria-orientation={vertical && semantic ? 'vertical' : undefined}
      aria-hidden={text === undefined && !semantic ? true : undefined}
      data-unica-divider-orientation={vertical ? 'vertical' : 'horizontal'}
      data-unica-divider-label-position={text === undefined ? undefined : position}
    >
      {text !== undefined ? (
        <>
          {position !== 'start' && <span className="unica-divider-line" aria-hidden="true" />}
          <span className="unica-divider-label">{text}</span>
          {position !== 'end' && <span className="unica-divider-line" aria-hidden="true" />}
        </>
      ) : vertical ? (
        <span className="unica-divider-line" aria-hidden="true" />
      ) : (
        <hr className="unica-divider-line" {...naming} />
      )}
    </div>
  );
}
