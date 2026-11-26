import { useRef } from 'react';
import type { CompositionEvent, FocusEvent, InputEvent as ReactInputEvent, RefObject } from 'react';
import { isConnectedNode, isInertElement } from '../../core/dom.js';
import { writeInputValue } from '../../core/forms/carriers.js';
import { useFormValue } from '../../core/forms/useFormValue.js';
import { useNativeComposition } from '../../core/forms/useNativeComposition.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { numberValue } from './step.js';
import type { NumberInputProps } from './types.js';

type Value = number | '';
type InputEventHandler = (event: ReactInputEvent<HTMLInputElement>) => void;

interface NumberValueOptions {
  readonly input: RefObject<HTMLInputElement | null>;
  readonly value: Value | undefined;
  readonly defaultValue: Value;
  readonly readOnly: NumberInputProps['readOnly'];
  readonly onInput: NumberInputProps['onInput'];
  readonly onInputCapture: NumberInputProps['onInputCapture'];
  readonly onChange: NumberInputProps['onChange'];
  readonly onValueChange: NumberInputProps['onValueChange'];
  readonly onCompositionStart: NumberInputProps['onCompositionStart'];
  readonly onCompositionEnd: NumberInputProps['onCompositionEnd'];
  readonly onBlur: NumberInputProps['onBlur'];
  readonly cancelPress: () => void;
  readonly refresh: () => void;
}

interface NumberValueEvents {
  readonly defaultValue: Value;
  readonly isComposing: () => boolean;
  readonly settleReset: () => void;
  readonly onInputCapture: InputEventHandler;
  readonly onInput: InputEventHandler;
  readonly onChange: NonNullable<NumberInputProps['onChange']>;
  readonly onCompositionStart: (event: CompositionEvent<HTMLInputElement>) => void;
  readonly onCompositionEnd: (event: CompositionEvent<HTMLInputElement>) => void;
  readonly onBlur: (event: FocusEvent<HTMLInputElement>) => void;
}

interface Edit {
  readonly node: HTMLInputElement;
  readonly owner: HTMLFormElement | null;
  readonly value: Value | undefined;
  readonly previous: Value;
  readonly resetEpoch: number;
}

export function canEditNumber(node: HTMLInputElement): boolean {
  return (
    isConnectedNode(node) &&
    !node.matches(':disabled') &&
    !node.readOnly &&
    !node.closest('[hidden]') &&
    !isInertElement(node)
  );
}

