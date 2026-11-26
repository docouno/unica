import { useCallback, useId, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { cx } from '../../core/cx.js';
import {
  getDefaultView,
  getOwnerDocument,
  isConnectedNode,
  isElementNode,
  isInertElement,
} from '../../core/dom.js';
import { FormInput } from '../../core/forms/carriers.js';
import { fieldControlId, fieldDescription, useFormField } from '../../core/forms/field-context.js';
import { observeFieldInput } from '../../core/forms/observeFieldInput.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import {
  CloseGlyph,
  FieldDangerGlyph,
  FieldInfoGlyph,
  FieldSuccessGlyph,
  FieldWarningGlyph,
} from '../../internal/glyphs/index.js';
import { Icon } from '../Icon/index.js';
import { Spinner } from '../Progress/index.js';
import { INPUT_TYPE } from './consts.js';
import type { InputProps } from './types.js';
import { useInputValue } from './use-input-value.js';
import './input.css';

const statusGlyphs = {
  info: FieldInfoGlyph,
  success: FieldSuccessGlyph,
  warning: FieldWarningGlyph,
  danger: FieldDangerGlyph,
};

function canFocus(input: HTMLInputElement): boolean {
  return isConnectedNode(input) && !input.matches(':disabled') && !isInertElement(input);
}

/** A single-line native field with decorative adornments and optional local clearing. */
export function Input({
  type = 'text',
  size: sizeProp,
  variant = 'default',
  status: statusProp,
  width = 'full',
  value,
  defaultValue = '',
  iconLeft,
  iconRight,
  prefix,
  suffix,
  clearable,
  clearLabel,
  onClear,
  loading,
  className,
  style,
  dir,
  hidden,
  inert,
  id,
  ref,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  required: requiredProp,
  'aria-describedby': describedBy,
  multiple,
  placeholder,
  onChange,
  onCompositionStart,
  onCompositionEnd,
  onBlur,
  ...native
}: InputProps): ReactElement {
  const scope = useFormField();
  const field = scope?.target === 'control' ? scope : null;
  const size = sizeProp ?? field?.size ?? 'm';
  const status = statusProp ?? field?.status ?? 'neutral';
  const disabled = disabledProp ?? field?.disabled;
  const readOnly = readOnlyProp ?? field?.readOnly;
  const required = requiredProp ?? field?.required;
  const generatedId = useId();
  const inputId = fieldControlId(field, id) || (clearable ? generatedId : id);
  const input = useRef<HTMLInputElement>(null);
  const [nativeDisabled, setNativeDisabled] = useState(false);
  const observe = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      return observeFieldInput(node, {
        focusAttribute: 'data-unica-input-focus',
        onChange: () => setNativeDisabled(node.matches(':disabled')),
      });
    }
  }, []);
  const mergedRef = useMemo(() => mergeRefs(input, observe, ref), [observe, ref]);
  const resolvedType = Object.hasOwn(INPUT_TYPE, type) ? type : 'text';
  const {
    controlled,
    isComposing,
    handleChange,
    handleCompositionStart,
    handleCompositionEnd,
    handleBlur,
  } = useInputValue({
    input,
    value,
    defaultValue,
    type: resolvedType,
    multiple,
    readOnly,
    onChange,
    onCompositionStart,
    onCompositionEnd,
    onBlur,
  });
  const unavailable = disabled || nativeDisabled;
  const busy = Boolean(loading && !unavailable);
  const effectiveStatus = unavailable ? 'neutral' : status;
  const StatusGlyph = effectiveStatus === 'neutral' ? null : statusGlyphs[effectiveStatus];
  // A nonempty placeholder keeps :placeholder-shown working in older WebKit.
  const nativePlaceholder = placeholder || ' ';

  for (const key of Object.keys(native)) {
    if (
      key.toLowerCase().startsWith('data-unica-input-') ||
      key.toLowerCase() === 'data-unica-form-field-glyph'
    ) {
      Reflect.deleteProperty(native, key);
    }
  }

  function clearValue(): void {
    const node = input.current;
    if (
      !node ||
      !node.value ||
      hidden ||
      loading ||
      node.readOnly ||
      isComposing() ||
      !canFocus(node)
    ) {
      return;
    }
    const view = getDefaultView(getOwnerDocument(node));
    if (!view) {
      return;
    }
    const descriptor = Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'value');
    if (!descriptor?.set) {
      return;
    }
    // Use the native setter so React observes the edit through its own input event path.
    descriptor.set.call(node, '');
    node.dispatchEvent(new view.Event('input', { bubbles: true, composed: true }));
    onClear?.();
    // The callbacks can remove or disable the input in the same discrete update.
    queueMicrotask(() => {
      if (input.current === node && canFocus(node)) {
        node.focus();
      }
    });
  }

  return (
    <span
      className={cx('unica-input', className)}
      data-unica-form-field-glyph={
        StatusGlyph && field?.status === effectiveStatus ? field.controlId : undefined
      }
      data-unica-input-size={size}
      data-unica-input-variant={variant}
      data-unica-input-status={effectiveStatus}
      data-unica-input-width={width}
      dir={dir}
      hidden={hidden}
      inert={inert}
      style={style}
      onClick={(event) => {
        const target = event.target;
        const node = input.current;
        if (
          !event.defaultPrevented &&
          isElementNode(target) &&
          !target.closest('input, button') &&
          node &&
          canFocus(node)
        ) {
          node.focus();
        }
      }}
    >
      {iconLeft && <Icon className="unica-input-icon" usage="slot" icon={iconLeft} size={size} />}
      {prefix && (
        <span className="unica-input-affix" aria-hidden="true" dir="auto">
          {prefix}
        </span>
      )}
      <FormInput
        {...native}
        ref={mergedRef}
        className="unica-input-native"
        id={inputId}
        type={resolvedType}
        dir={dir}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        aria-describedby={fieldDescription(field, describedBy, Boolean(unavailable))}
        multiple={multiple}
        controlled={controlled}
        defaultValue={value ?? defaultValue}
        placeholder={nativePlaceholder}
        aria-busy={busy || undefined}
        aria-invalid={effectiveStatus === 'danger' || undefined}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onBlur={handleBlur}
      />
      {suffix && (
        <span className="unica-input-affix" aria-hidden="true" dir="auto">
          {suffix}
        </span>
      )}
      {clearable && (
        <button
          type="button"
          className="unica-input-clear"
          aria-controls={inputId}
          aria-label={clearLabel?.trim() || 'Clear value'}
          aria-disabled={busy || undefined}
          disabled={unavailable || readOnly}
          onPointerDown={(event) => {
            if (event.button === 0) {
              event.preventDefault();
            }
          }}
          onMouseDown={(event) => {
            if (event.button === 0) {
              event.preventDefault();
            }
          }}
          onClick={clearValue}
        >
          <CloseGlyph className="unica-input-glyph" />
        </button>
      )}
      {StatusGlyph && <StatusGlyph className="unica-input-glyph unica-input-status" />}
      {busy && <Spinner className="unica-input-spinner" size={size} tone="muted" />}
      {iconRight && !StatusGlyph && !busy && (
        <Icon className="unica-input-icon" usage="slot" icon={iconRight} size={size} />
      )}
    </span>
  );
}
