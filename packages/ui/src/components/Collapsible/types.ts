import type { ComponentPropsWithRef } from 'react';
import type { ControlSize } from '../../core/forms/fieldAxes.js';
import type { PanelAttributes } from '../../internal/disclosure/Panel.js';
import type { TriggerAttributes } from '../../internal/disclosure/Trigger.js';
import type { PanelPolicy } from '../../internal/disclosure/context.js';

export interface CollapsibleProps extends ComponentPropsWithRef<'div'>, PanelPolicy {
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  readonly disabled?: boolean | undefined;
  readonly size?: ControlSize | undefined;
  readonly contentId?: string | undefined;
}

export interface CollapsibleTriggerProps extends TriggerAttributes {
  readonly asChild?: boolean | undefined;
}

export type CollapsibleContentProps = PanelAttributes;
