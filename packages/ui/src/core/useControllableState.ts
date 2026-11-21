import { useCallback, useInsertionEffect, useRef, useState, useSyncExternalStore } from 'react';

declare const process: { readonly env: { readonly NODE_ENV?: string } };

export interface ControllableStateOptions<T> {
  readonly value?: T | undefined;
  readonly defaultValue: T;
  readonly onChange?: ((value: T) => void) | undefined;
  readonly isEqual?: ((a: T, b: T) => boolean) | undefined;
}

interface LocalOrigin<T> {
  readonly initialValue: T;
}

interface LocalState<T> {
  readonly origin: LocalOrigin<T>;
  readonly value: T;
}

interface CommittedState<T> {
  readonly controlled: boolean;
  readonly origin: LocalOrigin<T>;
  readonly local: LocalState<T> | null;
  readonly onChange: ((value: T) => void) | undefined;
  readonly isEqual: (a: T, b: T) => boolean;
  readonly committedValue: T;
  latestValue: T;
}

function createControlledHistory<T>(defaultValue: T) {
  const initial = { initialValue: defaultValue };
  let origin = initial;
  return {
    readInitial: () => initial,
    read: () => origin,
    accept: (value: T) => {
      origin = { initialValue: value };
    },
  };
}

function subscribeToFixedSnapshot(): () => void {
  return () => undefined;
}

function devWarningsEnabled(): boolean {
  try {
    // Bundlers replace the environment expression. Native browser ESM can omit it.
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
  isEqual,
}: ControllableStateOptions<T>): [T, (next: T) => void] {
  const [current, { propose }] = useStateAuthority({ value, defaultValue, onChange, isEqual });
  return [current, propose];
}

export interface StateAuthority<T> {
  read: () => T;
  propose: (next: T, write?: (value: T) => void) => void;
  restore: (initial: T, write?: (value: T) => void) => void;
}

export function useStateAuthority<T>({
  value,
  defaultValue,
  onChange,
  isEqual = Object.is,
}: ControllableStateOptions<T>): [T, StateAuthority<T>] {
  const controlled = value !== undefined;
  const [history] = useState(() => createControlledHistory(defaultValue));
  const [local, setLocal] = useState<LocalState<T> | null>(null);

  // Controlled commits update the history while the hook reads a fixed snapshot.
  // Local mode observes the last committed origin, which stays fixed in that mode.
  const readOrigin = controlled ? history.readInitial : history.read;
  const origin = useSyncExternalStore(subscribeToFixedSnapshot, readOrigin, readOrigin);
  const current = controlled ? value : local?.origin === origin ? local.value : origin.initialValue;
  const committed = useRef<CommittedState<T>>({
    controlled,
    origin,
    local,
    onChange,
    isEqual,
    committedValue: current,
    latestValue: current,
  });
  const deliveries = useRef<T[]>([]);
  const warned = useRef(false);

  // Publish before ref attachments and layout effects can call the setter.
  useInsertionEffect(() => {
    const previous = committed.current;
    if (controlled) {
      history.accept(current);
    }
    // Preserve pending local latestValue across unrelated parent rerenders (for example
    // while a Continuous/Default/Transition update is queued), and sync it to current
    // once local actually commits or authority changes.
    const nextLatest =
      controlled || previous.controlled || previous.origin !== origin || previous.local !== local
        ? current
        : previous.latestValue;
    committed.current = {
      controlled,
      origin,
      local,
      onChange,
      isEqual,
      committedValue: current,
      latestValue: nextLatest,
    };
    if (controlled !== previous.controlled && !warned.current && devWarningsEnabled()) {
      warned.current = true;
      console.warn(
        `useControllableState switched to ${controlled ? 'controlled' : 'uncontrolled'} mode.`,
      );
    }
  }, [controlled, history, origin, local, onChange, isEqual, current]);

  const read = useCallback((): T => committed.current.latestValue, []);

  const restore = useCallback((initial: T, write?: (value: T) => void): void => {
    const snapshot = committed.current;
    if (!snapshot.controlled && !snapshot.isEqual(snapshot.latestValue, initial)) {
      write?.(initial);
      snapshot.latestValue = initial;
      setLocal({ origin: snapshot.origin, value: initial });
      return;
    }
    if (!snapshot.controlled && !snapshot.isEqual(snapshot.committedValue, initial)) {
      write?.(initial);
      setLocal({ origin: snapshot.origin, value: initial });
      return;
    }
    write?.(snapshot.latestValue);
  }, []);

  const propose = useCallback((next: T, write?: (value: T) => void): void => {
    const active = deliveries.current;
    const snapshot = committed.current;
    if (active.some((candidate) => snapshot.isEqual(candidate, next))) {
      write?.(snapshot.latestValue);
      return;
    }

    const unchanged = !snapshot.controlled && snapshot.isEqual(snapshot.latestValue, next);
    if (!snapshot.controlled && !unchanged) {
      // Write before mutating local state so a throwing DOM writer keeps React and DOM in sync.
      write?.(next);
      snapshot.latestValue = next;
      // A queued update can apply only under the authority that accepted it.
      setLocal({ origin: snapshot.origin, value: next });
    } else if (!snapshot.controlled && !snapshot.isEqual(snapshot.committedValue, next)) {
      // A prior setLocal(next) stayed pending (e.g. suspended transition); re-queue on the
      // current priority lane without emitting a duplicate onChange.
      write?.(snapshot.latestValue);
      setLocal({ origin: snapshot.origin, value: next });
    } else {
      // Repair native edits before external code can read the form.
      write?.(snapshot.latestValue);
    }

    if (!unchanged && snapshot.onChange) {
      active.push(next);
      try {
        snapshot.onChange(next);
      } finally {
        active.pop();
      }
    }
  }, []);

  return [current, { read, propose, restore }];
}
