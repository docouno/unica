import { Children, Fragment, isValidElement, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { cx } from '../../core/cx.js';
import { warnOnce } from '../../core/devWarning.js';
import { matchesSafe } from '../../core/dom.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { nonBlank, pickConsumerDataAttributes } from '../../core/passiveRoot.js';
import { useControllableState } from '../../core/useControllableState.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { CaretGlyph } from '../../internal/glyphs/index.js';
import { stepperMessages } from './messages.js';
import { preventRepeatedActivation, StepperItem, StepperStep } from './StepperStep.js';
import { StepperSummary } from './StepperSummary.js';
import type { StepperMessages, StepperProps, StepperStepProps } from './types.js';
import { StepperFocusBoundary, useStepperFocus } from './useStepperFocus.js';
import './stepper.css';

function normalizeSteps(children: ReactNode): StepperStepProps[] {
  const steps = new Map<string, StepperStepProps>();
  function collect(nodes: ReactNode): void {
    Children.forEach(nodes, (child) => {
      if (child === null) {
        return;
      }
      if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
        collect(child.props.children);
        return;
      }
      if (!isValidElement<StepperStepProps>(child) || child.type !== StepperStep) {
        warnOnce('stepper-child', 'Stepper accepts StepperStep children, arrays, and fragments.');
        return;
      }
      const step = child.props;
      if (
        typeof step.value !== 'string' ||
        typeof step.label !== 'string' ||
        !nonBlank(step.value) ||
        !nonBlank(step.label)
      ) {
        warnOnce('stepper-step-text', 'StepperStep requires a nonempty value and label.');
        return;
      }
      if (steps.has(step.value)) {
        warnOnce('stepper-step-duplicate', 'StepperStep values must be unique.');
        return;
      }
      steps.set(step.value, step);
    });
  }
  collect(children);
  return [...steps.values()];
}

function isComplete(step: StepperStepProps): boolean {
  return step.completed === true && step.status !== 'danger';
}

function resolveMessages(messages: Partial<StepperMessages> | undefined): StepperMessages {
  return {
    allSteps: messages?.allSteps ?? stepperMessages.allSteps,
    allComplete: messages?.allComplete ?? stepperMessages.allComplete,
    markerNumber: messages?.markerNumber ?? stepperMessages.markerNumber,
    position: messages?.position ?? stepperMessages.position,
    completedCount: messages?.completedCount ?? stepperMessages.completedCount,
    stepLabel: messages?.stepLabel ?? stepperMessages.stepLabel,
    needsAttention: messages?.needsAttention ?? stepperMessages.needsAttention,
    checkStep: messages?.checkStep ?? stepperMessages.checkStep,
  };
}

