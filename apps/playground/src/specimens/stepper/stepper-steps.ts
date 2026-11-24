import type { StepperStepProps } from '../../prototypes/stepper/stepper.proto.js';

export const workspaceSteps: readonly StepperStepProps[] = [
  { value: 'details', label: 'Workspace details', description: 'Name and region' },
  { value: 'access', label: 'Access rules', description: 'Roles and invitations' },
  { value: 'review', label: 'Review setup', description: 'Confirm and create' },
];
