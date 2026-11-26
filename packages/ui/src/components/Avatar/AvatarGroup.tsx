import type { ReactElement } from 'react';
import { cx } from '../../core/cx.js';
import { nonBlank, pickConsumerDataAttributes } from '../../core/passiveRoot.js';
import { VisuallyHidden } from '../Layout/VisuallyHidden.js';
import { Tooltip, TooltipProvider } from '../Tooltip/index.js';
import { AvatarFrame } from './Avatar.js';
import type { AvatarGroupProps } from './types.js';
import './avatar.css';

const DEFAULT_MAX = 4;

/** Shows a prefix of a named member list and the exact number of remaining members. */
export function AvatarGroup({
  label,
  members,
  size = 'm',
  max = DEFAULT_MAX,
  showNames = false,
  getOverflowLabel,
  id,
  className,
  dir,
  lang,
  hidden,
  inert,
  style,
  ref,
  ...rest
}: AvatarGroupProps): ReactElement | null {
  if (members.length === 0) {
    return null;
  }

  const limit = Number.isSafeInteger(max) && max > 0 ? max : DEFAULT_MAX;
  const visible = members.slice(0, limit);
  const remaining = members.length - visible.length;
  const overflowLabel =
    remaining > 0
      ? (nonBlank(getOverflowLabel?.(remaining)) ??
        `${String(remaining)} more ${remaining === 1 ? 'member' : 'members'}`)
      : undefined;
  const list = (
    <ul
      {...pickConsumerDataAttributes(rest, 'data-unica-avatar-')}
      id={id}
      className={cx('unica-avatar-group', className)}
      dir={dir}
      lang={lang}
      hidden={hidden}
      inert={inert}
      style={style}
      ref={ref}
      role="list"
      aria-label={nonBlank(label) ?? 'Members'}
      data-unica-avatar-size={size}
    >
      {visible.map(({ id: memberId, name, src, srcSet, sizes, imagePosition, fallback }) => {
        const fullName = nonBlank(name);
        const hint = showNames ? fullName : undefined;
        const identity = (
          <AvatarFrame
            name={name}
            alt={hint ? '' : name}
            size={size}
            compact={size === 'xs'}
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            imagePosition={imagePosition}
            fallback={fallback}
          />
        );
        return (
          <li key={memberId} className="unica-avatar-group-member">
            {hint ? (
              <Tooltip label={hint} collisionPadding={8}>
                <span
                  className="unica-avatar-group-anchor"
                  role="img"
                  aria-label={hint}
                  tabIndex={0}
                >
                  {identity}
                </span>
              </Tooltip>
            ) : (
              identity
            )}
          </li>
        );
      })}
      {overflowLabel !== undefined && (
        <li className="unica-avatar-group-overflow">
          <VisuallyHidden>{overflowLabel}</VisuallyHidden>
          <bdi className="unica-avatar-initials" aria-hidden="true" dir="ltr">
            +{remaining}
          </bdi>
        </li>
      )}
    </ul>
  );
  return <TooltipProvider delay={300}>{list}</TooltipProvider>;
}
