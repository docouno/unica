import { useMemo, useRef, useState } from 'react';
import type { JSX, KeyboardEvent } from 'react';
import { useRovingFocus } from '../../core/collections/useRovingFocus.js';
import { cx, dataFlag } from '../../core/cx.js';
import { warnOnce } from '../../core/devWarning.js';
import { isElementNode, isInertElement } from '../../core/dom.js';
import { FormInput, FormSelect } from '../../core/forms/carriers.js';
import { fieldDescription, fieldGroupLabel, useFormField } from '../../core/forms/field-context.js';
import { observeControlPath } from '../../core/forms/observeControlPath.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { Icon } from '../Icon/index.js';
import { Tooltip } from '../Tooltip/index.js';
import {
  observedSegmentedInput,
  observeSegmentedActivation,
  segmentedOptionSelector,
} from './segmented-activation.js';
import { revealSegment, useSegmentedLayout } from './segmented-layout.js';
import type { SegmentedControlOption, SegmentedControlProps } from './types.js';
import { useSegmentedForm } from './useSegmentedForm.js';
import './segmented-control.css';

const availableSelector = `${segmentedOptionSelector}:not(:disabled, [aria-disabled="true"])`;
const horizontalFocus: FocusOptions = { preventScroll: true };
const reservedRootProps = [
  'aria-checked',
  'aria-selected',
  'checked',
  'defaultChecked',
  'dangerouslySetInnerHTML',
  'onChange',
  'onChangeCapture',
] as const;

function createCatalog(
  items: readonly SegmentedControlOption[],
): ReadonlyMap<string, SegmentedControlOption> {
  const catalog = new Map<string, SegmentedControlOption>();
  for (const item of items) {
    if (catalog.has(item.value)) {
      warnOnce(
        'SegmentedControl.duplicateValue',
        'SegmentedControl requires unique option values.',
      );
    } else {
      catalog.set(item.value, item);
    }
  }
  return catalog;
}

function allowsSpace(event: KeyboardEvent): boolean {
  return !(
    event.repeat ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.nativeEvent.isComposing ||
    event.nativeEvent.keyCode === 229
  );
}

