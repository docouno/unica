import { useId, useState } from 'react';
import { Button, Flex, Input, Stack, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function WorkspaceForm({ external = false, subject = {} } = {}) {
  const id = useId();
  const formId = id + '-settings';
  const [submission, setSubmission] = useState('');
  const field = (
    <Stack gap={8}>
      <Text as="label" htmlFor={id} size="body-s" color="primary">
        Workspace name
      </Text>
      <div {...subject} style={{ display: 'grid' }}>
        <Input
          id={id}
          name="workspace"
          defaultValue="Folio"
          clearable
          required
          aria-describedby={id + '-hint'}
          form={external ? formId : undefined}
        />
      </div>
      <Text as="p" id={id + '-hint'} size="caption-l" color="muted">
        <bdi>Shown to members of your workspace.</bdi>
      </Text>
    </Stack>
  );
  return (
    <Stack gap={12} style={{ inlineSize: 'min(100%, 32rem)' }}>
      {external && field}
      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();
          const text = new FormData(event.currentTarget).get('workspace');
          setSubmission(typeof text === 'string' ? text : '');
        }}
      >
        <Stack gap={12}>
          {!external && field}
          <Flex gap={8} wrap="wrap">
            <Button type="submit" size="s">
              Submit
            </Button>
            <Button type="reset" size="s" variant="secondary" tone="neutral">
              Reset
            </Button>
          </Flex>
        </Stack>
      </form>
      <output aria-live="polite" style={{ overflowWrap: 'anywhere' }}>
        {submission && (
          <bdi dir="ltr">
            Submitted: <bdi>{submission}</bdi>
          </bdi>
        )}
      </output>
    </Stack>
  );
}
