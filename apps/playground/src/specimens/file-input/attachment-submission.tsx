import { useState } from 'react';
import { Button, Stack, Text } from '@docouno/unica';
import { FileInput } from '../../prototypes/file-input/file-input.proto.js';
import '@docouno/unica/styles.css';

export function AttachmentSubmission({ fieldProps = {} } = {}) {
  const [receipt, setReceipt] = useState('');
  return (
    <form
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
        <FileInput
          {...fieldProps}
          label="Supporting attachment"
          name="attachment"
          description={<bdi>Choose or drop one file to include it in the form.</bdi>}
        />
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
