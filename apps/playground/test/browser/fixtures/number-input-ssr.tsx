import { FormField, NumberInput } from '@docouno/unica';
import type { ReactElement } from 'react';

export default function NumberInputSsr(): ReactElement {
  return (
    <form data-testid="ssr-form">
      <p id="ssr-local-note">Capacity budget.</p>
      <FormField
        label="Initial count"
        controlId="ssr-local"
        size="s"
        required
        status="danger"
        description="Use half steps."
        message="Check the requested count."
        counter="9 max"
      >
        <NumberInput
          name="local"
          min={0}
          max={9}
          step={0.5}
          defaultValue={1.5}
          aria-describedby="ssr-local-note"
        />
      </FormField>
      <FormField
        label="Owner count"
        controlId="ssr-owner"
        disabled
        readOnly
        required
        status="danger"
      >
        <NumberInput
          name="owner"
          value={2}
          max={10}
          disabled={false}
          readOnly={false}
          required={false}
          status="neutral"
        />
      </FormField>
      <NumberInput aria-label="Generated id" name="generated" defaultValue="" />
    </form>
  );
}
