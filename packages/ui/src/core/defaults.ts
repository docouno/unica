import type { SIZE, TYPOGRAPHY_STEP } from '../consts.js';
import type { ExactAxisSubset } from '../types.js';

export const ICON_SIZE_VALUES = {
  inherit: 'inherit',
  s: 's',
  m: 'm',
  l: 'l',
} as const;

export const LINK_TYPOGRAPHY_STEP_VALUES = {
  'body-l': 'body-l',
  'body-m': 'body-m',
  'body-s': 'body-s',
  'caption-l': 'caption-l',
  'caption-m': 'caption-m',
  'caption-s': 'caption-s',
} as const;

export type IconSize = ExactAxisSubset<
  typeof SIZE,
  typeof ICON_SIZE_VALUES
>[keyof typeof ICON_SIZE_VALUES];

export type LinkSize =
  | 'inherit'
  | ExactAxisSubset<
      typeof TYPOGRAPHY_STEP,
      typeof LINK_TYPOGRAPHY_STEP_VALUES
    >[keyof typeof LINK_TYPOGRAPHY_STEP_VALUES];

export interface ComponentDefaultAxes {
  readonly Icon: {
    readonly size: IconSize;
  };
  readonly Link: {
    readonly size: LinkSize;
  };
}

export type UnicaComponentDefaults = {
  readonly [Family in keyof ComponentDefaultAxes]?:
    | {
        readonly [Axis in keyof ComponentDefaultAxes[Family]]?:
          ComponentDefaultAxes[Family][Axis] | undefined;
      }
    | undefined;
};
