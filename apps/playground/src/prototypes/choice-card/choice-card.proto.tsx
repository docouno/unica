import { createContext, useContext, useId } from 'react';
import type { ComponentPropsWithRef, HTMLAttributes, ReactElement, ReactNode } from 'react';
import {
  CheckboxIndicator,
  RadioIndicator,
  SwitchIndicator,
} from '../binary-controls/binary-controls.proto.js';
import type { BinaryPreviewState } from '../binary-controls/binary-controls.proto.js';
import type { ControlSize } from '../input/input.proto.js';
import './choice-card.css';

type ChoiceKind = 'checkbox' | 'radio' | 'switch';
interface ChoiceContextValue {
  readonly id: string;
  readonly size: ControlSize;
  readonly loading: boolean;
}
const ChoiceContext = createContext<ChoiceContextValue>({ id: '', size: 'm', loading: false });

export interface ChoiceCardProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'size' | 'children'
> {
  readonly 'data-wb-subject'?: string | undefined;
  readonly size?: ControlSize | undefined;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly metadata?: ReactNode;
  readonly secondary?: ReactNode;
  readonly children?: ReactNode;
  readonly indicatorPlacement?: 'start' | 'end' | 'none' | undefined;
  readonly status?: 'neutral' | 'danger' | undefined;
  /** Pins appearance, never DOM focus or interaction. */
  readonly previewState?: BinaryPreviewState | undefined;
  readonly previewFocus?: boolean | undefined;
}
export interface SwitchCardProps extends Omit<ChoiceCardProps, 'status'> {
  readonly loading?: boolean | undefined;
}
interface RootProps extends ChoiceCardProps {
  readonly kind: ChoiceKind;
  readonly loading?: boolean | undefined;
}

function ChoiceCard({
  kind,
  size = 'm',
  label,
  description,
  metadata,
  secondary,
  children,
  indicatorPlacement = kind === 'switch' ? 'end' : 'start',
  status = 'neutral',
  loading = false,
  previewState,
  previewFocus,
  className = '',
  style,
  hidden,
  id,
  readOnly,
  disabled,
  onClick,
  onChange,
  onKeyDown,
  'data-wb-subject': subject,
  ...props
}: RootProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const busy = kind === 'switch' && loading && !disabled;
  return (
    <ChoiceContext value={{ id: inputId, size, loading: busy }}>
      <div
        data-wb-subject={subject}
        className={`choice-card-proto ${className}`}
        data-kind={kind}
        data-size={size}
        data-placement={indicatorPlacement}
        data-status={disabled ? 'neutral' : status}
        data-readonly={readOnly || undefined}
        data-busy={busy || undefined}
        data-preview={previewState}
        data-preview-focus={previewFocus || undefined}
        style={style}
        hidden={hidden}
      >
        <span className="choice-card-control">
          <input
            {...props}
            id={inputId}
            type={kind === 'radio' ? 'radio' : 'checkbox'}
            role={kind === 'switch' ? 'switch' : undefined}
            className="binary-native choice-card-native"
            disabled={disabled}
            aria-readonly={readOnly || undefined}
            aria-busy={busy || undefined}
            aria-disabled={busy || undefined}
            aria-invalid={status === 'danger' || props['aria-invalid'] || undefined}
            aria-labelledby={
              props['aria-labelledby'] ?? (!props['aria-label'] ? `${inputId}-label` : undefined)
            }
            aria-describedby={
              [props['aria-describedby'], description ? `${inputId}-description` : '']
                .filter(Boolean)
                .join(' ') || undefined
            }
            onChange={(event) => {
              if (!readOnly && !busy) {
                onChange?.(event);
              }
            }}
            onClick={(event) => {
              onClick?.(event);
              if (readOnly || busy) {
                event.preventDefault();
              }
            }}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              if (event.defaultPrevented) {
                return;
              }
              if (
                readOnly &&
                [' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(
                  event.key,
                )
              ) {
                event.preventDefault();
              }
              if (kind === 'switch' && event.key === 'Enter') {
                event.preventDefault();
                if (!event.repeat && !readOnly && !busy) {
                  event.currentTarget.click();
                }
              }
            }}
          />
          {kind === 'checkbox' ? (
            <CheckboxIndicator size={size} />
          ) : kind === 'radio' ? (
            <RadioIndicator size={size} />
          ) : (
            <SwitchIndicator size={size} loading={busy} />
          )}
        </span>
        <label className="choice-card-hit" htmlFor={inputId} aria-hidden="true" />
        {children ?? (
          <ChoiceCardContent>
            <ChoiceCardLabel>{label}</ChoiceCardLabel>
            {description && <ChoiceCardDescription>{description}</ChoiceCardDescription>}
            {metadata && <ChoiceCardMetadata>{metadata}</ChoiceCardMetadata>}
            {secondary && <ChoiceCardSecondary>{secondary}</ChoiceCardSecondary>}
          </ChoiceCardContent>
        )}
      </div>
    </ChoiceContext>
  );
}

export function CheckboxCard(props: ChoiceCardProps): ReactElement {
  return <ChoiceCard {...props} kind="checkbox" />;
}
export function RadioCard(props: ChoiceCardProps): ReactElement {
  return <ChoiceCard {...props} kind="radio" />;
}
export function SwitchCard(props: SwitchCardProps): ReactElement {
  return <ChoiceCard {...props} kind="switch" />;
}

export function ChoiceCardContent({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>): ReactElement {
  return <div {...props} className={`choice-card-content ${className}`} />;
}
export function ChoiceCardLabel({
  className = '',
  ...props
}: HTMLAttributes<HTMLSpanElement>): ReactElement {
  const { id } = useContext(ChoiceContext);
  return <span {...props} id={`${id}-label`} className={`choice-card-label ${className}`} />;
}
export function ChoiceCardDescription({
  className = '',
  ...props
}: HTMLAttributes<HTMLSpanElement>): ReactElement {
  const { id } = useContext(ChoiceContext);
  return (
    <span {...props} id={`${id}-description`} className={`choice-card-description ${className}`} />
  );
}
export function ChoiceCardMetadata({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>): ReactElement {
  return <div {...props} className={`choice-card-metadata ${className}`} />;
}
export function ChoiceCardSecondary({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>): ReactElement {
  return (
    <div {...props} data-unica-card-secondary="" className={`choice-card-secondary ${className}`} />
  );
}
export function CheckboxCardIndicator(): ReactElement {
  const { size } = useContext(ChoiceContext);
  return (
    <span className="choice-card-custom-indicator">
      <CheckboxIndicator size={size} />
    </span>
  );
}
export function RadioCardIndicator(): ReactElement {
  const { size } = useContext(ChoiceContext);
  return (
    <span className="choice-card-custom-indicator">
      <RadioIndicator size={size} />
    </span>
  );
}
export function SwitchCardIndicator(): ReactElement {
  const { size, loading } = useContext(ChoiceContext);
  return (
    <span className="choice-card-custom-indicator">
      <SwitchIndicator size={size} loading={loading} />
    </span>
  );
}
export {
  ChoiceCardContent as CheckboxCardContent,
  ChoiceCardContent as RadioCardContent,
  ChoiceCardContent as SwitchCardContent,
  ChoiceCardLabel as CheckboxCardLabel,
  ChoiceCardLabel as RadioCardLabel,
  ChoiceCardLabel as SwitchCardLabel,
  ChoiceCardDescription as CheckboxCardDescription,
  ChoiceCardDescription as RadioCardDescription,
  ChoiceCardDescription as SwitchCardDescription,
};