/** Presents ordered process stages with optional return to completed or problematic steps. */
export function Stepper({
  children,
  value,
  defaultValue = null,
  onValueChange,
  allowReturn = false,
  size = 'm',
  layout = 'responsive',
  messages: suppliedMessages,
  id,
  className,
  style,
  dir,
  lang,
  ref,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
  ...data
}: StepperProps): ReactElement | null {
  const listId = useId();
  const steps = useMemo(() => normalizeSteps(children), [children]);
  const [currentValue, requestValue] = useControllableState<string | null>({
    value,
    defaultValue,
    onChange: (next) => {
      if (next !== null) {
        onValueChange?.(next);
      }
    },
  });
  const interactive = allowReturn && (value === undefined || onValueChange !== undefined);
  const [expanded, setExpanded] = useState(false);
  const showMap = interactive && expanded;
  const root = useRef<HTMLDivElement>(null);
  const compact = useRef<HTMLDivElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const focus = useStepperFocus({ root, compact, summary, list }, steps.length > 0, setExpanded);
  const rootRef = useMemo(() => mergeRefs(root, ref), [ref]);

  useIsoLayoutEffect(() => {
    if (!interactive && expanded) {
      setExpanded(false);
    }
  }, [interactive, expanded]);

  if (!steps.length) {
    return null;
  }

  const name = nonBlank(label);
  const nameIds = nonBlank(labelledBy);
  if (!name && !nameIds) {
    warnOnce('stepper-name', 'Stepper requires an aria-label or aria-labelledby.');
  }
  if (allowReturn && !interactive) {
    warnOnce(
      'stepper-on-value-change',
      'A controlled Stepper with allowReturn requires onValueChange.',
    );
  }

  const messages = resolveMessages(suppliedMessages);
  const activeIndex = steps.findIndex((step) => step.value === currentValue);
  const mapStyle: CSSProperties & { readonly '--_stepper-step-count': number } = {
    ...style,
    '--_stepper-step-count': steps.length,
  };

  const map = (
    <div
      {...pickConsumerDataAttributes(data, 'data-unica-stepper-')}
      id={id}
      className={cx('unica-stepper', className)}
      style={mapStyle}
      dir={dir}
      lang={lang}
      ref={rootRef}
      onFocusCapture={focus.onFocus}
      onBlurCapture={focus.onBlur}
      role="group"
      aria-label={name}
      aria-labelledby={nameIds}
      aria-describedby={describedBy}
      data-unica-stepper-size={size}
    >
      <div className="unica-stepper-view" data-unica-stepper-layout={layout}>
        <div
          className="unica-stepper-compact"
          ref={compact}
          data-unica-stepper-expanded={showMap ? '' : undefined}
        >
          <div className="unica-stepper-segments" aria-hidden="true">
            {steps.map((step, index) => (
              <span
                key={step.value}
                data-unica-stepper-current={index === activeIndex ? '' : undefined}
                data-unica-stepper-state={
                  step.status === 'danger' ? 'danger' : isComplete(step) ? 'completed' : undefined
                }
              />
            ))}
          </div>
          <div className="unica-stepper-summary">
            <StepperSummary
              steps={steps}
              activeIndex={activeIndex}
              completedCount={steps.filter(isComplete).length}
              messages={messages}
              expanded={showMap}
              ref={summary}
            />
            {interactive && (
              <button
                type="button"
                className="unica-stepper-disclosure"
                aria-controls={listId}
                aria-expanded={showMap}
                onKeyDown={preventRepeatedActivation}
                onClick={(event) => {
                  if (matchesSafe(event.currentTarget, ':disabled')) {
                    return;
                  }
                  focus.focusDisclosureForToggle(event.currentTarget);
                  setExpanded(!showMap);
                }}
              >
                <bdi>{messages.allSteps}</bdi>
                <CaretGlyph direction="down" weight="bold" />
              </button>
            )}
          </div>
        </div>
        {/* The explicit role retains list semantics in Safari after the visual list reset. */}
        <ol className="unica-stepper-list" role="list" id={listId} ref={list} tabIndex={-1}>
          {steps.map((step, index) => {
            const current = index === activeIndex;
            const complete = isComplete(step);
            const next = steps[index + 1];
            const traversed = complete && (index + 1 === activeIndex || (next && isComplete(next)));
            const actionable = interactive && !current && (complete || step.status === 'danger');
            return (
              <StepperItem
                key={step.value}
                step={step}
                index={index + 1}
                current={current}
                complete={complete}
                messages={messages}
                connector={next ? (traversed ? 'traversed' : 'pending') : undefined}
                onActivate={
                  actionable
                    ? (event) => {
                        if (!matchesSafe(event.currentTarget, ':disabled')) {
                          focus.recordActivation(event);
                          requestValue(step.value);
                        }
                      }
                    : undefined
                }
              />
            );
          })}
        </ol>
      </div>
    </div>
  );

  return (
    <StepperFocusBoundary
      captureBlurredOwner={focus.captureBlurredOwner}
      releaseBlurredOwner={focus.releaseBlurredOwner}
    >
      {map}
    </StepperFocusBoundary>
  );
}
