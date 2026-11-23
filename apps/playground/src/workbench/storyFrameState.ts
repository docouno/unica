import { useEffect, useRef } from 'react';
import type {
  StoryContext,
  StoryControlSchema,
  StoryControlValue,
  StoryControlValues,
} from './types.js';

export function defaultStoryControls(schema?: StoryControlSchema): StoryControlValues {
  if (!schema) {
    return {};
  }
  const initial: Record<string, StoryControlValue> = {};
  for (const [key, control] of Object.entries(schema)) {
    initial[key] = control.default;
  }
  return initial;
}

export function useStoryAction(
  ctx: { readonly story?: StoryContext } | undefined,
  handler: (actionId: string) => void,
): void {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  const onAction = ctx?.story?.onAction;
  useEffect(() => {
    if (!onAction) {
      return;
    }
    return onAction((actionId) => {
      handlerRef.current(actionId);
    });
  }, [onAction]);
}
