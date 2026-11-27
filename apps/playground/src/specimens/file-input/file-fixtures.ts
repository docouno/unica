export const fileSizes = ['s', 'm', 'l'] as const;

export function fileFixture(name: string, type = '', bytes?: number): File {
  return new File(bytes === undefined ? [name] : [new Uint8Array(bytes)], name, {
    type,
    lastModified: 1,
  });
}

export function fileKey(file: File): string {
  return JSON.stringify([file.name, file.size, file.type, file.lastModified]);
}

export function fileGesture(
  input: HTMLInputElement | null,
  files: readonly File[],
  type: 'drop' | 'dragenter' | 'dragleave' = 'drop',
  folder?: string,
): void {
  if (input) {
    const dataTransfer = new DataTransfer();
    for (const file of files) {
      dataTransfer.items.add(file);
    }
    if (folder) {
      dataTransfer.items.add(fileFixture(folder));
      const items = Array.from(dataTransfer.items);
      const item = items.at(-1);
      if (item) {
        // Hold the fixture item identities through the dispatched event.
        Object.defineProperty(item, 'webkitGetAsEntry', {
          value: () => ({ isDirectory: true, name: folder }),
        });
        Object.defineProperty(dataTransfer, 'items', { value: items });
      }
    }
    input.dispatchEvent(new DragEvent(type, { dataTransfer, bubbles: true, cancelable: true }));
  }
}
