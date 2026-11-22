import { useCallback, useRef } from 'react';
import type { RefObject } from 'react';
import { getDefaultView } from '../dom.js';
import { useIsoLayoutEffect } from '../useIsoLayoutEffect.js';

type NativeEditor = HTMLInputElement | HTMLTextAreaElement;

interface NativeComposition {
  readonly isActive: () => boolean;
  readonly start: (editor: NativeEditor) => void;
  readonly finish: (editor: NativeEditor, reconcile: () => void) => void;
  readonly cancel: () => void;
}

export function useNativeComposition(editorRef: RefObject<NativeEditor | null>): NativeComposition {
  const active = useRef<NativeEditor | null>(null);
  const cancelTimer = useRef<(() => void) | undefined>(undefined);
  const isActive = useCallback(
    () => active.current !== null && active.current === editorRef.current,
    [editorRef],
  );
  const cancel = useCallback((): void => {
    cancelTimer.current?.();
    cancelTimer.current = undefined;
    active.current = null;
  }, []);

  useIsoLayoutEffect(() => cancel, [cancel]);

  return {
    isActive,
    cancel,
    start(editor) {
      cancel();
      active.current = editor;
    },
    finish(editor, reconcile) {
      if (active.current !== editor || cancelTimer.current) {
        return;
      }
      const view = getDefaultView(editor.ownerDocument);
      if (!view) {
        cancel();
        return;
      }
      // The final input can occur before or after compositionend.
      const timer = view.setTimeout(() => {
        cancelTimer.current = undefined;
        if (active.current === editor) {
          active.current = null;
          if (editorRef.current === editor) {
            reconcile();
          }
        }
      }, 0);
      cancelTimer.current = () => view.clearTimeout(timer);
    },
  };
}
