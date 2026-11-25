import { useState } from 'react';
import { Button, Stack, Text } from '@docouno/unica';
import { TagsInput } from '../../prototypes/tags-input/tags-input.proto.js';
import '@docouno/unica/styles.css';

export function RecipientList({ fieldProps = {} } = {}) {
  const [recipients, setRecipients] = useState(['editor@example.org']);
  const [preview, setPreview] = useState('');
  return (
    <form
      style={{ inlineSize: 'min(100%, 30rem)' }}
      onSubmit={(event) => {
        event.preventDefault();
        const addresses = new FormData(event.currentTarget)
          .getAll('recipient')
          .filter((value) => typeof value === 'string');
        setPreview(addresses.length ? addresses.join(', ') : 'No recipients selected.');
      }}
    >
      <Stack gap={16}>
        <TagsInput
          {...fieldProps}
          label="Recipients"
          values={recipients}
          onValuesChange={(next) => {
            setRecipients([...next]);
            setPreview('');
          }}
          onDraftChange={() => setPreview('')}
          validate={(value) =>
            /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(value) ? undefined : 'Enter one complete address.'
          }
          description="Enter one address per line. Add or clear the draft before previewing the list."
        />
        {recipients.map((address) => (
          <input key={address} type="hidden" name="recipient" value={address} />
        ))}
        <div>
          <Button type="submit" variant="secondary" tone="neutral">
            Preview recipient list
          </Button>
        </div>
        <Text role="status" size="body-s" style={{ overflowWrap: 'anywhere' }}>
          <bdi>{preview}</bdi>
        </Text>
      </Stack>
    </form>
  );
}
