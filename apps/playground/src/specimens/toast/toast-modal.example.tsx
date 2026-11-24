import { useId, useLayoutEffect, useRef, useState } from 'react';
import {
  Button,
  Card,
  Flex,
  Input,
  Link,
  Stack,
  Text,
  Title,
  VisuallyHidden,
} from '@docouno/unica';
import '@docouno/unica/styles.css';
import { ToastViewport } from '../../prototypes/toast/toast.proto.js';

const contents = 'Review notes\n\nThe mobile layout and keyboard shortcuts are ready for review.';

const styles = `
  .toast-export-stage { inline-size: min(100%, 28rem); min-inline-size: 0; overflow-wrap: anywhere; }
  .toast-export-dialog {
    inline-size: min(26rem, calc(100% - 2rem)); max-block-size: calc(100dvh - 2rem);
    margin: auto; padding: var(--surface-l-padding); overflow: auto;
    color: var(--fg-primary); overflow-wrap: anywhere;
  }
  .toast-export-dialog::backdrop { background: var(--scrim-bg); }
  .toast-export-files summary { cursor: pointer; color: var(--fg-primary); }
  .toast-export-files summary:focus-visible { outline: 2px solid var(--focus-ring-color); }
  .toast-export-host {
    position: fixed; inset: auto; inset-block-end: 4px; inset-inline-end: 4px;
    box-sizing: border-box; inline-size: min(408px, calc(100% - 8px)); max-inline-size: none;
    max-block-size: calc(44dvh + 24px); padding: 12px; margin: 0; border: 0; background: transparent;
    overflow: auto; overscroll-behavior: contain;
  }
  .toast-export-host::backdrop { display: none; }
  .toast-export-stage .toast-export-queue {
    position: relative; inset: auto; align-self: end; inline-size: min(100%, 384px);
    max-block-size: none; --toast-list-height: 18rem;
  }
  .toast-export-host .toast-export-queue[data-expanded] {
    max-block-size: 44dvh; --toast-list-height: min(18rem, calc(44dvh - 5rem));
  }
  @media (max-width: 80rem) {
    .toast-export-dialog {
      inset-block-end: var(--export-notice-height, 0px);
      max-block-size: calc(100dvh - var(--export-notice-height, 0px) - 2rem);
    }
  }
`;

