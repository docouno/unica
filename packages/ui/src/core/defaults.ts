export type IconSize = 'inherit' | 's' | 'm' | 'l';

export type LinkSize =
  'inherit' | 'body-l' | 'body-m' | 'body-s' | 'caption-l' | 'caption-m' | 'caption-s';

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
