import { useImperativeHandle, useInsertionEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { ToastContext, defaultToastMessages } from './context.js';
import { ToastQueue } from './store.js';
import type { ToastProviderProps } from './types.js';
import './toast.css';

/** Owns notification state and commands without adding a DOM wrapper. */
export function ToastProvider({ children, messages, ref }: ToastProviderProps): ReactElement {
  const [queue] = useState(() => new ToastQueue());
  const context = useMemo(
    () => ({ queue, messages: { ...defaultToastMessages, ...messages } }),
    [queue, messages],
  );
  // Only a real unmount ends the queue. Strict Mode and temporarily hidden trees replay
  // layout effects and imperative refs, but keep insertion effects for the lifetime of the tree.
  useInsertionEffect(() => () => queue.dispose(), [queue]);
  useImperativeHandle(ref, () => queue.commands, [queue]);
  return <ToastContext value={context}>{children}</ToastContext>;
}
