export function devWarningsEnabled(): boolean {
  try {
    // Bundlers replace the environment expression. Native browser ESM can omit it.
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}
declare const process: { readonly env: { readonly NODE_ENV?: string } };
