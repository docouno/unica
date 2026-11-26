import type { ComponentPropsWithRef, ReactNode } from 'react';
import type { ControlSize } from '../../core/forms/fieldAxes.js';
import type { PanelAttributes } from '../../internal/disclosure/Panel.js';
import type { TriggerAttributes } from '../../internal/disclosure/Trigger.js';
import type { PanelPolicy } from '../../internal/disclosure/context.js';

export interface AccordionProps
  extends Omit<ComponentPropsWithRef<'div'>, 'value' | 'defaultValue'>, PanelPolicy {
  readonly headingLevel: 2 | 3 | 4 | 5 | 6;
  readonly value?: readonly string[] | undefined;
  readonly defaultValue?: readonly string[] | undefined;
  readonly onValueChange?: ((value: readonly string[]) => void) | undefined;
  readonly exclusive?: boolean | undefined;
  readonly dividers?: boolean | undefined;
  readonly size?: ControlSize | undefined;
}

export interface AccordionItemProps extends Omit<ComponentPropsWithRef<'div'>, 'value'> {
  readonly value: string;
  readonly disabled?: boolean | undefined;
}

export interface AccordionTriggerProps extends Omit<TriggerAttributes, 'id'> {
  readonly id?: never;
  readonly action?: ReactNode;
}

export type AccordionContentProps = PanelAttributes;
