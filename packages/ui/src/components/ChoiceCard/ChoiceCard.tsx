import { createContext, useContext } from 'react';
import type { JSX, ReactNode } from 'react';
import { cx, dataFlag } from '../../core/cx.js';
import { FormFieldContext } from '../../core/forms/field-context.js';
import { CheckboxContext, RadioContext, SwitchContext } from '../../internal/binary/BinaryGroup.js';
import type { BinaryGroupContext } from '../../internal/binary/BinaryGroup.js';
import type { BinaryKind, BinarySize } from '../../internal/binary/types.js';
import { hasBinaryContent, useBinaryInput } from '../../internal/binary/useBinaryInput.js';
import { CheckboxIndicator } from '../Checkbox/CheckboxIndicator.js';
import { RadioIndicator } from '../Radio/RadioIndicator.js';
import { SwitchIndicator } from '../Switch/SwitchIndicator.js';
import {
  ChoiceCardContent,
  ChoiceCardDescription,
  ChoiceCardLabel,
  ChoiceCardMetadata,
  ChoiceCardSecondary,
} from './parts.js';
import type {
  CheckboxCardIndicatorProps,
  CheckboxCardProps,
  RadioCardIndicatorProps,
  RadioCardProps,
  SwitchCardIndicatorProps,
  SwitchCardProps,
} from './types.js';
import './choice-card.css';

interface MarkerContext {
  readonly size: BinarySize;
  readonly busy: boolean;
  readonly thumbIcon?: ReactNode | undefined;
}

const MarkerContext = createContext<MarkerContext>({ size: 'm', busy: false });

function ChoiceMarker({
  kind,
  className,
  ...props
}: CheckboxCardIndicatorProps & { readonly kind: BinaryKind }): JSX.Element {
  const { size, busy, thumbIcon } = useContext(MarkerContext);
  const markerProps = { ...props, size, className: cx('unica-choice-card-marker', className) };
  switch (kind) {
    case 'checkbox':
      return <CheckboxIndicator {...markerProps} />;
    case 'radio':
      return <RadioIndicator {...markerProps} />;
    case 'switch':
      return <SwitchIndicator {...markerProps} loading={busy} thumbIcon={thumbIcon} />;
  }
}

function ChoiceMarkerSlot(
  props: CheckboxCardIndicatorProps & { readonly kind: BinaryKind },
): JSX.Element {
  return (
    <span className="unica-choice-card-marker-slot">
      <ChoiceMarker {...props} />
    </span>
  );
}

type ChoiceCardProps = CheckboxCardProps &
  Pick<SwitchCardProps, 'loading' | 'thumbIcon'> & {
    readonly kind: BinaryKind;
    readonly group: BinaryGroupContext | null;
  };

function ChoiceCard({
  kind,
  group,
  indicatorPlacement = kind === 'switch' ? 'end' : 'start',
  className,
  style,
  hidden,
  inert,
  children,
  metadata,
  secondary,
  thumbIcon,
  ...props
}: ChoiceCardProps): JSX.Element {
  const { row, carrier, inputId, labelId, descriptionId, size, locked, busy } =
    useBinaryInput<HTMLDivElement>({ ...props, kind, group, retainLocalLabel: true });

  return (
    <div
      ref={row}
      className={cx('unica-choice-card', className)}
      style={style}
      hidden={hidden}
      inert={inert}
      data-unica-choice-card-kind={kind}
      data-unica-choice-card-size={size}
      data-unica-choice-card-placement={indicatorPlacement}
      data-unica-choice-card-readonly={dataFlag(locked)}
      data-unica-choice-card-busy={dataFlag(busy)}
    >
      {carrier}
      <label className="unica-choice-card-hit" htmlFor={inputId} aria-hidden="true" />
      <FormFieldContext value={null}>
        <MarkerContext value={{ size, busy, thumbIcon }}>
          {indicatorPlacement !== 'none' && <ChoiceMarkerSlot kind={kind} />}
          {children ?? (
            <ChoiceCardContent>
              {labelId && <ChoiceCardLabel id={labelId}>{props.label}</ChoiceCardLabel>}
              {descriptionId && (
                <ChoiceCardDescription id={descriptionId}>
                  {props.description}
                </ChoiceCardDescription>
              )}
              {hasBinaryContent(metadata) && <ChoiceCardMetadata>{metadata}</ChoiceCardMetadata>}
              {hasBinaryContent(secondary) && (
                <ChoiceCardSecondary>{secondary}</ChoiceCardSecondary>
              )}
            </ChoiceCardContent>
          )}
        </MarkerContext>
      </FormFieldContext>
    </div>
  );
}

/** Renders an independent native checkbox with a full-card target and supporting content. */
export function CheckboxCard(props: CheckboxCardProps): JSX.Element {
  const group = useContext(CheckboxContext);
  return <ChoiceCard {...props} kind="checkbox" group={group} />;
}

/** Renders a native radio choice in a RadioCardGroup or RadioGroup. */
export function RadioCard(props: RadioCardProps): JSX.Element {
  const group = useContext(RadioContext);
  return <ChoiceCard {...props} kind="radio" group={group} />;
}

/** Renders an immediate on/off setting with optional pending feedback in the thumb. */
export function SwitchCard(props: SwitchCardProps): JSX.Element {
  const group = useContext(SwitchContext);
  return <ChoiceCard {...props} kind="switch" group={group} />;
}

/** Places the card's decorative check inside custom content. */
export function CheckboxCardIndicator(props: CheckboxCardIndicatorProps): JSX.Element {
  return <ChoiceMarkerSlot {...props} kind="checkbox" />;
}

/** Places the card's decorative radio mark inside custom content. */
export function RadioCardIndicator(props: RadioCardIndicatorProps): JSX.Element {
  return <ChoiceMarkerSlot {...props} kind="radio" />;
}

/** Places the card's decorative switch and pending mark inside custom content. */
export function SwitchCardIndicator(props: SwitchCardIndicatorProps): JSX.Element {
  return <ChoiceMarkerSlot {...props} kind="switch" />;
}
