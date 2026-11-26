import { useLayoutEffect, useRef, useState } from 'react';

export function useTagRemoval() {
  const action = useRef<HTMLButtonElement>(null);
  const [removed, setRemoved] = useState(false);
  const transferFocus = useRef(false);

  function toggle() {
    transferFocus.current = action.current?.matches(':focus') ?? false;
    setRemoved((previous) => !previous);
  }

  useLayoutEffect(() => {
    const target = action.current;
    if (
      transferFocus.current &&
      target &&
      target.ownerDocument.activeElement === target.ownerDocument.body
    ) {
      target.focus();
    }
    transferFocus.current = false;
  }, [removed]);

  return { action, removed, toggle };
}
