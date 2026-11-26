import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { Stack, Text, VisuallyHidden } from '@docouno/unica';
import { Toast } from '@docouno/unica';
import type { ToastProps } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import './toast-cards.examples.css';

const meanings: readonly ToastProps[] = [
  { title: 'Link copied' },
  {
    status: 'info',
    title: 'A new version is available',
    children: 'Refresh when you are ready to continue.',
    action: { label: 'Refresh', onClick: () => undefined },
  },
  {
    status: 'success',
    title: 'Changes saved',
    children: 'Your team can see the latest version.',
  },
  {
    status: 'warning',
    title: '3 files were skipped',
    children: 'The remaining 21 files were imported.',
    action: { label: 'Review files', onClick: () => undefined },
  },
  {
    status: 'danger',
    title: 'Changes could not be saved',
    children: 'Your draft is safe on this device.',
    action: { label: 'Retry', onClick: () => undefined },
  },
  {
    loading: true,
    title: 'Preparing your export',
    children: 'You can keep working. We will let you know when it is ready.',
  },
];

const longMessages: readonly ToastProps[] = [
  {
    status: 'success',
    title: 'The quarterly accessibility review has been shared with your team',
    action: { label: 'View document', onClick: () => undefined },
  },
  {
    status: 'danger',
    title: 'This file could not be uploaded',
    action: { label: 'Choose a different destination', onClick: () => undefined },
    children: (
      <bdi dir="ltr">
        <bdi>workspace_export_2026_11_final_accessibility_review_v12.pdf</bdi> exceeds the
        destination limit. Your original file is unchanged.
      </bdi>
    ),
  },
  {
    status: 'info',
    title: 'A new comment on your document',
    action: { label: 'View comment', onClick: () => undefined },
    children: (
      <>
        <bdi dir="ltr">
          <bdi className="toast-study-arabic" lang="ar">
            تقرير البحث
          </bdi>{' '}
          · v2.pdf
        </bdi>
        <br />
        <bdi>The selected paragraph has a new review note.</bdi>
      </>
    ),
  },
  {
    title: '8 documents archived',
    action: { label: 'Restore all 8 documents', onClick: () => undefined },
  },
];

// Keep the copy readable and selectable while excluding the pinned controls from interaction.
function pinControls(root: HTMLDivElement | null): void {
  root?.querySelectorAll('button').forEach((button) => {
    button.inert = true;
  });
}

function PinnedCards({
  ctx,
  cards,
}: PreviewProps & { readonly cards: readonly ToastProps[] }): ReactElement {
  return (
    <Stack className="toast-card-studies" gap={24} ref={pinControls}>
      {cards.map((card) => (
        <Fragment key={card.title}>
          <Toast {...ctx.subject} {...card} onDismiss={() => undefined} />
          {card.action && <VisuallyHidden>Example action: {card.action.label}</VisuallyHidden>}
        </Fragment>
      ))}
    </Stack>
  );
}

export function ToastRoles(props: PreviewProps): ReactElement {
  return <PinnedCards {...props} cards={meanings} />;
}

export function ToastOverflow(props: PreviewProps): ReactElement {
  return <PinnedCards {...props} cards={longMessages} />;
}

interface CardStudy {
  readonly label: string;
  readonly card: ToastProps;
  readonly result?: ToastProps;
  readonly pendingMessage?: string;
  readonly dismissible?: boolean;
}

const archive: CardStudy = {
  label: 'Inline when it fits',
  card: { title: 'Document archived', action: { label: 'Undo', onClick: () => undefined } },
  result: { status: 'success', title: 'Document restored' },
};

const anatomy: readonly CardStudy[] = [
  { label: 'Title only', card: { title: 'Link copied' } },
  archive,
  {
    label: 'Action below the details',
    card: {
      status: 'danger',
      title: 'Upload interrupted',
      children: 'Your connection was lost. The original file has not changed.',
      action: { label: 'Retry upload', onClick: () => undefined },
    },
    result: { status: 'success', title: 'Upload complete' },
  },
  {
    label: 'Confirmation without a close control',
    card: { status: 'success', title: 'Settings saved' },
    dismissible: false,
  },
];

