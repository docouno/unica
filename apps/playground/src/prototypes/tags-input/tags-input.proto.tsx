import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import { Tag } from '@docouno/unica';
import type { ControlSize, FieldStatus, FieldVariant } from '@docouno/unica';
import { useControlFocus } from '../control-focus.js';
import { FormField } from '../form-field/form-field.proto.js';
import './tags-input.css';

export interface TagsInputProps extends Omit<
  ComponentPropsWithRef<'textarea'>,
  'size' | 'value' | 'defaultValue' | 'onChange' | 'children'
> {
  readonly 'data-wb-subject'?: string | undefined;
  readonly values?: readonly string[];
  readonly initialValues?: readonly string[];
  readonly onValuesChange?: (values: readonly string[]) => void;
  readonly onDraftChange?: (draft: string) => void;
  readonly initialDraft?: string;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
  readonly size?: ControlSize;
  readonly variant?: FieldVariant;
  readonly status?: FieldStatus;
  readonly maxTags?: number;
  readonly validate?: (value: string) => string | undefined;
  /** Visual comparison only; never moves DOM focus. */
  readonly previewState?:
    | 'hover'
    | 'pointer-focus'
    | 'keyboard-focus'
    | 'add-hover'
    | 'add-active'
    | 'add-focus'
    | undefined;
  readonly initialError?: string;
}

