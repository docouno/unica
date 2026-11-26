import { warnOnce } from '../../core/devWarning.js';
import type { ToastAction, ToastId, ToastOptions, ToastStore } from './types.js';

const lifetime = 6000;
const capacity = 100;
let nextId = 0;

export interface ToastEntry extends ToastOptions {
  readonly id: ToastId;
  readonly status: NonNullable<ToastOptions['status']>;
  readonly loading: boolean;
  readonly urgency: NonNullable<ToastOptions['urgency']>;
}

interface ReadingClock {
  remaining: number;
  startedAt: number | null;
}

interface ReadingSource {
  readonly window: Window;
  readonly readable: () => ReadonlySet<ToastId>;
}

interface Delivery {
  readonly entry: ToastEntry;
}

const empty: readonly ToastEntry[] = [];

export function assertToastContent(title: string, action?: ToastAction): void {
  if (typeof title !== 'string' || !title.trim()) {
    throw new TypeError('Toast requires a non-empty title.');
  }
  if (action && (typeof action.label !== 'string' || !action.label.trim())) {
    throw new TypeError('A Toast action requires a non-empty label.');
  }
}

function resolveEntry(id: ToastId, options: ToastOptions): ToastEntry {
  assertToastContent(options.title, options.action);
  return {
    id,
    title: options.title,
    description: options.description,
    status: options.status ?? 'neutral',
    loading: options.loading ?? false,
    action: options.action && { ...options.action },
    actionLayout: options.actionLayout,
    operationKey: options.operationKey,
    persistent: options.persistent,
    urgency: options.urgency ?? 'polite',
  };
}

function timed(entry: ToastEntry): boolean {
  return (
    !entry.loading &&
    !entry.persistent &&
    !entry.action &&
    entry.status !== 'warning' &&
    entry.status !== 'danger'
  );
}

function changedMeaning(previous: ToastEntry, next: ToastEntry): boolean {
  return (
    previous.title.trim() !== next.title.trim() ||
    (previous.description?.trim() ?? '') !== (next.description?.trim() ?? '') ||
    previous.loading !== next.loading ||
    (!next.loading && previous.status !== next.status)
  );
}

/** State lives for the provider's mount. A projection supplies reading conditions in its own realm. */
export class ToastQueue {
  private readonly entries = new Map<ToastId, ToastEntry>();
  private readonly operations = new Map<string, ToastId>();
  private readonly clocks = new Map<ToastId, ReadingClock>();
  private readonly pending = new Map<ToastId, Delivery>();
  private readonly listeners = new Set<() => void>();
  private readonly viewports = new Set<symbol>();
  private snapshot: readonly ToastEntry[] = empty;
  private reading: ReadingSource | null = null;
  private timer: number | undefined;
  private disposed = false;

  readonly commands: ToastStore = {
    show: (options, command) => {
      if (this.disposed) {
        return null;
      }
      const key = options.operationKey;
      const existing = key === undefined ? undefined : this.operations.get(key);
      if (existing === undefined && this.entries.size >= capacity) {
        assertToastContent(options.title, options.action);
        return null;
      }
      const id = existing ?? (String(++nextId) as ToastId);
      const entry = resolveEntry(id, options);
      this.write(entry, command?.announce !== false);
      return id;
    },
    update: (id, patch, command) => {
      const current = this.entries.get(id);
      if (this.disposed || !current) {
        return false;
      }
      const entry = resolveEntry(id, { ...current, ...patch, operationKey: current.operationKey });
      this.write(entry, command?.announce !== false);
      return true;
    },
    dismiss: (id) => {
      if (!this.remove(id)) {
        return false;
      }
      this.schedule();
      this.publish();
      return true;
    },
    dismissAll: () => {
      if (this.entries.size === 0) {
        return;
      }
      this.clear();
      this.publish();
    },
  };

  readonly subscribe = (notify: () => void): (() => void) => {
    this.listeners.add(notify);
    return () => this.listeners.delete(notify);
  };

  readonly getSnapshot = (): readonly ToastEntry[] => this.snapshot;
  readonly getActiveViewport = (): symbol | undefined => this.viewports.values().next().value;

