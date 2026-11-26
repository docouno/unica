import { useCallback, useId, useInsertionEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { cx } from '../../core/cx.js';
import { getDefaultView, isElementNode } from '../../core/dom.js';
import { fieldControlId, fieldDescription, useFormField } from '../../core/forms/field-context.js';
import { observeFieldInput } from '../../core/forms/observeFieldInput.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import {
  DecreaseGlyph,
  FieldDangerGlyph,
  FieldInfoGlyph,
  FieldSuccessGlyph,
  FieldWarningGlyph,
  IncreaseGlyph,
} from '../../internal/glyphs/index.js';
import { Spinner } from '../Progress/index.js';
import { finite, numberValue, readStepDomain, stepCandidate, stepSize } from './step.js';
import type { Direction } from './step.js';
import type { NumberInputProps } from './types.js';
import { canEditNumber, useNumberValue } from './use-number-value.js';
import { useStepPress } from './use-step-press.js';
import type { StepPressOptions } from './use-step-press.js';
import { preserveWheelScroll } from './wheel-scroll.js';
import './number-input.css';

const statusGlyphs = {
  info: FieldInfoGlyph,
  success: FieldSuccessGlyph,
  warning: FieldWarningGlyph,
  danger: FieldDangerGlyph,
};

interface EditorView {
  readonly text: string;
  readonly disabled: boolean;
  readonly canDecrease: boolean;
  readonly canIncrease: boolean;
}

function syncProbe(probe: HTMLInputElement, input: HTMLInputElement): void {
  probe.min = input.min;
  probe.max = input.max;
  probe.step = input.step;
  probe.defaultValue = input.defaultValue;
}

function candidateFor(
  current: number | '' | undefined,
  domain: ReturnType<typeof readStepDomain>,
  direction: Direction,
  probe: HTMLInputElement,
): number | undefined {
  if (current === undefined) {
    return undefined;
  }
  const next = stepCandidate(current, domain, direction);
  if (next === undefined) {
    return undefined;
  }
  // Engines can impose additional limits on their decimal parsing or validity.
  // Inspect those on a detached number input without replacing the live draft.
  probe.value = String(next);
  const { badInput, rangeOverflow, rangeUnderflow, stepMismatch } = probe.validity;
  return !badInput &&
    !rangeOverflow &&
    !rangeUnderflow &&
    !stepMismatch &&
    numberValue(probe) === next
    ? next
    : undefined;
}

