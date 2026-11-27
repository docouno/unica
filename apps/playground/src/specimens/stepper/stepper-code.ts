import type { StepperMessages, StepperStepProps } from '@docouno/unica';
import { previewProps } from '../preview-code.js';
import { workspaceSteps } from './stepper-steps.js';
import type { StepperValues } from './stepper.spec.js';

const releaseSteps: readonly StepperStepProps[] = [
  { value: 'details', label: 'Details' },
  { value: 'review', label: 'Review' },
  { value: 'publish', label: 'Publish' },
];

export const stageMessages: Partial<StepperMessages> = { allSteps: 'All stages' };

export function stepperPreview(values: StepperValues): {
  readonly name: string;
  readonly steps: readonly StepperStepProps[];
} {
  const { example, size, layout, label, description, completed, status, message } = values;
  const release = example === 'release';
  const initialValue = values.mode === 'controlled' ? values.value : values.defaultValue;
  const name = values['aria-label'].trim() || (release ? 'Publish a release' : 'Workspace setup');
  const steps = (release ? releaseSteps : workspaceSteps).map((step, index): StepperStepProps => {
    if (index === 0) {
      return {
        ...step,
        label: label.trim() || step.label,
        description:
          description || (layout === 'horizontal' && size === 's' ? undefined : step.description),
        completed,
        status,
        message: status === 'danger' ? message : undefined,
      };
    }
    if (release) {
      return { ...step, completed: step.value === 'review' && initialValue === 'publish' };
    }
    if (layout === 'horizontal' && size === 's') {
      return { ...step, description: undefined };
    }
    if (layout === 'vertical' && step.value === 'access') {
      return { ...step, description: 'Roles, invitations, and permissions for shared spaces.' };
    }
    return step;
  });
  return { name, steps };
}

export function stepperCode(values: StepperValues): string {
  const { name, steps } = stepperPreview(values);
  const { allowReturn, value, defaultValue, mode, layout, size } = values;
  const rows = steps.map((step) => {
    const props = previewProps({
      value: step.value,
      label: step.label,
      ...(step.description ? { description: step.description } : {}),
      ...(step.completed ? { completed: true } : {}),
      ...(step.status === 'danger' ? { status: 'danger' } : {}),
      ...(step.message ? { message: step.message } : {}),
    });
    return `      <StepperStep${props} />`;
  });
  const options = previewProps(
    { 'aria-label': name, layout, size, allowReturn },
    { layout: 'responsive', size: 'm', allowReturn: false },
  );
  const stateful = mode === 'controlled' && allowReturn;
  const position =
    mode === 'local'
      ? ` defaultValue={${JSON.stringify(defaultValue || null)}}`
      : ` value={${stateful ? 'current' : JSON.stringify(value || null)}}`;
  const messages =
    values.messages === 'stages' ? ` messages={${JSON.stringify(stageMessages)}}` : '';

  return [
    "import '@docouno/unica/styles.css';",
    ...(stateful ? ["import { useState } from 'react';"] : []),
    "import { Stepper, StepperStep } from '@docouno/unica';",
    '',
    'export function WorkflowSteps() {',
    ...(stateful
      ? [`  const [current, setCurrent] = useState(${JSON.stringify(value || null)});`]
      : []),
    '  return (',
    `    <Stepper${options}${position}${stateful ? ' onValueChange={setCurrent}' : ''}${messages}>`,
    ...rows,
    '    </Stepper>',
    '  );',
    '}',
  ].join('\n');
}
