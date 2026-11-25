import { useId, useState } from 'react';
import { Button, Flex, Grid, Input, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function DraftForm({ buttonProps = {} } = {}) {
  const [message, setMessage] = useState({ action: '', title: '' });
  const fieldId = useId();
  return (
    <form
      style={{
        display: 'grid',
        inlineSize: '100%',
        minInlineSize: 0,
        justifyItems: 'start',
        gap: 'var(--space-12)',
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget, event.nativeEvent.submitter);
        const title = data.get('title');
        if (typeof title === 'string') {
          setMessage({ action: data.get('intent') === 'save' ? 'Saved' : 'Submitted', title });
        }
      }}
      onReset={() => setMessage({ action: 'Draft title reset.', title: '' })}
    >
      <Grid gap={4} style={{ inlineSize: 'min(100%, 18rem)', justifyItems: 'start' }}>
        <Text as="label" size="body-s" color="secondary" htmlFor={fieldId}>
          Draft title
        </Text>
        <Input id={fieldId} name="title" dir="auto" defaultValue="Untitled" required />
      </Grid>
      <Flex align="center" wrap="wrap" gap={12}>
        <Button {...buttonProps} type="reset" variant="ghost">
          Reset
        </Button>
        <Button {...buttonProps} type="submit" name="intent" value="save">
          Save draft
        </Button>
      </Flex>
      {message.action && (
        <Text size="body-s" color="muted" role="status" dir="auto">
          {message.action}
          {message.title && (
            <>
              {' “'}
              <bdi>{message.title}</bdi>”.
            </>
          )}
        </Text>
      )}
    </form>
  );
}
