import { subscribeFocusOrigin } from '../focus-origin.js';
import { observeControlPath } from './observeControlPath.js';

interface FieldObservation {
  readonly focusAttribute: string;
  readonly onChange: () => void;
  readonly watchAvailability?: boolean;
}

const availabilityAttributes = ['hidden', 'inert'];
const editorAttributes = ['readonly', 'form', 'min', 'max', 'step', 'value'];

export function observeFieldInput(
  input: HTMLInputElement,
  { focusAttribute, onChange, watchAvailability }: FieldObservation,
): () => void {
  let root: Node | undefined;
  let releaseFocus: (() => void) | undefined;

  function sync(): void {
    onChange();

    const nextRoot = input.getRootNode();
    if (root !== nextRoot) {
      root = nextRoot;
      releaseFocus?.();
      input.removeAttribute(focusAttribute);
      releaseFocus = subscribeFocusOrigin(input, (origin) => {
        if (origin === null) {
          input.removeAttribute(focusAttribute);
        } else {
          input.setAttribute(focusAttribute, origin);
        }
      });
    }
  }

  const stopObserving = observeControlPath(
    input,
    sync,
    watchAvailability ? availabilityAttributes : undefined,
    watchAvailability ? editorAttributes : undefined,
  );
  return () => {
    stopObserving();
    releaseFocus?.();
    input.removeAttribute(focusAttribute);
  };
}
