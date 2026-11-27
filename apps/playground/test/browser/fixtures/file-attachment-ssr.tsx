import type { ReactElement } from 'react';
import { Dropzone, FileInput, FormField } from '@docouno/unica';

export default function ColdAttachments(): ReactElement {
  return (
    <form data-testid="cold-form">
      <FormField label="Cold compact" controlId="cold-compact" required>
        <FileInput name="compact" />
      </FormField>
      <FormField label="Cold well" controlId="cold-well" required>
        <Dropzone name="well" />
      </FormField>
    </form>
  );
}
