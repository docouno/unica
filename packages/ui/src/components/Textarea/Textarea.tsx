import {
  useCallback,
  useInsertionEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { ReactElement } from 'react';
import { cx, dataFlag } from '../../core/cx.js';
import { getDefaultView } from '../../core/dom.js';
import { subscribeFocusOrigin } from '../../core/focus-origin.js';
import { writeTextareaValue } from '../../core/forms/carriers.js';
import { subscribeNativeReset } from '../../core/forms/NativeResetWitness.js';
import { useFormValue } from '../../core/forms/useFormValue.js';
import { useNativeComposition } from '../../core/forms/useNativeComposition.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import type { StyleWithVars } from '../../core/mergeStyle.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import {
  FieldDangerGlyph,
  FieldInfoGlyph,
  FieldSuccessGlyph,
  FieldWarningGlyph,
} from '../../internal/glyphs/index.js';
import type { TextareaProps } from './types.js';
import './textarea.css';

const subscribeToSnapshot = (): (() => void) => () => {};
const getClientSnapshot = (): boolean => true;
const getServerSnapshot = (): boolean => false;

const statusGlyphs = {
  info: FieldInfoGlyph,
  success: FieldSuccessGlyph,
  warning: FieldWarningGlyph,
  danger: FieldDangerGlyph,
};

function normalizeRows(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 3;
}

function normalizeValue(value: string): string {
  return value.replace(/\r\n?/g, '\n');
}

function syncInvalid(editor: HTMLTextAreaElement, danger: boolean): void {
  if (danger && !editor.matches(':disabled')) {
    if (editor.getAttribute('aria-invalid') !== 'true') {
      editor.setAttribute('aria-invalid', 'true');
    }
  } else {
    editor.removeAttribute('aria-invalid');
  }
}

function watchFieldsets(editor: HTMLTextAreaElement): (() => void) | undefined {
  const view = getDefaultView(editor.ownerDocument);
  if (!view) {
    return;
  }

  const observer = new view.MutationObserver(() => syncInvalid(editor, true));
  observer.observe(editor, { attributes: true, attributeFilter: ['disabled'] });
  for (let parent = editor.parentElement; parent; parent = parent.parentElement) {
    if (parent.localName === 'fieldset') {
      // The first legend is exempt from the disabled fieldset's state.
      observer.observe(parent, {
        attributes: true,
        attributeFilter: ['disabled'],
        childList: true,
      });
    }
  }
  return () => observer.disconnect();
}

/** Native multiline plain-text field with theme-driven chrome and optional content sizing. */
export function Textarea({
  variant = 'default',
  size = 'm',
  status = 'neutral',
  width = 'full',
  resize = 'vertical',
  rows,
  autosize = false,
  minRows,
  maxRows,
  value,
  defaultValue,
  disabled,
  readOnly,
  wrap,
  hidden,
  className,
  style,
  ref,
  onChange,
  onCompositionStart,
  onCompositionEnd,
  onBlur,
  ...nativeProps
}: TextareaProps): ReactElement {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const initializedEditor = useRef<HTMLTextAreaElement>(null);
  const [initial] = useState(() => normalizeValue(value ?? defaultValue ?? ''));
  const controlled = value !== undefined;
  const nativeValue = controlled ? normalizeValue(value) : undefined;
  const composition = useNativeComposition(editorRef);
  const { isActive } = composition;
  const danger = status === 'danger';
  const committed = useRef({ value: nativeValue, danger });
  useInsertionEffect(() => {
    committed.current = { value: nativeValue, danger };
  }, [nativeValue, danger]);

  const hasClientSnapshot = useSyncExternalStore(
    subscribeToSnapshot,
    getClientSnapshot,
    getServerSnapshot,
  );
  const hydrating = !hasClientSnapshot && typeof document !== 'undefined';
  const lineCount = normalizeRows(autosize ? minRows : rows);
  const maximum =
    autosize && maxRows !== undefined ? Math.max(lineCount, normalizeRows(maxRows)) : undefined;
  const manual = !autosize && resize === 'vertical';
  const wasManual = useRef(manual);
  const editorStyle: StyleWithVars = {
    ...style,
    '--_textarea-rows': lineCount,
    '--_textarea-max-rows': maximum,
  };
  const Glyph =
    wrap?.toLowerCase() !== 'off' && status !== 'neutral' ? statusGlyphs[status] : undefined;

  const getControl = useCallback(() => (controlled ? editorRef.current : null), [controlled]);
  const authority = useFormValue({
    value: nativeValue,
    defaultValue: initial,
    readOnly,
    getControl,
    commitMode: 'deferred',
    shouldWrite: () => !isActive(),
    beforeReset: composition.cancel,
    write(next, { force }) {
      const editor = editorRef.current;
      if (editor) {
        writeTextareaValue(editor, next, { force, syncDefault: true });
      }
    },
  });

  const attach = useCallback(
    (editor: HTMLTextAreaElement | null): void => {
      editorRef.current = editor;
      if (!editor) {
        return;
      }

      const current = committed.current;
      syncInvalid(editor, current.danger);
      if (current.value !== undefined) {
        // A public ref can read or submit the field during this commit.
        if (!isActive()) {
          writeTextareaValue(editor, current.value, { syncDefault: true });
        }
      } else if (editor !== initializedEditor.current) {
        initializedEditor.current = editor;
        // Restoring the baseline through defaultValue leaves a pre-hydration draft intact.
        if (editor.defaultValue !== initial) {
          editor.defaultValue = initial;
        }
        // Synchronize React's input tracking, including a draft cleared to ''.
        writeTextareaValue(editor, editor.value, { force: true });
      }
    },
    [initial, isActive],
  );
  const mergedRef = useMemo(() => mergeRefs(attach, ref), [attach, ref]);

  useIsoLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    return subscribeFocusOrigin(editor, (origin) => {
      if (origin) {
        editor.setAttribute('data-unica-textarea-focus-origin', origin);
      } else {
        editor.removeAttribute('data-unica-textarea-focus-origin');
      }
    });
  }, []);

  const reset = useRef<ReturnType<typeof subscribeNativeReset> | null>(null);
  useIsoLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor || controlled) {
      return;
    }
    const subscription = subscribeNativeReset(editor, (result) => {
      if (result === 'reset') {
        writeTextareaValue(editor, editor.value, { force: true });
      }
    });
    reset.current = subscription;
    return () => {
      reset.current = null;
      subscription.unsubscribe();
    };
  }, [controlled]);

  useIsoLayoutEffect(() => {
    const editor = editorRef.current;
    if (editor && danger) {
      return watchFieldsets(editor);
    }
  }, [danger]);

  useIsoLayoutEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      reset.current?.syncTargets();
      syncInvalid(editor, danger);
      if (wasManual.current && !manual) {
        // Dragging writes an inline physical height. Restore the author's current height.
        const height = style?.height;
        editor.style.height = typeof height === 'number' ? `${height}px` : (height ?? '');
      }
      wasManual.current = manual;
    }
  });

  return (
    <span
      className="unica-textarea"
      data-unica-textarea-size={size}
      data-unica-textarea-status={status}
      data-unica-textarea-variant={variant}
      data-unica-textarea-width={width}
    >
      <textarea
        {...nativeProps}
        children={undefined}
        dangerouslySetInnerHTML={undefined}
        ref={mergedRef}
        className={cx(
          'unica-textarea-editor',
          'unica-scrollbar',
          'unica-scrollbar--compact',
          className,
        )}
        aria-invalid={danger && !disabled ? true : undefined}
        rows={lineCount}
        disabled={disabled}
        readOnly={readOnly}
        wrap={wrap}
        hidden={hidden}
        data-unica-textarea-autosize={dataFlag(autosize)}
        data-unica-textarea-fixed={dataFlag(!manual)}
        style={editorStyle}
        // Prevent React from replacing an uncontrolled draft entered before hydration.
        defaultValue={nativeValue ?? (hydrating ? '' : initial)}
        onCompositionStart={(event) => {
          if (controlled) {
            composition.start(event.currentTarget);
          }
          onCompositionStart?.(event);
        }}
        onCompositionEnd={(event) => {
          composition.finish(event.currentTarget, authority.reconcile);
          onCompositionEnd?.(event);
        }}
        onBlur={(event) => {
          composition.finish(event.currentTarget, authority.reconcile);
          onBlur?.(event);
        }}
        onChange={(event) => {
          const editor = event.currentTarget;
          const draft = editor.value;
          try {
            onChange?.(event);
          } finally {
            if (controlled) {
              authority.propose(draft, editor);
            }
          }
        }}
      />
      {Glyph && <Glyph className="unica-textarea-status" />}
    </span>
  );
}
