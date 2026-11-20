import { useCallback, useInsertionEffect, useRef, useState, useSyncExternalStore } from 'react';

import { devWarningsEnabled } from './devWarningsEnabled.js';

export interface ControllableStateOptions<T> {
  readonly value?: T | undefined;
  readonly defaultValue: T;
  readonly onChange?: ((value: T) => void) | undefined;
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
  readonly onChange: ((value: T) => void) | undefined;
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

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<T>): [T, (next: T) => void] {
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
    onChange,
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
    committed.current = {
      controlled,
      origin,
      onChange,
      latestValue:
        controlled || previous.controlled || previous.origin !== origin
          ? current
          : previous.latestValue,
    };
    if (controlled !== previous.controlled && !warned.current && devWarningsEnabled()) {
      warned.current = true;
      console.warn(
        `useControllableState switched to ${controlled ? 'controlled' : 'uncontrolled'} mode.`,
      );
    }
  }, [controlled, history, origin, onChange, current]);

  const setValue = useCallback((next: T): void => {
    const active = deliveries.current;
    if (active.some((candidate) => Object.is(candidate, next))) {
      return;
    }

    const snapshot = committed.current;
    if (!snapshot.controlled) {
      if (Object.is(snapshot.latestValue, next)) {
        return;
      }
      snapshot.latestValue = next;
      // A queued update can apply only under the authority that accepted it.
      setLocal({ origin: snapshot.origin, value: next });
    }

    if (snapshot.onChange) {
      active.push(next);
      try {
        snapshot.onChange(next);
      } finally {
        active.pop();
      }
    }
  }, []);

  return [current, setValue];
}
