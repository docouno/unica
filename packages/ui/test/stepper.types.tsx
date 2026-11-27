import { createRef } from 'react';
import { Stepper, StepperStep } from '../src/index.js';
import type {
  StepperLayout,
  StepperMessages,
  StepperProps,
  StepperSize,
  StepperStepProps,
  StepperStepStatus,
} from '../src/server.js';

const root = createRef<HTMLDivElement>();
const item = createRef<HTMLLIElement>();
const size: StepperSize = 'l';
const layout: StepperLayout = 'compact';
const status: StepperStepStatus = 'danger';
const messages: Partial<StepperMessages> = {
  markerNumber: String,
  stepLabel: (index, label, completed) => `${index}: ${label} (${completed})`,
};
const props: StepperProps = {
  'aria-labelledby': 'heading',
  'aria-label': 'Setup',
  'aria-describedby': 'details',
  'data-owner': 'app',
  ref: root,
  value: null,
  defaultValue: undefined,
  layout,
  size,
  messages,
};
const step: StepperStepProps = {
  ref: item,
  value: 'settings',
  label: 'Settings',
  completed: undefined,
  status,
  message: 'Choose a default.',
};
<Stepper {...props} allowReturn onValueChange={(value: string) => value}>
  <StepperStep {...step} />
</Stepper>;

// @ts-expect-error The group requires an accessible name.
<Stepper />;
// @ts-expect-error Layout owns orientation.
<Stepper aria-label="Setup" orientation="vertical" />;
// @ts-expect-error The family owns the group's Tab order.
<Stepper aria-label="Setup" tabIndex={0} />;
// @ts-expect-error Step labels are text.
<StepperStep value="a" label={<em>First</em>} />;
// @ts-expect-error Correction uses danger status.
<StepperStep value="a" label="First" status="error" />;
// @ts-expect-error Old prototype flags are absent.
<StepperStep value="a" label="First" preview="hover" />;
// @ts-expect-error The step owns its list item ref type.
<StepperStep value="a" label="First" ref={root} />;
