import { createRef } from 'react';
import { Toast, ToastProvider, ToastViewport, useToast } from '../src/index.js';
import type { ToastAction, ToastId, ToastStore, ToastUpdate } from '../src/index.js';
import type { ToastCommandOptions } from '../src/server.js';

const storeRef = createRef<ToastStore>();
const viewportRef = createRef<HTMLDivElement>();
const fallbackFocusRef = createRef<HTMLButtonElement>();
const props: ToastUpdate = { description: undefined, action: undefined };
const command: ToastCommandOptions = { announce: false };

export function Consumer() {
  const store = useToast();
  const id = store.show({ title: 'Preparing export', loading: true }, command);
  if (id !== null) {
    store.update(id, props);
    // @ts-expect-error An explicit undefined title is invalid.
    store.update(id, { title: undefined });
    // @ts-expect-error Operation keys belong to show.
    store.update(id, { operationKey: 'another' });
  }
  // @ts-expect-error The queue accepts its own opaque identifiers.
  store.dismiss('string');
  return (
    <ToastViewport ref={viewportRef} fallbackFocusRef={fallbackFocusRef} placement="top-start" />
  );
}

// @ts-expect-error Toast cards require a title.
const untitled = <Toast />;
// @ts-expect-error An action requires a handler.
const incomplete: ToastAction = { label: 'Retry' };
// @ts-expect-error A caller cannot mint an ID.
const invented: ToastId = '123';

void [
  untitled,
  incomplete,
  invented,
  <ToastProvider ref={storeRef}>
    <Consumer />
  </ToastProvider>,
];
