import type {
  ComponentPropsWithRef,
  CSSProperties,
  MouseEventHandler,
  ReactElement,
  ReactNode,
  Ref,
} from 'react';
import type { SIZE, STATUS } from '../../consts.js';
import type { DataAttributeValue } from '../../core/passiveRoot.js';
import type { GlyphSource } from '../../core/glyph.js';
import type { ExactAxisSubset } from '../../types.js';
import type { AlertClose } from './Alert.js';
import type { ALERT_SIZE, ALERT_STATUS } from './consts.js';

export type AlertSize = ExactAxisSubset<typeof SIZE, typeof ALERT_SIZE>[keyof typeof ALERT_SIZE];

export type AlertStatus = ExactAxisSubset<
  typeof STATUS,
  typeof ALERT_STATUS
>[keyof typeof ALERT_STATUS];

type LiveAttribute = 'role' | 'aria-live' | 'aria-atomic' | 'aria-relevant';
type PassiveAttribute =
  | 'accessKey'
  | 'autoFocus'
  | 'contentEditable'
  | 'dangerouslySetInnerHTML'
  | 'focusable'
  | 'is'
  | 'popover'
  | 'tabIndex';

type DataAttributes = { readonly [name: `data-${string}`]: DataAttributeValue };
type ClosedAttributes<Key extends string> = { readonly [K in Key]?: never };
type Heading = 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

type PartProps<Tag extends 'div' | Heading> = Omit<
  ComponentPropsWithRef<Tag>,
  LiveAttribute | 'dangerouslySetInnerHTML'
> &
  ClosedAttributes<LiveAttribute | 'dangerouslySetInnerHTML'> &
  DataAttributes;

export type AlertProps = Omit<
  ComponentPropsWithRef<'div'>,
  LiveAttribute | PassiveAttribute | 'children' | 'title' | 'onClose'
> &
  ClosedAttributes<Exclude<LiveAttribute, 'role'> | PassiveAttribute | 'title' | 'onClose'> &
  DataAttributes & {
    readonly children: ReactNode;
    readonly size?: AlertSize | undefined;
    readonly status?: AlertStatus | undefined;
    readonly icon?: GlyphSource | null | false | undefined;
    readonly role?: 'alert' | 'status' | 'region' | 'none' | undefined;
    readonly close?: ReactElement<AlertCloseProps, typeof AlertClose> | null | false | undefined;
  };

export type AlertTitleProps =
  | (PartProps<'div'> & { readonly as?: 'div' | undefined })
  | (PartProps<Heading> & { readonly as: Heading });

export type AlertDescriptionProps = PartProps<'div'>;

export type AlertActionsProps = PartProps<'div'>;

export type AlertCloseProps = DataAttributes &
  ClosedAttributes<
    | LiveAttribute
    | 'aria-labelledby'
    | 'children'
    | 'onClick'
    | 'type'
    | 'form'
    | 'formAction'
    | 'formEncType'
    | 'formMethod'
    | 'formNoValidate'
    | 'formTarget'
  > & {
    readonly id?: string | undefined;
    readonly className?: string | undefined;
    readonly style?: CSSProperties | undefined;
    readonly ref?: Ref<HTMLButtonElement> | undefined;
    readonly 'aria-label': string;
    readonly onClose: MouseEventHandler<HTMLButtonElement>;
  };
