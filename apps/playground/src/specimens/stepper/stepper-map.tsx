import type { ReactElement } from 'react';
import { Stepper, StepperStep } from '@docouno/unica';
import type { StepperProps, StepperStepProps } from '@docouno/unica';

export function StepMap({
  steps,
  ...props
}: StepperProps & {
  readonly children?: never;
  readonly steps: readonly StepperStepProps[];
}): ReactElement {
  return (
    <Stepper {...props}>
      {steps.map((step) => (
        <StepperStep key={step.value} {...step} />
      ))}
    </Stepper>
  );
}
