import type { JSX } from 'react';
import { warnOnce } from '../../core/devWarning.js';
import type {
  SelectContentProps,
  SelectGroupProps,
  SelectOptionProps,
  SelectTriggerProps,
} from './types.js';

/** Declaratively customizes the button of a Select. */
export const SelectTrigger: (props: SelectTriggerProps) => JSX.Element | null = () => {
  warnOnce('select-trigger-outside', 'SelectTrigger belongs directly inside Select.');
  return null;
};

/** Declares the content attributes and optional JSX catalog of a Select. */
export const SelectContent: (props: SelectContentProps) => JSX.Element | null = () => {
  warnOnce('select-content-outside', 'SelectContent belongs directly inside Select.');
  return null;
};

/** Declares an option in SelectContent. */
export const SelectOption: (props: SelectOptionProps) => JSX.Element | null = () => {
  warnOnce('select-option-outside', 'SelectOption belongs inside SelectContent.');
  return null;
};

/** Declares one level of grouping in SelectContent. */
export const SelectGroup: (props: SelectGroupProps) => JSX.Element | null = () => {
  warnOnce('select-group-outside', 'SelectGroup belongs inside SelectContent.');
  return null;
};