export function useNumberValue({
  input,
  value,
  defaultValue,
  readOnly,
  onInput,
  onInputCapture,
  onChange,
  onValueChange,
  onCompositionStart,
  onCompositionEnd,
  onBlur,
  cancelPress,
  refresh,
}: NumberValueOptions): NumberValueEvents {
  const composition = useNativeComposition(input);
  const edits = useRef(new WeakMap<Event, Edit>());
  const attached = useRef<HTMLInputElement | null>(null);
  const lastWritten = useRef<Value>(value ?? defaultValue);
  const resetEpoch = useRef(0);
  const resetting = useRef(false);
  const freshNativeEdit = useRef<HTMLInputElement | null>(null);
  const abandonedComposition = useRef<HTMLInputElement | null>(null);
  const discardedInputs = useRef(new WeakSet<Event>());

  const form = useFormValue<Value>({
    value,
    defaultValue,
    onChange: onValueChange,
    readOnly,
    commitMode: 'deferred',
    getControl: () => input.current,
    readInitialValue: (node) => numberValue(node as HTMLInputElement) ?? defaultValue,
    beforeReset() {
      if (composition.isActive()) {
        abandonedComposition.current = input.current;
      }
      resetEpoch.current += 1;
      resetting.current = true;
      composition.cancel();
      cancelPress();
    },
    shouldWrite: () => !composition.isActive(),
    write(next, { controlled }) {
      const node = input.current;
      if (!node) {
        return;
      }
      if (freshNativeEdit.current === node) {
        // An input can arrive in the same task as form.reset(). Settle the
        // authority change without replacing the browser's newer edit.
        lastWritten.current = next;
        resetting.current = false;
        return;
      }
      const mounting = attached.current !== node;
      attached.current = node;
      const draft = numberValue(node);
      if (
        resetting.current ||
        (mounting && controlled) ||
        (draft === undefined ? next !== lastWritten.current : next !== draft)
      ) {
        writeInputValue(node, String(next), { force: true });
      } else if (mounting && draft !== undefined) {
        // Set the dirty-value flag without normalizing a hydrated native draft.
        writeInputValue(node, node.value, { force: true });
      }
      lastWritten.current = next;
      resetting.current = false;
      refresh();
    },
  });

  const baseline = String(value ?? form.defaultValue);
  useIsoLayoutEffect(() => {
    const node = input.current;
    if (node && node.defaultValue !== baseline) {
      // React 19 can defer the value attribute of a focused number editor.
      // Keep the reset baseline current even while the native preedit is active.
      node.setAttribute('value', baseline);
      refresh();
    }
  }, [baseline, input, refresh]);

  function deliver(edit: Edit): boolean {
    form.settleReset();
    if (input.current !== edit.node || edit.resetEpoch !== resetEpoch.current) {
      return false;
    }
    if (edit.owner !== edit.node.form || !canEditNumber(edit.node)) {
      form.reconcile();
      return false;
    }
    if (edit.value !== undefined && edit.value !== edit.previous) {
      form.propose(edit.value, edit.node);
      refresh();
      return true;
    }
    refresh();
    return false;
  }

  function finishComposition(node: HTMLInputElement): void {
    composition.finish(node, () => {
      const delivered = deliver({
        node,
        owner: node.form,
        value: numberValue(node),
        previous: form.read(),
        resetEpoch: resetEpoch.current,
      });
      if (!delivered) {
        form.reconcile();
      }
    });
  }

  return {
    defaultValue: form.defaultValue,
    isComposing: composition.isActive,
    settleReset: form.settleReset,
    onInputCapture(event) {
      const node = event.currentTarget;
      freshNativeEdit.current = node;
      try {
        form.settleReset(event.nativeEvent.isTrusted ? node : undefined);
      } finally {
        freshNativeEdit.current = null;
      }
      const native = event.nativeEvent;
      const compositionInput =
        native.isComposing ||
        native.inputType === 'insertCompositionText' ||
        native.inputType === 'deleteCompositionText' ||
        native.inputType === 'insertFromComposition';
      if (abandonedComposition.current === node && compositionInput) {
        discardedInputs.current.add(native);
      } else if (composition.isActive() || native.isComposing) {
        if (!composition.isActive()) {
          composition.start(node);
        }
      } else {
        abandonedComposition.current = null;
        edits.current.set(event.nativeEvent, {
          node,
          owner: node.form,
          value: numberValue(node),
          previous: form.read(),
          resetEpoch: resetEpoch.current,
        });
      }
      onInputCapture?.(event);
    },
    onInput(event) {
      const native = event.nativeEvent;
      if (discardedInputs.current.delete(native)) {
        form.reconcile();
      }
      refresh();
      onInput?.(event);
      if (edits.current.has(native)) {
        // React may omit onChange when badInput becomes empty or a final IME
        // input has the same native value as the last preedit.
        queueMicrotask(() => {
          const edit = edits.current.get(native);
          edits.current.delete(native);
          if (edit) {
            deliver(edit);
          }
        });
      }
    },
    onChange(event) {
      const native = event.nativeEvent;
      const edit = edits.current.get(native);
      edits.current.delete(native);
      onChange?.(event);
      if (edit) {
        deliver(edit);
      }
    },
    onCompositionStart(event) {
      abandonedComposition.current = null;
      composition.start(event.currentTarget);
      onCompositionStart?.(event);
    },
    onCompositionEnd(event) {
      finishComposition(event.currentTarget);
      onCompositionEnd?.(event);
    },
    onBlur(event) {
      finishComposition(event.currentTarget);
      onBlur?.(event);
    },
  };
}
