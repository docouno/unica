import { createRef } from 'react';
import { Input, defineGlyph } from '../src/index.js';
import type { ControlSize, FieldStatus, FieldVariant, InputProps } from '../src/index.js';
import type * as Server from '../src/server.js';

const control: {
  readonly size: ControlSize;
  readonly status: FieldStatus;
  readonly variant: FieldVariant;
} = { size: 'l', status: 'warning', variant: 'ghost' };
const server: {
  size: Server.ControlSize;
  status: Server.FieldStatus;
  variant: Server.FieldVariant;
} = control;
const props: Server.InputProps = {
  ...server,
  id: 'contact',
  name: 'email',
  type: 'email',
  autoComplete: 'email',
  'aria-describedby': 'hint',
  'data-edit-target': 'contact',
  iconLeft: defineGlyph(() => null),
  prefix: '@',
  suffix: '.example',
  clearable: true,
  ref: createRef<HTMLInputElement>(),
  onChange: (event) => event.currentTarget.setCustomValidity(''),
} satisfies InputProps;

export const field = <Input {...props} />;
export const callbackRef = (
  <Input
    ref={(node) => {
      node?.select();
      return () => {};
    }}
  />
);

// @ts-expect-error Time has a distinct native and product contract.
export const time = <Input type="time" />;
// @ts-expect-error Checkbox state does not belong to a text input.
export const checkbox = <Input checked />;
// @ts-expect-error Input size is a design-system axis.
export const numericSize = <Input size={30} />;
// @ts-expect-error Text values are strings.
export const numericValue = <Input value={1} />;
// @ts-expect-error Affixes are text.
export const action = <Input suffix={<button type="button">Open</button>} />;
// @ts-expect-error The origin of material is the active theme.
export const material = <Input appearance="glass" />;
// @ts-expect-error Validation uses the field status axis.
export const unsupportedStatus = <Input status="accent" />;
// @ts-expect-error Labels belong to the enclosing markup.
export const shorthand = <Input label="Contact" />;
// @ts-expect-error The native input does not receive children.
export const children = <Input>Content</Input>;
// @ts-expect-error Production Input does not pin focus appearance.
export const preview = <Input previewState="keyboard-focus" />;
