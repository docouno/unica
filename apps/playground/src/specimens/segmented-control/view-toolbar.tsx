import { useState } from 'react';
import {
  Button,
  Card,
  Flex,
  Grid,
  Icon,
  Input,
  SegmentedControl,
  Stack,
  Text,
} from '@docouno/unica';
import { FileTextIcon } from '@phosphor-icons/react';
import '@docouno/unica/styles.css';

const documents = ['Project notes', 'Design review', 'Release plan'];
const views = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
];

export function DocumentResults({ view = 'list', entries = documents } = {}) {
  return (
    <Grid
      columns={view === 'grid' ? 3 : 1}
      gap={8}
      role="list"
      aria-label="Documents"
      style={{ maxInlineSize: '26.25rem' }}
    >
      {entries.map((title) => (
        <Card key={title} size="s" variant="subtle" role="listitem">
          <Flex
            align={view === 'grid' ? 'start' : 'center'}
            direction={view === 'grid' ? 'column' : 'row'}
            gap={8}
          >
            <Icon usage="slot" icon={FileTextIcon} size="s" />
            <Text size="caption-l" style={{ overflowWrap: 'anywhere' }}>
              {title}
            </Text>
          </Flex>
        </Card>
      ))}
    </Grid>
  );
}

function Toolbar({ density = 'm', controlProps = {} }) {
  const size = density === 's' || density === 'l' ? density : 'm';
  const [applied, setApplied] = useState({ view: '', query: '' });
  const results = documents.filter((title) =>
    title.toLowerCase().includes(applied.query.toLowerCase()),
  );
  return (
    <form
      aria-label={`${size.toUpperCase()} document controls`}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const query = data.get('query');
        setApplied({
          view: data.get('layout') === 'grid' ? 'grid' : 'list',
          query: typeof query === 'string' ? query.trim() : '',
        });
      }}
    >
      <Stack gap={8}>
        <Text size="caption-l" color="secondary">
          <bdi>{size.toUpperCase()} density</bdi>
        </Text>
        <Flex wrap="wrap" gap={12} align="center">
          <SegmentedControl
            {...controlProps}
            size={size}
            name="layout"
            aria-label={`Layout in ${size} controls`}
            items={views}
          />
          <Input
            name="query"
            size={size}
            aria-label={`Find items ${size}`}
            dir="auto"
            placeholder="Find"
            style={{ inlineSize: '8rem', maxInlineSize: '100%' }}
          />
          <Button size={size} variant="secondary" tone="neutral" type="submit">
            Apply
          </Button>
        </Flex>
        <output>
          <Text as="span" size="caption-l">
            {applied.view && (
              <bdi>
                {results.length} {results.length === 1 ? 'document' : 'documents'} ·{' '}
                {applied.view === 'grid' ? 'Grid' : 'List'} view
                {applied.query && (
                  <>
                    {' '}
                    · “<bdi>{applied.query}</bdi>”
                  </>
                )}
              </bdi>
            )}
          </Text>
        </output>
        {applied.view && results.length > 0 && (
          <DocumentResults view={applied.view} entries={results} />
        )}
      </Stack>
    </form>
  );
}

export function ViewToolbar({ controlProps = {} } = {}) {
  return (
    <Stack gap={24} style={{ minInlineSize: 0 }}>
      {['s', 'm', 'l'].map((size) => (
        <Toolbar key={size} density={size} controlProps={controlProps} />
      ))}
    </Stack>
  );
}
