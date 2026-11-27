import { useCallback, useInsertionEffect, useMemo, useRef, useState } from 'react';
import type { ClipboardEvent, DragEvent, KeyboardEvent, RefObject } from 'react';
import { warnOnce } from '../../core/devWarning.js';
import {
  containsSafe,
  getDeepActiveElement,
  getDefaultView,
  getRootNodeSafe,
  isInertElement,
  matchesSafe,
} from '../../core/dom.js';
import { observeFieldInput } from '../../core/forms/observeFieldInput.js';
import { useFormValue } from '../../core/forms/useFormValue.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { subscribeToModalChanges } from '../../core/overlay/runtime.js';
import { admitFiles, fileCandidates, fileRules, transferCandidates } from './admission.js';
import {
  createFileResetCompanion,
  fileResetOwner,
  syncFileResetOwner,
  writeFiles,
} from './native-files.js';
import type { FileIntakeMessages, FileIntakeResult, FileIntakeSource } from './types.js';

interface IntakeOptions {
  readonly value: readonly File[] | undefined;
  readonly onValueChange: ((value: readonly File[]) => void) | undefined;
  readonly onIntake: ((result: FileIntakeResult) => void) | undefined;
  readonly multiple: boolean;
  readonly accept: string | undefined;
  readonly maxSize: number | undefined;
  readonly maxFiles: number | undefined;
  readonly allowPaste: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly loading: boolean;
  readonly messages: FileIntakeMessages;
  readonly form: string | undefined;
  readonly focusAttribute: string;
}

interface Attempt {
  readonly id: number;
  readonly chosen: readonly File[];
  readonly rules: ReturnType<typeof fileRules>;
  readonly result: FileIntakeResult;
  readonly format: FileIntakeMessages['attempt'];
}

const noFiles: readonly File[] = [];
const syncMessage = 'Files could not be saved to this field. Clear the selection or try again.';
const failedWrite = /* @__PURE__ */ new Error('The file selection could not be projected.');

function shouldHandleFiles(data: DataTransfer | null): boolean {
  return !!data && Array.from(data.types).includes('Files');
}

export function suppressRepeatedActivation(event: KeyboardEvent<HTMLElement>): void {
  if (event.repeat && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
  }
}

interface IntakeNodes {
  readonly input: RefObject<HTMLInputElement | null>;
  readonly chooser: RefObject<HTMLInputElement | null>;
  readonly companionHost: RefObject<HTMLSpanElement | null>;
}

interface FileIntake {
  readonly chooserKey: number;
  readonly ready: boolean;
  readonly blocked: boolean;
  readonly disabled: boolean;
  readonly controlled: boolean;
  readonly dragging: boolean;
  readonly rules: ReturnType<typeof fileRules>;
  readonly files: readonly File[];
  readonly projectionError: boolean;
  readonly feedback: {
    readonly id: number;
    readonly text: string;
    readonly rejected: boolean;
  } | null;
  readonly open: () => void;
  readonly changeChooser: (input: HTMLInputElement) => void;
  readonly changeCarrier: (input: HTMLInputElement) => void;
  readonly clear: () => boolean;
  readonly paste: (event: ClipboardEvent<HTMLElement>) => void;
  readonly dragEnter: (event: DragEvent<HTMLDivElement>) => void;
  readonly dragOver: (event: DragEvent<HTMLDivElement>) => void;
  readonly dragLeave: (event: DragEvent<HTMLDivElement>) => void;
  readonly drop: (event: DragEvent<HTMLDivElement>) => void;
}