/** Presents a compact radio group for choosing one value. */
export function SegmentedControl({
  ref,
  items,
  name,
  form,
  value,
  defaultValue,
  onValueChange,
  size: sizeProp,
  orientation = 'horizontal',
  width = 'auto',
  required: requiredProp,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  status: statusProp,
  'aria-describedby': describedBy,
  'aria-labelledby': labelledBy,
  className,
  onFocus,
  onBlur,
  onKeyDown,
  ...props
}: SegmentedControlProps): JSX.Element {
  const scope = useFormField();
  const field = scope?.target === 'group' ? scope : null;
  const size = sizeProp ?? field?.size ?? 'm';
  const status = statusProp ?? (field?.status === 'danger' ? 'danger' : 'neutral');
  const required = requiredProp ?? field?.required ?? false;
  const disabled = disabledProp ?? field?.disabled ?? false;
  const readOnly = readOnlyProp ?? field?.readOnly ?? false;
  const rail = useRef<HTMLDivElement>(null);
  const rootRef = useMemo(() => mergeRefs(rail, ref), [ref]);
  const catalog = useMemo(() => createCatalog(items), [items]);
  const { carrier, selected, resetValue, controlled, choose, reconcile } = useSegmentedForm({
    rail,
    catalog,
    name,
    form,
    value,
    defaultValue,
    onValueChange,
    readOnly,
  });

  const [fieldsetDisabled, setFieldsetDisabled] = useState(false);
  const unavailable = disabled || fieldsetDisabled;
  const invalid = status === 'danger' && !unavailable;
  const requiresAnswer = required && !readOnly && !unavailable;
  const focusOptions = orientation === 'horizontal' ? horizontalFocus : undefined;

  useIsoLayoutEffect(() => {
    if (rail.current) {
      return observeSegmentedActivation(rail.current, { choose, reconcile });
    }
  }, [choose, reconcile]);

  useIsoLayoutEffect(() => {
    const input = carrier.current;
    if (!input) {
      return;
    }
    return observeControlPath(input, () => setFieldsetDisabled(input.matches(':disabled')));
  }, [carrier]);

  const collection = useMemo(
    () =>
      [...catalog.values()].map((option) => ({
        key: option.value,
        label: option.label,
        navigable: !unavailable && !option.disabled,
      })),
    [catalog, unavailable],
  );
  const entry =
    collection.find((item) => item.key === selected && item.navigable) ??
    collection.find((item) => item.navigable);
  const roving = useRovingFocus<HTMLInputElement>({
    items: collection,
    entryKey: entry?.key,
    recoveryKey: entry?.key,
    orientation: 'both',
    wrap: true,
    homeEnd: true,
    typeahead: false,
    navigateOnCurrent: true,
    focusOptions,
    onNavigate: (next) => {
      const input = rail.current?.querySelector<HTMLInputElement>(`${availableSelector}:focus`);
      if (input?.value === next) {
        choose(input);
      }
    },
  });
  // WebKit can treat adjacent unnamed radios as one Tab group even though
  // the forms expose a separate radiogroup for each control.
  const reserveEntry = entry !== undefined && roving.focusedKey === null;
  useSegmentedLayout(
    rail,
    JSON.stringify([...catalog.values()].map(({ value, iconOnly }) => [value, iconOnly === true])),
    selected,
    roving.focusedKey,
    props.dir,
  );

  const firstAvailable = (): HTMLInputElement | null =>
    rail.current?.querySelector<HTMLInputElement>(availableSelector) ?? null;
  const validationTarget = (): HTMLElement | null =>
    carrier.current?.matches(':disabled') ? null : (firstAvailable() ?? rail.current);
  const validationProps = {
    form,
    disabled,
    required: required && !readOnly,
    className: 'unica-segmented-control-carrier',
    getFocusTarget: validationTarget,
  };
  // The radios share the form owner for native reset. Only the
  // select carrier has a name and participates in submission.
  const radioProps = { form, disabled, controlled };

  for (const prop of reservedRootProps) {
    delete props[prop];
  }

  return (
    <div
      {...props}
      ref={rootRef}
      role="radiogroup"
      aria-labelledby={fieldGroupLabel(field, labelledBy)}
      aria-describedby={fieldDescription(field, describedBy, unavailable)}
      aria-orientation={orientation}
      aria-readonly={readOnly || undefined}
      aria-disabled={unavailable || undefined}
      aria-required={requiresAnswer || undefined}
      aria-invalid={invalid || undefined}
      tabIndex={reserveEntry ? 0 : -1}
      className={cx(
        'unica-segmented-control',
        'unica-scrollbar unica-scrollbar--compact',
        className,
      )}
      data-unica-segmented-size={size}
      data-unica-segmented-orientation={orientation}
      data-unica-segmented-width={width}
      data-unica-segmented-readonly={dataFlag(readOnly)}
      data-unica-segmented-invalid={dataFlag(invalid)}
      onFocus={(event) => {
        if (
          event.target === event.currentTarget &&
          reserveEntry &&
          !carrier.current?.matches(':disabled')
        ) {
          const options = event.currentTarget.querySelectorAll<HTMLInputElement>(availableSelector);
          const target = Array.from(options).find((option) => option.value === entry?.key);
          if (target) {
            target.focus(focusOptions);
            return;
          }
        }
        onFocus?.(event);
      }}
      onBlur={(event) => {
        roving.onBlur(event);
        onBlur?.(event);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          event.defaultPrevented ||
          !isElementNode(event.target) ||
          !event.target.matches(segmentedOptionSelector)
        ) {
          return;
        }
        const input = event.target as HTMLInputElement;
        const space = event.key === ' ';
        const arrow = event.key.startsWith('Arrow');
        const bounds = event.key === 'Home' || event.key === 'End';
        if (!space && !arrow && !bounds) {
          return;
        }
        if (unavailable || readOnly || !input.matches(availableSelector) || isInertElement(input)) {
          event.preventDefault();
          return;
        }
        if (space) {
          event.preventDefault();
          if (allowsSpace(event)) {
            choose(input);
          }
        } else {
          roving.onKeyDown(event);
          // The browser's fallback arrow action also checks native radios,
          // including when the collection rejects a modified key.
          if (arrow) {
            event.preventDefault();
          }
        }
      }}
    >
      <FormSelect
        {...validationProps}
        ref={carrier}
        name={name || undefined}
        initialValue={selected}
        data-unica-segmented-blocked=""
      />
      {[...catalog.values()].map((option) => {
        const item = roving.getItemProps(option.value);
        const label = (
          <label
            key={option.value}
            className="unica-segmented-control-item"
            data-unica-segmented-icon-only={dataFlag(option.iconOnly)}
            data-unica-segmented-blocked={dataFlag(option.disabled)}
            onMouseDown={(event) => {
              if (option.disabled) {
                event.preventDefault();
              }
            }}
          >
            <FormInput
              {...radioProps}
              type="radio"
              value={option.value}
              defaultChecked={resetValue === option.value}
              aria-disabled={option.disabled || undefined}
              data-unica-segmented-option=""
              ref={item.ref}
              tabIndex={reserveEntry ? -1 : item.tabIndex}
              onFocus={(event) => {
                item.onFocus(event);
                const label = event.currentTarget.parentElement;
                if (rail.current && label) {
                  revealSegment(rail.current, label);
                }
              }}
              onInput={(event) => {
                // A component moved into an opaque DOM root can still receive local input.
                if (!observedSegmentedInput(event.nativeEvent)) {
                  if (option.disabled || unavailable || !event.currentTarget.checked) {
                    reconcile();
                  } else {
                    choose(event.currentTarget);
                  }
                }
              }}
            />
            <span className="unica-segmented-control-plate">
              {option.iconLeft && <Icon icon={option.iconLeft} size={size} usage="slot" />}
              <span className={option.iconOnly ? 'unica-visually-hidden' : undefined}>
                {option.label}
              </span>
            </span>
          </label>
        );
        return option.iconOnly ? (
          <Tooltip
            key={option.value}
            label={option.label}
            disabled={option.disabled || unavailable}
          >
            {label}
          </Tooltip>
        ) : (
          label
        );
      })}
    </div>
  );
}
