import { createContext, useContext } from 'react';
import type { Context } from 'react';
import type { ToastQueue } from './store.js';
import type { ToastMessages, ToastStore } from './types.js';

interface ToastContextValue {
  readonly queue: ToastQueue;
  readonly messages: ToastMessages;
}

export const defaultToastMessages: ToastMessages = {
  regionLabel: 'Notifications',
  listLabel: 'Notification list',
  actionsLabel: 'Notification actions',
  dismissAll: 'Dismiss all',
  dismiss: (title) => `Dismiss: ${title}`,
  dismissAllLabel: (count) => `Dismiss all ${count} notifications`,
  expand: (count) => `Expand ${count} notifications`,
  collapse: (count) => `Collapse ${count} notifications`,
  summary: (count, issues) =>
    `${count} notifications${issues ? ` · ${issues} ${issues === 1 ? 'needs' : 'need'} attention` : ''}`,
  stateLabel: (status, loading) => {
    if (loading) {
      return 'In progress';
    }
    return status === 'neutral' ? '' : status.charAt(0).toUpperCase() + status.slice(1);
  },
};

export const ToastContext: Context<ToastContextValue | null> =
  /* @__PURE__ */ createContext<ToastContextValue | null>(null);

export function useToastOwner(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast and ToastViewport require a ToastProvider.');
  }
  return context;
}

/** Returns the stable commands for the nearest notification queue. */
export function useToast(): ToastStore {
  return useToastOwner().queue.commands;
}
