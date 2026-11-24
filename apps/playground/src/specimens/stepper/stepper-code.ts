import type { StepperStepProps } from '../../prototypes/stepper/stepper.proto.js';
import { previewProps } from '../preview-code.js';
import { workspaceSteps } from './stepper-steps.js';
import type { StepperValues } from './stepper.spec.js';

export function stepperPreview({ example, size, layout, label, value }: StepperValues): {
  label: string;
  steps: readonly StepperStepProps[];
} {
  if (example === 'release') {
    return {
      label: label.trim() ? label : 'Publish a release',
      steps: [
        { value: 'details', label: 'Details', completed: true },
        { value: 'review', label: 'Review', completed: value === 'publish' },
        { value: 'publish', label: 'Publish' },
      ],
    };
  }

  return {
    label: label.trim() ? label : 'Workspace setup',
    steps: workspaceSteps.map((step) => {
      let description = step.description;
      if (layout === 'horizontal' && size === 's') {
        description = undefined;
      } else if (layout === 'vertical' && step.value === 'access') {
        description = 'Roles, invitations, and permissions for shared spaces.';
      }
      return { ...step, description, completed: step.value === 'details' };
    }),
  };
}

export function stepperCode(values: StepperValues): string {
  const { label, steps } = stepperPreview(values);
  const { allowReturn, value, layout, size } = values;
  const rows = steps.map((step) => {
    const props = previewProps({
      value: step.value,
      label: step.label,
      ...(step.description ? { description: step.description } : {}),
      ...(step.completed ? { completed: true } : {}),
    });
    return `      <StepperStep${props} />`;
  });
  const options = previewProps({ label, layout, size }, { size: 'm' });
  const selected = allowReturn ? 'current || null' : JSON.stringify(value || null);

  return [
    "import '@docouno/unica/styles.css';",
    ...(allowReturn ? ["import { useState } from 'react';"] : []),
    "import { Stepper, StepperStep } from './prototypes/stepper/stepper.proto.js';",
    '',
    'export function WorkflowSteps() {',
    ...(allowReturn ? [`  const [current, setCurrent] = useState(${JSON.stringify(value)});`] : []),
    '  return (',
    `    <Stepper${options} value={${selected}}${allowReturn ? ' onValueChange={setCurrent}' : ''}>`,
    ...rows,
    '    </Stepper>',
    '  );',
    '}',
  ].join('\n');
}
