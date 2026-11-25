import { useState } from 'react';
import { Stack, Text } from '@docouno/unica';
import { Autocomplete } from '../../prototypes/combobox/combobox.proto.js';
import '@docouno/unica/styles.css';
import { blocks } from './block-commands.js';

export function InsertBlock({ fieldProps = {}, surface = 'overlay' } = {}) {
  const [result, setResult] = useState('');
  return (
    <form
      data-surface={surface}
      className={surface === 'overlay' ? 'unica-overlay-surface' : undefined}
      style={{
        position: 'relative',
        boxSizing: 'border-box',
        inlineSize: 'min(100%, 34rem)',
        padding: surface === 'overlay' ? 'var(--surface-s-padding)' : undefined,
      }}
      onSubmit={(event) => {
        event.preventDefault();
        const command = new FormData(event.currentTarget).get('command');
        const block = blocks.find((option) => option.insertText === command && !option.disabled);
        setResult(
          block ? `${block.label} inserted.` : 'Choose an available block or enter its command.',
        );
      }}
    >
      <Stack gap={12}>
        <Autocomplete
          {...fieldProps}
          name="command"
          label="Insert a block"
          variant="ghost"
          size="s"
          placeholder="Type / to browse"
          options={blocks}
          filter={(option, query) => {
            const text = query.trim().replace(/^\//u, '').toLocaleLowerCase();
            return [option.label, option.description, option.insertText].some((part) =>
              part?.toLocaleLowerCase().includes(text),
            );
          }}
          onTextChange={() => setResult('')}
          onSuggestion={(option) => setResult(`${option.label} inserted.`)}
        />
        {result && (
          <Text as="p" size="body-s" color="secondary" role="status">
            <bdi>{result}</bdi>
          </Text>
        )}
      </Stack>
    </form>
  );
}