export function useFileIntake(
  options: IntakeOptions,
  { input, chooser, companionHost }: IntakeNodes,
): FileIntake {
  const { value, multiple, onValueChange, disabled, readOnly, loading, form, focusAttribute } =
    options;
  const companion = useRef<ReturnType<typeof createFileResetCompanion>>(null);
  const mounted = useRef(false);
  const readyRef = useRef(false);
  const opening = useRef<HTMLInputElement | null>(null);
  const stopOpenObservation = useRef<(() => void) | null>(null);
  const retired = useRef<HTMLInputElement | null>(null);
  const sequence = useRef(0);
  const published = useRef(0);
  const proposal = useRef<{ failed: boolean } | null>(null);
  const projectionFailed = useRef(false);
  const customValidityOwner = useRef<HTMLInputElement | null>(null);
  const dragDepth = useRef(0);
  const [ready, setReady] = useState(false);
  const [chooserKey, setChooserKey] = useState(0);
  const [fieldsetDisabled, setFieldsetDisabled] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [projectionError, setProjectionError] = useState(false);
  const [pending, setPending] = useState<Attempt | null>(null);
  const [feedback, setFeedback] = useState<{ id: number; text: string; rejected: boolean } | null>(
    null,
  );

  const rules = useMemo(
    () => fileRules(options.accept, options.maxSize, options.maxFiles, multiple),
    [options.accept, options.maxSize, options.maxFiles, multiple],
  );
  const controlledValue = useMemo(() => {
    if (value === undefined) {
      return undefined;
    }
    if (!multiple && value.length > 1) {
      warnOnce('file-intake-single', 'A single file field uses only the first file in value.');
    }
    return multiple ? Array.from(value) : value.slice(0, 1);
  }, [multiple, value]);

  const stopDrag = useCallback((): void => {
    dragDepth.current = 0;
    setDragging(false);
  }, []);
  const finishOpening = useCallback((): void => {
    opening.current = null;
    stopOpenObservation.current?.();
    stopOpenObservation.current = null;
  }, []);
  const invalidateChooser = useCallback((): void => {
    const old = opening.current;
    if (old) {
      finishOpening();
      retired.current = old;
      setChooserKey((key) => key + 1);
    }
  }, [finishOpening]);

  const resetFeedback = useCallback((): void => {
    sequence.current += 1;
    invalidateChooser();
    stopDrag();
    setPending(null);
    setFeedback(null);
  }, [invalidateChooser, stopDrag]);

  function project(files: readonly File[]): boolean {
    const node = input.current;
    if (!node) {
      return false;
    }
    const synced = writeFiles(node, files);
    if (!synced) {
      node.setCustomValidity(syncMessage);
      customValidityOwner.current = node;
    } else if (customValidityOwner.current === node) {
      if (!node.willValidate || node.validationMessage === syncMessage) {
        node.setCustomValidity('');
      }
      customValidityOwner.current = null;
    }
    projectionFailed.current = !synced;
    setProjectionError(!synced);
    return synced;
  }

  const state = useFormValue({
    value: controlledValue,
    defaultValue: noFiles,
    normalize: (files) => (!multiple && files.length > 1 ? files.slice(0, 1) : files),
    onChange: onValueChange,
    getControl: () => input.current,
    write: (next, { controlled }) => {
      const attempt = proposal.current;
      if (!project(next) && attempt) {
        if (!controlled) {
          // Abort a local commit before the state authority adopts an unwritable value.
          throw failedWrite;
        }
        // A parent can commit via flushSync within onValueChange. Keep its layout
        // effect alive and publish the native validity error on the mounted field.
        attempt.failed = true;
      }
    },
    onReset: () => {
      const witness = companion.current;
      // The companion already handled an aligned controlled reset synchronously.
      if (!witness || fileResetOwner(witness) !== input.current?.form) {
        resetFeedback();
      }
    },
    readOnly: disabled || readOnly || loading,
    writeDeps: [multiple],
  });
  const { read, settleReset, reconcile } = state;
  const controlled = state.controlled;
  const liveState = useRef({ controlled, options, project, rules });
  useInsertionEffect(() => {
    liveState.current = { controlled, options, project, rules };
  });

  useIsoLayoutEffect(() => {
    const node = input.current;
    if (!node) {
      return;
    }
    mounted.current = true;
    readyRef.current = true;
    setReady(true);
    return () => {
      mounted.current = false;
      readyRef.current = false;
      finishOpening();
    };
  }, [finishOpening]);

  useIsoLayoutEffect(() => {
    const node = input.current;
    const host = companionHost.current;
    if (!node || !host || !controlled) {
      return;
    }
    const witness = createFileResetCompanion(node, () => {
      if (
        mounted.current &&
        liveState.current.controlled &&
        input.current === node &&
        companion.current &&
        fileResetOwner(companion.current) === node.form
      ) {
        liveState.current.project(read());
        resetFeedback();
      }
    });
    if (witness) {
      companion.current = witness;
      host.append(witness);
    }
    return () => {
      companion.current = null;
      witness?.remove();
    };
  }, [controlled, read, resetFeedback]);

  useIsoLayoutEffect(() => {
    if (companion.current && input.current) {
      syncFileResetOwner(companion.current, input.current);
    }
  }, [form, controlled]);

  useIsoLayoutEffect(() => {
    const node = input.current;
    if (!node) {
      return;
    }
    let owner = node.form;
    return observeFieldInput(node, {
      focusAttribute,
      watchAvailability: true,
      onChange: () => {
        const nativeDisabled = matchesSafe(node, ':disabled');
        const nativeInert = isInertElement(node);
        setFieldsetDisabled(nativeDisabled && !node.disabled);
        if (nativeDisabled || nativeInert) {
          invalidateChooser();
          stopDrag();
        }
        const witness = companion.current;
        if (node.form !== owner || (witness && fileResetOwner(witness) !== node.form)) {
          settleReset();
          owner = node.form;
          if (witness) {
            syncFileResetOwner(witness, node);
          }
          reconcile();
        }
      },
    });
  }, [focusAttribute, invalidateChooser, reconcile, settleReset, stopDrag]);

  const blocked = !ready || disabled || fieldsetDisabled || readOnly || loading;
  useIsoLayoutEffect(() => {
    if (blocked) {
      invalidateChooser();
      stopDrag();
    }
  }, [blocked, invalidateChooser, stopDrag]);

  useIsoLayoutEffect(() => {
    const node = chooser.current;
    if (retired.current !== node) {
      retired.current = null;
    }
    const cancel = (): void => {
      if (opening.current === node) {
        finishOpening();
      }
    };
    node?.addEventListener('cancel', cancel);
    return () => node?.removeEventListener('cancel', cancel);
  }, [chooserKey, ready, finishOpening]);

  useIsoLayoutEffect(() => {
    if (!pending || pending.id !== sequence.current || published.current === pending.id) {
      return;
    }
    published.current = pending.id;
    const committed = read();
    const count = projectionFailed.current
      ? 0
      : pending.result.accepted.filter(
          (file) => !pending.chosen.includes(file) && committed.includes(file),
        ).length;
    const { accept, maxSize, maxFiles } = pending.rules;
    const limits = {
      accept,
      ...(maxSize !== undefined && { maxSize }),
      ...(maxFiles !== undefined && { maxFiles }),
    };
    const text = pending.format(pending.result, limits, count);
    if (pending.id === sequence.current) {
      setFeedback({ id: pending.id, text, rejected: pending.result.rejected.length > 0 });
      setPending(null);
    }
  }, [pending, read]);

  function available(): boolean {
    const { disabled, readOnly, loading } = liveState.current.options;
    const node = input.current;
    return (
      !!node &&
      readyRef.current &&
      !disabled &&
      !readOnly &&
      !loading &&
      !matchesSafe(node, ':disabled') &&
      !isInertElement(node)
    );
  }

  function propose(next: readonly File[], chosen: readonly File[]): boolean {
    const previous = proposal.current;
    const attempt = { failed: false };
    proposal.current = attempt;
    try {
      state.propose(Array.from(next));
      return !attempt.failed;
    } catch (error) {
      if (error !== failedWrite) {
        throw error;
      }
      project(chosen);
      return false;
    } finally {
      proposal.current = previous;
    }
  }

  function receive(source: FileIntakeSource, candidates: ReturnType<typeof fileCandidates>): void {
    if (!available()) {
      return;
    }
    const { rules, options } = liveState.current;
    const chosen = read();
    const admission = admitFiles(source, candidates, chosen, rules);
    if (!admission) {
      return;
    }
    const id = ++sequence.current;
    const result = admission.result;
    if (admission.next !== chosen && !propose(admission.next, chosen)) {
      return;
    }
    options.onIntake?.(result);
    settleReset();
    if (mounted.current && id === sequence.current) {
      setPending({ id, chosen, rules, result, format: options.messages.attempt });
    }
  }

  function open(): void {
    settleReset();
    const node = chooser.current;
    if (
      !node ||
      node === retired.current ||
      opening.current ||
      !available() ||
      matchesSafe(node, ':disabled')
    ) {
      return;
    }
    const doc = node.ownerDocument;
    const view = getDefaultView(doc);
    const activation = view?.navigator.userActivation;
    if (activation?.isActive === false) {
      return;
    }
    opening.current = node;
    if (view) {
      const recheck = (): void => {
        if (!available()) {
          invalidateChooser();
        }
      };
      const observer = new view.MutationObserver(recheck);
      const options = { attributes: true, attributeFilter: ['open'], subtree: true };
      observer.observe(doc, options);
      const root = getRootNodeSafe(node);
      if (root !== doc) {
        observer.observe(root, options);
      }
      const unsubscribe = subscribeToModalChanges(doc, recheck);
      stopOpenObservation.current = () => {
        observer.disconnect();
        unsubscribe();
      };
    }
    if (activation || typeof node.showPicker !== 'function') {
      node.click();
    } else {
      // A picker can be denied without a change or cancel event.
      try {
        node.showPicker();
      } catch {
        finishOpening();
      }
    }
  }

  function changeChooser(node: HTMLInputElement): void {
    const candidates = fileCandidates(node.files ?? []);
    node.value = '';
    settleReset();
    if (opening.current !== node) {
      return;
    }
    finishOpening();
    receive('picker', candidates);
  }

  function changeCarrier(node: HTMLInputElement): void {
    const candidates = fileCandidates(node.files ?? []);
    settleReset(node);
    // Programmatic native changes can reach the carrier directly. Restore the
    // committed projection before admission or any callback reads FormData.
    if (project(read())) {
      receive('picker', candidates);
    }
  }

  function clear(): boolean {
    settleReset();
    const chosen = read();
    if (!available() || chosen.length === 0) {
      return false;
    }
    resetFeedback();
    return propose(noFiles, chosen);
  }

  function paste(event: ClipboardEvent<HTMLElement>): void {
    const target = event.currentTarget;
    if (
      event.defaultPrevented ||
      !liveState.current.options.allowPaste ||
      event.target !== target ||
      getDeepActiveElement(target.ownerDocument, getRootNodeSafe(target)) !== target
    ) {
      return;
    }
    settleReset();
    if (available() && event.clipboardData) {
      const candidates = transferCandidates(event.clipboardData);
      if (candidates.length > 0) {
        event.preventDefault();
        receive('paste', candidates);
      }
    }
  }

  function dragOver(event: DragEvent<HTMLDivElement>): void {
    if (!shouldHandleFiles(event.dataTransfer)) {
      return;
    }
    const allowed = !event.defaultPrevented && available();
    event.preventDefault();
    event.dataTransfer.dropEffect = allowed ? 'copy' : 'none';
    setDragging(allowed);
  }

  function dragEnter(event: DragEvent<HTMLDivElement>): void {
    if (shouldHandleFiles(event.dataTransfer)) {
      dragDepth.current += 1;
      dragOver(event);
    }
  }

  function dragLeave(event: DragEvent<HTMLDivElement>): void {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    const next = event.relatedTarget;
    if (containsSafe(event.currentTarget, next)) {
      return;
    }
    if (next || dragDepth.current === 0 || event.target === event.currentTarget) {
      stopDrag();
    }
  }

  function drop(event: DragEvent<HTMLDivElement>): void {
    stopDrag();
    if (
      !event.dataTransfer ||
      (!shouldHandleFiles(event.dataTransfer) && !event.dataTransfer.files.length)
    ) {
      return;
    }
    const allowed = !event.defaultPrevented;
    event.preventDefault();
    settleReset();
    if (allowed && available()) {
      receive('drop', transferCandidates(event.dataTransfer));
    }
  }

  return {
    chooserKey,
    ready,
    blocked,
    disabled: disabled || fieldsetDisabled,
    controlled,
    dragging: dragging && !blocked,
    rules,
    files: state.value,
    projectionError,
    feedback,
    open,
    changeChooser,
    changeCarrier,
    clear,
    paste,
    dragEnter,
    dragOver,
    dragLeave,
    drop,
  };
}
