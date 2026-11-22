import { devWarningsEnabled } from './devWarningsEnabled.js';

const warnedKeys = new Set<string>();

export function warnOnce(key: string, message: string): void {
  if (!devWarningsEnabled() || warnedKeys.has(key)) {
    return;
  }
  warnedKeys.add(key);
  console.warn(message);
}

/** Internal test-only helper; not exported from public package entry points. */
export function resetDevWarnings(): void {
  warnedKeys.clear();
}