// Local design preview. This is not the library's state, form, or ARIA engine.
export function TagsInput({
  values,
  initialValues = [],
  onValuesChange,
  onDraftChange,
  initialDraft = '',
  label,
  description,
  message,
  size = 'm',
  variant = 'default',
  status = 'neutral',
  maxTags: limit,
  validate,
  previewState,
  initialError = '',
  id,
  className = '',
  style,
  disabled = false,
  readOnly = false,
  hidden,
  required,
  placeholder = 'Add a tag',
  ref,
  'data-wb-subject': subject,
  ...props
}: TagsInputProps): ReactElement {
  const generatedId = useId();
  const editorId = id ?? generatedId;
  const shell = useControlFocus();
  const editor = useRef<HTMLTextAreaElement | null>(null);
  const editorRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      editor.current = node;
      if (typeof ref === 'function') {
        return ref(node);
      }
      if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );
  const removeButtons = useRef(new Map<string, HTMLButtonElement>());
  const composing = useRef(false);
  const [localValues, setLocalValues] = useState<readonly string[]>(initialValues);
  const [draft, setDraft] = useState(initialDraft);
  const [rejection, setRejection] = useState<string | { batchSize: number }>(initialError);
  const [announcement, setAnnouncement] = useState('');
  const [expandedDraft, setExpandedDraft] = useState(initialDraft.includes('\n'));
  const tags = values ?? localValues;
  const maxTags = limit === undefined ? undefined : Math.max(0, Math.floor(limit));
  const atLimit = maxTags !== undefined && tags.length >= maxTags;
  const capacityError = (batchSize: number): string => {
    if (maxTags === undefined || tags.length + batchSize <= maxTags) {
      return '';
    }
    const places = Math.max(0, maxTags - tags.length);
    return `Nothing added. This batch exceeds the ${maxTags}-tag limit. ${places} ${places === 1 ? 'place' : 'places'} available.`;
  };
  const error = typeof rejection === 'string' ? rejection : capacityError(rejection.batchSize);
  const effectiveStatus = disabled ? 'neutral' : error && !readOnly ? 'danger' : status;
  const feedback = disabled ? undefined : error && !readOnly ? error : message;
  const projection = readOnly ? tags.join('\n') : draft;
  const canAdd = Boolean(draft.trim()) && !atLimit && !disabled && !readOnly;
  const expanded = readOnly || expandedDraft || draft.includes('\n');

  const update = (next: readonly string[]): void => {
    setLocalValues(next);
    onValuesChange?.(next);
  };
  const updateDraft = (text: string): void => {
    setDraft(text);
    if (!text) {
      setExpandedDraft(false);
    } else if (text.includes('\n')) {
      setExpandedDraft(true);
    }
    onDraftChange?.(text);
  };
  const focusEditor = (): void => editor.current?.focus({ preventScroll: true });
  const accept = (text: string): void => {
    if (disabled || readOnly || composing.current) {
      return;
    }
    const candidates = text
      .split(/\r?\n/)
      .map((value, line) => ({ value: value.trim(), line: line + 1 }))
      .filter(({ value }) => value.length > 0);
    if (!candidates.length) {
      return;
    }
    let reason = '';
    const seen = new Set(tags);
    for (const candidate of candidates) {
      if (seen.has(candidate.value)) {
        reason = `Line ${candidate.line}: “${candidate.value}” is already included.`;
        break;
      }
      const invalid = validate?.(candidate.value);
      if (invalid) {
        reason = `Line ${candidate.line}: ${invalid}`;
        break;
      }
      seen.add(candidate.value);
    }
    const failure = reason ? `Nothing added. ${reason}` : capacityError(candidates.length);
    if (failure) {
      updateDraft(text);
      setRejection(reason ? failure : { batchSize: candidates.length });
      setAnnouncement(reason ? failure : '');
      return;
    }
    update([...tags, ...candidates.map(({ value }) => value)]);
    updateDraft('');
    setRejection('');
    setAnnouncement(`${candidates.length === 1 ? 'Tag' : `${candidates.length} tags`} added.`);
  };
  const remove = (tag: string, keyboard = false): void => {
    if (disabled || readOnly) {
      return;
    }
    const index = tags.indexOf(tag);
    const next = tags.filter((value) => value !== tag);
    update(next);
    setRejection('');
    setAnnouncement(`Removed ${tag}.`);
    if (keyboard && next.length) {
      requestAnimationFrame(() =>
        removeButtons.current.get(next[Math.min(index, next.length - 1)] ?? '')?.focus(),
      );
    } else {
      focusEditor();
    }
  };

  // Keep the preview height in step with content, width, and typography.
  useLayoutEffect(() => {
    const node = editor.current;
    if (!node) {
      return;
    }
    const tail = node.parentElement;
    const action = tail?.querySelector<HTMLButtonElement>('.tags-add-proto');
    let previousMetrics = '';
    const metrics = (): string => {
      const css = getComputedStyle(node);
      return [
        node.offsetWidth,
        node.clientWidth,
        css.fontFamily,
        css.fontSize,
        css.fontWeight,
        css.lineHeight,
        css.letterSpacing,
        css.wordSpacing,
        action ? getComputedStyle(action).inlineSize : '',
      ].join(':');
    };
    const resize = (): void => {
      if (action) {
        tail?.style.setProperty('--tags-action-width', getComputedStyle(action).inlineSize);
      }
      node.style.height = 'auto';
      node.style.height = `${node.scrollHeight}px`;
      tail?.style.setProperty('--tags-native-gutter', `${node.offsetWidth - node.clientWidth}px`);
      previousMetrics = metrics();
      const css = getComputedStyle(node);
      const singleRow = Math.max(
        Number.parseFloat(css.minHeight),
        Number.parseFloat(css.lineHeight) +
          Number.parseFloat(css.paddingTop) +
          Number.parseFloat(css.paddingBottom),
      );
      // Keep the expanded editor until acceptance or clearing; width changes
      // must not oscillate between a wrapped tail and a full-width single line.
      if (!readOnly && node.value && node.scrollHeight > singleRow + 1) {
        setExpandedDraft(true);
      }
    };
    resize();
    const observer = new ResizeObserver(() => {
      if (previousMetrics !== metrics()) {
        resize();
      }
    });
    observer.observe(node);
    if (tail) {
      observer.observe(tail);
    }
    if (action) {
      observer.observe(action);
    }
    // A font change can rewrap text without changing the measured box
    // or the action's minimum width. Inherited style changes need their own
    // invalidation rather than waiting for a ResizeObserver callback.
    const inheritedStyles = new MutationObserver(() => {
      if (previousMetrics !== metrics()) {
        resize();
      }
    });
    for (let ancestor: Element | null = node; ancestor; ancestor = ancestor.parentElement) {
      inheritedStyles.observe(ancestor, { attributes: true });
    }
    document.fonts?.addEventListener('loadingdone', resize);
    return () => {
      observer.disconnect();
      inheritedStyles.disconnect();
      document.fonts?.removeEventListener('loadingdone', resize);
    };
  }, [projection, size, readOnly, disabled, expanded]);

  // Demonstrates draft protection on a containing form without serializing tags.
  useEffect(() => {
    const node = editor.current;
    if (!node) {
      return;
    }
    node.setCustomValidity(
      !readOnly && !disabled && draft.trim() ? 'Add or clear the draft before continuing.' : '',
    );
    const invalid = (): void => {
      if (draft.trim()) {
        setRejection('Add or clear the draft before continuing.');
      }
    };
    node.addEventListener('invalid', invalid);
    return () => node.removeEventListener('invalid', invalid);
  }, [draft, readOnly, disabled]);

  const describedBy =
    [
      props['aria-describedby'],
      description ? `${editorId}-description` : '',
      feedback ? `${editorId}-message` : '',
      atLimit ? `${editorId}-limit` : '',
    ]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <div className={`tags-field-proto ${className}`} style={style} data-size={size} hidden={hidden}>
      <FormField
        label={label}
        htmlFor={editorId}
        descriptionId={description ? `${editorId}-description` : undefined}
        messageId={feedback ? `${editorId}-message` : undefined}
        required={required}
        description={typeof description === 'string' ? <bdi>{description}</bdi> : description}
        message={typeof feedback === 'string' && feedback ? <bdi>{feedback}</bdi> : feedback}
        status={effectiveStatus}
      >
        <span
          ref={shell}
          data-preview-focus-scope=""
          data-native-context-region=""
          data-wb-subject={subject}
          data-unica-tag-layout="field"
          className="tags-editor-proto"
          data-size={size}
          data-variant={variant}
          data-status={effectiveStatus}
          data-preview={previewState}
          data-disabled={disabled || undefined}
          data-readonly={readOnly || undefined}
          onClick={(event) => {
            if (
              !(event.target as Element).closest('button, textarea, [data-unica-tag-part="label"]')
            ) {
              focusEditor();
            }
          }}
        >
          {!readOnly &&
            tags.map((tag, index) => (
              <Tag
                key={tag}
                size={size}
                disabled={disabled}
                textValue={tag}
                removeLabel={`Remove ${tag}`}
                removeTabIndex={-1}
                removeRef={(node) => {
                  if (node) {
                    removeButtons.current.set(tag, node);
                  } else {
                    removeButtons.current.delete(tag);
                  }
                }}
                onRemove={() => remove(tag, shell.current?.dataset.focusOrigin === 'keyboard')}
                onKeyDown={(event) => {
                  if (event.repeat && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    return;
                  }
                  const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
                  const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
                  const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
                  if (event.key === 'Backspace' || event.key === 'Delete') {
                    event.preventDefault();
                    if (!event.repeat) {
                      remove(tag, true);
                    }
                  } else if (
                    event.key === backward ||
                    event.key === forward ||
                    event.key === 'Home' ||
                    event.key === 'End'
                  ) {
                    event.preventDefault();
                    const next =
                      event.key === 'Home'
                        ? 0
                        : event.key === 'End'
                          ? tags.length - 1
                          : index + (event.key === backward ? -1 : 1);
                    if (next >= tags.length) {
                      focusEditor();
                    } else {
                      removeButtons.current.get(tags[Math.max(0, next)] ?? '')?.focus();
                    }
                  } else if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    focusEditor();
                  } else if (event.key === 'Tab') {
                    // Tag navigation is an excursion from the one editor Tab entry.
                    focusEditor();
                  }
                }}
              >
                <bdi>{tag}</bdi>
              </Tag>
            ))}
          <span className="tags-draft-row-proto" data-expanded={expanded || undefined}>
            <textarea
              {...props}
              ref={editorRef}
              id={editorId}
              rows={1}
              className="tags-draft-proto unica-scrollbar unica-scrollbar--compact"
              value={projection}
              readOnly={readOnly}
              disabled={disabled}
              placeholder={readOnly ? 'No tags' : atLimit && !draft ? 'Limit reached' : placeholder}
              aria-label={label ? props['aria-label'] : (props['aria-label'] ?? 'Tags')}
              aria-required={required || undefined}
              aria-invalid={effectiveStatus === 'danger' || undefined}
              aria-describedby={describedBy}
              onChange={(event) => {
                updateDraft(event.currentTarget.value);
                setRejection('');
              }}
              onCompositionStart={(event) => {
                composing.current = true;
                props.onCompositionStart?.(event);
              }}
              onCompositionEnd={(event) => {
                composing.current = false;
                props.onCompositionEnd?.(event);
              }}
              onPaste={(event) => {
                props.onPaste?.(event);
                if (event.defaultPrevented || readOnly || disabled || composing.current) {
                  return;
                }
                const text = event.clipboardData.getData('text/plain');
                if (!text.includes('\n')) {
                  return;
                }
                event.preventDefault();
                const node = event.currentTarget;
                accept(draft.slice(0, node.selectionStart) + text + draft.slice(node.selectionEnd));
              }}
              onKeyDown={(event) => {
                props.onKeyDown?.(event);
                if (
                  event.defaultPrevented ||
                  event.nativeEvent.isComposing ||
                  composing.current ||
                  readOnly ||
                  disabled
                ) {
                  return;
                }
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (!event.repeat) {
                    accept(draft);
                  }
                } else if (
                  !event.ctrlKey &&
                  !event.metaKey &&
                  !event.altKey &&
                  !event.shiftKey &&
                  event.currentTarget.selectionStart === 0 &&
                  event.currentTarget.selectionEnd === 0 &&
                  tags.length &&
                  ((event.key === 'Backspace' && !draft) ||
                    event.key ===
                      (getComputedStyle(event.currentTarget).direction === 'rtl'
                        ? 'ArrowRight'
                        : 'ArrowLeft'))
                ) {
                  event.preventDefault();
                  if (!event.repeat) {
                    removeButtons.current.get(tags[tags.length - 1] ?? '')?.focus();
                  }
                }
              }}
            />
            {!readOnly && !disabled && (
              <button
                className="tags-add-proto"
                type="button"
                aria-label="Add tags"
                aria-controls={editorId}
                disabled={!canAdd}
                onClick={() => {
                  accept(draft);
                  focusEditor();
                }}
              >
                Add
              </button>
            )}
          </span>
        </span>
      </FormField>
      {maxTags !== undefined && (
        <div className="tags-capacity-proto" id={`${editorId}-limit`}>
          <span>
            {atLimit && !disabled && !readOnly && (
              <bdi>
                {maxTags === 0
                  ? 'No tags can be added.'
                  : tags.length === maxTags
                    ? 'Remove a tag to add another.'
                    : `Remove ${tags.length - maxTags + 1} tags to add another.`}
              </bdi>
            )}
          </span>
          <bdi dir="ltr">
            {tags.length} / {maxTags}
          </bdi>
        </div>
      )}
      {readOnly && draft && (
        <div className="tags-retained-proto">
          <span>Unadded draft</span>
          <div dir="auto">{draft}</div>
        </div>
      )}
      <span className="tags-announcement-proto" aria-live="polite" aria-atomic="true">
        {typeof rejection === 'string' ? announcement : error}
      </span>
    </div>
  );
}