/** A native numeric editor with two integrated directional actions. */
export function NumberInput({
  value,
  defaultValue,
  min,
  max,
  step,
  size: sizeProp,
  variant = 'default',
  status: statusProp,
  width = 'full',
  prefix,
  suffix,
  loading,
  decrementLabel,
  incrementLabel,
  onValueChange,
  onInput,
  onInputCapture,
  onChange,
  onCompositionStart,
  onCompositionEnd,
  onBlur,
  onKeyDown,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  required: requiredProp,
  'aria-describedby': describedBy,
  inputMode = 'decimal',
  className,
  style,
  dir,
  hidden,
  inert,
  id,
  ref,
  ...native
}: NumberInputProps): ReactElement {
  const scope = useFormField();
  const field = scope?.target === 'control' ? scope : null;
  const size = sizeProp ?? field?.size ?? 'm';
  const status = statusProp ?? field?.status ?? 'neutral';
  const disabled = disabledProp ?? field?.disabled;
  const readOnly = readOnlyProp ?? field?.readOnly;
  const required = requiredProp ?? field?.required;
  const generatedId = useId();
  const inputId = fieldControlId(field, id) || generatedId;
  const input = useRef<HTMLInputElement>(null);
  const probe = useRef<HTMLInputElement | null>(null);
  const [editor, setEditor] = useState<EditorView | null>(null);
  const pressOptions = useRef<StepPressOptions | null>(null);
  const press = useStepPress(pressOptions);
  const { cancel } = press;
  const minimum = finite(min);
  const maximum = finite(max);
  const stride = stepSize(step);
  const controlledValue =
    value === undefined ? undefined : value === '' ? '' : (finite(value) ?? '');
  const initialValue = defaultValue === '' ? '' : (finite(defaultValue) ?? '');

  const refresh = useCallback(() => {
    const node = input.current;
    const tester = probe.current;
    if (!node || !tester) {
      return;
    }
    syncProbe(tester, node);
    const domain = readStepDomain(node);
    const current = numberValue(node);
    const disabled = node.matches(':disabled');
    const canStep = !disabled && !node.readOnly;
    const snapshot: EditorView = {
      text: node.value,
      disabled,
      canDecrease: canStep && candidateFor(current, domain, -1, tester) !== undefined,
      canIncrease: canStep && candidateFor(current, domain, 1, tester) !== undefined,
    };
    setEditor((previous) =>
      previous?.text === snapshot.text &&
      previous.disabled === snapshot.disabled &&
      previous.canDecrease === snapshot.canDecrease &&
      previous.canIncrease === snapshot.canIncrease
        ? previous
        : snapshot,
    );
  }, []);
  const observe = useCallback(
    (node: HTMLInputElement | null) => {
      if (!node) {
        return;
      }
      const tester = node.ownerDocument.createElement('input');
      tester.type = 'number';
      probe.current = tester;
      const unsubscribe = observeFieldInput(node, {
        focusAttribute: 'data-unica-number-input-focus',
        watchAvailability: true,
        onChange() {
          if (!canEditNumber(node)) {
            cancel();
          }
          refresh();
        },
      });
      return () => {
        unsubscribe();
        probe.current = null;
      };
    },
    [cancel, refresh],
  );
  const mergedRef = useMemo(() => mergeRefs(input, observe, ref), [observe, ref]);
  const form = useNumberValue({
    input,
    value: controlledValue,
    defaultValue: initialValue,
    readOnly,
    onValueChange,
    onInput,
    onInputCapture,
    onChange,
    onCompositionStart,
    onCompositionEnd,
    onBlur,
    cancelPress: cancel,
    refresh,
  });

  function nextStep(node: HTMLInputElement, direction: Direction): number | undefined {
    const tester = probe.current;
    if (!tester || !canEditNumber(node) || form.isComposing()) {
      return undefined;
    }
    syncProbe(tester, node);
    return candidateFor(numberValue(node), readStepDomain(node), direction, tester);
  }

  function requestStep(direction: Direction): boolean {
    form.settleReset();
    const node = input.current;
    if (!node) {
      return false;
    }
    const next = nextStep(node, direction);
    if (next === undefined) {
      return false;
    }
    const view = getDefaultView(node.ownerDocument);
    const descriptor =
      view && Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'value');
    if (!view || !descriptor?.set) {
      return false;
    }
    // Let React and native consumers observe one edit through the regular event
    // path. The prototype setter leaves React's previous value available to onChange.
    descriptor.set.call(node, String(next));
    node.dispatchEvent(new view.Event('input', { bubbles: true, composed: true }));
    if (input.current === node && node.isConnected) {
      node.dispatchEvent(new view.Event('change', { bubbles: true }));
    }
    return true;
  }

  useInsertionEffect(() => {
    pressOptions.current = {
      input,
      settleReset: form.settleReset,
      step: requestStep,
      canStep: (direction) =>
        input.current !== null && nextStep(input.current, direction) !== undefined,
    };
  });
  useIsoLayoutEffect(cancel, [
    cancel,
    minimum,
    maximum,
    stride,
    disabled,
    readOnly,
    hidden,
    inert,
    native.form,
  ]);
  useIsoLayoutEffect(() => {
    const node = input.current;
    return node ? preserveWheelScroll(node) : undefined;
  }, []);
  useIsoLayoutEffect(refresh);

  const unavailable = disabled || editor?.disabled;
  const busy = Boolean(loading && !unavailable);
  const effectiveStatus = unavailable ? 'neutral' : status;
  const StatusGlyph = effectiveStatus === 'neutral' ? null : statusGlyphs[effectiveStatus];
  const baseline = controlledValue ?? form.defaultValue;
  const initialDomain = {
    min: minimum,
    max: maximum,
    step: stride,
    base: minimum ?? (baseline || 0),
  };
  const actionsBlocked = unavailable || readOnly || hidden || inert;

  function action(direction: Direction): ReactElement {
    const decrease = direction === -1;
    const Glyph = decrease ? DecreaseGlyph : IncreaseGlyph;
    const label = decrease
      ? decrementLabel?.trim() || 'Decrease value'
      : incrementLabel?.trim() || 'Increase value';
    const available = editor
      ? decrease
        ? editor.canDecrease
        : editor.canIncrease
      : stepCandidate(baseline, initialDomain, direction) !== undefined;
    return (
      <button
        type="button"
        className="unica-number-input-action"
        data-unica-number-input-action={decrease ? 'decrement' : 'increment'}
        tabIndex={-1}
        aria-controls={inputId}
        aria-label={label}
        disabled={actionsBlocked || !available}
        onPointerDown={(event) => press.start(event, direction)}
        onLostPointerCapture={press.loseCapture}
        onClick={(event) => press.click(event, direction)}
      >
        <Glyph className="unica-number-input-glyph" />
      </button>
    );
  }

  // Keep internal CSS state and the native number semantics library-owned.
  const nativeProps = { ...native };
  for (const key of Object.keys(nativeProps)) {
    if (
      key.toLowerCase().startsWith('data-unica-number-input-') ||
      key.toLowerCase() === 'data-unica-form-field-glyph'
    ) {
      Reflect.deleteProperty(nativeProps, key);
    }
  }

  return (
    <span
      className={cx('unica-number-input', className)}
      data-unica-number-input-size={size}
      data-unica-number-input-variant={variant}
      data-unica-number-input-width={width}
      data-unica-number-input-status={effectiveStatus}
      dir={dir}
      hidden={hidden}
      inert={inert}
      style={style}
      onClick={(event) => {
        const node = input.current;
        if (
          !event.defaultPrevented &&
          isElementNode(event.target) &&
          !event.target.closest('input, button') &&
          node &&
          !node.matches(':disabled')
        ) {
          node.focus({ preventScroll: true });
        }
      }}
    >
      {action(-1)}
      <span className="unica-number-input-body">
        <span
          className="unica-number-input-value"
          data-unica-form-field-glyph={
            StatusGlyph && field?.status === effectiveStatus ? field.controlId : undefined
          }
        >
          {prefix && (
            <span className="unica-number-input-affix" dir="auto" aria-hidden="true" title={prefix}>
              {prefix}
            </span>
          )}
          <input
            {...nativeProps}
            ref={mergedRef}
            id={inputId}
            className="unica-number-input-native"
            type="number"
            role={undefined}
            dir="ltr"
            inputMode={inputMode}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            min={minimum}
            max={maximum}
            step={stride}
            defaultValue={String(baseline)}
            style={{
              inlineSize: `${Math.max(3, ((editor?.text ?? String(baseline)) || native.placeholder || '').length)}ch`,
            }}
            aria-busy={busy || undefined}
            aria-describedby={fieldDescription(field, describedBy, Boolean(unavailable))}
            aria-invalid={effectiveStatus === 'danger' || undefined}
            onInputCapture={form.onInputCapture}
            onInput={form.onInput}
            onChange={form.onChange}
            onCompositionStart={form.onCompositionStart}
            onCompositionEnd={form.onCompositionEnd}
            onBlur={form.onBlur}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              if (
                !event.defaultPrevented &&
                !event.nativeEvent.isComposing &&
                !form.isComposing() &&
                !event.altKey &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.shiftKey &&
                (event.key === 'ArrowUp' || event.key === 'ArrowDown')
              ) {
                event.preventDefault();
                requestStep(event.key === 'ArrowUp' ? 1 : -1);
              }
            }}
          />
          {suffix && (
            <span className="unica-number-input-affix" dir="auto" aria-hidden="true" title={suffix}>
              {suffix}
            </span>
          )}
        </span>
        {(StatusGlyph || busy) && (
          <span className="unica-number-input-feedback">
            {StatusGlyph && (
              <StatusGlyph className="unica-number-input-glyph unica-number-input-status" />
            )}
            {busy && <Spinner size={size} tone="muted" className="unica-number-input-spinner" />}
          </span>
        )}
      </span>
      {action(1)}
    </span>
  );
}
