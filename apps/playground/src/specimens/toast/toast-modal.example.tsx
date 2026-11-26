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
  ToastProvider,
  ToastViewport,
  UnicaProvider,
  useToast,
} from '@docouno/unica';
import type { ToastViewportProps } from '@docouno/unica';
import '@docouno/unica/styles.css';

const contents = 'Review notes\n\nThe mobile layout and keyboard shortcuts are ready for review.';

const styles = `
  .toast-export-stage {
    min-block-size: 100%; padding: var(--space-24);
    overflow-wrap: anywhere;
  }
  .toast-export-dialog {
    inline-size: min(26rem, calc(100% - 2rem));
    max-block-size: calc(100dvh - 2rem);
    margin: auto; padding: var(--surface-l-padding); overflow: auto;
    color: var(--fg-primary); overflow-wrap: anywhere;
  }
  .toast-export-dialog::backdrop { background: var(--scrim-bg); }
  .toast-export-files summary { cursor: pointer; color: var(--fg-primary); }
  .toast-export-files summary:focus-visible { outline: 2px solid var(--focus-ring-color); }
  @media (max-width: 700px) {
    .toast-export-dialog { margin-block-start: var(--space-16); }
  }
`;

interface ExportFile {
  readonly number: number;
  readonly name: string;
}

export function ToastModalExample({
  subject = {},
  failNext = false,
}: {
  readonly subject?: Partial<Pick<ToastViewportProps, 'data-wb-subject'>>;
  readonly failNext?: boolean;
} = {}) {
  return (
    <ToastProvider>
      <ExportOptions subject={subject} failNext={failNext} />
    </ToastProvider>
  );
}

function ExportPreview({ host }: { readonly host: HTMLDialogElement | null }) {
  const toast = useToast();
  const details = useRef<HTMLDetailsElement>(null);

  return (
    <UnicaProvider portalContainer={host}>
      <Stack gap={8} align="start">
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          onClick={() => {
            toast.show({
              operationKey: 'text-preview',
              title: 'Text preview ready',
              status: 'info',
              action: {
                label: 'Read preview',
                onClick: () => {
                  if (details.current) {
                    details.current.open = true;
                    details.current.querySelector('summary')?.focus();
                  }
                },
              },
            });
          }}
        >
          Prepare text preview
        </Button>
        <details ref={details} className="toast-export-files">
          <summary>Export contents</summary>
          <Text size="body-s" style={{ whiteSpace: 'pre-wrap' }}>
            {contents}
          </Text>
        </details>
        <ToastViewport placement="top-start" />
      </Stack>
    </UnicaProvider>
  );
}

function ExportOptions({
  subject,
  failNext,
}: {
  readonly subject: Partial<Pick<ToastViewportProps, 'data-wb-subject'>>;
  readonly failNext: boolean;
}) {
  const toast = useToast();
  const id = useId();
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const seeded = useRef(false);
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<readonly ExportFile[]>([
    { number: 0, name: 'review-notes.txt' },
  ]);
  const [preview, setPreview] = useState(-1);
  const [filename, setFilename] = useState('review-notes');
  const stem = filename.trim();

  function outcome(file: ExportFile) {
    return {
      status: 'success' as const,
      title: 'Export ready',
      description: file.name,
      action: {
        label: 'View export',
        onClick: () => {
          setPreview(file.number);
          stage?.ownerDocument.getElementById(id + '-file-' + file.number)?.focus();
        },
      },
    };
  }

  useLayoutEffect(() => {
    if (stage && !seeded.current) {
      seeded.current = true;
      const initial = { number: 0, name: 'review-notes.txt' };
      toast.show(outcome(initial), { announce: false });
    }
  });

  function prepareExport(): void {
    if (!stem) {
      return;
    }
    const file = { number: nextId.current++, name: /\.txt$/i.test(stem) ? stem : stem + '.txt' };
    if (!failNext) {
      setFiles((current) => [...current, file]);
      toast.show(outcome(file));
      return;
    }
    const notice = toast.show({
      title: 'Export failed',
      description: file.name,
      status: 'danger',
      action: {
        label: 'Retry export',
        onClick: () => {
          setFiles((current) =>
            current.some((item) => item.number === file.number) ? current : [...current, file],
          );
          if (notice !== null) {
            toast.update(notice, outcome(file));
          }
        },
      },
    });
  }

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

  function closeDialog(): void {
    dialog?.close();
    setOpen(false);
  }

  return (
    <Stack
      ref={setStage}
      className="toast-export-stage"
      gap={16}
      onKeyDownCapture={(event) => {
        const view = event.currentTarget.ownerDocument.defaultView;
        if (
          event.repeat &&
          (event.key === 'Enter' || event.key === ' ') &&
          view &&
          event.target instanceof view.HTMLButtonElement
        ) {
          event.preventDefault();
        }
      }}
    >
      <style>{styles}</style>
      <Card size="s">
        <Stack gap={8} align="start">
          <Title as="h2" size="heading-s">
            Review notes
          </Title>
          <Text size="body-s">{contents.split('\n\n')[1]}</Text>
          <Button
            ref={trigger}
            type="button"
            variant="secondary"
            tone="neutral"
            size="s"
            aria-haspopup="dialog"
            aria-controls={id + '-dialog'}
            onClick={() => {
              dialog?.showModal();
              input.current?.focus({ preventScroll: true });
              setOpen(true);
            }}
          >
            Open export options
          </Button>
          {!open && fileList}
        </Stack>
      </Card>
      <dialog
        ref={setDialog}
        id={id + '-dialog'}
        aria-labelledby={id + '-heading'}
        data-surface="overlay"
        className="unica-overlay-surface toast-export-dialog"
        onClose={() => setOpen(false)}
      >
        <Stack gap={16}>
          <Title id={id + '-heading'} as="h2" size="heading-s">
            Export options
          </Title>
          <Stack gap={4}>
            <Text as="label" htmlFor={id + '-name'} size="body-s">
              File name
            </Text>
            <Input
              ref={input}
              id={id + '-name'}
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
            <Button type="button" size="s" variant="secondary" tone="neutral" onClick={closeDialog}>
              Close dialog
            </Button>
          </Flex>
          <ToastProvider messages={{ regionLabel: 'Preview notifications' }}>
            <ExportPreview host={open ? dialog : null} />
          </ToastProvider>
          {open && fileList}
        </Stack>
      </dialog>
      <UnicaProvider portalContainer={open ? dialog : stage}>
        <ToastViewport
          {...subject}
          placement="bottom-end"
          fallbackFocusRef={open ? input : trigger}
        />
      </UnicaProvider>
    </Stack>
  );
}
