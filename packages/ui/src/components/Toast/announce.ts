import { hasToastVisibility } from './host.js';
import type { ToastQueue } from './store.js';
import type { ToastMessages } from './types.js';

export function announceFromCarrier(
  root: HTMLElement,
  queue: ToastQueue,
  messages: ToastMessages,
  available: () => boolean,
): { readonly refresh: () => void; readonly stop: () => void } {
  const view = root.ownerDocument.defaultView!;
  const channels = (['polite', 'assertive'] as const).map((urgency) => ({
    urgency,
    node: root.querySelector<HTMLElement>(
      urgency === 'polite' ? '[role="status"]' : '[role="alert"]',
    )!,
    frame: undefined as number | undefined,
  }));
  let stopped = false;

  function refresh(): void {
    if (stopped || !available()) {
      return;
    }
    for (const channel of channels) {
      if (
        channel.frame !== undefined ||
        !hasToastVisibility(channel.node) ||
        !queue.nextDelivery(channel.urgency)
      ) {
        continue;
      }
      const tick = (): void => {
        channel.frame = undefined;
        if (
          stopped ||
          !available() ||
          !root.contains(channel.node) ||
          !hasToastVisibility(channel.node)
        ) {
          return;
        }
        const delivery = queue.nextDelivery(channel.urgency);
        if (!delivery) {
          return;
        }
        if (channel.node.textContent) {
          channel.node.textContent = '';
          channel.frame = view.requestAnimationFrame(tick);
          return;
        }
        queue.deliver(delivery, ({ status, loading, title, description }) => {
          const text = [messages.stateLabel(status, loading), title, description]
            .filter((part) => part?.trim())
            .join('. ');
          channel.node.textContent = text;
        });
        refresh();
      };
      // The empty live regions must be present for an accessibility update before the write.
      channel.frame = view.requestAnimationFrame(() => {
        channel.frame = view.requestAnimationFrame(tick);
      });
    }
  }

  const unsubscribe = queue.subscribe(refresh);
  return {
    refresh,
    stop: () => {
      stopped = true;
      unsubscribe();
      for (const channel of channels) {
        if (channel.frame !== undefined) {
          view.cancelAnimationFrame(channel.frame);
        }
      }
    },
  };
}
