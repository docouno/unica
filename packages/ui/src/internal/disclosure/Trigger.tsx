import { createElement, useCallback, useMemo } from 'react';
import type { ComponentPropsWithRef, ReactElement } from 'react';
import { Button } from '../../components/Button/Button.js';
import { requireSlotChild, resolveSlotProps, Slot } from '../../core/Slot.js';
import { composeEventHandlers } from '../../core/composeEventHandlers.js';
import { cx } from '../../core/cx.js';
import { guardActivation } from '../../core/guardActivation.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { CaretGlyph } from '../glyphs/index.js';
import type { DisclosureState } from './context.js';
import { withoutOwnedAttributes } from './host-attributes.js';

type OwnedAttribute =
  | 'popoverTarget'
  | 'popoverTargetAction'
  | 'popovertarget'
  | 'popovertargetaction'
  | 'command'
  | 'commandFor'
  | 'commandfor'
  | 'type'
  | 'aria-controls'
  | 'aria-expanded'
  | 'aria-pressed'
  | (typeof buttonToggleProps)[number]
  | 'dangerouslySetInnerHTML';

const buttonToggleProps = ['pressed', 'defaultPressed', 'onPressedChange'] as const;

const ownedButtonNames = /* @__PURE__ */ new Set([
  'type',
  'disabled',
  'aria-controls',
  'aria-expanded',
  'aria-pressed',
  'popovertarget',
  'popovertargetaction',
  'command',
  'commandfor',
  'data-unica-disclosure-indicator',
  'class',
  ...buttonToggleProps.map((name) => name.toLowerCase()),
]);

export type TriggerAttributes = Omit<ComponentPropsWithRef<'button'>, OwnedAttribute> & {
  readonly [Key in OwnedAttribute]?: never;
};

interface TriggerProps extends TriggerAttributes {
  readonly state: DisclosureState;
  readonly asChild?: boolean | undefined;
  readonly indicator?: 'start' | 'end';
}

function requireButton(
  children: TriggerProps['children'],
  outer: TriggerAttributes,
): ReactElement<Record<string, unknown>> {
  const child = requireSlotChild<HTMLButtonElement>(children, 'CollapsibleTrigger asChild');
  if (child.type !== 'button' && (child.type !== Button || child.props.asChild)) {
    throw new Error(
      'CollapsibleTrigger asChild requires one native button or a Unica Button that renders a button.',
    );
  }
  if (
    child.type === Button &&
    buttonToggleProps.some((name) => child.props[name] !== undefined || outer[name] !== undefined)
  ) {
    throw new Error(
      'CollapsibleTrigger asChild requires a Button without pressed, defaultPressed, or onPressedChange.',
    );
  }
  return child;
}

export function Trigger({
  state,
  asChild = false,
  indicator = 'start',
  children,
  ref,
  className,
  disabled,
  onClick,
  ...props
}: TriggerProps): ReactElement {
  delete props.dangerouslySetInnerHTML;
  const { triggers } = state;
  const register = useCallback(
    (node: HTMLButtonElement | null) => {
      if (node) {
        triggers.add(node);
        return () => {
          triggers.delete(node);
        };
      }
    },
    [triggers],
  );
  const triggerRef = useMemo(() => mergeRefs(register, ref), [register, ref]);
  const child = asChild ? requireButton(children, props) : undefined;
  const unavailable = Boolean(state.disabled || disabled || child?.props.disabled);
  const nativeProps = withoutOwnedAttributes(
    props,
    ownedButtonNames,
    state.triggerId !== undefined ? 'id' : undefined,
  );
  const binding = {
    id: state.triggerId ?? props.id,
    'aria-controls': state.panelId,
    'aria-expanded': state.open,
    'aria-pressed': undefined,
    disabled: unavailable,
    type: 'button' as const,
  };
  const interaction = composeEventHandlers(onClick, (event) => {
    if (!event.currentTarget.matches(':disabled')) {
      state.toggle(event.currentTarget);
    }
  });

  if (child) {
    const childProps = withoutOwnedAttributes(child.props, ownedButtonNames);
    // Recreate a sanitized child so React never receives a raw DOM name, even with undefined.
    // Slot still owns the event, ref, style, and class merges for either host.
    const button =
      childProps === child.props
        ? child
        : createElement(child.type, { ...childProps, key: child.key ?? undefined });
    const guards =
      child.type === 'button'
        ? guardActivation<HTMLButtonElement>(
            resolveSlotProps({
              slotProps: { ...nativeProps, onClick: interaction },
              childProps,
            }),
            (button) => button.matches(':disabled'),
          )
        : undefined;
    return (
      <Slot<HTMLButtonElement>
        {...nativeProps}
        onClick={interaction}
        className={className}
        ref={triggerRef}
        slotOwned={{
          ...binding,
          id: child.props.id ?? binding.id,
          ...guards,
        }}
      >
        {button}
      </Slot>
    );
  }

  const caret = <CaretGlyph className="unica-disclosure-caret" direction="down" weight="bold" />;
  return (
    <button
      {...nativeProps}
      {...binding}
      {...guardActivation({ ...nativeProps, onClick: interaction }, (button) =>
        button.matches(':disabled'),
      )}
      ref={triggerRef}
      className={cx('unica-disclosure-trigger', className)}
      data-unica-disclosure-indicator={indicator}
    >
      {indicator === 'start' && caret}
      <span className="unica-disclosure-label">{children}</span>
      {indicator === 'end' && caret}
    </button>
  );
}
