import type { ChangeEvent, FocusEvent, CompositionEvent, RefObject } from 'react';
import { writeInputValue } from '../../core/forms/carriers.js';
import { useFormValue } from '../../core/forms/useFormValue.js';
import { useNativeComposition } from '../../core/forms/useNativeComposition.js';
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
  const composition = useNativeComposition(input);
  const { isActive } = composition;

  const form = useFormValue({
    value,
    defaultValue,
    readOnly,
    commitMode: 'deferred',
    getControl: () => input.current,
    readInitialValue: (control) => (control as HTMLInputElement).value,
    beforeReset: composition.cancel,
    onReset() {
      if (!form.controlled && input.current) {
        form.adopt(input.current.value);
      }
    },
    shouldWrite: () => !isActive(),
    writeDeps: [type, multiple],
    write(next, { controlled, force }) {
      if (input.current) {
        writeInputValue(input.current, next, { syncDefault: controlled, force });
      }
    },
  });
  const { adopt, controlled } = form;

  useIsoLayoutEffect(() => {
    if (!controlled && input.current && !isActive()) {
      // Changing type or multiple can sanitize an existing local edit.
      adopt(input.current.value);
    }
  }, [adopt, controlled, input, isActive, multiple, type]);

  return {
    controlled,
    isComposing: isActive,
    handleChange(event) {
      const target = event.currentTarget;
      form.propose(target.value, target);
      onChange?.(event);
    },
    handleCompositionStart(event) {
      composition.start(event.currentTarget);
      onCompositionStart?.(event);
    },
    handleCompositionEnd(event) {
      composition.finish(event.currentTarget, form.reconcile);
      onCompositionEnd?.(event);
    },
    handleBlur(event) {
      composition.finish(event.currentTarget, form.reconcile);
      onBlur?.(event);
    },
  };
}
