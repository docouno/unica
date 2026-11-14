import type { ComponentPropsWithRef, ReactElement } from 'react';
import { CheckIcon, WarningIcon } from '@phosphor-icons/react';
import './stepper.css';

export interface StepItem {
  readonly label: string;
  readonly description?: string;
  readonly status?: 'completed' | 'current' | 'future' | 'invalid';
}
export interface StepperProps extends ComponentPropsWithRef<'div'> {
  readonly steps: readonly StepItem[];
  readonly current?: number;
  readonly onStepChange?: (step: number) => void;
}

export function Stepper({
  steps,
  current = 0,
  onStepChange,
  className = '',
  ...props
}: StepperProps): ReactElement {
  return (
    <div {...props} className={`stepper-proto ${className}`}>
      <ol className="stepper-list-proto">
        {steps.map((step, index) => {
          const state =
            step.status ??
            (index < current ? 'completed' : index === current ? 'current' : 'future');
          const marker =
            state === 'completed' ? (
              <CheckIcon size="1em" aria-hidden="true" />
            ) : state === 'invalid' ? (
              <WarningIcon size="1em" aria-hidden="true" />
            ) : (
              index + 1
            );
          return (
            <li
              key={step.label}
              className="stepper-step-proto"
              data-state={state}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <div className="stepper-rail-proto">
                {onStepChange ? (
                  <button
                    type="button"
                    className="stepper-marker-proto"
                    aria-label={`Step ${index + 1}: ${step.label}`}
                    onClick={() => onStepChange(index)}
                  >
                    {marker}
                  </button>
                ) : (
                  <span className="stepper-marker-proto">{marker}</span>
                )}
              </div>
              <div className="stepper-copy-proto">
                <span className="stepper-label-proto">{step.label}</span>
                {step.description && (
                  <span className="stepper-description-proto">{step.description}</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
