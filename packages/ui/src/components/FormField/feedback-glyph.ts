import { getDefaultView } from '../../core/dom.js';
import { observeControlPath } from '../../core/forms/observeControlPath.js';

const scopeMarker = 'data-unica-form-field-glyph';
const ownership = 'data-unica-form-field-glyph-owner';
const visibilityAttributes = ['class', 'style', 'hidden'];

/** Reconcile the server's visual fallback with the matching editor in the mounted field. */
export function observeFeedbackGlyph(body: HTMLDivElement, controlId: string): () => void {
  const view = getDefaultView(body.ownerDocument);
  if (!view) {
    return () => {};
  }

  const control = body.firstElementChild;
  let shell: Element | undefined;
  const resize = view.ResizeObserver ? new view.ResizeObserver(update) : undefined;
  const observer = new view.MutationObserver(update);

  function update(): void {
    const next = Array.from(control?.querySelectorAll(`[${scopeMarker}]`) ?? []).find(
      (candidate) => candidate.getAttribute(scopeMarker) === controlId,
    );
    if (next !== shell) {
      if (shell) {
        resize?.unobserve(shell);
      }
      shell = next;
      if (shell) {
        resize?.observe(shell);
      }
    }
    const editor = shell?.matches('button')
      ? shell
      : shell?.querySelector(':scope > :is(input, textarea)');
    const visible =
      editor &&
      !editor.matches(':disabled, [hidden]') &&
      (editor.checkVisibility?.({ visibilityProperty: true, opacityProperty: true }) ??
        editor.getClientRects().length > 0);
    const owner = visible ? 'editor' : 'feedback';
    if (body.getAttribute(ownership) !== owner) {
      body.setAttribute(ownership, owner);
    }
  }

  if (control) {
    observer.observe(control, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [scopeMarker, ...visibilityAttributes, 'disabled'],
    });
  }
  const stopPath = observeControlPath(body, update, visibilityAttributes);

  return () => {
    stopPath();
    observer.disconnect();
    resize?.disconnect();
    body.removeAttribute(ownership);
  };
}
