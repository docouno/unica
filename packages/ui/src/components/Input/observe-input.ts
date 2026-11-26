import { subscribeFocusOrigin } from '../../core/focus-origin.js';
import { observeControlPath } from '../../core/forms/observeControlPath.js';

export function observeInput(
  input: HTMLInputElement,
  onDisabled: (disabled: boolean) => void,
): () => void {
  let root: Node | undefined;
  let releaseFocus: (() => void) | undefined;

  const stopObserving = observeControlPath(input, () => {
    onDisabled(input.matches(':disabled'));

    const nextRoot = input.getRootNode();
    if (root !== nextRoot) {
      root = nextRoot;
      releaseFocus?.();
      input.removeAttribute('data-unica-input-focus');
      releaseFocus = subscribeFocusOrigin(input, (origin) => {
        if (origin === null) {
          input.removeAttribute('data-unica-input-focus');
        } else {
          input.setAttribute('data-unica-input-focus', origin);
        }
      });
    }
  });

  return () => {
    stopObserving();
    releaseFocus?.();
    input.removeAttribute('data-unica-input-focus');
  };
}