export function ToastModalExample({ subject = {} } = {}) {
  const id = useId();
  const dialogId = id + '-dialog';
  const hostId = id + '-host';
  const inputId = id + '-name';
  const triggerId = id + '-trigger';
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const nextId = useRef(1);
  const [files, setFiles] = useState([{ number: 0, name: 'review-notes.txt', notify: true }]);
  const [preview, setPreview] = useState(-1);
  const [filename, setFilename] = useState('review-notes');
  const stem = filename.trim();
  const visible = files.filter((file) => file.notify);
  const hasNotices = visible.length > 0;

  useLayoutEffect(() => {
    const host = document.getElementById(hostId);
    const dialog = document.getElementById(dialogId);
    if (!open || !hasNotices || !host || !(dialog instanceof HTMLDialogElement)) {
      return;
    }
    host.showPopover();
    const reserveRoom = () =>
      dialog.style.setProperty('--export-notice-height', host.offsetHeight + 4 + 'px');
    reserveRoom();
    const observer = new ResizeObserver(reserveRoom);
    observer.observe(host);
    return () => {
      observer.disconnect();
      dialog.style.removeProperty('--export-notice-height');
    };
  }, [dialogId, hasNotices, hostId, open]);

  function closeDialog() {
    const dialog = document.getElementById(dialogId);
    if (!(dialog instanceof HTMLDialogElement)) {
      return;
    }
    document.getElementById(hostId)?.hidePopover();
    dialog.close();
    setAnnouncement('');
    setOpen(false);
    document.getElementById(triggerId)?.focus({ preventScroll: true });
  }

  function prepareExport() {
    if (stem) {
      const name = /\.txt$/i.test(stem) ? stem : stem + '.txt';
      const file = { number: nextId.current++, name, notify: true };
      setFiles((current) => [...current, file]);
      setAnnouncement('Export ' + (file.number + 1) + ' ready. ' + file.name);
    }
  }

  function returnFromQueue() {
    const queue = document.getElementById(id)?.querySelector('.toast-export-queue');
    if (queue?.contains(document.activeElement)) {
      document.getElementById(open ? inputId : triggerId)?.focus({ preventScroll: true });
    }
  }

  const queue = (
    <ToastViewport
      {...subject}
      className="toast-export-queue"
      items={visible.map((file) => ({
        id: id + '-notice-' + file.number,
        status: 'success',
        title: 'Export ready',
        children: <bdi>{file.name}</bdi>,
        action: {
          label: 'View export',
          onClick: () => {
            setPreview(file.number);
            document.getElementById(id + '-file-' + file.number)?.focus();
          },
        },
      }))}
      onDismiss={(noticeId) => {
        if (visible.length === 1) {
          returnFromQueue();
        }
        setFiles((current) =>
          current.map((file) =>
            id + '-notice-' + file.number === noticeId ? { ...file, notify: false } : file,
          ),
        );
      }}
      onDismissAll={() => {
        returnFromQueue();
        setFiles((current) => current.map((file) => ({ ...file, notify: false })));
      }}
    />
  );

  const fileList = (
    <Stack gap={8} className="toast-export-files">
      <Title as="h3" size="body-m">
        Prepared files
      </Title>
      {files.map((file) => (
        <details key={file.number} open={preview === file.number}>
          <summary
            id={id + '-file-' + file.number}
            onClick={(event) => {
              event.preventDefault();
              setPreview(preview === file.number ? -1 : file.number);
            }}
          >
            <Text as="span" size="body-s">
              <bdi>{file.name}</bdi>
            </Text>
          </summary>
          <Stack gap={8} align="start">
            <Text size="body-s" dir="auto" style={{ whiteSpace: 'pre-wrap' }}>
              {contents}
            </Text>
            <Link
              href={'data:text/plain;charset=utf-8,' + encodeURIComponent(contents)}
              download={file.name}
            >
              Download text file
            </Link>
          </Stack>
        </details>
      ))}
    </Stack>
  );

  return (
    <Stack
      id={id}
      className="toast-export-stage"
      gap={16}
      onKeyDownCapture={(event) => {
        if (
          event.repeat &&
          (event.key === 'Enter' || event.key === ' ') &&
          event.target instanceof HTMLButtonElement
        ) {
          event.preventDefault();
        }
      }}
    >
      <style>{styles}</style>
      <Card size="s" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <Stack gap={8} align="start">
          <Title as="h2" size="heading-s">
            Review notes
          </Title>
          <Text size="body-s" dir="auto">
            The mobile layout and keyboard shortcuts are ready for review.
          </Text>
          <Button
            id={triggerId}
            type="button"
            variant="secondary"
            tone="neutral"
            size="s"
            aria-haspopup="dialog"
            aria-controls={dialogId}
            onClick={() => {
              const dialog = document.getElementById(dialogId);
              if (dialog instanceof HTMLDialogElement) {
                dialog.showModal();
                setOpen(true);
              }
            }}
          >
            Open export options
          </Button>
        </Stack>
        {!open && fileList}
      </Card>
      {!open && queue}
      <dialog
        id={dialogId}
        aria-labelledby={id + '-heading'}
        data-surface="overlay"
        className="unica-overlay-surface toast-export-dialog"
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
      >
        <Stack gap={16}>
          <Title id={id + '-heading'} as="h2" size="heading-s">
            Export options
          </Title>
          <Stack gap={12}>
            <Stack gap={4}>
              <Text as="label" htmlFor={inputId} size="body-s">
                File name
              </Text>
              <Input
                id={inputId}
                value={filename}
                onChange={(event) => setFilename(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    if (!event.repeat) {
                      prepareExport();
                    }
                  }
                }}
                suffix={/\.txt$/i.test(stem) ? undefined : '.txt'}
                aria-required="true"
                width="full"
              />
            </Stack>
            <Flex wrap="wrap" gap={8}>
              <Button type="button" size="s" disabled={!stem} onClick={prepareExport}>
                Prepare export
              </Button>
              <Button
                type="button"
                size="s"
                variant="secondary"
                tone="neutral"
                onClick={closeDialog}
              >
                Close dialog
              </Button>
            </Flex>
          </Stack>
          <VisuallyHidden role="status">{announcement}</VisuallyHidden>
          {open && fileList}
        </Stack>
        {open && hasNotices && (
          <div
            id={hostId}
            popover="manual"
            className="toast-export-host unica-scrollbar unica-scrollbar--compact"
          >
            {queue}
          </div>
        )}
      </dialog>
    </Stack>
  );
}
