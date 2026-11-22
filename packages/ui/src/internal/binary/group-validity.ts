interface GroupMessage {
  readonly source: string;
  readonly native: string;
}

interface ValidityWatch {
  readonly write: (message: string) => void;
  readonly release: () => void;
}

export interface GroupValidity {
  watch(input: HTMLInputElement, refresh: () => void): void;
  sync(
    controls: readonly HTMLInputElement[],
    message: string | undefined,
    focusable: (input: HTMLInputElement) => boolean,
  ): void;
  release(input: HTMLInputElement): void;
  remove(input: HTMLInputElement): void;
  disconnect(): void;
}

function watchValidity(input: HTMLInputElement, onChange: () => void): ValidityWatch {
  const property = 'setCustomValidity';
  const previous = Object.getOwnPropertyDescriptor(input, property);
  const original = Reflect.get(input, property);
  const write = (message: string) => original.call(input, message);

  // This applies to the group's own controls only. A native method has no event
  // or DOM record when a caller replaces or clears a custom validity message.
  function setCustomValidity(this: HTMLInputElement, message: string): void {
    original.call(this, message);
    if (this === input) {
      onChange();
    }
  }

  const installed = previous ? previous.configurable === true : Object.isExtensible(input);
  if (installed) {
    Object.defineProperty(input, property, {
      value: setCustomValidity,
      writable: true,
      configurable: true,
    });
  }
  return {
    write,
    release() {
      if (!installed || input.setCustomValidity !== setCustomValidity) {
        return;
      }
      if (previous) {
        Object.defineProperty(input, property, previous);
      } else {
        Reflect.deleteProperty(input, property);
      }
    },
  };
}

export function createGroupValidity(): GroupValidity {
  const owned = new Map<HTMLInputElement, GroupMessage>();
  const watches = new Map<HTMLInputElement, ValidityWatch>();

  function write(input: HTMLInputElement, message: string): void {
    const watch = watches.get(input);
    if (watch) {
      watch.write(message);
    } else {
      input.setCustomValidity(message);
    }
  }

  function release(input: HTMLInputElement): void {
    const previous = owned.get(input);
    if (!previous) {
      return;
    }
    if (!input.validity.customError) {
      owned.delete(input);
    } else if (input.willValidate) {
      if (input.validationMessage === previous.native) {
        write(input, '');
      }
      owned.delete(input);
    }
  }

  return {
    watch(input, refresh) {
      if (!watches.has(input)) {
        watches.set(
          input,
          watchValidity(input, () => {
            owned.delete(input);
            refresh();
          }),
        );
      }
    },
    sync(controls, message, focusable) {
      let anchor: HTMLInputElement | undefined;
      if (message !== undefined && !controls.some((input) => input.willValidate && input.checked)) {
        const eligible = controls.filter(
          (input) =>
            input.willValidate &&
            (!input.validity.customError || input.validationMessage === owned.get(input)?.native),
        );
        anchor = eligible.find(focusable) ?? eligible[0];
      }

      for (const [input, previous] of owned) {
        // Barred controls hide their validation messages. Reconcile ownership once
        // they can expose the message again, so application messages are preserved.
        if (input !== anchor || previous.source !== message || !input.validity.customError) {
          release(input);
        }
      }

      if (anchor && message !== undefined && !owned.has(anchor)) {
        write(anchor, message);
        owned.set(anchor, { source: message, native: anchor.validationMessage });
      }
    },
    release,
    remove(input) {
      release(input);
      owned.delete(input);
      watches.get(input)?.release();
      watches.delete(input);
    },
    disconnect() {
      watches.forEach((watch) => watch.release());
      watches.clear();
      owned.clear();
    },
  };
}
