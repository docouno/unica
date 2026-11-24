import { useState } from 'react';
import { Code, Stack, Text } from '@docouno/unica';
import { Listbox } from '../../prototypes/select/select.proto.js';
import '@docouno/unica/styles.css';

const columns = [
  { value: 'title', label: 'Title' },
  { value: 'owner', label: 'Owner' },
  { value: 'modified', label: 'Last modified' },
];

export function ExportColumns({ listProps = {} } = {}) {
  const [selected, setSelected] = useState(['title', 'modified']);
  const header = columns
    .filter(({ value }) => selected.includes(value))
    .map(({ value }) => value)
    .join(',');
  return (
    <Stack gap={12} style={{ inlineSize: 'min(100%, 24rem)' }}>
      <Listbox
        {...listProps}
        title="Export columns"
        options={columns}
        multiple
        values={selected}
        onValuesChange={(values) => setSelected([...values])}
      />
      <Text size="body-s" role="status">
        <bdi>
          {header ? (
            <>
              CSV header: <Code>{header}</Code>
            </>
          ) : (
            'No columns selected.'
          )}
        </bdi>
      </Text>
    </Stack>
  );
}
