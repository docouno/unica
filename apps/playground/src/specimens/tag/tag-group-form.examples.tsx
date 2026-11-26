import { useId, useRef, useState } from 'react';
import { Button, Flex, Input, Stack, TagGroup, Text } from '@docouno/unica';

const assigned = [
  { id: 'guide', label: 'Field guide', removeLabel: 'Remove Field guide' },
  { id: 'checklist', label: 'Review checklist', removeLabel: 'Remove Review checklist' },
];

export function TagGroupForm({ fieldsetDisabled = false, groupProps = {} } = {}) {
  const id = useId();
  const name = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(assigned);
  const [result, setResult] = useState('');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get('collection-name');
        setResult(
          typeof value === 'string' && value
            ? `Submitted collection name: ${value}`
            : 'No collection name submitted.',
        );
      }}
      onReset={() => setResult('Form reset. Assigned labels are unchanged.')}
      style={{ inlineSize: 'min(100%, 30rem)' }}
    >
      <Stack gap={12}>
        <fieldset disabled={fieldsetDisabled} style={{ minInlineSize: 0 }}>
          <legend>Collection details</legend>
          <Stack gap={8}>
            <label htmlFor={id}>Collection name</label>
            <Input id={id} ref={name} name="collection-name" defaultValue="Field notes" />
            <TagGroup
              {...groupProps}
              aria-label="Assigned labels"
              items={items}
              emptyFocusRef={name}
              onRemove={(removed) =>
                setItems((current) => current.filter(({ id }) => id !== removed))
              }
            />
          </Stack>
        </fieldset>
        <Flex gap={8} wrap="wrap">
          <Button type="submit">Save</Button>
          <Button type="reset" variant="secondary" tone="neutral">
            Reset form
          </Button>
        </Flex>
        <Text size="body-s" color="secondary" role="status">
          {result}
        </Text>
      </Stack>
    </form>
  );
}