const controls: readonly CardStudy[] = [
  { ...archive, label: 'Action and dismiss' },
  {
    label: 'Unavailable during scan',
    card: {
      status: 'warning',
      title: 'Download is unavailable',
      children: 'This file is being scanned. Try again when the scan finishes.',
      action: { label: 'Download', disabled: true, onClick: () => undefined },
    },
  },
  {
    label: 'Pending during retry',
    card: {
      status: 'danger',
      title: 'Changes could not be saved',
      children: 'Your draft is safe on this device.',
      action: { label: 'Retry', onClick: () => undefined },
    },
    pendingMessage: 'Retrying save.',
    result: { status: 'success', title: 'Changes saved' },
  },
];

function StudyCard({
  ctx,
  study,
  dismiss,
  announce,
}: PreviewProps & {
  readonly study: CardStudy;
  readonly dismiss: (row: HTMLDivElement, title: string) => void;
  readonly announce: (message: string) => void;
}): ReactElement {
  const row = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const moveFromAction = useRef(false);
  const [phase, setPhase] = useState<'ready' | 'pending' | 'done'>('ready');
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useLayoutEffect(() => {
    if (moveFromAction.current && document.activeElement === document.body) {
      row.current?.querySelector<HTMLButtonElement>('button[aria-label]')?.focus();
    }
    moveFromAction.current = false;
  }, [phase]);

  function activate(): void {
    const resultTitle = study.result?.title;
    if (!resultTitle || phase !== 'ready') {
      return;
    }
    const finish = (): void => {
      moveFromAction.current =
        row.current?.querySelector('button:not([aria-label])') === document.activeElement;
      setPhase('done');
      announce(resultTitle);
    };
    if (study.pendingMessage) {
      setPhase('pending');
      announce(study.pendingMessage);
      timer.current = window.setTimeout(finish, 2400);
    } else {
      finish();
    }
  }

  const card = phase === 'done' && study.result ? study.result : study.card;
  return (
    <Stack gap={8} ref={row}>
      <Text className="toast-study-label" size="caption-l" weight="medium">
        {study.label}
      </Text>
      <Toast
        {...ctx.subject}
        {...card}
        action={card.action && { ...card.action, pending: phase === 'pending', onClick: activate }}
        {...(study.dismissible === false
          ? {}
          : { onDismiss: () => row.current && dismiss(row.current, card.title) })}
      />
    </Stack>
  );
}

function LiveCards({
  ctx,
  studies,
  label,
}: PreviewProps & {
  readonly studies: readonly CardStudy[];
  readonly label: string;
}): ReactElement {
  const root = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const [announcement, announce] = useState('');
  const shown = studies.filter((study) => !hidden.includes(study.label));

  function dismiss(row: HTMLDivElement, study: CardStudy, title: string): void {
    if (root.current && row.contains(document.activeElement)) {
      const buttons = [...root.current.querySelectorAll<HTMLButtonElement>('button[aria-label]')];
      const index = buttons.findIndex((button) => row.contains(button));
      (buttons[index + 1] ?? buttons[index - 1] ?? root.current).focus();
    }
    setHidden((previous) => [...previous, study.label]);
    announce(`${title} dismissed.`);
  }

  return (
    <Stack
      className="toast-card-studies"
      gap={24}
      ref={root}
      role="group"
      aria-label={label}
      tabIndex={-1}
    >
      {shown.map((study) => (
        <StudyCard
          key={study.label}
          ctx={ctx}
          study={study}
          dismiss={(row, title) => dismiss(row, study, title)}
          announce={announce}
        />
      ))}
      {shown.length === 0 && (
        <Text className="toast-study-label" size="body-s">
          All notifications dismissed.
        </Text>
      )}
      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
    </Stack>
  );
}

export function ToastAnatomy(props: PreviewProps): ReactElement {
  return <LiveCards {...props} studies={anatomy} label="Notification layouts" />;
}

export function ToastControlStates(props: PreviewProps): ReactElement {
  return <LiveCards {...props} studies={controls} label="Notification control states" />;
}
