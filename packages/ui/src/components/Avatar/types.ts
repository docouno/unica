import type { ComponentPropsWithRef, ReactElement } from 'react';
import type { DataAttributeValue } from '../../core/passiveRoot.js';
import type { AVATAR_SIZE } from './consts.js';

export type AvatarSize = (typeof AVATAR_SIZE)[keyof typeof AVATAR_SIZE];

type PassiveKey = 'id' | 'className' | 'style' | 'dir' | 'lang' | 'hidden' | 'inert' | 'ref';
type AvatarRootProps<Tag extends 'span' | 'ul'> = Readonly<
  Pick<ComponentPropsWithRef<Tag>, PassiveKey>
> & {
  readonly [key: `data-${string}`]: DataAttributeValue;
} & {
  readonly [Key in Exclude<keyof ComponentPropsWithRef<Tag>, PassiveKey | 'key'>]?: never;
};

interface PortraitProps {
  readonly src?: string | undefined;
  readonly srcSet?: string | undefined;
  readonly sizes?: string | undefined;
  readonly imagePosition?: string | undefined;
  readonly fallback?: string | ReactElement | undefined;
}

export interface AvatarProps extends AvatarRootProps<'span'>, PortraitProps {
  /** Accessible name for the identity. Pass an empty string beside a visible name. */
  readonly alt: string;
  /** Name used to generate initials. */
  readonly name?: string | undefined;
  readonly size?: AvatarSize | undefined;
}

interface AvatarGroupMember extends PortraitProps {
  readonly id: string;
  readonly name: string;
}

export interface AvatarGroupProps extends AvatarRootProps<'ul'> {
  readonly label: string;
  readonly members: readonly AvatarGroupMember[];
  readonly size?: Exclude<AvatarSize, '2xs'> | undefined;
  /** Maximum number of portraits before the additional overflow counter. */
  readonly max?: number | undefined;
  readonly showNames?: boolean | undefined;
  readonly getOverflowLabel?: ((count: number) => string) | undefined;
}
