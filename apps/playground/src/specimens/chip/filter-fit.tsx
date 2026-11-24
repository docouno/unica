import { useState } from 'react';
import { Badge, Button, Flex, Stack, Text } from '@docouno/unica';
import { StarIcon } from '@phosphor-icons/react';
import { Chip } from '../../prototypes/chip/chip.proto.js';
import { Tag } from '../../prototypes/tag/tag.proto.js';
import '@docouno/unica/styles.css';

const stock = {
  XS: { total: 8, favorites: 3 },
  S: { total: 16, favorites: 6 },
  M: { total: 25, favorites: 12 },
  L: { total: 14, favorites: 9 },
  XL: { total: 8, favorites: 4 },
};

function SizeFilters({ density = 'm', chipProps = {} }) {
  const size = density === 's' || density === 'l' ? density : 'm';
  const [count, setCount] = useState(stock.M.favorites);
  return (
    <form
      aria-label={`${size.toUpperCase()} filter controls`}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const selected = data.getAll('size');
        const entries = Object.entries(stock).filter(
          ([label]) => !selected.length || selected.includes(label),
        );
        setCount(
          entries.reduce(
            (sum, [, item]) => sum + (data.has('favorites') ? item.favorites : item.total),
            0,
          ),
        );
      }}
    >
      <Stack gap={12}>
        <Text size="caption-l" color="secondary">
          <bdi>{size.toUpperCase()} density</bdi>
        </Text>
        <Flex gap={8} wrap="wrap" align="center">
          <Badge size={size} role="status">
            <bdi>{count} results</bdi>
          </Badge>
          <Chip {...chipProps} size={size} name="favorites" defaultChecked iconLeft={StarIcon}>
            Favorites
          </Chip>
          <Tag size={size} removeLabel="Remove Design systems" onRemove={() => undefined} disabled>
            Design systems
          </Tag>
          <Button size={size} variant="secondary" tone="neutral" type="submit">
            Apply
          </Button>
        </Flex>
        <Flex gap={8} wrap="wrap" align="center" role="group" aria-label="Sizes">
          {Object.keys(stock).map((label) => (
            <Chip key={label} size={size} name="size" value={label} defaultChecked={label === 'M'}>
              {label}
            </Chip>
          ))}
        </Flex>
      </Stack>
    </form>
  );
}

export function FilterFit({ chipProps = {} } = {}) {
  return (
    <Stack gap={24} style={{ minInlineSize: 0 }}>
      {['s', 'm', 'l'].map((size) => (
        <SizeFilters key={size} density={size} chipProps={chipProps} />
      ))}
    </Stack>
  );
}
