import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { PreviewContext, StoryContext } from '../../workbench/types.js';

interface Copy {
  readonly available: () => boolean;
  readonly accepts: (action: string) => boolean;
}

const acceptAll = (): boolean => true;
const frames = new WeakMap<StoryContext['onAction'], Set<Copy>>();

function visible(node: HTMLElement | null): boolean {
  if (!node?.isConnected) {
    return false;
  }
  const frame = node.ownerDocument.defaultView?.frameElement;
  const target = frame ?? node;
  const rect = target.getBoundingClientRect();
  const view = target.ownerDocument.defaultView;
  return Boolean(
    view && rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < view.innerHeight,
  );
}

/** A shared StoryFrame command updates every copy while one visible copy announces it. */
export function useToastStoryAction(
  ctx: PreviewContext,
  stage: RefObject<HTMLElement | null>,
  handler: (action: string, announce: boolean) => void,
  accepts: (action: string) => boolean = acceptAll,
): void {
  const latest = useRef({ handler, accepts });
  useEffect(() => {
    latest.current = { handler, accepts };
  }, [handler, accepts]);

  const onAction = ctx.story?.onAction;
  useEffect(() => {
    if (!onAction) {
      return;
    }
    const copies = frames.get(onAction) ?? new Set<Copy>();
    const current: Copy = {
      available: () => visible(stage.current),
      accepts: (action) => latest.current.accepts(action),
    };
    frames.set(onAction, copies);
    copies.add(current);
    const stop = onAction((action) => {
      const eligible = [...copies].filter((copy) => copy.accepts(action));
      const announcer = eligible.find((copy) => copy.available()) ?? eligible[0];
      if (eligible.includes(current)) {
        latest.current.handler(action, announcer === current);
      }
    });
    return () => {
      stop();
      copies.delete(current);
    };
  }, [onAction, stage]);
}
