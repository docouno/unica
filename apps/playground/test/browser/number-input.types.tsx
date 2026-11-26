import { NumberInput } from '@docouno/unica';
import type { NumberInputProps } from '@docouno/unica';

export function Consumer({ props }: { props: NumberInputProps }) {
  return (
    <NumberInput
      {...props}
      ref={(node) => {
        if (node) {
          const reset = () => node.form?.reset();
          node.addEventListener('named-reset', reset);
          return () => node.removeEventListener('named-reset', reset);
        }
      }}
      value=""
      defaultValue={0}
      form="measurements"
      min={-3}
      max={5}
      step="any"
      aria-valuetext="No limit"
      onValueChange={(value: number | '') => String(value)}
      data-consumer="number"
    />
  );
}

// @ts-expect-error Precision is fixed by the supported decimal steps.
<NumberInput precision={2} />;
// @ts-expect-error The public value is a number or an empty string.
<NumberInput value="12" />;
// @ts-expect-error The editor's native type is fixed.
<NumberInput type="text" />;
// @ts-expect-error The label is an external form element.
<NumberInput label="Limit" />;
// @ts-expect-error Preview state is a Workbench concern.
<NumberInput previewState="keyboard-focus" />;
