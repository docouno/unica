import { useState } from 'react';
import { Stack, Text } from '@docouno/unica';
import { List, ListItem } from '../../prototypes/list/list.proto.js';
import '@docouno/unica/styles.css';

export function DocumentList({
  listProps = {},
  subject = {},
  onOpen = console.log,
  surface = 'base',
} = {}) {
  const [document, setDocument] = useState('');
  function openDocument(title = '') {
    setDocument(title);
    onOpen(title);
  }
  return (
    <Stack
      gap={0}
      data-surface={surface === 'overlay' ? 'overlay' : undefined}
      className={surface === 'overlay' ? 'unica-overlay-surface' : undefined}
      style={{
        inlineSize: 'min(100%, 420px)',
        boxSizing: 'border-box',
        padding: surface === 'overlay' ? 'var(--surface-s-padding)' : undefined,
      }}
    >
      <List {...subject} aria-label="Project documents" size="m" markers={false} {...listProps}>
        <ListItem title="Launch plan" action={{ onClick: () => openDocument('Launch plan') }} />
        <ListItem title="Review notes" action={{ onClick: () => openDocument('Review notes') }} />
      </List>
      <Text
        role="status"
        size="body-s"
        style={{ marginBlockStart: document ? 'var(--space-8)' : 0 }}
      >
        <bdi>
          {document === 'Launch plan'
            ? 'Launch plan: publish after the final review.'
            : document === 'Review notes'
              ? 'Review notes: confirm the handoff before publication.'
              : ''}
        </bdi>
      </Text>
    </Stack>
  );
}
