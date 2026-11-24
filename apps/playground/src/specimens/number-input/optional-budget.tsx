import { useState } from 'react';
import { Button, Stack, Text } from '@docouno/unica';
import { NumberInput } from '../../prototypes/number-input/number-input.proto.js';
import '@docouno/unica/styles.css';

export function OptionalBudget({ fieldProps = {} } = {}) {
  const [receipt, setReceipt] = useState('');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const limit = new FormData(event.currentTarget).get('budget');
        if (typeof limit !== 'string') {
          return;
        }
        setReceipt(
          limit === '' ? 'Saved with no spending limit.' : `Saved spending limit: ${limit} USD.`,
        );
      }}
    >
      <Stack gap={12}>
        <NumberInput
          {...fieldProps}
          name="budget"
          label="Spending limit in US dollars"
          min={0}
          step={1}
          suffix="USD"
          placeholder="No limit"
          description={<bdi>Leave empty for no limit. Zero blocks all spending.</bdi>}
        />
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
