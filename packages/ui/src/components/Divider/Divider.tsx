import type { AriaAttributes, ComponentPropsWithRef, JSX } from 'react';
import './divider.css';

type Orientation = 'horizontal' | 'vertical';
type LabelPosition = 'start' | 'center' | 'end';
type DataValue = string | number | boolean | undefined;
type NameKey = 'aria-label' | 'aria-labelledby';
type RootElementProps = ComponentPropsWithRef<'div'>;
type PassiveKey = 'className' | 'dir' | 'hidden' | 'id' | 'lang' | 'ref' | 'style';

type DividerRootProps = Readonly<Pick<RootElementProps, PassiveKey>> & {
  readonly [key: `data-${string}`]: DataValue;
} & {
  readonly [Key in Exclude<keyof RootElementProps, PassiveKey | NameKey | 'key'>]?: never;
};

type SeparatorName = Readonly<Pick<AriaAttributes, NameKey>>;
type NoSeparatorName = { readonly [Key in NameKey]?: never };

type PlainDivider = {
  readonly orientation?: Orientation | undefined;
  readonly label?: never;
  readonly labelPosition?: never;
} & (
  | ({ readonly decorative: false } & SeparatorName)
  | ({ readonly decorative?: boolean | undefined } & NoSeparatorName)
);

type LabeledDivider = {
  readonly orientation?: 'horizontal' | undefined;
  readonly label: string;
  readonly labelPosition?: LabelPosition | undefined;
  readonly decorative?: never;
} & NoSeparatorName;

export type DividerProps = DividerRootProps & (PlainDivider | LabeledDivider);

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
  const data: Record<string, DataValue> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (
      key.startsWith('data-') &&
      !key.toLowerCase().startsWith('data-unica-divider-') &&
      (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    ) {
      data[key] = value;
    }
  }

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
      className={className ? `unica-divider ${className}` : 'unica-divider'}
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
