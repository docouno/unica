import { Button } from '@docouno/unica';
import type { KeyboardEvent, ReactElement } from 'react';
import { ToastCard } from '../../prototypes/toast/toast.proto.js';
import type { PreviewProps } from '../../workbench/types.js';
import { toastTitle } from './toast-code.js';
import type { ToastValues } from './toast.spec.js';
import { useToastExample } from './use-toast-example.js';

interface PlaygroundProps extends PreviewProps {
  readonly values: ToastValues;
}

function preventRepeatedActivation(event: KeyboardEvent<HTMLElement>): void {
  if (event.repeat && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
  }
}

function SavedChange({ ctx, values }: PlaygroundProps): ReactElement {
  const { id, phase, change } = useToastExample();
  if (phase === 'dismissed') {
    return (
      <Button
        id={id}
        type="button"
        variant="secondary"
        tone="accent"
        onKeyDown={preventRepeatedActivation}
        onClick={() => change()}
      >
        Restore toast
      </Button>
    );
  }

  const reverted = phase === 'reverted';
  const undo = values.action === 'undo' && !reverted;
  return (
    <ToastCard
      {...ctx.subject}
      id={id}
      data-toast-comparison={ctx.tab === 'states' ? '' : undefined}
      title={reverted ? 'Changes reverted' : toastTitle(values.title)}
      status={reverted ? 'success' : values.status}
      loading={!reverted && values.loading}
      actionLayout={undo ? values.actionLayout : 'auto'}
      action={
        undo
          ? {
              label: 'Undo',
              onClick: () => {
                change('reverted');
                ctx.action('onUndo')();
              },
            }
          : undefined
      }
      onKeyDown={preventRepeatedActivation}
      onDismiss={() => {
        change('dismissed');
        ctx.action('onDismiss')();
      }}
    />
  );
}

export function ToastPlayground({ ctx, values }: PlaygroundProps): ReactElement {
  return <SavedChange key={JSON.stringify(values)} ctx={ctx} values={values} />;
}
