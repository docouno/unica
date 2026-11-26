import { useMemo, useRef } from 'react';
import type { FocusEvent, KeyboardEvent, ReactElement } from 'react';
import { cx } from '../../core/cx.js';
import { warnOnce } from '../../core/devWarning.js';
import { matchesSafe } from '../../core/dom.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { nonBlank } from '../../core/passiveRoot.js';
import { CloseGlyph } from '../../internal/glyphs/index.js';
import { Icon } from '../Icon/index.js';
import { Spinner } from '../Progress/index.js';
import { TooltipView } from '../Tooltip/Tooltip.js';
import { getTagText, tagRootAttributes } from './attributes.js';
import type { TagProps } from './types.js';
import { useTagFieldset } from './useTagFieldset.js';
import { useTagOverflow } from './useTagOverflow.js';
import './tag.css';

export function isModifiedTagKey(event: KeyboardEvent<HTMLElement>): boolean {
  return (
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.nativeEvent.isComposing ||
    event.nativeEvent.keyCode === 229
  );
}

/** Display one assigned value with a native remove action. */
export function Tag(props: TagProps): ReactElement {
  return <TagView props={props} />;
}

interface TagViewProps {
  readonly props: TagProps;
  readonly onRemoveFocus?: ((event: FocusEvent<HTMLButtonElement>) => void) | undefined;
}

/** Share the remove action with a toolbar's registered focus target. */
export function TagView({
  props: {
    children,
    textValue,
    status = 'neutral',
    size = 'm',
    iconLeft,
    removeIcon = CloseGlyph,
    removeLabel,
    onRemove,
    disabled = false,
    loading = false,
    removeRef,
    removeTabIndex = 0,
    onKeyDown,
    ref,
    className,
    ...props
  },
  onRemoveFocus,
}: TagViewProps): ReactElement {
  const labelRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const mergedRemoveRef = useMemo(() => mergeRefs(buttonRef, removeRef), [removeRef]);
  const touchStartedOnLabel = useRef(false);
  const text = getTagText(children, textValue);
  const valid =
    text !== undefined && nonBlank(removeLabel) !== undefined && typeof onRemove === 'function';
  if (!valid) {
    warnOnce(
      'tag-action',
      'Tag requires a nonempty value, a removeLabel, and an onRemove handler.',
    );
  }

  const fieldsetDisabled = useTagFieldset(buttonRef, valid && loading && !disabled);
  const busy = loading && !disabled && !fieldsetDisabled;
  const clipped = useTagOverflow(labelRef, children, text);

  return (
    <TooltipView
      label={clipped && props.hidden !== true ? (text ?? '') : ''}
      align="start"
      focusOnAriaDisabled
    >
      <span
        {...tagRootAttributes(props)}
        ref={ref}
        className={cx('unica-tag', className)}
        data-unica-tag-size={size}
        data-unica-mark-status={status}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (
            event.target === buttonRef.current &&
            (event.key === 'Enter' || event.key === ' ') &&
            (event.repeat || busy || isModifiedTagKey(event))
          ) {
            event.preventDefault();
          }
        }}
      >
        {iconLeft && (
          <span className="unica-tag-icon" aria-hidden="true">
            <Icon usage="slot" icon={iconLeft} size={size} />
          </span>
        )}
        <span ref={labelRef} className="unica-tag-label" data-unica-tag-part="label">
          {children}
        </span>
        {valid && (
          <button
            ref={mergedRemoveRef}
            className="unica-tag-remove"
            data-unica-tag-part="remove"
            type="button"
            disabled={disabled}
            aria-label={removeLabel}
            aria-disabled={busy || undefined}
            aria-busy={busy || undefined}
            tabIndex={removeTabIndex === -1 ? -1 : 0}
            onFocus={onRemoveFocus}
            onPointerDown={(event) => {
              const label = labelRef.current?.getBoundingClientRect();
              touchStartedOnLabel.current = Boolean(
                event.pointerType === 'touch' &&
                label &&
                event.clientX >= label.left &&
                event.clientX <= label.right &&
                event.clientY >= label.top &&
                event.clientY <= label.bottom,
              );
            }}
            onPointerCancel={() => {
              touchStartedOnLabel.current = false;
            }}
            onClick={(event) => {
              const labelTap = touchStartedOnLabel.current && event.detail > 0;
              touchStartedOnLabel.current = false;
              if (
                !event.defaultPrevented &&
                !disabled &&
                !loading &&
                !labelTap &&
                !matchesSafe(event.currentTarget, ':disabled')
              ) {
                onRemove();
              }
            }}
          >
            <span className="unica-tag-remove-plate" aria-hidden="true">
              {busy ? (
                <Spinner size="inherit" tone="inherit" />
              ) : (
                <Icon usage="slot" icon={removeIcon} />
              )}
            </span>
          </button>
        )}
      </span>
    </TooltipView>
  );
}
