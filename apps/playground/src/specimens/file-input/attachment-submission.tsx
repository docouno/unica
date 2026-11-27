import { useState } from 'react';
import { Button, FileInput, FormField, Stack, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function AttachmentSubmission({ fieldProps = {} } = {}) {
  const [receipt, setReceipt] = useState('');
  return (
    <form
      method="post"
      encType="multipart/form-data"
      onSubmit={(event) => {
        event.preventDefault();
        const file = new FormData(event.currentTarget).get('attachment');
        setReceipt(
          file instanceof File && file.name
            ? `Last submission: ${file.name} (${file.size} ${file.size === 1 ? 'byte' : 'bytes'}).`
            : 'Last submission contained no attachment.',
        );
      }}
    >
      <Stack gap={12}>
        <FormField
          label="Supporting attachment"
          description="Choose or drop one file to include it in the form."
        >
          <FileInput {...fieldProps} name="attachment" />
        </FormField>
        <Button size="s" type="submit" style={{ alignSelf: 'start' }}>
          Inspect submission
        </Button>
        <Text
          as="p"
          role="status"
          size="body-s"
          color="secondary"
          style={{ overflowWrap: 'anywhere' }}
        >
          <bdi dir="ltr">{receipt}</bdi>
        </Text>
      </Stack>
    </form>
  );
}
