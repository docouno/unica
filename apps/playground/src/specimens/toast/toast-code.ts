import { previewProps, previewText } from '../preview-code.js';
import type { ToastValues } from './toast.spec.js';
import ownerSource from './use-toast-example.ts?raw';

export function toastTitle(title: string): string {
  return title.trim() ? title : 'Changes saved';
}

export function toastCode(values: ToastValues): string {
  const undo = values.action === 'undo';
  const title = toastTitle(values.title);
  const staticProps = previewProps(
    { status: values.status, loading: values.loading },
    { status: 'neutral', loading: false },
  );
  const status =
    values.status === 'success'
      ? '"success"'
      : `{reverted ? 'success' : ${JSON.stringify(values.status)}}`;
  const content = undo
    ? `title={reverted ? 'Changes reverted' : ${JSON.stringify(title)}}
        status=${status}${values.loading ? ' loading={!reverted}' : ''}
        action={reverted ? undefined : { label: 'Undo', onClick: () => change('reverted') }}${values.actionLayout === 'below' ? " actionLayout={reverted ? 'auto' : 'below'}" : ''}`
    : `title=${previewText(title)}${staticProps}`;
  const keyHandler = `onKeyDown={(event) => {
    if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault();
  }}`;
  return `import { Button } from '@docouno/unica';
import { ToastCard } from './prototypes/toast/toast.proto.js';
${ownerSource}
export function SavedChange() {
  const { id, phase, change } = useToastExample();
  if (phase === 'dismissed') {
    return (
      <Button id={id} type="button" variant="secondary" tone="accent" ${keyHandler} onClick={() => change()}>
        Restore toast
      </Button>
    );
  }${undo ? "\n  const reverted = phase === 'reverted';" : ''}
  return (
    <ToastCard
      id={id}
      ${content}
      ${keyHandler}
      onDismiss={() => change('dismissed')}
    />
  );
}`;
}
