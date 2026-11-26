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
import { subscribeFocusOrigin } from '../../core/focus-origin.js';
import { writeTextareaValue } from '../../core/forms/carriers.js';
import { fieldControlId, fieldDescription, useFormField } from '../../core/forms/field-context.js';
import { subscribeNativeReset } from '../../core/forms/NativeResetWitness.js';
import { observeControlPath } from '../../core/forms/observeControlPath.js';
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

/** Native multiline plain-text field with theme-driven chrome and optional content sizing. */
export function Textarea({
  variant = 'default',
  size: sizeProp,
  status: statusProp,
  width = 'full',
  resize = 'vertical',
  rows,
  autosize = false,
  minRows,
  maxRows,
  value,
  defaultValue,
  disabled: disabledProp,
  readOnly: readOnlyProp,
  required: requiredProp,
  id,
  'aria-describedby': describedBy,
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
  const scope = useFormField();
  const field = scope?.target === 'control' ? scope : null;
  const size = sizeProp ?? field?.size ?? 'm';
  const status = statusProp ?? field?.status ?? 'neutral';
  const disabled = disabledProp ?? field?.disabled;
  const readOnly = readOnlyProp ?? field?.readOnly;
  const required = requiredProp ?? field?.required;
  const [nativeDisabled, setNativeDisabled] = useState(false);
  const unavailable = Boolean(disabled || nativeDisabled);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const initializedEditor = useRef<HTMLTextAreaElement>(null);
  const [initial] = useState(() => normalizeValue(value ?? defaultValue ?? ''));
  const controlled = value !== undefined;
  const nativeValue = controlled ? normalizeValue(value) : undefined;
  const composition = useNativeComposition(editorRef);
  const { isActive } = composition;
  const committed = useRef(nativeValue);
  useInsertionEffect(() => {
    committed.current = nativeValue;
  }, [nativeValue]);

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
    !unavailable && wrap?.toLowerCase() !== 'off' && status !== 'neutral'
      ? statusGlyphs[status]
      : undefined;

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
      if (current !== undefined) {
        // A public ref can read or submit the field during this commit.
        if (!isActive()) {
          writeTextareaValue(editor, current, { syncDefault: true });
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
    if (editor) {
      return observeControlPath(editor, () => setNativeDisabled(editor.matches(':disabled')));
    }
  }, []);

  useIsoLayoutEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      reset.current?.syncTargets();
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
      data-unica-form-field-glyph={Glyph && field?.status === status ? field.controlId : undefined}
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
        id={fieldControlId(field, id)}
        aria-describedby={fieldDescription(field, describedBy, unavailable)}
        aria-invalid={status === 'danger' && !unavailable ? true : undefined}
        required={required}
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
