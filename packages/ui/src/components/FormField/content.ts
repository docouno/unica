import { Fragment, isValidElement } from 'react';
import type { ReactNode } from 'react';
import type { FieldStatus } from '../../core/forms/fieldAxes.js';

const fallbackLabels = {
  info: 'Information',
  success: 'Valid',
  warning: 'Review this value',
  danger: 'Needs attention',
};

export function hasFieldContent(content: ReactNode): boolean {
  if (typeof content === 'string') {
    return content.trim().length > 0;
  }
  if (Array.isArray(content)) {
    return content.some(hasFieldContent);
  }
  if (isValidElement<{ children?: ReactNode }>(content) && content.type === Fragment) {
    return hasFieldContent(content.props.children);
  }
  return content !== null && content !== undefined && typeof content !== 'boolean';
}

export function feedbackContent(
  status: FieldStatus,
  content: ReactNode,
  statusLabel: ReactNode,
): ReactNode {
  if (content === '' || hasFieldContent(content)) {
    return content;
  }
  if (status === 'neutral') {
    return null;
  }
  return hasFieldContent(statusLabel) ? statusLabel : fallbackLabels[status];
}
