import type { JSX } from 'react';
import { BinaryRadioGroup, BinaryToggleGroup } from '../../internal/binary/BinaryGroup.js';
import { cx } from '../../core/cx.js';
import type { CheckboxCardGroupProps, RadioCardGroupProps } from './types.js';
import './choice-card.css';

/** Lays out independent choices with shared checkbox group semantics and validation. */
export function CheckboxCardGroup({ className, ...props }: CheckboxCardGroupProps): JSX.Element {
  return (
    <BinaryToggleGroup
      {...props}
      kind="checkbox"
      className={cx('unica-choice-card-group', className)}
    />
  );
}

/** Lays out alternatives with shared radio selection, keyboard navigation, and validation. */
export function RadioCardGroup({ className, ...props }: RadioCardGroupProps): JSX.Element {
  return <BinaryRadioGroup {...props} className={cx('unica-choice-card-group', className)} />;
}
