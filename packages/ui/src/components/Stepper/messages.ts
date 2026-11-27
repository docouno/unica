import type { StepperMessages } from './types.js';

export function isolateAuthorText(text: string): string {
  return `\u2068${text}\u2069`;
}

export const stepperMessages: StepperMessages = {
  allSteps: 'All steps',
  allComplete: 'All steps complete',
  markerNumber: String,
  position: (index, total) => `Step ${index} of ${total}`,
  completedCount: (count, total) => `${count} of ${total} steps complete`,
  stepLabel: (index, label, completed) =>
    `Step ${index}: ${isolateAuthorText(label)}${completed ? ', completed' : ''}`,
  needsAttention: (message) =>
    message ? `Needs attention: ${isolateAuthorText(message)}` : 'Needs attention',
  checkStep: (label) => `Check ${isolateAuthorText(label)}`,
};
