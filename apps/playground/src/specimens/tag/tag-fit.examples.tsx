import { useId, useState } from 'react';
import { FolderIcon } from '@phosphor-icons/react';
import { Badge, Button, Flex, Grid, Input, Stack, Title, VisuallyHidden } from '@docouno/unica';
import { FormField } from '../../prototypes/form-field/form-field.proto.js';
import { Tag } from '../../prototypes/tag/tag.proto.js';
import { TagsInput } from '../../prototypes/tags-input/tags-input.proto.js';

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
        const tag = `${heading}-research`;
        return (
          <Stack key={size} role="group" aria-labelledby={heading} gap={12}>
            <Title as="h3" size="body-m" id={heading}>
              {name}
            </Title>
            <Grid
              gap={12}
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 15rem), 1fr))',
                alignItems: 'start',
              }}
            >
              <FormField htmlFor={input} label="Label to add" size={size}>
                <Input
                  id={input}
                  size={size}
                  width="full"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                      event.preventDefault();
                      addLabel();
                    }
                  }}
                />
              </FormField>
              <TagsInput
                size={size}
                label="Assigned values"
                values={values}
                onValuesChange={(next) => {
                  setValues([...next]);
                  setAnnouncement('');
                }}
                placeholder="Add value"
              />
            </Grid>
            <Flex align="center" gap={8} wrap="wrap">
              <Badge size={size}>Verified</Badge>
              {values.includes('Research') && (
                <Tag
                  {...tagProps}
                  id={tag}
                  size={size}
                  iconLeft={FolderIcon}
                  removeLabel="Remove Research"
                  onRemove={() => {
                    if (document.getElementById(tag)?.contains(document.activeElement)) {
                      document.getElementById(input)?.focus();
                    }
                    setValues((current) => current.filter((value) => value !== 'Research'));
                    setAnnouncement('Removed Research.');
                  }}
                >
                  Research
                </Tag>
              )}
              <Button
                type="button"
                size={size}
                variant="secondary"
                tone="neutral"
                disabled={!canAdd}
                onClick={(event) => {
                  if (event.currentTarget === document.activeElement) {
                    document.getElementById(input)?.focus();
                  }
                  addLabel();
                }}
              >
                Add label
              </Button>
            </Flex>
          </Stack>
        );
      })}
      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
    </Stack>
  );
}
