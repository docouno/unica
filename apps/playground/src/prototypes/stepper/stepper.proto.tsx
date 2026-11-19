import { createContext, useContext, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement, Ref } from 'react';
import { CaretDownIcon, CheckIcon, WarningCircleIcon } from '@phosphor-icons/react';
import './stepper.css';

export interface StepperStepProps {
  readonly value: string;
  readonly label: string;
  readonly description?: string | undefined;
  readonly completed?: boolean;
  readonly invalid?: boolean;
  readonly issue?: string | undefined;
  readonly preview?: 'hover' | 'pressed' | 'focus';
}

export interface StepperProps {
  readonly label: string;
  readonly value: string | null;
  readonly children: ReactElement<StepperStepProps> | readonly ReactElement<StepperStepProps>[];
  readonly size?: 's' | 'm' | 'l';
  readonly layout?: 'responsive' | 'horizontal' | 'vertical' | 'compact';
  readonly onValueChange?: (value: string) => void;
}

interface StepPresentation {
  readonly index: number;
  readonly current: boolean;
  readonly connector: boolean;
  readonly traversed: boolean;
  readonly onActivate: ((keyboard: boolean) => void) | undefined;
  readonly currentRef: Ref<HTMLLIElement> | undefined;
}

const StepContext = createContext<StepPresentation | null>(null);

