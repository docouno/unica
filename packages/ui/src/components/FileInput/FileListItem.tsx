import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement, RefObject } from 'react';
import { cx, dataFlag } from '../../core/cx.js';
import { getDefaultView, isInertElement, matchesSafe } from '../../core/dom.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { Button, IconButton } from '../Button/index.js';
import { Icon } from '../Icon/index.js';
import { Progress, Spinner } from '../Progress/index.js';
import { fileGlyph, removeGlyph, successGlyph } from './glyphs.js';
import { FileListContext } from './list-context.js';
import { listCopy, measuredProgress, resolveMessages } from './messages.js';
import type { FileListItemProps } from './types.js';
import { suppressRepeatedActivation } from './use-file-intake.js';
import './file-input.css';

function Thumbnail({
  url,
  size,
}: {
  readonly url: string | undefined;
  readonly size: 's' | 'm' | 'l';
}): ReactElement {
  const [failed, setFailed] = useState(false);
  return url && !failed ? (
    <img src={url} alt="" onError={() => setFailed(true)} />
  ) : (
    <Icon usage="slot" icon={fileGlyph} size={size} />
  );
}

function LocalThumbnail({
  file,
  size,
  row,
}: {
  readonly file: File;
  readonly size: 's' | 'm' | 'l';
  readonly row: RefObject<HTMLLIElement | null>;
}): ReactElement {
  const [preview, setPreview] = useState<{ file: File; url: string }>();
  useEffect(() => {
    const view = getDefaultView(row.current?.ownerDocument ?? null);
    if (view?.URL.createObjectURL) {
      const url = view.URL.createObjectURL(file);
      let active = true;
      queueMicrotask(() => {
        if (active) {
          setPreview({ file, url });
        }
      });
      return () => {
        active = false;
        view.URL.revokeObjectURL(url);
      };
    }
  }, [file, row]);
  const url = preview?.file === file ? preview.url : undefined;
  return <Thumbnail key={url} url={url} size={size} />;
}

/** Display one local or saved attachment and its application-owned operation. */
export function FileListItem({
  ref,
  name,
  size: sizeProp,
  fileSize,
  state,
  thumbnail,
  href,
  disabled = false,
  readOnly = false,
  removing: removingProp = false,
  removeError,
  onRemove,
  onRetry,
  messages: customMessages,
  className,
  ...props
}: FileListItemProps): ReactElement {
  const list = useContext(FileListContext);
  const size = sizeProp ?? list?.size ?? 'm';
  const inherited = list?.messages ?? listCopy;
  const messages = useMemo(
    () => resolveMessages(inherited, customMessages),
    [inherited, customMessages],
  );
  const row = useRef<HTMLLIElement>(null);
  const rowRef = useMemo(() => mergeRefs(row, ref), [ref]);
  const remove = useRef<HTMLButtonElement>(null);
  const removing = !disabled && !readOnly && removingProp;
  const phase = disabled || removing ? undefined : state?.phase;
  const progress = measuredProgress(state);
  const phaseDetail = removing
    ? messages.removing
    : phase && state
      ? messages.phase(state, name)
      : '';
  const showTrack =
    phase === 'uploading' ||
    (progress !== null && (phase === 'verifying' || phase === 'paused' || phase === 'failed'));
  const showWaiting = removing || (phase === 'verifying' && progress === null);
  const canRemove = !readOnly && onRemove !== undefined;
  const canRetry = !disabled && !readOnly && state?.phase === 'failed' && onRetry !== undefined;
  const error = !disabled && !removing ? removeError : undefined;
  const update = list?.update;

  useIsoLayoutEffect(() => {
    const node = row.current;
    if (node && update) {
      return () => update(node, null);
    }
  }, [update]);

  useIsoLayoutEffect(() => {
    if (row.current && update) {
      update(row.current, {
        name,
        phase,
        detail: phaseDetail,
        removing,
        removeError: error,
        remove: remove.current,
      });
    }
  });

  function activate(action: (() => void) | undefined, target: HTMLButtonElement): void {
    if (
      !removing &&
      !readOnly &&
      !disabled &&
      !matchesSafe(target, ':disabled') &&
      !isInertElement(target)
    ) {
      action?.();
    }
  }

  const sizeText =
    typeof fileSize === 'number' && Number.isFinite(fileSize) && fileSize >= 0
      ? messages.formatSize(fileSize)
      : undefined;
  const filename = <bdi>{name}</bdi>;
  return (
    <li
      {...props}
      ref={rowRef}
      className={cx('unica-file-item', className)}
      data-unica-file-item-size={size}
      data-unica-file-item-phase={phase}
      data-unica-file-item-disabled={dataFlag(disabled)}
      data-unica-file-item-removing={dataFlag(removing)}
    >
      <span className="unica-file-item-icon" aria-hidden="true">
        {typeof thumbnail === 'object' ? (
          <LocalThumbnail file={thumbnail} size={size} row={row} />
        ) : (
          <Thumbnail key={thumbnail} url={thumbnail} size={size} />
        )}
      </span>
      <div className="unica-file-item-body">
        {href && !disabled ? (
          <a className="unica-file-item-name unica-file-item-link" href={href} download={name}>
            {filename}
          </a>
        ) : (
          <span className="unica-file-item-name">{filename}</span>
        )}
        {(sizeText || phaseDetail || (showTrack && progress !== null)) && (
          <div className="unica-file-item-meta">
            {sizeText && (
              <span className="unica-file-item-size" dir="auto">
                {sizeText}
              </span>
            )}
            {phaseDetail && (
              <span className="unica-file-item-detail">
                {showWaiting ? (
                  <Spinner />
                ) : phase === 'success' ? (
                  <Icon usage="slot" icon={successGlyph} color="success" />
                ) : null}
                <span dir="auto">{phaseDetail}</span>
              </span>
            )}
            {showTrack && progress !== null && (
              <span className="unica-file-item-percentage" dir="ltr" aria-hidden="true">
                {Math.floor(progress)}%
              </span>
            )}
          </div>
        )}
        {showTrack && phase && (
          <Progress
            aria-label={messages.progress(name, phase)}
            size="s"
            showValue={false}
            className="unica-file-item-progress"
            value={progress}
            active={phase === 'uploading' || phase === 'verifying'}
            paused={phase === 'paused'}
            status={phase === 'failed' ? 'danger' : phase === 'paused' ? 'neutral' : 'accent'}
          />
        )}
        {error && (
          <span className="unica-file-item-error" dir="auto">
            {error}
          </span>
        )}
      </div>
      {(canRetry || canRemove) && (
        <span className="unica-file-item-actions" aria-disabled={removing || undefined}>
          {canRetry && (
            <Button
              className="unica-file-item-retry"
              variant="ghost"
              tone="neutral"
              size={size}
              type="button"
              tabIndex={removing ? -1 : undefined}
              aria-label={messages.retry(name)}
              onKeyDown={suppressRepeatedActivation}
              onClick={(event) => activate(onRetry, event.currentTarget)}
            >
              {messages.retryAction}
            </Button>
          )}
          {canRemove && (
            <IconButton
              ref={remove}
              className="unica-file-item-remove"
              icon={removeGlyph}
              variant="ghost"
              tone="neutral"
              size={size}
              type="button"
              disabled={disabled}
              tabIndex={removing ? -1 : undefined}
              aria-label={messages.remove(name)}
              onKeyDown={suppressRepeatedActivation}
              onClick={(event) => activate(onRemove, event.currentTarget)}
            />
          )}
        </span>
      )}
    </li>
  );
}