  registerViewport(viewport: symbol): () => void {
    this.viewports.add(viewport);
    if (this.viewports.size > 1) {
      warnOnce('toast-viewport', 'ToastProvider projects its queue through one ToastViewport.');
    }
    // Registration follows the mount, including Activity-hidden trees. Defer subscriptions
    // to the next microtask because React does not allow updates inside insertion effects.
    const notify = (): void => this.notify();
    queueMicrotask(notify);
    return () => {
      this.viewports.delete(viewport);
      queueMicrotask(notify);
    };
  }

  attachReading(source: ReadingSource): () => void {
    this.reading = source;
    return () => {
      if (this.reading === source) {
        this.cancelTimer();
        this.settle(source.window.performance.now());
        for (const clock of this.clocks.values()) {
          clock.startedAt = null;
        }
        this.reading = null;
      }
    };
  }

  refreshReading(): void {
    const source = this.reading;
    if (!source || this.clocks.size === 0) {
      return;
    }
    const readable = source.readable();
    const now = source.window.performance.now();
    this.settle(now);
    let removed = false;
    for (const [id, clock] of this.clocks) {
      if (!readable.has(id)) {
        clock.startedAt = null;
      } else if (clock.remaining <= 0) {
        this.remove(id);
        removed = true;
      } else {
        clock.startedAt = now;
      }
    }
    this.schedule();
    if (removed) {
      this.publish();
    }
  }

  nextDelivery(urgency: ToastEntry['urgency']): Delivery | undefined {
    for (const delivery of this.pending.values()) {
      if (delivery.entry.urgency === urgency) {
        return delivery;
      }
    }
    return undefined;
  }

  deliver(delivery: Delivery, write: (entry: ToastEntry) => void): void {
    const { id } = delivery.entry;
    if (this.pending.get(id) === delivery) {
      write(this.entries.get(id) ?? delivery.entry);
      this.pending.delete(id);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.clear();
    this.reading = null;
    this.listeners.clear();
    this.viewports.clear();
    this.snapshot = empty;
  }

  private write(entry: ToastEntry, announce: boolean): void {
    const previous = this.entries.get(entry.id);
    const meaning = !previous || changedMeaning(previous, entry);
    this.entries.set(entry.id, entry);
    if (entry.operationKey !== undefined) {
      this.operations.set(entry.operationKey, entry.id);
    }
    if (meaning) {
      if (announce) {
        const queued = this.pending.get(entry.id);
        if (queued && queued.entry.urgency !== entry.urgency) {
          this.pending.delete(entry.id);
        }
        this.pending.set(entry.id, { entry });
      } else {
        this.pending.delete(entry.id);
      }
    }
    if (!timed(entry)) {
      this.clocks.delete(entry.id);
    } else if (!this.clocks.has(entry.id)) {
      this.clocks.set(entry.id, { remaining: lifetime, startedAt: null });
    }
    this.schedule();
    this.publish();
  }

  private remove(id: ToastId): boolean {
    const entry = this.entries.get(id);
    if (!entry) {
      return false;
    }
    this.entries.delete(id);
    this.pending.delete(id);
    this.clocks.delete(id);
    if (entry.operationKey !== undefined) {
      this.operations.delete(entry.operationKey);
    }
    return true;
  }

  private clear(): void {
    this.cancelTimer();
    this.entries.clear();
    this.operations.clear();
    this.pending.clear();
    this.clocks.clear();
  }

  private settle(now: number): void {
    for (const clock of this.clocks.values()) {
      if (clock.startedAt !== null) {
        clock.remaining = Math.max(0, clock.remaining - (now - clock.startedAt));
        clock.startedAt = now;
      }
    }
  }

  private cancelTimer(): void {
    if (this.timer !== undefined) {
      this.reading?.window.clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  private schedule(): void {
    this.cancelTimer();
    const source = this.reading;
    if (!source) {
      return;
    }
    let deadline = Number.POSITIVE_INFINITY;
    for (const clock of this.clocks.values()) {
      if (clock.startedAt !== null) {
        deadline = Math.min(deadline, clock.startedAt + clock.remaining);
      }
    }
    if (Number.isFinite(deadline)) {
      this.timer = source.window.setTimeout(
        () => {
          this.timer = undefined;
          this.refreshReading();
        },
        Math.max(0, Math.ceil(deadline - source.window.performance.now())),
      );
    }
  }

  private publish(): void {
    this.snapshot = Array.from(this.entries.values());
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
