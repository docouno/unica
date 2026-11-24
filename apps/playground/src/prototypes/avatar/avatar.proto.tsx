import { useId, useState } from 'react';
import type { ComponentPropsWithRef, CSSProperties, ReactElement, ReactNode } from 'react';
import { UserGlyph } from '../control-glyphs.js';
import { Icon, Tooltip, TooltipProvider } from '@docouno/unica';
import './avatar.css';

export type AvatarSize = '2xs' | 'xs' | 's' | 'm' | 'l';
export type AvatarGroupSize = Exclude<AvatarSize, '2xs'>;

export interface AvatarProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  readonly alt: string;
  readonly name?: string;
  readonly size?: AvatarSize;
  readonly src?: string | undefined;
  readonly fallback?: ReactNode;
  readonly imagePosition?: string | undefined;
  /** Holds an image state for visual comparison; not a library API. */
  readonly previewStatus?: 'loading' | 'error' | undefined;
}

function initialsFor(name: string, compact: boolean): string {
  const words = name.trim().split(/\s+/u).filter(Boolean);
  const letter = (word: string): string => {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const first = [...segmenter.segment(word)][0];
    return first ? ([...segmenter.segment(first.segment.toUpperCase())][0]?.segment ?? '') : '';
  };
  if (!words[0]) {
    return '';
  }
  return letter(words[0]) + (!compact && words.length > 1 ? letter(words.at(-1) ?? '') : '');
}

function AvatarImage({
  src,
  imagePosition,
}: {
  readonly src: string;
  readonly imagePosition: string;
}): ReactElement {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      data-loaded={loaded || undefined}
      style={{ objectPosition: imagePosition }}
      ref={(image) => {
        if (image?.complete && image.naturalWidth > 0) {
          setLoaded(true);
        }
      }}
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(false)}
    />
  );
}

// Visual reference: native image loading is live; responsive image races belong to Wave 2.
export function Avatar({
  alt,
  name = '',
  size = 'm',
  src,
  fallback,
  imagePosition = '50% 50%',
  previewStatus,
  className = '',
  ...props
}: AvatarProps): ReactElement {
  const initials = initialsFor(name, size === '2xs');
  const mark = fallback ?? (initials || <Icon usage="slot" icon={UserGlyph} />);
  return (
    <span
      {...props}
      className={`avatar-proto ${className}`}
      data-size={size}
      data-preview-status={previewStatus}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      <span className="avatar-proto-fallback" aria-hidden="true" inert>
        {typeof mark === 'string' || typeof mark === 'number' ? (
          <span className="avatar-proto-initials">{mark}</span>
        ) : (
          mark
        )}
      </span>
      {src && !previewStatus && <AvatarImage key={src} src={src} imagePosition={imagePosition} />}
    </span>
  );
}

export interface AvatarGroupMember {
  readonly id: string;
  readonly name: string;
  readonly src?: string;
  readonly fallback?: ReactNode;
  readonly imagePosition?: string;
}

export interface AvatarGroupProps extends Omit<ComponentPropsWithRef<'ul'>, 'children'> {
  readonly label: string;
  readonly members: readonly AvatarGroupMember[];
  readonly size?: AvatarGroupSize;
  readonly max?: number;
  /** Opt-in name hints on hover and keyboard focus. */
  readonly showNames?: boolean;
  readonly getOverflowLabel?: (count: number) => string;
}

const groupGeometry: Record<AvatarGroupSize, { dimension: number; overlap: number }> = {
  xs: { dimension: 24, overlap: 4 },
  s: { dimension: 32, overlap: 4 },
  m: { dimension: 40, overlap: 6 },
  l: { dimension: 48, overlap: 8 },
};

// A true transparent cutout preserves the underlying surface, including live glass.
// The SVG mask is prototype machinery, not a prescribed production architecture.
export function AvatarGroup({
  label,
  members,
  size = 'm',
  max = 4,
  showNames = false,
  getOverflowLabel = (count) => `${String(count)} more ${count === 1 ? 'member' : 'members'}`,
  className = '',
  style,
  ...props
}: AvatarGroupProps): ReactElement | null {
  const maskId = `avatar-cutout-${useId().replaceAll(':', '')}`;
  if (members.length === 0) {
    return null;
  }
  const limit = Number.isInteger(max) && max > 0 ? max : 4;
  const visible = members.slice(0, limit);
  const remaining = members.length - visible.length;
  const { dimension, overlap } = groupGeometry[size];
  const gap = 2;
  const group = (
    <ul
      {...props}
      className={`avatar-group-proto ${className}`}
      aria-label={label}
      data-size={size}
      style={
        {
          '--avatar-overlap': `${String(overlap)}px`,
          '--avatar-cutout': `url(#${maskId})`,
          ...style,
        } as CSSProperties
      }
    >
      {visible.map((member, index) => {
        const name = member.name.trim();
        const identity = (
          <Avatar
            name={member.name}
            alt={showNames ? '' : member.name}
            src={member.src}
            fallback={member.fallback ?? (initialsFor(member.name, size === 'xs') || undefined)}
            imagePosition={member.imagePosition}
            size={size}
          />
        );
        return (
          <li key={member.id} className="avatar-group-proto-member">
            {index === 0 && (
              <svg className="avatar-group-proto-mask" aria-hidden="true" width="0" height="0">
                <defs>
                  <mask
                    id={maskId}
                    maskUnits="userSpaceOnUse"
                    x="0"
                    y="0"
                    width={dimension}
                    height={dimension}
                  >
                    <rect width={dimension} height={dimension} fill="white" />
                    <rect
                      className="avatar-group-proto-cutout"
                      y={-gap}
                      width={dimension + gap * 2}
                      height={dimension + gap * 2}
                      fill="black"
                    />
                  </mask>
                </defs>
              </svg>
            )}
            {showNames && name ? (
              <Tooltip label={name} collisionPadding={8}>
                <span className="avatar-name-hint" role="img" aria-label={name} tabIndex={0}>
                  {identity}
                </span>
              </Tooltip>
            ) : (
              identity
            )}
          </li>
        );
      })}
      {remaining > 0 && (
        <li className="avatar-group-proto-overflow" aria-label={getOverflowLabel(remaining)}>
          <span className="avatar-proto-initials" aria-hidden="true">
            +{remaining}
          </span>
        </li>
      )}
    </ul>
  );
  return <TooltipProvider delay={300}>{group}</TooltipProvider>;
}
