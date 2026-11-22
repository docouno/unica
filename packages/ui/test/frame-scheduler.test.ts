import { getDefaultView } from '../src/core/dom.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFrameJob } from '../src/core/frame-scheduler.js';

const cleanups: (() => void)[] = [];

function replaceProp(target: object, key: string, value: unknown): void {
  const desc = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(target, key, { configurable: true, value });
  cleanups.push(() => {
    if (desc) {
      Object.defineProperty(target, key, desc);
    } else {
      Reflect.deleteProperty(target, key);
    }
  });
}

function mockRaf(doc: Document) {
  const view = getDefaultView(doc)!;
  const pending = new Map<number, FrameRequestCallback>();
  let nextId = 0;
  const reported: unknown[] = [];

  const request = vi.fn((cb: FrameRequestCallback) => {
    const id = ++nextId;
    pending.set(id, cb);
    return id;
  });
  const cancel = vi.fn((id: number) => pending.delete(id));
  replaceProp(view, 'requestAnimationFrame', request);
  replaceProp(view, 'cancelAnimationFrame', cancel);
  replaceProp(view, 'reportError', (error: unknown) => {
    reported.push(error);
  });

  return {
    request,
    cancel,
    pending,
    reported,
    flush() {
      const batch = [...pending.values()];
      pending.clear();
      for (const cb of batch) {
        cb(0);
      }
    },
  };
}

afterEach(() => {
  for (const fn of cleanups.splice(0).reverse()) {
    fn();
  }
  document.body.replaceChildren();
});

describe('FrameScheduler', () => {
  it('runs prepare -> measure -> write across multiple jobs in one frame and isolates documents', () => {
    const main = mockRaf(document);
    const frame = document.createElement('iframe');
    document.body.append(frame);
    const childDoc = frame.contentDocument!;
    const child = mockRaf(childDoc);

    const log: string[] = [];
    const jobA = createFrameJob(document, {
      prepare: () => log.push('prepare:A'),
      measure: () => {
        log.push('measure:A');
        return () => log.push('write:A');
      },
    });
    const jobB = createFrameJob(document, {
      prepare: () => log.push('prepare:B'),
      measure: () => {
        log.push('measure:B');
        return () => log.push('write:B');
      },
    });
    const childJob = createFrameJob(childDoc, {
      prepare: () => log.push('prepare:child'),
      measure: () => {
        log.push('measure:child');
        return () => log.push('write:child');
      },
    });

    jobA.schedule();
    jobB.schedule();
    jobA.schedule(); // deduplicated within frame
    expect(main.request).toHaveBeenCalledTimes(1);
    expect(child.request).not.toHaveBeenCalled();

    childJob.schedule();
    expect(child.request).toHaveBeenCalledTimes(1);

    main.flush();
    expect(log).toEqual(['prepare:A', 'prepare:B', 'measure:A', 'measure:B', 'write:A', 'write:B']);
    expect(child.pending.size).toBe(1);

    child.flush();
    expect(log.slice(-3)).toEqual(['prepare:child', 'measure:child', 'write:child']);

    jobA.dispose();
    jobB.dispose();
    childJob.dispose();
    expect(main.pending.size).toBe(0);
    expect(child.pending.size).toBe(0);
  });

  it('handles dispose, throw, and re-schedule inside an active frame and cleans up at idle = 0', () => {
    const main = mockRaf(document);
    const log: string[] = [];
    const prepareErr = new Error('prepare boom');
    const measureErr = new Error('measure boom');
    const writeErr = new Error('write boom');
    let reschedules = 0;

    const doomed = createFrameJob(document, {
      prepare: () => log.push('prepare:doomed'),
      measure: () => {
        log.push('measure:doomed');
        return () => log.push('write:doomed');
      },
    });
    const killer = createFrameJob(document, {
      prepare: () => {
        log.push('prepare:killer');
        doomed.dispose();
      },
      measure: () => {
        log.push('measure:killer');
        return () => {
          log.push('write:killer');
          if (reschedules === 0) {
            reschedules++;
            killer.schedule();
          }
        };
      },
    });
    const throwingPrepare = createFrameJob(document, {
      prepare: () => {
        throw prepareErr;
      },
      measure: () => {
        log.push('measure:should-not-run');
      },
    });
    const throwingMeasure = createFrameJob(document, {
      measure: () => {
        throw measureErr;
      },
    });
    const throwingWrite = createFrameJob(document, {
      measure: () => () => {
        throw writeErr;
      },
    });

    killer.schedule();
    doomed.schedule();
    throwingPrepare.schedule();
    throwingMeasure.schedule();
    throwingWrite.schedule();

    main.flush();
    expect(log).toEqual(['prepare:killer', 'measure:killer', 'write:killer']);
    expect(main.reported).toEqual([prepareErr, measureErr, writeErr]);
    // Re-scheduling inside write queued a follow-up frame cleanly.
    expect(main.pending.size).toBe(1);

    // Cancelling the sole queued job cancels the rAF immediately (idle = 0).
    killer.cancel();
    expect(main.cancel).toHaveBeenCalledTimes(1);
    expect(main.pending.size).toBe(0);

    // Scheduling and disposing all jobs leaves zero pending frames.
    killer.schedule();
    expect(main.pending.size).toBe(1);
    killer.dispose();
    throwingPrepare.dispose();
    throwingMeasure.dispose();
    throwingWrite.dispose();
    expect(main.cancel).toHaveBeenCalledTimes(2);
    expect(main.pending.size).toBe(0);
  });
});
