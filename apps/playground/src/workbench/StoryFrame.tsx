import { Fragment, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { defaultStoryControls } from './storyFrameState.js';
import type {
  StoryActionDefinition,
  StoryActionEvent,
  StoryContext,
  StoryControlDefinition,
  StoryControlSchema,
  StoryControlValue,
  StoryControlValues,
} from './types.js';
import './story-frame.css';

function normalizeChoice(choice: string | { readonly value: string; readonly label?: string }): {
  readonly value: string;
  readonly label: string;
} {
  return typeof choice === 'string'
    ? { value: choice, label: choice }
    : { value: choice.value, label: choice.label ?? choice.value };
}

function clampNumber(value: number, control: Extract<StoryControlDefinition, { kind: 'number' }>) {
  let next = value;
  if (control.min !== undefined) {
    next = Math.max(control.min, next);
  }
  if (control.max !== undefined) {
    next = Math.min(control.max, next);
  }
  return next;
}

function controlsSignature(controls: StoryControlSchema | undefined): string {
  if (!controls) {
    return '';
  }
  return JSON.stringify(
    Object.keys(controls)
      .sort()
      .map((key) => {
        const control = controls[key]!;
        if (control.kind === 'enum') {
          return [
            key,
            control.kind,
            control.default,
            control.choices.map((choice) => (typeof choice === 'string' ? choice : choice.value)),
          ];
        }
        if (control.kind === 'number') {
          return [key, control.kind, control.default, control.min, control.max, control.step];
        }
        return [key, control.kind, control.default];
      }),
  );
}

function useControlLookup(controls: StoryControlSchema | undefined) {
  const controlsRef = useRef(controls);
  useLayoutEffect(() => {
    controlsRef.current = controls;
  }, [controls]);
  return useCallback((key: string): StoryControlDefinition | undefined => {
    const schema = controlsRef.current;
    return schema && Object.hasOwn(schema, key) ? schema[key] : undefined;
  }, []);
}

export interface StoryFrameProps {
  readonly id?: string | undefined;
  readonly title: string;
  readonly meta?: string | undefined;
  readonly caption?: string | undefined;
  readonly headingLevel?: 'h2' | 'h3';
  readonly dataBlock?: string | undefined;
  readonly dataSlice?: string | undefined;
  readonly controls?: StoryControlSchema | undefined;
  readonly actions?: readonly StoryActionDefinition[] | undefined;
  readonly reset?: boolean | undefined;
  readonly externalRevision?: number;
  readonly raw?: boolean;
  readonly hideHeader?: boolean;
  readonly hideTitle?: boolean;
  readonly footer?: ReactNode;
  readonly children: (story: StoryContext) => ReactNode;
}

export function StoryFrame({
  id,
  title,
  meta,
  caption,
  headingLevel = 'h2',
  dataBlock,
  dataSlice,
  controls,
  actions,
  reset = false,
  externalRevision = 0,
  raw = false,
  hideHeader = false,
  hideTitle = false,
  footer,
  children,
}: StoryFrameProps): ReactElement {
  const [initialControls, setInitialControls] = useState<StoryControlValues>(() =>
    defaultStoryControls(controls),
  );
  const [controlValues, setControlValues] = useState<StoryControlValues>(() =>
    defaultStoryControls(controls),
  );
  const [numberDrafts, setNumberDrafts] = useState<Readonly<Record<string, string>>>({});
  const getControl = useControlLookup(controls);
  const [localRevision, setLocalRevision] = useState(0);
  const [lastAction, setLastAction] = useState<StoryActionEvent | null>(null);
  const [seenExternalRevision, setSeenExternalRevision] = useState(externalRevision);
  const currentControlsSig = controlsSignature(controls);
  const [seenControlsSig, setSeenControlsSig] = useState(currentControlsSig);
  const [listeners] = useState(() => new Set<(actionId: string) => void>());

  if (externalRevision !== seenExternalRevision || currentControlsSig !== seenControlsSig) {
    const nextDefaults = defaultStoryControls(controls);
    setSeenExternalRevision(externalRevision);
    setSeenControlsSig(currentControlsSig);
    setInitialControls(nextDefaults);
    setControlValues(nextDefaults);
    setNumberDrafts({});
    setLastAction(null);
  }

  const effectiveRevision = localRevision + externalRevision;

  const clearNumberDraft = useCallback((key: string): void => {
    setNumberDrafts((previous) => {
      if (!Object.hasOwn(previous, key)) {
        return previous;
      }
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }, []);

  const setControl = useCallback(
    (key: string, value: StoryControlValue): void => {
      const control = getControl(key);
      if (!control) {
        return;
      }
      let next = value;
      switch (control.kind) {
        case 'boolean':
          if (typeof value !== 'boolean') {
            return;
          }
          break;
        case 'enum':
          if (
            typeof value !== 'string' ||
            !control.choices.some((choice) => normalizeChoice(choice).value === value)
          ) {
            return;
          }
          break;
        case 'number':
          if (typeof value !== 'number' || !Number.isFinite(value)) {
            return;
          }
          next = clampNumber(value, control);
          clearNumberDraft(key);
          break;
      }
      setControlValues((previous) =>
        previous[key] === next ? previous : { ...previous, [key]: next },
      );
    },
    [clearNumberDraft, getControl],
  );

  const onAction = useCallback(
    (listener: (actionId: string) => void): (() => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    [listeners],
  );

  const dispatchAction = useCallback(
    (actionId: string): void => {
      setLastAction((previous) => ({ id: actionId, seq: (previous?.seq ?? 0) + 1 }));
      for (const listener of [...listeners]) {
        listener(actionId);
      }
    },
    [listeners],
  );

  const handleReset = useCallback((): void => {
    setControlValues(initialControls);
    setNumberDrafts({});
    setLastAction(null);
    setLocalRevision((previous) => previous + 1);
  }, [initialControls]);

  const story = useMemo<StoryContext>(
    () => ({
      controls: controlValues,
      setControl,
      revision: effectiveRevision,
      lastAction,
      onAction,
      reset: handleReset,
    }),
    [controlValues, effectiveRevision, handleReset, lastAction, onAction, setControl],
  );

  const controlEntries = controls ? Object.entries(controls) : [];
  const hasControls = controlEntries.length > 0;
  const hasActions = (actions?.length ?? 0) > 0 || reset;
  const hasToolbar = hasControls || hasActions;
  const Heading = headingLevel;

  if (hideHeader) {
    return <Fragment key={effectiveRevision}>{children(story)}</Fragment>;
  }

  return (
    <section id={id} className="wb-story-frame" data-wb-block={dataBlock} data-wb-slice={dataSlice}>
      <header className="wb-story-header" dir="auto">
        <div className="wb-story-header-row">
          {hideTitle ? (
            caption ? (
              <p className="wb-story-caption" dir="auto">
                {caption}
              </p>
            ) : (
              <span />
            )
          ) : (
            <div className="wb-story-title-group">
              <Heading className="wb-story-title">{title}</Heading>
              {meta && <span className="wb-story-badge">{meta}</span>}
            </div>
          )}
          {!raw && hasToolbar && (
            <div className="wb-story-toolbar" role="group" aria-label={`${title} controls`}>
              {controlEntries.map(([key, control]) => {
                const current = controlValues[key] ?? control.default;
                if (control.kind === 'boolean') {
                  return (
                    <label key={key} className="wb-story-control wb-story-toggle">
                      <span className="wb-checkbox">
                        <input
                          type="checkbox"
                          checked={current === true}
                          onChange={(event) => setControl(key, event.currentTarget.checked)}
                        />
                        <span className="wb-check-mark" aria-hidden="true" />
                      </span>
                      <span className="wb-story-control-label">{control.label}</span>
                    </label>
                  );
                }
                if (control.kind === 'enum') {
                  const choices = control.choices.map(normalizeChoice);
                  return (
                    <label key={key} className="wb-story-control">
                      <span className="wb-story-control-label">{control.label}</span>
                      <select
                        className="wb-field wb-story-select"
                        value={String(current)}
                        onChange={(event) => setControl(key, event.currentTarget.value)}
                      >
                        {choices.map((choice) => (
                          <option key={choice.value} value={choice.value}>
                            {choice.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }
                const draft = numberDrafts[key];
                const parsedDraft =
                  draft !== undefined && draft.trim() ? Number(draft) : Number.NaN;
                const outOfRange =
                  draft !== undefined &&
                  Number.isFinite(parsedDraft) &&
                  ((control.min !== undefined && parsedDraft < control.min) ||
                    (control.max !== undefined && parsedDraft > control.max));
                const invalid =
                  draft !== undefined &&
                  (!draft.trim() || !Number.isFinite(parsedDraft) || outOfRange);
                return (
                  <label key={key} className="wb-story-control">
                    <span className="wb-story-control-label">{control.label}</span>
                    <input
                      type="number"
                      className="wb-field wb-story-number"
                      min={control.min}
                      max={control.max}
                      step={control.step ?? 'any'}
                      aria-invalid={invalid || undefined}
                      value={draft ?? String(current)}
                      onChange={(event) => {
                        const text = event.currentTarget.value;
                        setNumberDrafts((previous) => ({ ...previous, [key]: text }));
                        if (text.trim() && Number.isFinite(Number(text))) {
                          const parsed = clampNumber(Number(text), control);
                          setControlValues((previous) => ({ ...previous, [key]: parsed }));
                        }
                      }}
                      onBlur={() => clearNumberDraft(key)}
                    />
                  </label>
                );
              })}
              {hasControls && hasActions && (
                <span className="wb-story-divider" aria-hidden="true" />
              )}
              {actions?.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="wb-action-btn wb-story-btn"
                  onClick={() => dispatchAction(action.id)}
                >
                  {action.label}
                </button>
              ))}
              {reset && (
                <button
                  type="button"
                  className="wb-action-btn wb-story-btn wb-story-reset"
                  onClick={handleReset}
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>
        {!hideTitle && caption && (
          <p className="wb-story-caption" dir="auto">
            {caption}
          </p>
        )}
      </header>
      <Fragment key={effectiveRevision}>{children(story)}</Fragment>
      {footer && <div className="wb-story-footer">{footer}</div>}
    </section>
  );
}
