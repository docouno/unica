import {
  composedContains,
  getComposedParentElement,
  getComputedStyleSafe,
  isContentEditableSafe,
  isInertElement,
  matchesSafe,
} from '../../core/dom.js';

function eligible(target: HTMLElement, dialog: HTMLDialogElement): boolean {
  if (
    target === dialog ||
    !composedContains(dialog, target) ||
    matchesSafe(target, ':disabled, [aria-disabled="true" i]') ||
    isInertElement(target, 'local')
  ) {
    return false;
  }

  const style = getComputedStyleSafe(target);
  if (
    style?.visibility === 'hidden' ||
    style?.visibility === 'collapse' ||
    style?.display === 'contents'
  ) {
    return false;
  }
  for (
    let node: Element | null = target;
    node && node !== dialog;
    node = getComposedParentElement(node)
  ) {
    const layout = node === target ? style : getComputedStyleSafe(node);
    if (
      matchesSafe(node, '[hidden], dialog:not([open]), [popover]:not(:popover-open)') ||
      layout?.display === 'none' ||
      layout?.contentVisibility === 'hidden'
    ) {
      return false;
    }
    if (node !== target && matchesSafe(node, 'details:not([open])')) {
      const summary = node.querySelector(':scope > summary');
      if (!summary || !composedContains(summary, target)) {
        return false;
      }
    }
  }
  return true;
}

function opensKeyboard(target: HTMLElement): boolean {
  return (
    isContentEditableSafe(target) ||
    matchesSafe(
      target,
      'textarea:not([readonly]), input:not([readonly], [type="hidden"], [type="button"], [type="submit"], [type="reset"], [type="image"], [type="checkbox"], [type="radio"], [type="range"], [type="color"], [type="file"])',
    )
  );
}

function canAutofocus(target: HTMLElement): boolean {
  return target.tabIndex >= 0 || target.hasAttribute('tabindex') || isContentEditableSafe(target);
}

/** Set the native dialog's focus delegate before showModal can focus any editable descendants. */
export function prepareDialogFocus(
  dialog: HTMLDialogElement,
  surface: HTMLElement,
  title: HTMLElement | undefined,
  explicit: HTMLElement | null | undefined,
  touch: boolean,
): () => void {
  const target =
    explicit &&
    eligible(explicit, dialog) &&
    canAutofocus(explicit) &&
    !(touch && opensKeyboard(explicit))
      ? explicit
      : title && eligible(title, dialog) && canAutofocus(title)
        ? title
        : surface;
  const previous = new Map<HTMLElement, string>();
  for (const autofocus of dialog.querySelectorAll<HTMLElement>('[autofocus]')) {
    if (autofocus !== target) {
      previous.set(autofocus, autofocus.getAttribute('autofocus') ?? '');
      autofocus.removeAttribute('autofocus');
    }
  }
  const authored = target.hasAttribute('autofocus');
  if (!authored) {
    target.setAttribute('autofocus', '');
  }
  return () => {
    if (!authored) {
      target.removeAttribute('autofocus');
    }
    for (const [node, value] of previous) {
      if (!node.hasAttribute('autofocus')) {
        node.setAttribute('autofocus', value);
      }
    }
  };
}
