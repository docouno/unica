import type { ComponentPropsWithRef } from 'react';
import type { ORIENTATION, SIZE } from '../../consts.js';
import type { GlyphSource } from '../../core/glyph.js';
import type { ExactAxisSubset } from '../../types.js';
import type { Responsive } from '../Layout/index.js';
import type {
  TABS_ACTIVATION_MODE,
  TABS_DISTRIBUTION,
  TABS_MOUNT_STRATEGY,
  TABS_SIZE,
} from './consts.js';

export type TabsSize = ExactAxisSubset<typeof SIZE, typeof TABS_SIZE>[keyof typeof TABS_SIZE];
export type TabsOrientation = (typeof ORIENTATION)[keyof typeof ORIENTATION];
export type TabsActivationMode = (typeof TABS_ACTIVATION_MODE)[keyof typeof TABS_ACTIVATION_MODE];
export type TabsMountStrategy = (typeof TABS_MOUNT_STRATEGY)[keyof typeof TABS_MOUNT_STRATEGY];
export type TabsDistribution = (typeof TABS_DISTRIBUTION)[keyof typeof TABS_DISTRIBUTION];

type DivProps = ComponentPropsWithRef<'div'>;
type ButtonProps = ComponentPropsWithRef<'button'>;
type Forbidden<Keys extends string> = { readonly [Key in Keys]?: never };
type DivHost<Keys extends string> = Omit<DivProps, Keys> & Forbidden<Keys>;

type Name =
  | { readonly 'aria-label': string; readonly 'aria-labelledby'?: string | undefined }
  | { readonly 'aria-label'?: string | undefined; readonly 'aria-labelledby': string };

export interface TabsProps extends Omit<DivHost<'dangerouslySetInnerHTML'>, 'defaultValue'> {
  readonly value?: string | undefined;
  readonly defaultValue?: string | undefined;
  readonly size?: TabsSize | undefined;
  readonly orientation?: TabsOrientation | undefined;
  readonly activationMode?: TabsActivationMode | undefined;
  readonly mountStrategy?: TabsMountStrategy | undefined;
  readonly onValueChange?: ((value: string) => void) | undefined;
}

export interface TabsListMessages {
  readonly scrollBack?: string | undefined;
  readonly scrollForward?: string | undefined;
}

export type TabsListProps = DivHost<
  'aria-orientation' | 'dangerouslySetInnerHTML' | 'role' | 'tabIndex'
> &
  Name & {
    readonly distribution?: Responsive<TabsDistribution> | undefined;
    readonly messages?: TabsListMessages | undefined;
  };

type TriggerOwned =
  | 'aria-controls'
  | 'aria-disabled'
  | 'aria-hidden'
  | 'aria-selected'
  | 'asChild'
  | 'command'
  | 'commandFor'
  | 'dangerouslySetInnerHTML'
  | 'hidden'
  | 'href'
  | 'id'
  | 'inert'
  | 'name'
  | 'popoverTarget'
  | 'popoverTargetAction'
  | 'role'
  | 'tabIndex'
  | 'type';

type TriggerLabel =
  | { readonly children: string; readonly iconLeft?: GlyphSource | undefined }
  | {
      readonly children?: undefined;
      readonly iconLeft: GlyphSource;
      readonly 'aria-label': string;
      readonly 'aria-labelledby'?: never;
    };

export type TabsTriggerProps = Omit<ButtonProps, TriggerOwned | 'children' | 'disabled' | 'value'> &
  Forbidden<TriggerOwned> &
  TriggerLabel & {
    readonly value: string;
    readonly disabled?: boolean | undefined;
    readonly count?: number | string | undefined;
    readonly countLabel?: string | undefined;
  };

export interface TabsPanelProps extends DivHost<
  | 'aria-hidden'
  | 'aria-label'
  | 'aria-labelledby'
  | 'dangerouslySetInnerHTML'
  | 'hidden'
  | 'id'
  | 'role'
> {
  readonly value: string;
  readonly mountStrategy?: TabsMountStrategy | undefined;
}
