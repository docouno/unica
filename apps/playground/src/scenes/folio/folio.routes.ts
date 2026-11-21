const reviewParameters = ['family', 'scheme', 'vp', 'scale', 'dir', 'surface', 'raw', 'freeze'];

export function folioSceneHref(item: string): string {
  const current = new URLSearchParams(window.location.search);
  const destination = new URLSearchParams({ item });
  for (const name of reviewParameters) {
    const value = current.get(name);
    if (value !== null) {
      destination.set(name, value);
    }
  }
  return `?${destination}`;
}
