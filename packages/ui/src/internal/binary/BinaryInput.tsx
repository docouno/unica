import { useCallback, useId, useInsertionEffect, useRef } from 'react';
import type { ChangeEvent, JSX, ReactNode } from 'react';
import { afterDispatch, completeKeydown } from '../../core/activation.js';
import { cx, dataFlag } from '../../core/cx.js';
import { warnOnce } from '../../core/devWarning.js';
import { getDefaultView, isInertElement, matchesSafe } from '../../core/dom.js';
import { FormInput, writeInputChecked } from '../../core/forms/carriers.js';
import { useFormValue } from '../../core/forms/useFormValue.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import type { BinaryGroupContext } from './BinaryGroup.js';
import { bindBinaryInput } from './input-dom.js';
import { registerStandaloneRadio } from './standalone-radio.js';
import type { StandaloneRadio } from './standalone-radio.js';
import type { BinaryKind, BinaryIndicatorProps, BinaryStatus, ToggleProps } from './types.js';
import './binary.css';

interface BinaryInputOptions extends ToggleProps {
  readonly kind: BinaryKind;
  readonly group: BinaryGroupContext | null;
  readonly indicator: (state: BinaryIndicatorProps) => ReactNode;
  readonly status?: BinaryStatus | undefined;
  readonly indeterminate?: boolean | undefined;
  readonly loading?: boolean | undefined;
}

const radioKeys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Home', 'End']);

interface PendingActivation {
  readonly element: HTMLInputElement;
  readonly event: ChangeEvent<HTMLInputElement>;
  readonly next: boolean;
}

function setAria(input: HTMLInputElement, name: string, value: string | boolean | undefined): void {
  if (value === undefined) {
    input.removeAttribute(name);
  } else if (input.getAttribute(name) !== String(value)) {
    input.setAttribute(name, String(value));
  }
}

function rebaseClick(input: HTMLInputElement): void {
  const view = getDefaultView(input.ownerDocument);
  const descriptor =
    view && Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'checked');
  if (descriptor?.set) {
    // Re-run the new click's preactivation against the just-settled value,
    // keeping the React tracker on the baseline until it extracts change.
    const baseline = input.checked;
    writeInputChecked(input, baseline, { force: true });
    descriptor.set.call(input, input.type === 'radio' || !baseline);
    if (input.type === 'checkbox') {
      input.indeterminate = false;
    }
  }
}

