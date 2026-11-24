import type { MouseEvent } from 'react';

/** Keep a fragment in its open case, or address the canonical block in the source theme. */
export function specimenBlockPage(
  item: string,
  tab: 'states' | 'compositions',
  block: string,
  themeId: string,
): string {
  const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
  if (params.get('item') === item && params.get('tab') === tab && params.get('block') === block) {
    return '';
  }
  params.set('item', item);
  params.set('tab', tab);
  params.set('block', block);
  params.set('solo', themeId);
  return `?${params}`;
}

// The target can mount after the browser's initial fragment navigation.
export function focusLinkedFragment(node: HTMLElement | null): void {
  if (node) {
    const { activeElement, body, location } = node.ownerDocument;
    if (activeElement === body && location.hash === `#${node.id}`) {
      node.focus();
    }
  }
}

// Follow a mounted study's canonical address without reloading its edited inputs.
export function followStudyFragment(event: MouseEvent<HTMLAnchorElement>): void {
  const link = event.currentTarget;
  const view = link.ownerDocument.defaultView;
  if (
    !view ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    link.target ||
    link.search === view.location.search
  ) {
    return;
  }
  const target = link.ownerDocument.getElementById(link.hash.slice(1));
  if (target) {
    event.preventDefault();
    const address = new URL(link.href);
    // Keep all compared owners mounted; the shared link still opens its source theme alone.
    if (!new URLSearchParams(view.location.search).has('solo')) {
      address.searchParams.delete('solo');
    }
    view.history.pushState(null, '', address);
    view.dispatchEvent(new PopStateEvent('popstate'));
    target.focus({ preventScroll: true });
    view.requestAnimationFrame(() => {
      if (link.ownerDocument.activeElement === target) {
        target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    });
  }
}
