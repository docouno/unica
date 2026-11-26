import { useId, useState } from 'react';
import { Button, NumberInput, Stack, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function OptionalBudget({ fieldProps = {} } = {}) {
  const id = useId();
  const [receipt, setReceipt] = useState('');
  return (
    <form
      onReset={() => setReceipt('')}
      onSubmit={(event) => {
        event.preventDefault();
        const limit = new FormData(event.currentTarget).get('budget');
        if (typeof limit === 'string') {
          setReceipt(
            limit === '' ? 'Saved with no spending limit.' : `Saved spending limit: ${limit} USD.`,
          );
        }
      }}
    >
      <Stack gap={12} style={{ inlineSize: 'min(100%, 32rem)' }}>
        <Stack gap={8}>
          <Text as="label" size="body-s" htmlFor={id}>
            Spending limit in US dollars
          </Text>
          <div {...fieldProps} style={{ display: 'flex' }}>
            <NumberInput
              id={id}
              name="budget"
              min={0}
              suffix="USD"
              placeholder="No limit"
              aria-describedby={id + '-help'}
            />
          </div>
          <Text id={id + '-help'} size="caption-l" color="muted">
            <bdi>Leave empty for no limit. Zero blocks all spending.</bdi>
          </Text>
        </Stack>
        <Button type="submit" size="s" style={{ alignSelf: 'start' }}>
          Save limit
        </Button>
        <Text as="p" role="status" size="body-s">
          <bdi>{receipt}</bdi>
        </Text>
      </Stack>
    </form>
  );
}
