import { useRef } from 'react';
import type { ChangeEvent, FocusEvent, CompositionEvent, RefObject } from 'react';
import { getDefaultView, getOwnerDocument } from '../../core/dom.js';
import { writeInputValue } from '../../core/forms/carriers.js';
import { useFormValue } from '../../core/forms/useFormValue.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import type { InputProps } from './types.js';

interface InputValueOptions {
  readonly input: RefObject<HTMLInputElement | null>;
  readonly value: string | undefined;
  readonly defaultValue: string;
  readonly type: string;
  readonly multiple: boolean | undefined;
  readonly readOnly: boolean | undefined;
  readonly onChange: InputProps['onChange'];
  readonly onCompositionStart: InputProps['onCompositionStart'];
  readonly onCompositionEnd: InputProps['onCompositionEnd'];
  readonly onBlur: InputProps['onBlur'];
}

interface InputValueEvents {
  readonly controlled: boolean;
  readonly isComposing: () => boolean;
  readonly handleChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly handleCompositionStart: (event: CompositionEvent<HTMLInputElement>) => void;
  readonly handleCompositionEnd: (event: CompositionEvent<HTMLInputElement>) => void;
  readonly handleBlur: (event: FocusEvent<HTMLInputElement>) => void;
}

export function useInputValue({
  input,
  value,
  defaultValue,
  type,
  multiple,
  readOnly,
  onChange,
  onCompositionStart,
  onCompositionEnd,
  onBlur,
}: InputValueOptions): InputValueEvents {
  const composition = useRef<HTMLInputElement | null>(null);
  const finishTimer = useRef<(() => void) | undefined>(undefined);

  function cancelComposition(): void {
    finishTimer.current?.();
    finishTimer.current = undefined;
    composition.current = null;
  }

  useIsoLayoutEffect(() => cancelComposition, []);

  const form = useFormValue({
    value,
    defaultValue,
    readOnly,
    commitMode: 'deferred',
    getControl: () => input.current,
    readInitialValue: (control) => (control as HTMLInputElement).value,
    beforeReset: cancelComposition,
    onReset() {
      if (!form.controlled && input.current) {
        form.adopt(input.current.value);
      }
    },
    shouldWrite: () => input.current !== composition.current,
    writeDeps: [type, multiple],
    write(next, { controlled, force }) {
      if (input.current) {
        writeInputValue(input.current, next, { syncDefault: controlled, force });
      }
    },
  });
  const { adopt, controlled } = form;

  useIsoLayoutEffect(() => {
    if (!controlled && input.current && !composition.current) {
      // Changing type or multiple can sanitize an existing local edit.
      adopt(input.current.value);
    }
  }, [adopt, controlled, input, multiple, type]);

  function finishComposition(node: HTMLInputElement): void {
    if (composition.current !== node || finishTimer.current) {
      return;
    }
    const view = getDefaultView(getOwnerDocument(node));
    if (!view) {
      cancelComposition();
      return;
    }
    // Engines differ on whether the final input is before or after compositionend.
    // Let both the native sequence and callbacks commit before restoring authority.
    const timer = view.setTimeout(() => {
      finishTimer.current = undefined;
      if (composition.current === node) {
        composition.current = null;
        if (input.current === node) {
          form.reconcile();
        }
      }
    }, 0);
    finishTimer.current = () => view.clearTimeout(timer);
  }

  return {
    controlled,
    isComposing: () => composition.current !== null,
    handleChange(event) {
      const target = event.currentTarget;
      form.propose(target.value, target);
      onChange?.(event);
    },
    handleCompositionStart(event) {
      cancelComposition();
      composition.current = event.currentTarget;
      onCompositionStart?.(event);
    },
    handleCompositionEnd(event) {
      finishComposition(event.currentTarget);
      onCompositionEnd?.(event);
    },
    handleBlur(event) {
      finishComposition(event.currentTarget);
      onBlur?.(event);
    },
  };
}
