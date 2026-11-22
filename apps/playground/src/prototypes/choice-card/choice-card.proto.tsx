import { CheckboxIndicator, RadioIndicator, SwitchIndicator } from '@docouno/unica';
import type { ControlSize } from '@docouno/unica';
import { createContext, useContext, useId, useRef } from 'react';
import type { ComponentPropsWithRef, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { repairCanceledChoiceActivation, useChoiceInput } from './choice-card-state.js';
import './choice-card.css';

type ChoiceKind = 'checkbox' | 'radio' | 'switch';
type ChoicePreviewState = 'rest' | 'hover' | 'active' | 'focus';
interface ChoiceContextValue {
  readonly id: string;
  readonly size: ControlSize;
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly loading: boolean;
}
const ChoiceContext = createContext<ChoiceContextValue>({
  id: '',
  size: 'm',
  checked: false,
  disabled: false,
  loading: false,
});

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
  readonly previewState?: ChoicePreviewState | undefined;
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
  ref,
  readOnly,
  disabled,
  checked,
  defaultChecked,
  onClick,
  onChange,
  onKeyDown,
  'data-wb-subject': subject,
  ...props
}: RootProps): ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const inputState = useChoiceInput(inputRef, ref, checked, defaultChecked, disabled);
  const busy = kind === 'switch' && loading && !inputState.disabled;
  const indicator = { size, ...inputState };
  return (
    <ChoiceContext value={{ id: inputId, ...indicator, loading: busy }}>
      <div
        data-wb-subject={subject}
        className={`choice-card-proto ${className}`}
        data-kind={kind}
        data-size={size}
        data-placement={indicatorPlacement}
        data-status={inputState.disabled ? 'neutral' : status}
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
            ref={inputRef}
            id={inputId}
            type={kind === 'radio' ? 'radio' : 'checkbox'}
            role={kind === 'switch' ? 'switch' : undefined}
            className="choice-card-native"
            disabled={disabled}
            checked={checked}
            defaultChecked={checked === undefined ? defaultChecked : undefined}
            aria-readonly={readOnly || undefined}
            aria-busy={busy || undefined}
            aria-disabled={busy || undefined}
            aria-invalid={
              inputState.disabled ? undefined : status === 'danger' || props['aria-invalid']
            }
            aria-labelledby={
              props['aria-labelledby'] ?? (!props['aria-label'] ? `${inputId}-label` : undefined)
            }
            aria-describedby={
              [props['aria-describedby'], description ? `${inputId}-description` : '']
                .filter(Boolean)
                .join(' ') || undefined
            }
            onChange={(event) => {
              if (!event.defaultPrevented && !readOnly && !busy) {
                onChange?.(event);
              }
            }}
            onClick={(event) => {
              onClick?.(event);
              if (readOnly || busy) {
                event.preventDefault();
              }
              repairCanceledChoiceActivation(event.currentTarget, event.nativeEvent);
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
          {indicatorPlacement !== 'none' && (
            <ChoiceIndicator kind={kind} {...indicator} loading={busy} />
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
function ChoiceIndicator({
  kind,
  loading,
  ...state
}: Omit<ChoiceContextValue, 'id'> & { readonly kind: ChoiceKind }): ReactElement {
  switch (kind) {
    case 'checkbox':
      return <CheckboxIndicator {...state} />;
    case 'radio':
      return <RadioIndicator {...state} />;
    case 'switch':
      return <SwitchIndicator {...state} loading={loading} />;
  }
}

function CustomChoiceIndicator({ kind }: { readonly kind: ChoiceKind }): ReactElement {
  const { size, checked, disabled, loading } = useContext(ChoiceContext);
  return (
    <span className="choice-card-custom-indicator">
      <ChoiceIndicator
        kind={kind}
        size={size}
        checked={checked}
        disabled={disabled}
        loading={loading}
      />
    </span>
  );
}
export function CheckboxCardIndicator(): ReactElement {
  return <CustomChoiceIndicator kind="checkbox" />;
}
export function RadioCardIndicator(): ReactElement {
  return <CustomChoiceIndicator kind="radio" />;
}
export function SwitchCardIndicator(): ReactElement {
  return <CustomChoiceIndicator kind="switch" />;
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
