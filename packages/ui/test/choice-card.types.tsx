import { createRef } from 'react';
import {
  Checkbox,
  CheckboxCard,
  CheckboxCardGroup,
  CheckboxCardIndicator,
  ChoiceCardContent,
  ChoiceCardDescription,
  ChoiceCardLabel,
  ChoiceCardMetadata,
  ChoiceCardSecondary,
  Radio,
  RadioCard,
  RadioCardGroup,
  RadioCardIndicator,
  SwitchCard,
  SwitchCardIndicator,
} from '../src/index.js';
import type { CheckboxCardGroupProps, RadioCardProps, SwitchCardProps } from '../src/server.js';
import type { ChoiceCardIndicatorPlacement } from '../src/index.js';

const input = createRef<HTMLInputElement>();
const div = createRef<HTMLDivElement>();
const span = createRef<HTMLSpanElement>();
const placement: ChoiceCardIndicatorPlacement = 'none';
const checkboxGroup: CheckboxCardGroupProps = {
  value: ['pdf'],
  onValueChange(next) {
    const values: string[] = next;
    return values.length;
  },
};
const radio: RadioCardProps = { value: '', ref: input, label: 'Automatic' };
const setting = {
  ref: input,
  checked: true,
  loading: false,
  onCheckedChange(next: boolean) {
    return next;
  },
} satisfies SwitchCardProps;

<CheckboxCardGroup {...checkboxGroup} ref={div}>
  <Checkbox value="csv" label="CSV" />
  <CheckboxCard ref={input} value="pdf" indicatorPlacement={placement} aria-labelledby="pdf">
    <ChoiceCardContent ref={div}>
      <ChoiceCardLabel id="pdf" ref={span}>
        PDF <CheckboxCardIndicator ref={span} />
      </ChoiceCardLabel>
      <ChoiceCardDescription ref={span}>For print.</ChoiceCardDescription>
      <ChoiceCardMetadata ref={div}>Included</ChoiceCardMetadata>
      <ChoiceCardSecondary ref={div}>
        <a href="/terms">Terms</a>
      </ChoiceCardSecondary>
    </ChoiceCardContent>
  </CheckboxCard>
</CheckboxCardGroup>;

<RadioCardGroup ref={div} defaultValue={null} onValueChange={(next: string) => next}>
  <Radio value="compact" label="Short" />
  <RadioCard {...radio} />
  <RadioCard value="extended" indicatorPlacement="none" aria-label="Extended">
    <RadioCardIndicator ref={span} />
  </RadioCard>
</RadioCardGroup>;

<SwitchCard {...setting} indicatorPlacement="none" aria-label="Notifications">
  <SwitchCardIndicator ref={span} />
</SwitchCard>;

// @ts-expect-error The material comes from the theme.
<CheckboxCard variant="glass" />;
// @ts-expect-error A choice card is an individual option.
<CheckboxCard indeterminate />;
// @ts-expect-error Select shorthand or compound content.
<CheckboxCard label="PDF">
  <ChoiceCardLabel>PDF</ChoiceCardLabel>
</CheckboxCard>;
// @ts-expect-error A radio option needs a string key.
<RadioCard label="Print" />;
// @ts-expect-error Read-only belongs to the radio group.
<RadioCard readOnly value="print" />;
// @ts-expect-error The group owns selection and form association.
<RadioCard checked name="output" value="print" />;
// @ts-expect-error Immediate settings show adjacent operation feedback.
<SwitchCard status="danger" />;
// @ts-expect-error The marker follows the card's native value.
<SwitchCardIndicator size="l" checked />;
// @ts-expect-error The card ref points at the native input.
<CheckboxCard ref={div} label="Save original" />;
// @ts-expect-error Preview pins are outside the component API.
<RadioCard previewState="hover" value="print" />;
