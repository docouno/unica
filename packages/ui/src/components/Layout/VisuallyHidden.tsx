import { createElement } from 'react';
import type { JSX } from 'react';
import { cx } from '../../core/cx.js';
import type { VisuallyHiddenProps, VisuallyHiddenTag } from './types.js';

export type { VisuallyHiddenProps } from './types.js';

/**
 * Renders content accessible to assistive technologies while hiding it visually via
 * `.unica-visually-hidden`.
 */
export function VisuallyHidden<Tag extends VisuallyHiddenTag = 'span'>({
  as,
  className,
  ...props
}: VisuallyHiddenProps<Tag>): JSX.Element {
  return createElement<Record<string, unknown>>(as ?? 'span', {
    ...props,
    className: cx('unica-visually-hidden', className),
  });
}
