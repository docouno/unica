import { useCallback, useMemo, useRef, useState } from 'react';
import type { HTMLAttributes, JSX, KeyboardEvent, Ref, RefCallback } from 'react';
import { cx, dataFlag } from '../../core/cx.js';
import { FormInput } from '../../core/forms/carriers.js';
import {
  fieldControlId,
  fieldDescription,
  fieldGroupLabel,
  useFormField,
} from '../../core/forms/field-context.js';
import type { StyleWithVars } from '../../core/mergeStyle.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { pickConsumerDataAttributes } from '../../core/passiveRoot.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { serializeValue, sortMarks } from './scale.js';
import type { SliderScale, SliderValues } from './scale.js';
import { SliderMarks } from './SliderMarks.js';
import type { SliderProps } from './types.js';
import { nativeNumbers, useSliderForm } from './useSliderForm.js';
import type { SliderInputs } from './useSliderForm.js';
import { useSliderInput } from './useSliderInput.js';

interface Naming {
  readonly id?: string | undefined;
  readonly label?: string | undefined;
  readonly labelledBy?: string | undefined;
  readonly describedBy?: string | undefined;
  readonly details?: string | undefined;
}

interface ThumbProps extends Naming {
  readonly ref?: Ref<HTMLInputElement> | undefined;
  readonly name?: string | undefined;
}

type SliderFrame = Pick<
  SliderProps,
  | 'size'
  | 'orientation'
  | 'status'
  | 'disabled'
  | 'readOnly'
  | 'showValue'
  | 'formatValue'
  | 'marks'
  | 'form'
  | 'className'
  | 'style'
  | 'dir'
  | 'lang'
  | 'inert'
  | 'hidden'
  | 'title'
> &
  Pick<
    HTMLAttributes<HTMLElement>,
    | 'onKeyDown'
    | 'onKeyDownCapture'
    | 'onKeyUp'
    | 'onKeyUpCapture'
    | 'onFocus'
    | 'onFocusCapture'
    | 'onBlur'
    | 'onBlurCapture'
  >;

interface SliderControlProps extends SliderFrame {
  readonly scale: SliderScale;
  readonly group?: (Naming & { readonly ref?: Ref<HTMLDivElement> | undefined }) | undefined;
  readonly thumbs: readonly ThumbProps[];
  readonly value: SliderValues | undefined;
  readonly defaultValue: SliderValues;
  readonly onChange: ((next: SliderValues) => void) | undefined;
  readonly onCommit: ((next: SliderValues) => void) | undefined;
}

const noMarks: readonly [] = [];

function naming({ id, label, labelledBy, describedBy, details }: Naming) {
  return {
    id,
    'aria-label': label,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    'aria-details': details,
  };
}

function useAttachmentRef<T>(internal: Ref<T>, external?: Ref<T>): RefCallback<T> {
  return useCallback(
    (node) => (node === null ? undefined : mergeRefs(internal, external)(node)),
    [internal, external],
  );
}

