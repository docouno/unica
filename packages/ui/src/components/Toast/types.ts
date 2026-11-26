import type { CSSProperties, ReactNode, Ref, RefObject } from 'react';
import type { STATUS } from '../../consts.js';
import type { ExactAxisSubset } from '../../types.js';
import type { TOAST_STATUS } from './consts.js';

declare const toastId: unique symbol;

export type ToastId = string & { readonly [toastId]: true };
export type ToastStatus = ExactAxisSubset<
  typeof STATUS,
  typeof TOAST_STATUS
>[keyof typeof TOAST_STATUS];
export type ToastPlacement =
  'bottom-start' | 'bottom-center' | 'bottom-end' | 'top-start' | 'top-center' | 'top-end';

export interface ToastAction {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean | undefined;
  readonly pending?: boolean | undefined;
}

export interface ToastOptions {
  readonly title: string;
  readonly description?: string | undefined;
  readonly status?: ToastStatus | undefined;
  readonly loading?: boolean | undefined;
  readonly action?: ToastAction | undefined;
  readonly actionLayout?: 'auto' | 'below' | undefined;
  readonly operationKey?: string | undefined;
  readonly persistent?: boolean | undefined;
  readonly urgency?: 'polite' | 'assertive' | undefined;
}

export interface ToastUpdate extends Partial<Omit<ToastOptions, 'operationKey' | 'title'>> {
  readonly title?: string;
}

export interface ToastCommandOptions {
  readonly announce?: boolean | undefined;
}

export interface ToastStore {
  readonly show: (options: ToastOptions, command?: ToastCommandOptions) => ToastId | null;
  readonly update: (id: ToastId, patch: ToastUpdate, command?: ToastCommandOptions) => boolean;
  readonly dismiss: (id: ToastId) => boolean;
  readonly dismissAll: () => void;
}

export interface ToastMessages {
  readonly regionLabel: string;
  readonly listLabel: string;
  readonly actionsLabel: string;
  readonly dismissAll: string;
  readonly dismiss: (title: string) => string;
  readonly dismissAllLabel: (count: number) => string;
  readonly expand: (count: number) => string;
  readonly collapse: (count: number) => string;
  readonly summary: (count: number, hiddenIssues: number) => string;
  readonly stateLabel: (status: ToastStatus, loading: boolean) => string;
}

interface ToastRootProps {
  readonly [attribute: `data-${string}`]: string | number | boolean | undefined;
  readonly id?: string | undefined;
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
  readonly ref?: Ref<HTMLDivElement> | undefined;
}

export interface ToastProps
  extends
    ToastRootProps,
    Pick<ToastOptions, 'title' | 'status' | 'loading' | 'action' | 'actionLayout'> {
  readonly children?: ReactNode | undefined;
  readonly onDismiss?: (() => void) | undefined;
  readonly dismissLabel?: string | undefined;
  readonly lang?: string | undefined;
  readonly dir?: 'ltr' | 'rtl' | 'auto' | undefined;
}

export interface ToastProviderProps {
  readonly children?: ReactNode | undefined;
  readonly messages?: Partial<ToastMessages> | undefined;
  readonly ref?: Ref<ToastStore> | undefined;
}

export interface ToastViewportProps extends ToastRootProps {
  readonly placement?: ToastPlacement | undefined;
  readonly fallbackFocusRef?: RefObject<HTMLElement | null> | undefined;
}
