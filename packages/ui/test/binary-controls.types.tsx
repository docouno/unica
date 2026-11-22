import { createRef } from 'react';
import {
  Checkbox,
  CheckboxGroup,
  CheckboxIndicator,
  Radio,
  RadioGroup,
  RadioIndicator,
  Switch,
  SwitchGroup,
  SwitchIndicator,
} from '../src/index.js';
import type {
  CheckboxGroupProps,
  CheckboxIndicatorProps,
  CheckboxProps,
  RadioGroupProps,
  RadioIndicatorProps,
  RadioProps,
  SwitchGroupProps,
  SwitchIndicatorProps,
  SwitchProps,
} from '../src/server.js';

const inputRef = createRef<HTMLInputElement>();
const groupRef = createRef<HTMLDivElement>();
const indicatorRef = createRef<HTMLSpanElement>();
const svgRef = createRef<SVGSVGElement>();
const icon = <svg aria-hidden="true" />;

const checkbox: CheckboxProps = {
  checked: false,
  indeterminate: true,
  name: 'permissions',
  form: 'settings',
  value: '',
  label: <strong>Read</strong>,
  status: 'danger',
  description: undefined,
  size: undefined,
  onCheckedChange: (next) => next satisfies boolean,
};
const checkboxes: CheckboxGroupProps = {
  defaultValue: ['read'] as const,
  readOnly: true,
  required: true,
  requiredMessage: undefined,
  name: 'permissions',
  form: 'settings',
};
const checkMark: CheckboxIndicatorProps = { indeterminate: true, disabled: undefined };
const radio: RadioProps = {
  value: '',
  defaultChecked: true,
  onChange: (event) => event.currentTarget satisfies HTMLInputElement,
};
const radios: RadioGroupProps = {
  value: null,
  orientation: 'horizontal',
  name: undefined,
  onValueChange: (next) => next satisfies string,
};
const radioMark: RadioIndicatorProps = { checked: true, size: 'l' };
const toggle: SwitchProps = { defaultChecked: true, thumbIcon: icon, loading: undefined };
const toggles: SwitchGroupProps = {
  value: ['mail', 'push'] as const,
  onValueChange: (next) => next satisfies string[],
};
const toggleMark: SwitchIndicatorProps = { loading: true, thumbIcon: icon };

export const examples = (
  <>
    <Checkbox {...checkbox} ref={inputRef} />
    <CheckboxGroup {...checkboxes} ref={groupRef} aria-label="Permissions">
      <Checkbox value="read" label="Read" />
    </CheckboxGroup>
    <CheckboxIndicator {...checkMark} ref={indicatorRef} />
    <Radio {...radio} ref={inputRef} aria-label="Default" />
    <RadioGroup {...radios} ref={groupRef} aria-label="Plan">
      <Radio value="" label="None" />
    </RadioGroup>
    <RadioIndicator {...radioMark} ref={indicatorRef} />
    <Switch {...toggle} ref={inputRef} aria-label="Mail alerts" />
    <SwitchGroup {...toggles} ref={groupRef} aria-label="Channels">
      <Switch value="mail" label="Mail" />
    </SwitchGroup>
    <SwitchIndicator {...toggleMark} ref={indicatorRef} />
  </>
);

// @ts-expect-error The checkbox owns its native input type.
<Checkbox type="text" />;
// @ts-expect-error Size uses Unica's size axis.
<Checkbox size={20} />;
// @ts-expect-error The input ref does not point to the row.
<Checkbox ref={groupRef} />;
// @ts-expect-error The group uses an array of selected keys.
<CheckboxGroup value="read" />;
// @ts-expect-error Read-only is a radiogroup setting.
<Radio readOnly />;
// @ts-expect-error Radio keys are strings.
<Radio value={1} />;
// @ts-expect-error A radiogroup can have only one selected key.
<RadioGroup value={['read']} />;
// @ts-expect-error The group ref points to a div.
<RadioGroup ref={svgRef} />;
// @ts-expect-error Preview state belongs to Workbench.
<Radio previewState="hover" />;
// @ts-expect-error Switch has no mixed value.
<Switch indeterminate />;
// @ts-expect-error Settings feedback is owned by the application.
<Switch status="danger" />;
// @ts-expect-error The slot accepts a rendered node, not a component function.
<Switch thumbIcon={() => icon} />;
// @ts-expect-error A set of switches has no group required rule.
<SwitchGroup required />;
// @ts-expect-error Theme supplies the material.
<Switch appearance="glass" />;
// @ts-expect-error The indicator is decorative and has no tab stop.
<CheckboxIndicator tabIndex={0} />;
// @ts-expect-error The radio indicator owns its internal mark.
<RadioIndicator>Selected</RadioIndicator>;
// @ts-expect-error The indicator ref points to a span.
<SwitchIndicator ref={svgRef} />;