export function Stepper({
  label,
  value,
  children,
  size = 'm',
  layout = 'responsive',
  onValueChange,
}: StepperProps): ReactElement | null {
  const listId = useId();
  const currentEntry = useRef<HTMLLIElement>(null);
  const keyboardRequest = useRef<{ readonly value: string } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const showMap = Boolean(onValueChange && expanded);
  const entries = [children].flat();
  const steps = entries.map((entry) => entry.props);
  const activeIndex = steps.findIndex((step) => step.value === value);
  const active = steps[activeIndex];
  const completedCount = steps.filter((step) => step.completed && !step.invalid).length;
  const otherIssues = steps.filter((step) => step.invalid && step.value !== value);

  useLayoutEffect(() => {
    if (keyboardRequest.current?.value === value) {
      keyboardRequest.current = null;
      currentEntry.current?.focus({ preventScroll: true });
    }
  }, [value]);

  if (steps.length === 0) {
    return null;
  }

  const summary = active
    ? active.label
    : completedCount === steps.length
      ? 'All steps complete'
      : `${completedCount} of ${steps.length} steps complete`;

  function requestStep(nextValue: string, keyboard: boolean): void {
    if (keyboard) {
      const request = { value: nextValue };
      keyboardRequest.current = request;
      // The preview accepts synchronously. A declined request expires after the input task.
      setTimeout(() => {
        if (keyboardRequest.current === request) {
          keyboardRequest.current = null;
        }
      }, 0);
    } else {
      keyboardRequest.current = null;
    }
    onValueChange?.(nextValue);
  }

  return (
    <div className="stepper-proto" role="group" aria-label={label} data-size={size}>
      <div className="stepper-view-proto" data-layout={layout}>
        <div className="stepper-compact-proto" data-expanded={showMap || undefined}>
          <div className="stepper-segments-proto" aria-hidden="true">
            {steps.map((step) => (
              <span
                key={step.value}
                data-current={step.value === value || undefined}
                data-status={step.invalid ? 'invalid' : step.completed ? 'completed' : undefined}
              />
            ))}
          </div>
          <div className="stepper-summary-proto">
            <div className="stepper-summary-copy-proto" aria-hidden={showMap || undefined}>
              {active && (
                <span className="stepper-position-proto">
                  <bdi>
                    Step {activeIndex + 1} of {steps.length}
                  </bdi>
                </span>
              )}
              <span
                className="stepper-title-proto"
                aria-current={active && !showMap ? 'step' : undefined}
              >
                <bdi>{summary}</bdi>
              </span>
              {!showMap && (
                <>
                  {active?.description && (
                    <span className="stepper-description-proto">
                      <bdi>{active.description}</bdi>
                    </span>
                  )}
                  {active?.invalid && <Issue message={active.issue} />}
                  {otherIssues.map((step) => (
                    <Issue key={step.value} message={`Check ${step.label}`} other />
                  ))}
                </>
              )}
            </div>
            {onValueChange && (
              <button
                type="button"
                className="stepper-disclosure-proto"
                aria-controls={listId}
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
              >
                All steps
                <CaretDownIcon size="1em" weight="bold" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <ol className="stepper-list-proto" role="list" id={listId}>
          {entries.map((entry, index) => {
            const step = entry.props;
            const current = step.value === value;
            const next = steps[index + 1];
            const isComplete = step.completed && !step.invalid;
            const actionable = onValueChange && !current && (isComplete || step.invalid);
            return (
              <StepContext
                key={step.value}
                value={{
                  index,
                  current,
                  connector: Boolean(next),
                  traversed: Boolean(
                    isComplete &&
                    next &&
                    (next.value === value || (next.completed && !next.invalid)),
                  ),
                  onActivate: actionable
                    ? (keyboard) => requestStep(step.value, keyboard)
                    : undefined,
                  currentRef: current ? currentEntry : undefined,
                }}
              >
                {entry}
              </StepContext>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export function StepperStep({
  label,
  description,
  completed,
  invalid,
  issue,
  preview,
}: StepperStepProps): ReactElement | null {
  const presentation = useContext(StepContext);
  if (!presentation) {
    return null;
  }

  const { index, current, connector, traversed, onActivate, currentRef } = presentation;
  const isComplete = completed && !invalid;
  const content = (
    <>
      <span className="stepper-marker-proto" aria-hidden="true">
        {invalid ? (
          <WarningCircleIcon weight="bold" />
        ) : isComplete && !current ? (
          <CheckIcon weight="bold" />
        ) : (
          index + 1
        )}
      </span>
      <span className="stepper-copy-proto">
        <span className="stepper-title-proto">
          <span className="stepper-sr-proto">Step {index + 1}: </span>
          <bdi className="stepper-title-text-proto">{label}</bdi>
          {isComplete && <span className="stepper-sr-proto">, completed</span>}
        </span>
        {description && (
          <span className="stepper-description-proto">
            <bdi>{description}</bdi>
          </span>
        )}
        {invalid && (
          <span className="stepper-issue-proto">
            {issue && <span className="stepper-sr-proto">Needs attention: </span>}
            <bdi>{issue || 'Needs attention'}</bdi>
          </span>
        )}
      </span>
    </>
  );

  return (
    <li
      className="stepper-step-proto"
      aria-current={current ? 'step' : undefined}
      ref={currentRef}
      tabIndex={current ? -1 : undefined}
      data-current={current || undefined}
      data-status={invalid ? 'invalid' : isComplete ? 'completed' : undefined}
    >
      {connector && (
        <span
          className="stepper-connector-proto"
          data-traversed={traversed || undefined}
          aria-hidden="true"
        />
      )}
      {onActivate ? (
        <button
          type="button"
          className="stepper-entry-proto"
          data-preview={preview}
          onClick={(event) => onActivate(event.detail === 0)}
        >
          {content}
        </button>
      ) : (
        <div className="stepper-entry-proto">{content}</div>
      )}
    </li>
  );
}

function Issue({
  message,
  other,
}: {
  readonly message?: string | undefined;
  readonly other?: boolean;
}): ReactElement {
  return (
    <span
      className="stepper-issue-proto stepper-summary-issue-proto"
      data-other={other || undefined}
    >
      <WarningCircleIcon size="1em" weight="bold" aria-hidden="true" />
      <span>
        {message && <span className="stepper-sr-proto">Needs attention: </span>}
        <bdi>{message || 'Needs attention'}</bdi>
      </span>
    </span>
  );
}
