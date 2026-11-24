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
