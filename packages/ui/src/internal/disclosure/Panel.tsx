import { useMemo, useRef, useState } from 'react';
import type { ComponentPropsWithRef, ReactElement } from 'react';
import { cx, dataFlag } from '../../core/cx.js';
import { getComputedStyleSafe } from '../../core/dom.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { nonBlank } from '../../core/passiveRoot.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import type { DisclosureState } from './context.js';
import { followReturnedFocus, returnPanelFocus } from './focus.js';
import type { ReturnedFocus } from './focus.js';
import { withoutOwnedAttributes } from './host-attributes.js';

export interface PanelAttributes extends Omit<
  ComponentPropsWithRef<'div'>,
  'id' | 'hidden' | 'inert' | 'dangerouslySetInnerHTML'
> {
  readonly id?: never;
  readonly hidden?: never;
  readonly inert?: never;
  readonly dangerouslySetInnerHTML?: never;
  readonly padded?: boolean | undefined;
}

interface PanelProps extends PanelAttributes {
  readonly state: DisclosureState;
}

export const panelMotionFlag = 'data-unica-disclosure-moving';

const ownedPanelNames = /* @__PURE__ */ new Set([
  'id',
  'hidden',
  'inert',
  'class',
  'style',
  'dangerouslysetinnerhtml',
  'data-unica-disclosure-panel',
  'data-unica-disclosure-open',
  panelMotionFlag,
]);

function readDuration(panel: HTMLElement): number {
  const time = getComputedStyleSafe(panel)?.getPropertyValue('--_disclosure-duration').trim() ?? '';
  return Number.parseFloat(time) * (time.endsWith('ms') ? 1 : 1000);
}

function readHeight(panel: HTMLElement): number {
  const height = Number.parseFloat(getComputedStyleSafe(panel)?.height ?? '');
  return Number.isFinite(height) ? height : panel.offsetHeight;
}

export function Panel({
  state,
  ref,
  children,
  className,
  style,
  role,
  padded = true,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...props
}: PanelProps): ReactElement {
  const nativeProps = withoutOwnedAttributes(props, ownedPanelNames);
  const { open, lazyMount, unmountOnExit, panelId, triggerId, panel: ownerRef } = state;
  const [visit, setVisit] = useState<'new' | 'present' | 'exited'>(open ? 'present' : 'new');
  const previous = useRef<boolean | null>(open);
  const panelRef = useRef<HTMLDivElement>(null);
  const motion = useRef<(() => void) | null>(null);
  const returnedFocus = useRef<ReturnedFocus | null>(null);
  const panelHost = useMemo(() => mergeRefs(panelRef, ownerRef, ref), [ownerRef, ref]);
  const hidden = !open && visit !== 'present';

  useIsoLayoutEffect(() => {
    const panel = panelRef.current;
    return () => {
      motion.current?.();
      returnedFocus.current?.stop();
      returnedFocus.current = null;
      panel?.removeAttribute(panelMotionFlag);
      // Activity can disconnect layout effects while retaining the panel and its state.
      previous.current = null;
    };
  }, []);

  useIsoLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    if (hidden) {
      returnedFocus.current?.update();
      returnedFocus.current?.stop();
      returnedFocus.current = null;
      panel.removeAttribute(panelMotionFlag);
      motion.current?.();
    }
    if (previous.current === null) {
      previous.current = open;
      panel.toggleAttribute('inert', !open);
      if (open) {
        setVisit('present');
      } else if (visit === 'present') {
        setVisit('exited');
      }
      return;
    }
    if (previous.current === open) {
      return;
    }
    previous.current = open;

    returnedFocus.current?.stop();
    const target = open ? undefined : returnPanelFocus(panel, state);
    returnedFocus.current = target ? followReturnedFocus(target) : null;
    panel.toggleAttribute('inert', !open);

    const from = open && visit !== 'present' ? 0 : readHeight(panel);
    motion.current?.();
    if (open) {
      setVisit('present');
    }
    const to = open ? readHeight(panel) : 0;
    const view = panel.ownerDocument.defaultView;
    const media = view?.matchMedia?.('(prefers-reduced-motion: reduce)');
    const duration = readDuration(panel);

    const settle = (): void => {
      if (open) {
        panel.removeAttribute(panelMotionFlag);
        motion.current?.();
      } else {
        // The height stays at zero until React commits hidden and the child mount policy.
        setVisit('exited');
      }
    };
    if (!view || media?.matches || !(duration > 0) || from === to || !panel.animate) {
      settle();
      return;
    }

    panel.setAttribute(panelMotionFlag, '');
    const animation = panel.animate([{ height: `${from}px` }, { height: `${to}px` }], {
      duration: open ? duration : Math.round(duration * 0.8),
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
      fill: 'both',
    });
    let frame = 0;
    const cancel = (): void => {
      animation.onfinish = null;
      animation.oncancel = null;
      animation.cancel();
      view.cancelAnimationFrame(frame);
      media?.removeEventListener('change', checkMotion);
      motion.current = null;
    };
    const finish = (): void => {
      if (motion.current === cancel) {
        settle();
      }
    };
    const checkMotion = (): void => {
      view.cancelAnimationFrame(frame);
      returnedFocus.current?.update();
      if (media?.matches || !(readDuration(panel) > 0)) {
        finish();
      } else {
        frame = view.requestAnimationFrame(checkMotion);
      }
    };
    motion.current = cancel;
    animation.onfinish = finish;
    animation.oncancel = finish;
    frame = view.requestAnimationFrame(checkMotion);
    media?.addEventListener('change', checkMotion);
  }, [hidden, open, state, visit]);

  const keepChildren =
    open || visit === 'present' || (!unmountOnExit && (!lazyMount || visit === 'exited'));
  const regionLabel = role === 'region' && !nonBlank(ariaLabel) ? triggerId : undefined;
  return (
    <div
      {...nativeProps}
      ref={panelHost}
      className={cx('unica-disclosure-panel', className)}
      style={hidden ? { ...style, display: 'none' } : style}
      id={panelId}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={nonBlank(ariaLabelledBy) ?? regionLabel}
      hidden={hidden}
      inert={hidden}
      data-unica-disclosure-panel=""
      data-unica-disclosure-open={dataFlag(open)}
    >
      <div className="unica-disclosure-body" data-unica-disclosure-padded={dataFlag(padded)}>
        {keepChildren && children}
      </div>
    </div>
  );
}