export function BinaryInput({
  kind,
  group,
  indicator,
  label,
  description,
  size,
  status,
  indeterminate = false,
  loading = false,
  className,
  style,
  hidden,
  id,
  ref,
  name,
  form,
  checked,
  defaultChecked,
  value,
  disabled,
  readOnly,
  required,
  tabIndex,
  onCheckedChange,
  onChange,
  onClick,
  onKeyDown,
  ...attrs
}: BinaryInputOptions): JSX.Element {
  const generated = useId();
  const inputId = id ?? generated;
  const row = useRef<HTMLLabelElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const radio = useRef<StandaloneRadio | null>(null);
  const activation = useRef<PendingActivation | null>(null);
  const groupDom = group?.dom;
  const observesValidity = kind !== 'switch';
  const inputRef = useCallback(
    (element: HTMLInputElement | null) =>
      mergeRefs((element: HTMLInputElement | null) => {
        input.current = element;
        if (element && observesValidity) {
          groupDom?.watchValidity(element);
        }
      }, ref)(element),
    [groupDom, observesValidity, ref],
  );
  const isRadio = kind === 'radio';
  const isSwitch = kind === 'switch';
  const managed = group?.managed === true;
  const standaloneRadio = isRadio && !group;
  const effectiveSize = size ?? group?.size ?? 'm';
  const effectiveStatus = status ?? group?.status ?? 'neutral';
  const unavailable = Boolean(disabled || group?.disabled);
  const locked = Boolean(readOnly || group?.readOnly);
  const busy = isSwitch && loading;
  const hasLabel = label !== undefined && label !== null && label !== false;
  const hasDescription = description !== undefined && description !== null && description !== false;
  const descriptionId = hasDescription ? `${generated}-description` : undefined;
  const labelId = hasLabel ? `${generated}-label` : undefined;
  const invalid = effectiveStatus === 'danger' || attrs['aria-invalid'];
  const inputName =
    group && (isRadio || (group.sharedOwner && group.name !== undefined))
      ? group.name
      : (name ?? group?.name);
  const inputForm = group?.sharedOwner ? group.form : (form ?? group?.form);

  const local = useFormValue<boolean>({
    value: managed || standaloneRadio ? undefined : checked,
    defaultValue: defaultChecked ?? false,
    getControl: () => (managed || standaloneRadio ? null : input.current),
    writeDeps: [indeterminate],
    write(next, context) {
      if (input.current) {
        writeInputChecked(input.current, next, {
          syncDefault: context.controlled,
          force: context.force,
        });
        if (kind === 'checkbox') {
          input.current.indeterminate = indeterminate;
        }
        groupDom?.syncValidity();
      }
    },
  });

  function repair(): void {
    if (managed) {
      group?.repair();
    } else if (standaloneRadio) {
      radio.current?.repair();
    } else {
      local.repair();
    }
  }

  function blocked(element: HTMLInputElement): boolean {
    return locked || busy || matchesSafe(element, ':disabled') || isInertElement(element);
  }

  function acceptActivation(pending: PendingActivation): void {
    const { element, event, next } = pending;
    if (event.nativeEvent.defaultPrevented || blocked(element)) {
      repair();
      return;
    }
    if (managed) {
      if (!group.propose(element, next)) {
        return;
      }
    } else if (standaloneRadio) {
      if (!radio.current?.propose(next)) {
        return;
      }
    } else {
      if (local.read() === next) {
        local.repair();
        return;
      }
      local.propose(next, element);
    }
    onCheckedChange?.(next);
    if (onChange) {
      // React extracts change from click. Deliver that event after native input confirms
      // activation, with currentTarget bound for the duration of the consumer callback.
      const previous = event.currentTarget;
      event.currentTarget = element;
      try {
        onChange(event);
      } finally {
        event.currentTarget = previous;
      }
    }
  }

  const availability = {
    invalid,
    busy,
    ariaBusy: attrs['aria-busy'],
    ariaDisabled: attrs['aria-disabled'],
  };
  const current = useRef({
    availability,
    checked,
    defaultChecked,
    sync: local.sync,
    acceptActivation,
    repair,
    blocked,
  });
  useInsertionEffect(() => {
    current.current = {
      availability,
      checked,
      defaultChecked,
      sync: local.sync,
      acceptActivation,
      repair,
      blocked,
    };
  });

  function finishActivation(pending: PendingActivation): void {
    if (activation.current === pending) {
      activation.current = null;
      if (input.current === pending.element) {
        current.current.acceptActivation(pending);
      }
    }
  }

  function syncAvailability(element: HTMLInputElement): void {
    const { invalid, busy, ariaBusy, ariaDisabled } = current.current.availability;
    const disabled = element.matches(':disabled');
    const pending = busy && !disabled;
    setAria(element, 'aria-invalid', disabled ? undefined : invalid);
    setAria(element, 'aria-busy', pending || ariaBusy);
    setAria(element, 'aria-disabled', pending || ariaDisabled);
  }

  useIsoLayoutEffect(() => {
    const element = input.current;
    const host = row.current;
    if (element && host) {
      return bindBinaryInput(element, host, {
        refresh(rootChanged) {
          syncAvailability(element);
          radio.current?.refreshRoot();
          if (rootChanged) {
            current.current.sync();
          }
        },
        beforeClick(event) {
          const pending = activation.current;
          const previous = pending?.event.nativeEvent;
          if (pending && previous && previous !== event && previous.eventPhase === 0) {
            finishActivation(pending);
            current.current.repair();
            rebaseClick(element);
          }
        },
        confirmInput() {
          const pending = activation.current;
          if (pending?.element === element && pending.event.nativeEvent.eventPhase === 0) {
            finishActivation(pending);
          }
        },
      });
    }
  }, []);

  useIsoLayoutEffect(() => {
    const element = input.current;
    if (element && standaloneRadio) {
      const registered = registerStandaloneRadio(
        element,
        current.current.defaultChecked ?? false,
        current.current.checked,
      );
      radio.current = registered;
      return () => {
        registered.dispose();
        radio.current = null;
      };
    }
  }, [standaloneRadio]);

  useIsoLayoutEffect(() => {
    const element = input.current;
    if (element && groupDom) {
      return () => groupDom.removeMember(element);
    }
  }, [groupDom]);

  useIsoLayoutEffect(() => {
    const element = input.current;
    if (!element) {
      return;
    }
    if (kind === 'checkbox') {
      element.indeterminate = indeterminate;
    }
    if (group?.sharedOwner && form !== undefined && form !== group.form) {
      warnOnce('binary-shared-form', 'Set form on the group when its options share a form owner.');
    }
    if (isRadio && group && name !== undefined && name !== group.name) {
      warnOnce('radio-group-name', 'Set name on RadioGroup to name its native radio set.');
    }
    if (managed && (checked !== undefined || defaultChecked !== undefined)) {
      warnOnce(
        'binary-group-authority',
        'Use the group value or defaultValue to set checked options.',
      );
    }
    groupDom?.setMember(element, {
      disabled: unavailable,
      tabIndex,
      key: value,
      name: inputName,
      onAvailabilityChange: () => syncAvailability(element),
    });
    radio.current?.update(checked);
    syncAvailability(element);
  });

  function stageActivation(event: ChangeEvent<HTMLInputElement>): void {
    const element = event.currentTarget;
    const pending = { event, element, next: element.checked };
    activation.current = pending;
    const controlled = managed
      ? group.controlled
      : standaloneRadio
        ? checked !== undefined || radio.current?.hasControlledSelection()
        : local.controlled;
    if (controlled) {
      // Delegated React change listeners must also read the last controlled commit.
      repair();
    }
    afterDispatch(event.nativeEvent, element, () => finishActivation(pending));
  }

  const selected = managed
    ? group.isChecked(value)
    : standaloneRadio
      ? (checked ?? defaultChecked ?? false)
      : local.value;
  const resetSelection = managed ? group.isDefaultChecked(value) : selected;

  return (
    <label
      ref={row}
      className={cx('unica-binary-control', className)}
      data-unica-binary-kind={kind}
      data-unica-binary-size={effectiveSize}
      data-unica-binary-status={effectiveStatus}
      data-unica-binary-readonly={dataFlag(locked)}
      data-unica-binary-standalone={dataFlag(!hasLabel && !hasDescription)}
      style={style}
      hidden={hidden}
    >
      <span className="unica-binary-target">
        <FormInput
          {...attrs}
          ref={inputRef}
          id={inputId}
          className="unica-binary-native"
          type={isRadio ? 'radio' : 'checkbox'}
          role={isSwitch ? 'switch' : undefined}
          name={inputName}
          form={inputForm}
          value={value ?? 'on'}
          controlled={managed || (standaloneRadio ? checked !== undefined : local.controlled)}
          defaultChecked={resetSelection}
          disabled={unavailable}
          required={required || (isRadio && group?.required)}
          tabIndex={tabIndex}
          data-unica-binary-mixed={dataFlag(indeterminate)}
          data-unica-binary-keyed={dataFlag(value !== undefined)}
          aria-busy={(busy && !unavailable) || attrs['aria-busy']}
          aria-disabled={(busy && !unavailable) || attrs['aria-disabled']}
          aria-readonly={(!isRadio && locked) || attrs['aria-readonly']}
          aria-invalid={unavailable ? undefined : invalid}
          aria-labelledby={
            attrs['aria-labelledby'] ?? (attrs['aria-label'] === undefined ? labelId : undefined)
          }
          aria-describedby={
            [attrs['aria-describedby'], descriptionId].filter(Boolean).join(' ') || undefined
          }
          onClick={(event) => {
            onClick?.(event);
            if (blocked(event.currentTarget)) {
              event.preventDefault();
            }
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented || event.nativeEvent.defaultPrevented) {
              return;
            }
            const { key, currentTarget } = event;
            const radioNavigation = isRadio && group && radioKeys.has(key);
            if (
              (key === ' ' || radioNavigation || (isSwitch && key === 'Enter')) &&
              blocked(currentTarget)
            ) {
              event.preventDefault();
              return;
            }
            if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
              if (radioNavigation || (isSwitch && key === 'Enter')) {
                event.preventDefault();
              }
              return;
            }
            if (isSwitch && key === 'Enter') {
              completeKeydown(event.nativeEvent, currentTarget, () => {
                if (
                  !event.repeat &&
                  currentTarget.isConnected &&
                  !current.current.blocked(currentTarget)
                ) {
                  currentTarget.click();
                }
              });
            } else if (radioNavigation) {
              const target = group.dom.getRadioTarget(currentTarget, key);
              if (target) {
                completeKeydown(event.nativeEvent, currentTarget, () => {
                  if (target.isConnected && !current.current.blocked(target)) {
                    target.focus();
                    target.click();
                  }
                });
              }
            }
          }}
          onChange={stageActivation}
        />
        {indicator({ size: effectiveSize, checked: selected, disabled: unavailable })}
      </span>
      {(hasLabel || hasDescription) && (
        <span className="unica-binary-copy">
          {hasLabel && (
            <span className="unica-binary-label" id={labelId}>
              {label}
            </span>
          )}
          {hasDescription && (
            <span
              className="unica-binary-description"
              id={descriptionId}
              aria-hidden={!hasLabel || undefined}
            >
              {description}
            </span>
          )}
        </span>
      )}
    </label>
  );
}
