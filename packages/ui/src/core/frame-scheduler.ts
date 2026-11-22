import { getLiveView, reportErrorSafe } from './dom.js';

export interface FrameTask {
  readonly prepare?: (() => void) | undefined;
  readonly measure: () => (() => void) | void;
}

export interface FrameJob {
  readonly schedule: () => void;
  readonly cancel: () => void;
  readonly dispose: () => void;
}

interface InternalJob {
  readonly task: FrameTask;
  cancelled: boolean;
  disposed: boolean;
}

interface DocumentScheduler {
  readonly jobs: Set<InternalJob>;
  readonly queued: Set<InternalJob>;
  frameId: number | null;
  running: boolean;
  schedule: (job: InternalJob) => void;
  cancel: (job: InternalJob) => void;
  dispose: (job: InternalJob) => void;
}

const schedulers = new WeakMap<Document, DocumentScheduler>();

function createScheduler(doc: Document): DocumentScheduler {
  const jobs = new Set<InternalJob>();
  const queued = new Set<InternalJob>();
  let frameId: number | null = null;
  let running = false;

  const cancelFrame = (): void => {
    if (frameId === null) {
      return;
    }
    const id = frameId;
    frameId = null;
    const view = getLiveView(doc);
    if (view && typeof view.cancelAnimationFrame === 'function') {
      try {
        view.cancelAnimationFrame(id);
      } catch {
        // Ignore detached frame teardown.
      }
    }
  };

  const requestFrame = (): void => {
    if (frameId !== null || running || queued.size === 0 || jobs.size === 0) {
      return;
    }
    const view = getLiveView(doc);
    if (!view || typeof view.requestAnimationFrame !== 'function') {
      queued.clear();
      return;
    }
    frameId = view.requestAnimationFrame(flush);
  };

  const cleanupIfIdle = (): void => {
    if (jobs.size === 0) {
      queued.clear();
      cancelFrame();
      if (schedulers.get(doc) === scheduler) {
        schedulers.delete(doc);
      }
    } else if (queued.size === 0) {
      cancelFrame();
    }
  };

  const flush = (): void => {
    frameId = null;
    if (queued.size === 0) {
      cleanupIfIdle();
      return;
    }
    const view = getLiveView(doc);
    if (!view) {
      queued.clear();
      cleanupIfIdle();
      return;
    }

    const batch = Array.from(queued);
    queued.clear();
    running = true;
    try {
      const failedPrepare = new Set<InternalJob>();
      // Phase 1: prepare (e.g. clear previous measurement attributes before reading layout).
      for (let index = 0; index < batch.length; index++) {
        const job = batch[index]!;
        if (job.disposed || job.cancelled || !job.task.prepare) {
          continue;
        }
        try {
          job.task.prepare();
        } catch (error) {
          failedPrepare.add(job);
          reportErrorSafe(view, error);
        }
      }

      // Phase 2: measure all active jobs together in one layout pass.
      const writes: { readonly job: InternalJob; readonly write: () => void }[] = [];
      for (let index = 0; index < batch.length; index++) {
        const job = batch[index]!;
        if (job.disposed || job.cancelled || failedPrepare.has(job)) {
          continue;
        }
        try {
          const write = job.task.measure();
          if (typeof write === 'function') {
            writes.push({ job, write });
          }
        } catch (error) {
          reportErrorSafe(view, error);
        }
      }

      // Phase 3: apply writes after all reads complete.
      for (let index = 0; index < writes.length; index++) {
        const { job, write } = writes[index]!;
        if (job.disposed || job.cancelled) {
          continue;
        }
        try {
          write();
        } catch (error) {
          reportErrorSafe(view, error);
        }
      }
    } finally {
      running = false;
      if (jobs.size === 0) {
        cleanupIfIdle();
      } else if (queued.size > 0) {
        requestFrame();
      }
    }
  };

  const scheduler: DocumentScheduler = {
    jobs,
    queued,
    get frameId() {
      return frameId;
    },
    set frameId(value) {
      frameId = value;
    },
    get running() {
      return running;
    },
    set running(value) {
      running = value;
    },
    schedule(job) {
      if (job.disposed) {
        return;
      }
      job.cancelled = false;
      queued.add(job);
      requestFrame();
    },
    cancel(job) {
      job.cancelled = true;
      queued.delete(job);
      if (queued.size === 0) {
        cancelFrame();
      }
    },
    dispose(job) {
      if (job.disposed) {
        return;
      }
      job.disposed = true;
      job.cancelled = true;
      queued.delete(job);
      jobs.delete(job);
      cleanupIfIdle();
    },
  };

  return scheduler;
}

/** Register a 3-phase (`prepare -> measure -> write`) task batched per Document frame. */
export function createFrameJob(doc: Document, task: FrameTask): FrameJob {
  let scheduler = schedulers.get(doc);
  if (!scheduler) {
    scheduler = createScheduler(doc);
    schedulers.set(doc, scheduler);
  }
  const job: InternalJob = { task, cancelled: false, disposed: false };
  scheduler.jobs.add(job);
  const owned = scheduler;
  return {
    schedule: () => owned.schedule(job),
    cancel: () => owned.cancel(job),
    dispose: () => owned.dispose(job),
  };
}
