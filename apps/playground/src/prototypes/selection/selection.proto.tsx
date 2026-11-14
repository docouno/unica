import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { CheckIcon } from '@phosphor-icons/react';
import type { ControlSize } from '../input/input.proto.js';
import './selection.css';

export interface ChoiceProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'size'> {
  readonly size?: ControlSize | undefined;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
}

interface ChoiceControlProps extends ChoiceProps {
  readonly kind: 'checkbox' | 'radio' | 'switch';
  readonly card?: boolean | undefined;
}

function ChoiceControl({
  kind,
  card,
  label,
  description,
  size = 'm',
  className = '',
  style,
  readOnly,
  onClick,
  children,
  hidden,
  ...props
}: ChoiceControlProps): ReactElement {
  return (
    <label
      className={`choice-proto ${card ? 'choice-card-proto' : ''} ${className}`}
      data-kind={kind}
      data-size={size}
      style={style}
      hidden={hidden}
    >
      <span className="choice-control-proto">
        <input
          {...props}
          type={kind === 'radio' ? 'radio' : 'checkbox'}
          role={kind === 'switch' ? 'switch' : undefined}
          className="choice-native-proto"
          readOnly={readOnly}
          aria-readonly={readOnly || undefined}
          onClick={(event) => {
            if (readOnly) {
              event.preventDefault();
            }
            onClick?.(event);
          }}
        />
        <span className="choice-indicator-proto" aria-hidden="true">
          {kind === 'checkbox' && <CheckIcon weight="bold" size="1em" />}
        </span>
      </span>
      {(label || description || children) && (
        <span className="choice-copy-proto">
          {(label || children) && <span className="choice-label-proto">{label ?? children}</span>}
          {description && <span className="choice-description-proto">{description}</span>}
        </span>
      )}
    </label>
  );
}

export function Checkbox(props: ChoiceProps): ReactElement {
  return <ChoiceControl {...props} kind="checkbox" />;
}

export function Radio(props: ChoiceProps): ReactElement {
  return <ChoiceControl {...props} kind="radio" />;
}

export function Switch(props: ChoiceProps): ReactElement {
  return <ChoiceControl {...props} kind="switch" />;
}

export function CheckboxCard(props: ChoiceProps): ReactElement {
  return <ChoiceControl {...props} kind="checkbox" card />;
}

export function RadioCard(props: ChoiceProps): ReactElement {
  return <ChoiceControl {...props} kind="radio" card />;
}

export function SwitchCard(props: ChoiceProps): ReactElement {
  return <ChoiceControl {...props} kind="switch" card />;
}
