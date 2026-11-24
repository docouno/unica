import { useId, useLayoutEffect, useRef, useState } from 'react';

export function useToastExample() {
  const id = useId();
  const [phase, setPhase] = useState('initial');
  const returnFocus = useRef(false);

  function change(next = 'initial') {
    returnFocus.current = document.getElementById(id)?.contains(document.activeElement) ?? false;
    setPhase(next);
  }

  useLayoutEffect(() => {
    if (returnFocus.current) {
      returnFocus.current = false;
      if (document.activeElement === document.body) {
        const root = document.getElementById(id);
        const target = root instanceof HTMLButtonElement ? root : root?.querySelector('button');
        target?.focus();
      }
    }
  }, [id, phase]);

  return { id, phase, change };
}
