import { useId, useLayoutEffect, useRef, useState } from 'react';

export function useTagRemoval() {
  const id = useId();
  const [removed, setRemoved] = useState(false);
  const transferFocus = useRef(false);

  function toggle() {
    transferFocus.current = document.getElementById(id)?.contains(document.activeElement) ?? false;
    setRemoved((previous) => !previous);
  }

  useLayoutEffect(() => {
    if (transferFocus.current) {
      transferFocus.current = false;
      const owner = document.getElementById(id);
      if (owner && document.activeElement === document.body) {
        const button = owner.querySelector('button');
        (button && !button.disabled ? button : owner).focus();
      }
    }
  }, [id, removed]);

  return { id, removed, toggle };
}
