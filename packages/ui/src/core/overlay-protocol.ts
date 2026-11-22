export const OVERLAY_RUNTIME_KEY: symbol = Symbol.for('@docouno/unica/OverlayRuntime@1');

export interface OverlayRuntimeProtocol {
  readonly open: (...args: never[]) => unknown;
  readonly close: (...args: never[]) => unknown;
  readonly cancelExit: (...args: never[]) => unknown;
  readonly reconcile: () => unknown;
  readonly nativeDismiss: (...args: never[]) => unknown;
  readonly publishModal: () => unknown;
  readonly resolveModal: (includeExiting?: boolean) => HTMLDialogElement | null;
  readonly watchTrigger: (...args: never[]) => unknown;
  readonly trackVersion: (version: string) => unknown;
  readonly isTrackedModal?: ((dialog: Element) => boolean) | undefined;
}

const REQUIRED_RUNTIME_METHODS = [
  'open',
  'close',
  'cancelExit',
  'reconcile',
  'nativeDismiss',
  'publishModal',
  'resolveModal',
  'watchTrigger',
  'trackVersion',
] as const;

const fallbackRuntimes = new WeakMap<Document, OverlayRuntimeProtocol>();

export function isOverlayRuntimeLike(candidate: unknown): candidate is OverlayRuntimeProtocol {
  if (typeof candidate !== 'object' || candidate === null) {
    return false;
  }
  for (let index = 0; index < REQUIRED_RUNTIME_METHODS.length; index++) {
    const method = REQUIRED_RUNTIME_METHODS[index]!;
    if (typeof Reflect.get(candidate, method) !== 'function') {
      return false;
    }
  }
  return true;
}

export function setFallbackOverlayRuntime(doc: Document, runtime: OverlayRuntimeProtocol): void {
  fallbackRuntimes.set(doc, runtime);
}

export function deleteFallbackOverlayRuntime(doc: Document, runtime: OverlayRuntimeProtocol): void {
  if (fallbackRuntimes.get(doc) === runtime) {
    fallbackRuntimes.delete(doc);
  }
}

export function resolveOverlayRuntime(doc: Document): OverlayRuntimeProtocol | undefined {
  try {
    const candidate: unknown = Reflect.get(doc, OVERLAY_RUNTIME_KEY);
    if (isOverlayRuntimeLike(candidate)) {
      return candidate;
    }
  } catch {
    // Fall back when the document host forbids symbol lookup.
  }
  return fallbackRuntimes.get(doc);
}
