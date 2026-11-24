import type { ReactElement } from 'react';
import { Stepper, StepperStep } from '../../prototypes/stepper/stepper.proto.js';
import type { StepperProps, StepperStepProps } from '../../prototypes/stepper/stepper.proto.js';

export function StepMap({
  steps,
  ...props
}: Omit<StepperProps, 'children'> & { readonly steps: readonly StepperStepProps[] }): ReactElement {
  return (
    <Stepper {...props}>
      {steps.map((step) => (
        <StepperStep key={step.value} {...step} />
      ))}
    </Stepper>
  );
}
