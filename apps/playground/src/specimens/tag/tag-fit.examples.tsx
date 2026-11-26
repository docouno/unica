import { useId, useState } from 'react';
import {
  Badge,
  Button,
  Flex,
  Input,
  Stack,
  Tag,
  Text,
  Title,
  VisuallyHidden,
} from '@docouno/unica';
import { FolderIcon } from '@phosphor-icons/react';

const sizes = Object.freeze({ Small: 's', Medium: 'm', Large: 'l' });

export function FitExample({ tagProps = {} } = {}) {
  const id = useId();
  const [values, setValues] = useState(['Design systems', 'Research']);
  const [draft, setDraft] = useState('Documentation');
  const [announcement, setAnnouncement] = useState('');
  const label = draft.trim();
  const canAdd = label !== '' && !values.includes(label);

  function addLabel() {
    if (canAdd) {
      setValues([...values, label]);
      setDraft('');
      setAnnouncement(`Added ${label}.`);
    }
  }

  return (
    <Stack gap={24} style={{ inlineSize: 'min(100%, 42rem)', minInlineSize: 0 }}>
      {Object.entries(sizes).map(([name, size]) => {
        const heading = `${id}-${size}`;
        const input = `${heading}-new`;
        return (
          <form
            key={size}
            aria-labelledby={heading}
            onSubmit={(event) => {
              event.preventDefault();
              event.currentTarget.ownerDocument.getElementById(input)?.focus();
              addLabel();
            }}
          >
            <Stack gap={12}>
              <Title as="h3" size="body-m" id={heading}>
                {name}
              </Title>
              <label htmlFor={input}>
                <Text as="span" size="body-s">
                  Label to add
                </Text>
              </label>
              <Flex align="center" gap={8} wrap="wrap">
                <Input
                  id={input}
                  size={size}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <Button
                  type="submit"
                  size={size}
                  variant="secondary"
                  tone="neutral"
                  disabled={!canAdd}
                >
                  Add label
                </Button>
              </Flex>
              <Flex align="center" gap={8} wrap="wrap">
                <Badge size={size}>Verified</Badge>
                {values.map((value) => (
                  <Tag
                    {...tagProps}
                    key={value}
                    size={size}
                    iconLeft={FolderIcon}
                    removeLabel={`Remove ${value}`}
                    onRemove={() => {
                      const field = document.getElementById(input);
                      field?.focus();
                      setValues((current) => current.filter((item) => item !== value));
                      setAnnouncement(`Removed ${value}.`);
                    }}
                  >
                    {value}
                  </Tag>
                ))}
              </Flex>
            </Stack>
          </form>
        );
      })}
      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
    </Stack>
  );
}
