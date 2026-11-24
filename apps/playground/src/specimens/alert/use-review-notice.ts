import { useId, useLayoutEffect, useRef, useState } from 'react';

export function useReviewNotice() {
  const [shown, setShown] = useState(true);
  const [publication, setPublication] = useState(0);
  const focusId = useId();
  const restoreFocus = useRef(false);

  useLayoutEffect(() => {
    if (restoreFocus.current) {
      restoreFocus.current = false;
      const target = document.getElementById(focusId);
      if (target && target.ownerDocument.activeElement === target.ownerDocument.body) {
        target.focus();
      }
    }
  }, [shown, focusId]);

  function toggleFrom(trigger = document.activeElement) {
    restoreFocus.current = trigger?.matches(':focus') ?? false;
    setPublication(0);
    setShown((visible) => !visible);
  }

  function publish() {
    setPublication((previous) => previous + 1);
  }

  return { shown, publication, focusId, toggleFrom, publish };
}