export function SliderControl({
  scale,
  group,
  thumbs,
  value,
  defaultValue,
  onChange,
  onCommit,
  orientation = 'horizontal',
  size: sizeProp,
  status: statusProp,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  showValue = true,
  formatValue = serializeValue,
  marks = noMarks,
  form: formId,
  className,
  style,
  dir,
  lang,
  inert,
  hidden,
  title,
  onKeyDown,
  onKeyDownCapture,
  onKeyUp,
  onKeyUpCapture,
  onFocus,
  onFocusCapture,
  onBlur,
  onBlurCapture,
  ...rest
}: SliderControlProps): JSX.Element {
  const scope = useFormField();
  const field = scope?.target === (group ? 'group' : 'control') ? scope : null;
  const size = sizeProp ?? field?.size ?? 'm';
  const status = statusProp ?? (field?.status === 'danger' ? 'danger' : 'neutral');
  const disabled = disabledProp ?? field?.disabled ?? false;
  const readOnly = readOnlyProp ?? field?.readOnly ?? false;
  const root = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const lower = useRef<HTMLInputElement>(null);
  const upper = useRef<HTMLInputElement>(null);
  const reset = useRef<(() => void) | null>(null);
  const inputs = useMemo<SliderInputs>(() => [lower, upper], [lower, upper]);
  const rootRef = useAttachmentRef(root, group?.ref);
  const lowerInputRef = useAttachmentRef(lower, thumbs[0]?.ref);
  const upperInputRef = useAttachmentRef(upper, thumbs[1]?.ref);
  const form = useSliderForm({
    scale,
    inputs,
    value,
    defaultValue,
    onChange,
    readOnly,
    onReset: () => reset.current?.(),
  });
  const [initialFormId] = useState(formId);
  useIsoLayoutEffect(() => {
    // Leave the old owner in place until any already-completed reset has been
    // reconciled. A reset still dispatching uses the newly associated controls.
    for (const handle of inputs) {
      const node = handle.current;
      if (node && node.getAttribute('form') !== (formId ?? null)) {
        if (formId === undefined) {
          node.removeAttribute('form');
        } else {
          node.setAttribute('form', formId);
        }
      }
    }
  }, [formId, inputs]);
  const input = useSliderInput(
    { root, rail, inputs, orientation, scale, form, disabled, readOnly, onCommit },
    reset,
  );
  // React supplies the initial numeric attributes for SSR. From hydration on,
  // the form writer owns the pair so React cannot restore a stale bound mid-reset.
  const [native] = useState(() => [
    nativeNumbers(scale, form.value, 0),
    group ? nativeNumbers(scale, form.value, 1) : undefined,
  ]);
  const marksByValue = useMemo(() => sortMarks(scale, marks), [scale, marks]);
  const first = form.value[0];
  const last = form.value[1];
  const start = last === undefined ? 0 : scale.fractionOf(first);
  const end = scale.fractionOf(last ?? first);
  const close = useRef<() => void>(() => {});
  const horizontal = orientation === 'horizontal';
  useIsoLayoutEffect(() => {
    close.current = () => {
      const node = rail.current;
      if (!node || !group) {
        return;
      }
      const computed = node.ownerDocument.defaultView?.getComputedStyle(node);
      const length = Number.parseFloat(
        horizontal ? (computed?.width ?? '') : (computed?.height ?? ''),
      );
      const short = Number.parseFloat(computed?.getPropertyValue('--_slider-short') ?? '');
      node.toggleAttribute(
        'data-unica-slider-close',
        start === end || (length > 0 && (end - start) * Math.max(0, length - short) < short + 6),
      );
    };
    close.current();
  });
  useIsoLayoutEffect(() => {
    const node = rail.current;
    const view = node?.ownerDocument.defaultView;
    if (!node || !view || !group) {
      return;
    }
    const observer = new view.ResizeObserver(() => close.current());
    observer.observe(node);
    return () => observer.disconnect();
  }, [rail, Boolean(group)]);

  const invalid = status === 'danger' && !input.disabled;
  const display = [formatValue(first), last === undefined ? undefined : formatValue(last)] as const;
  const keys = {
    onKeyDown(event: KeyboardEvent<HTMLElement>) {
      onKeyDown?.(event);
      input.onKeyDown(event);
    },
    onKeyDownCapture,
    onKeyUp,
    onKeyUpCapture,
    onFocus,
    onFocusCapture,
    onBlur,
    onBlurCapture,
  };
  const positions: StyleWithVars = { '--_slider-start': start, '--_slider-end': end };

  return (
    <div
      {...pickConsumerDataAttributes(rest, 'data-unica-slider-')}
      {...(group
        ? {
            ...naming(group),
            'aria-labelledby': fieldGroupLabel(field, group.labelledBy),
            'aria-describedby': fieldDescription(field, group.describedBy, input.disabled),
          }
        : undefined)}
      ref={rootRef}
      className={cx('unica-slider', className)}
      style={style}
      dir={dir}
      lang={lang}
      inert={inert}
      hidden={hidden}
      title={title}
      role={group ? 'group' : undefined}
      aria-invalid={group && invalid ? true : undefined}
      {...(group ? keys : undefined)}
      data-unica-slider-size={size}
      data-unica-slider-orientation={orientation}
      data-unica-slider-status={status}
      data-unica-slider-readonly={dataFlag(readOnly)}
    >
      {showValue && (
        <span className="unica-slider-value" dir={group ? 'ltr' : undefined}>
          <bdi>{display[0]}</bdi>
          {group && (
            <>
              <span aria-hidden="true">—</span>
              <bdi>{display[1]}</bdi>
            </>
          )}
        </span>
      )}
      <div className="unica-slider-scale">
        <div
          ref={rail}
          className="unica-slider-hit"
          style={positions}
          data-unica-slider-close={dataFlag(Boolean(group) && start === end)}
          onPointerDown={input.onPointerDown}
          onPointerMove={input.onPointerMove}
          onPointerLeave={input.onPointerLeave}
          onPointerUp={input.onPointerUp}
          onPointerCancel={input.onPointerCancel}
          onLostPointerCapture={input.onLostPointerCapture}
        >
          <span className="unica-slider-rail" aria-hidden="true" />
          <span className="unica-slider-fill" aria-hidden="true" />
          {thumbs.map((thumb, index) => {
            const position: StyleWithVars = {
              '--_slider-position': group && index === 0 ? start : end,
            };
            return (
              <span
                className="unica-slider-thumb-wrap"
                key={index}
                style={position}
                data-unica-slider-thumb={String(index)}
              >
                <FormInput
                  {...naming(thumb)}
                  id={fieldControlId(field?.target === 'control' ? field : null, thumb.id)}
                  aria-describedby={fieldDescription(
                    field,
                    thumb.describedBy,
                    input.disabled || group !== undefined,
                  )}
                  {...native[index]}
                  {...(!group ? keys : undefined)}
                  controlled={false}
                  ref={index === 0 ? lowerInputRef : upperInputRef}
                  type="range"
                  name={thumb.name}
                  form={initialFormId}
                  disabled={disabled}
                  aria-readonly={readOnly && !input.disabled ? true : undefined}
                  aria-invalid={!group && invalid ? true : undefined}
                  aria-orientation={orientation}
                  aria-valuetext={display[index]}
                  className="unica-slider-native"
                />
                <span className="unica-slider-thumb" aria-hidden="true" />
              </span>
            );
          })}
        </div>
        {marksByValue.length > 0 && (
          <SliderMarks marks={marksByValue} scale={scale} orientation={orientation} />
        )}
      </div>
    </div>
  );
}
