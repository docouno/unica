import type { JSX } from 'react';

export default function ClosedDialogFixture(): JSX.Element {
  return <dialog aria-label="Initially closed">Dialog content</dialog>;
}
