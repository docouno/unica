import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  useState,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';
import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { Icon } from '@docouno/unica';
import type { GlyphSource, ControlSize } from '@docouno/unica';
import './segmented-control.css';

export interface SegmentItem {
  readonly value: string;
  readonly label: ReactNode;
  readonly iconLeft?: GlyphSource | undefined;
  readonly disabled?: boolean | undefined;
}

export interface SegmentedControlProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> {
  readonly ref?: Ref<HTMLDivElement>;
  readonly items?: readonly SegmentItem[] | undefined;
  readonly value?: string | null | undefined;
  readonly defaultValue?: string | null | undefined;
  readonly onValueChange?: ((value: string) => void) | undefined;
  readonly size?: ControlSize | undefined;
  readonly orientation?: 'horizontal' | 'vertical';
  readonly width?: 'auto' | 'full';
  readonly disabled?: boolean | undefined;
  readonly readOnly?: boolean;
  readonly invalid?: boolean;
  readonly name?: string | undefined;
}

interface SegmentContext {
  readonly name: string;
  readonly value: string | null;
  readonly tabValue: string | undefined;
  readonly size: ControlSize;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly choose: (value: string) => void;
}

const SegmentContext = createContext<SegmentContext | null>(null);

// Local design behavior only; the full reset/validation and ref contract belongs to the library.
export function SegmentedControl({
  ref,
  items,
  children,
  value,
  defaultValue,
  onValueChange,
  size = 'm',
  orientation = 'horizontal',
  width = 'auto',
  disabled = false,
  readOnly = false,
  invalid = false,
  name,
  className = '',
  onKeyDown,
  ...props
}: SegmentedControlProps): ReactElement {
  const generatedName = useId();
  const railRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => railRef.current as HTMLDivElement);
  const choices =
    items ??
    Children.toArray(children).flatMap((child) =>
      isValidElement<SegmentedControlItemProps>(child) ? [child.props] : [],
    );
  const [localValue, setLocalValue] = useState<string | null>(
    defaultValue !== undefined ? defaultValue : (choices[0]?.value ?? null),
  );
  const selected = value !== undefined ? value : localValue;
  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) {
      return;
    }
    const cells = Array.from(rail.querySelectorAll<HTMLElement>('.segment-proto'));
    const reveal = (): void => {
      const bounds = rail.getBoundingClientRect();
      if (!bounds.width) {
        return;
      }
      const inset = Number.parseFloat(getComputedStyle(rail).paddingInlineStart);
      const edges = cells.map((cell) => cell.getBoundingClientRect());
      const contentWidth =
        Math.max(...edges.map((edge) => edge.right)) - Math.min(...edges.map((edge) => edge.left));
      rail.toggleAttribute('data-overflow', contentWidth + 2 * inset > bounds.width + 0.01);
      const input = rail.querySelector<HTMLInputElement>('input:checked');
      if (!input) {
        return;
      }
      const cell = input.parentElement?.getBoundingClientRect();
      if (!cell) {
        return;
      }
      const delta =
        cell.left < bounds.left + inset
          ? cell.left - bounds.left - inset
          : cell.right > bounds.right - inset
            ? cell.right - bounds.right + inset
            : 0;
      if (delta) {
        rail.scrollBy({ left: delta, behavior: 'instant' });
      }
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(rail);
    cells.forEach((cell) => observer.observe(cell));
    return () => observer.disconnect();
  }, [selected]);
  const available = choices.filter((item) => !item.disabled);
  const tabValue = available.find((item) => item.value === selected)?.value ?? available[0]?.value;
  const choose = (next: string): void => {
    if (disabled || readOnly || next === selected) {
      return;
    }
    setLocalValue(next);
    onValueChange?.(next);
  };
  return (
    <SegmentContext
      value={{
        name: name ?? generatedName,
        value: selected,
        tabValue,
        size,
        disabled,
        readOnly,
        choose,
      }}
    >
      <div
        {...props}
        ref={railRef}
        role="radiogroup"
        aria-orientation={orientation}
        aria-readonly={readOnly || undefined}
        aria-disabled={disabled || undefined}
        aria-invalid={invalid || undefined}
        className={`segmented-control-proto unica-scrollbar unica-scrollbar--compact ${className}`}
        data-size={size}
        data-orientation={orientation}
        data-width={width}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
        data-invalid={invalid || undefined}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) {
            return;
          }
          const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
          if (!keys.includes(event.key)) {
            return;
          }
          event.preventDefault();
          if (disabled || readOnly) {
            return;
          }
          const inputs = Array.from(
            event.currentTarget.querySelectorAll<HTMLInputElement>('input:not(:disabled)'),
          );
          const current = inputs.indexOf(event.target as HTMLInputElement);
          if (!inputs.length || current < 0) {
            return;
          }
          const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
          let step = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
          if (rtl && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
            step *= -1;
          }
          const index =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? inputs.length - 1
                : (current + step + inputs.length) % inputs.length;
          const next = inputs[index];
          next?.focus({ preventScroll: true });
          next?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
          if (next) {
            choose(next.value);
          }
        }}
      >
        {items
          ? items.map((item) => (
              <SegmentedControlItem
                key={item.value}
                value={item.value}
                iconLeft={item.iconLeft}
                disabled={item.disabled}
              >
                {item.label}
              </SegmentedControlItem>
            ))
          : children}
      </div>
    </SegmentContext>
  );
}

export interface SegmentedControlItemProps {
  readonly value: string;
  readonly children: ReactNode;
  readonly iconLeft?: GlyphSource | undefined;
  readonly iconOnly?: boolean;
  readonly disabled?: boolean | undefined;
  readonly ref?: Ref<HTMLInputElement>;
  /** Specimen-only pins. These never change the actual selection. */
  readonly previewState?: 'hover' | 'active';
  readonly previewFocus?: boolean;
}

export function SegmentedControlItem({
  value,
  children,
  iconLeft,
  iconOnly = false,
  disabled = false,
  ref,
  previewState,
  previewFocus,
}: SegmentedControlItemProps): ReactElement {
  const group = useContext(SegmentContext);
  if (!group) {
    throw new Error('SegmentedControlItem requires SegmentedControl.');
  }
  const unavailable = group.disabled || disabled;
  return (
    <label
      className="segment-proto"
      data-preview={previewState}
      data-preview-focus={previewFocus || undefined}
      data-icon-only={iconOnly || undefined}
      title={iconOnly && typeof children === 'string' ? children : undefined}
    >
      <input
        ref={ref}
        type="radio"
        name={group.name}
        value={value}
        checked={group.value === value}
        disabled={unavailable}
        tabIndex={!unavailable && group.tabValue === value ? 0 : -1}
        onClick={(event) => {
          if (group.readOnly) {
            event.preventDefault();
          }
        }}
        onKeyDown={(event) => {
          if (group.readOnly && event.key === ' ') {
            event.preventDefault();
          }
        }}
        onChange={() => group.choose(value)}
      />
      <span className="segment-proto-plate">
        {iconLeft && <Icon usage="slot" icon={iconLeft} size={group.size} />}
        <span className="segment-proto-label">{children}</span>
      </span>
    </label>
  );
}
