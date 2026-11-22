import { CheckCircleIcon, InfoIcon, WarningCircleIcon, WarningIcon } from '@phosphor-icons/react';

export const textareaFeedback = {
  info: { Icon: InfoIcon, name: 'InfoIcon', label: 'For your information' },
  success: { Icon: CheckCircleIcon, name: 'CheckCircleIcon', label: 'Checked' },
  warning: { Icon: WarningIcon, name: 'WarningIcon', label: 'Review before saving' },
  danger: { Icon: WarningCircleIcon, name: 'WarningCircleIcon', label: 'Needs attention' },
} as const;
