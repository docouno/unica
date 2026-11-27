import { getDefaultView } from '../../core/dom.js';

const resetElement = 'unica-file-reset-v1';
const resetHandler: unique symbol = Symbol.for('unica.file-reset.v1.handler');
const resetInternals: unique symbol = Symbol.for('unica.file-reset.v1.internals');

interface ResetCompanion extends HTMLElement {
  [resetInternals]?: ElementInternals;
  [resetHandler]?: () => void;
}

/** Mirrors the input's native owner without contributing any named form entries. */
export function createFileResetCompanion(
  input: HTMLInputElement,
  reset: () => void,
): ResetCompanion | null {
  const realm = getDefaultView(input.ownerDocument);
  if (!realm?.customElements || !realm.HTMLElement.prototype.attachInternals) {
    return null;
  }
  const registry = realm.customElements;
  if (!registry.get(resetElement)) {
    registry.define(
      resetElement,
      class extends realm.HTMLElement {
        static readonly formAssociated = true;

        constructor() {
          super();
          Object.defineProperty(this, resetInternals, { value: this.attachInternals() });
        }

        formResetCallback(): void {
          (this as ResetCompanion)[resetHandler]?.();
        }
      },
    );
  }

  const node = input.ownerDocument.createElement(resetElement) as ResetCompanion;
  if (!node[resetInternals]) {
    return null;
  }
  node[resetHandler] = reset;
  syncFileResetOwner(node, input);
  return node;
}

export function fileResetOwner(node: ResetCompanion): HTMLFormElement | null {
  return node[resetInternals]?.form ?? null;
}

export function syncFileResetOwner(node: ResetCompanion, input: HTMLInputElement): void {
  const ownerId = input.getAttribute('form');
  if (ownerId === null) {
    node.removeAttribute('form');
  } else if (node.getAttribute('form') !== ownerId) {
    node.setAttribute('form', ownerId);
  }
}

function reflectsFiles(input: HTMLInputElement, files: readonly File[]): boolean {
  return (
    input.files?.length === files.length && files.every((file, i) => input.files?.[i] === file)
  );
}

export function writeFiles(input: HTMLInputElement, files: readonly File[]): boolean {
  if (reflectsFiles(input, files)) {
    return true;
  }
  try {
    if (files.length === 0) {
      input.value = '';
    } else {
      const realm = getDefaultView(input.ownerDocument);
      if (!realm?.DataTransfer) {
        return false;
      }
      const transfer = new realm.DataTransfer();
      for (const file of files) {
        if (!transfer.items.add(file)) {
          return false;
        }
      }
      input.files = transfer.files;
    }
    return reflectsFiles(input, files);
  } catch {
    return false;
  }
}
