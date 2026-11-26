import { useContext, useId, useMemo, useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';
import { cx, dataFlag } from '../../core/cx.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { pickConsumerDataAttributes } from '../../core/passiveRoot.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import {
  CloseGlyph,
  ErrorCircleGlyph,
  FieldInfoGlyph,
  FieldSuccessGlyph,
  FieldWarningGlyph,
  NotificationGlyph,
} from '../../internal/glyphs/index.js';
import { Button } from '../Button/Button.js';
import { IconButton } from '../Button/IconButton.js';
import { Icon } from '../Icon/Icon.js';
import { Spinner } from '../Progress/Spinner.js';
import { ToastContext, defaultToastMessages } from './context.js';
import { assertToastContent } from './store.js';
import type { ToastProps, ToastStatus } from './types.js';
import './toast.css';

const glyphs: Readonly<Record<ToastStatus, typeof FieldInfoGlyph>> = {
  neutral: NotificationGlyph,
  info: FieldInfoGlyph,
  success: FieldSuccessGlyph,
  warning: FieldWarningGlyph,
  danger: ErrorCircleGlyph,
};

const statusSignal: Readonly<Record<ToastStatus, string>> = {
  neutral: 'var(--neutral-signal)',
  info: 'var(--status-info-signal)',
  success: 'var(--status-success-signal)',
  warning: 'var(--status-warning-signal)',
  danger: 'var(--status-danger-signal)',
};

interface ToastCardProps extends ToastProps {
  readonly summary?: string | undefined;
}

function useActionLine(
  node: HTMLDivElement | null,
  auto: boolean,
  title: string,
  label: string | undefined,
): boolean {
  const [wrap, setWrap] = useState(false);
  useIsoLayoutEffect(() => {
    const view = node?.ownerDocument.defaultView;
    const titleProbe = node?.querySelector('.unica-toast-title-measure');
    const actionProbe = node?.querySelector('.unica-toast-action-measure');
    const action = actionProbe?.closest('button');
    if (!node || !view || !auto || !titleProbe || !actionProbe || !action) {
      return;
    }
    function measure(): void {
      if (!node || !view || !titleProbe || !actionProbe || !action) {
        return;
      }
      const cardStyle = view.getComputedStyle(node);
      const buttonStyle = view.getComputedStyle(action);
      const dismiss = node.querySelector('.unica-toast-dismiss');
      const padding = (style: CSSStyleDeclaration): number =>
        Number.parseFloat(style.paddingInlineStart) + Number.parseFloat(style.paddingInlineEnd);
      const actionWidth =
        actionProbe.getBoundingClientRect().width +
        padding(buttonStyle) +
        Number.parseFloat(buttonStyle.borderInlineStartWidth) +
        Number.parseFloat(buttonStyle.borderInlineEndWidth);
      const required =
        20 +
        3 * Number.parseFloat(cardStyle.columnGap) +
        padding(cardStyle) +
        (dismiss?.getBoundingClientRect().width ?? 0) +
        titleProbe.getBoundingClientRect().width +
        actionWidth;
      setWrap(required > node.clientWidth + 0.5 || actionWidth > 160);
    }
    measure();
    const observer = new view.ResizeObserver(measure);
    observer.observe(node);
    observer.observe(titleProbe);
    observer.observe(actionProbe);
    const dismiss = node.querySelector('.unica-toast-dismiss');
    if (dismiss) {
      observer.observe(dismiss);
    }
    return () => observer.disconnect();
  }, [node, auto, title, label]);
  return auto && wrap;
}

/** Renders passive feedback with an optional application action and dismiss control. */
export function Toast(props: ToastProps): ReactElement {
  return <ToastCard {...props} summary={undefined} />;
}

/** Shared card rendering for inline and queued notifications. */
export function ToastCard({
  title,
  status = 'neutral',
  loading = false,
  action,
  actionLayout = 'auto',
  onDismiss,
  dismissLabel,
  summary,
  className,
  children,
  style,
  id,
  lang,
  dir,
  ref,
  ...attributes
}: ToastCardProps): ReactElement {
  assertToastContent(title, action);
  const messages = useContext(ToastContext)?.messages ?? defaultToastMessages;
  const titleId = useId();
  const stateId = useId();
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const cardRef = useMemo(() => mergeRefs(setNode, ref), [ref]);
  const hasDescription =
    children !== null && children !== undefined && children !== false && children !== '';
  const auto = Boolean(action) && !hasDescription && actionLayout === 'auto';
  const wrapAction = useActionLine(node, auto, title, action?.label);
  const below = hasDescription || actionLayout === 'below' || wrapAction;
  const state = messages.stateLabel(status, loading);

  return (
    <div
      {...pickConsumerDataAttributes(attributes, 'data-unica-toast-')}
      ref={cardRef}
      id={id}
      className={cx('unica-toast', className)}
      lang={lang}
      dir={dir}
      role="group"
      aria-labelledby={titleId}
      aria-describedby={state ? stateId : undefined}
      data-surface="overlay"
      data-unica-toast-status={status}
      data-unica-toast-loading={dataFlag(loading)}
      data-unica-toast-action-below={dataFlag(below)}
      style={{ ...style, '--_toast-signal': statusSignal[status] } as CSSProperties}
    >
      {auto && (
        <bdi
          className="unica-toast-title-measure"
          data-unica-toast-measure={title}
          aria-hidden="true"
        />
      )}
      <span className="unica-toast-glyph" aria-hidden="true">
        {loading ? <Spinner size="inherit" /> : <Icon usage="slot" icon={glyphs[status]} />}
      </span>
      {state && (
        <span id={stateId} className="unica-visually-hidden">
          {state}
        </span>
      )}
      <div className="unica-toast-copy">
        <div className="unica-toast-title" id={titleId}>
          <bdi>{title}</bdi>
        </div>
        {hasDescription && (
          <div className="unica-toast-description">
            {typeof children === 'string' ? <bdi>{children}</bdi> : children}
          </div>
        )}
      </div>
      {action && (
        <Button
          className="unica-toast-action"
          size="s"
          variant="ghost"
          tone="neutral"
          type="button"
          disabled={action.disabled}
          loading={action.pending}
          onClick={action.onClick}
        >
          <bdi>{action.label}</bdi>
          {auto && (
            <bdi
              className="unica-toast-action-measure"
              data-unica-toast-measure={action.label}
              aria-hidden="true"
            />
          )}
        </Button>
      )}
      {onDismiss && (
        <IconButton
          className="unica-toast-dismiss"
          icon={CloseGlyph}
          size="s"
          variant="ghost"
          tone="neutral"
          type="button"
          aria-label={dismissLabel ?? messages.dismiss(title)}
          onClick={onDismiss}
        />
      )}
      {summary && (
        <div className="unica-toast-stack-hint">
          <bdi>{summary}</bdi>
        </div>
      )}
    </div>
  );
}
